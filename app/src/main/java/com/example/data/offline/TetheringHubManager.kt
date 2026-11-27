package com.example.data.offline

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.util.Log
import com.example.data.model.CefrLevel
import com.example.data.model.ChatMessage
import com.example.data.model.ChatSenderRole
import com.example.data.model.LeaderboardEntry
import com.example.data.model.QuizQuestionItem
import com.example.data.model.QuizRoom
import com.example.data.model.RoomChatMessage
import com.example.data.model.RoomMessageType
import com.example.data.model.RoomPlayer
import com.example.data.model.RoomStatus
import com.example.data.model.TeamChannel
import com.example.data.model.TeamChannelKind
import com.google.firebase.Timestamp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.BufferedWriter
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.Inet4Address
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.NetworkInterface
import java.net.ServerSocket
import java.net.Socket
import java.util.Date
import java.util.UUID
import java.util.concurrent.CopyOnWriteArrayList

enum class TetheringRole {
    NONE,
    HOST,
    PEER
}

data class TetheringPeer(
    val uid: String,
    val name: String,
    val avatarColor: String = "INDIGO"
)

data class TetheringHostInfo(
    val teamId: String,
    val teamName: String,
    val teamCode: String,
    val hostName: String,
    val hostIp: String,
    val port: Int,
    val cefrLevel: CefrLevel,
    val memberCount: Int,
    val activeQuizTitle: String = ""
)

data class TetheringUiState(
    val role: TetheringRole = TetheringRole.NONE,
    val isScanning: Boolean = false,
    val localIpAddresses: List<String> = emptyList(),
    val hostPort: Int = TetheringHubManager.DEFAULT_TCP_PORT,
    val teamCode: String = "",
    val activeTeam: TeamChannel? = null,
    val connectedPeers: List<TetheringPeer> = emptyList(),
    val discoveredHosts: List<TetheringHostInfo> = emptyList(),
    val messages: List<ChatMessage> = emptyList(),
    val liveRoom: QuizRoom? = null,
    val roomPlayers: List<RoomPlayer> = emptyList(),
    val roomMessages: List<RoomChatMessage> = emptyList(),
    val statusNote: String = ""
)

/**
 * Local Wi-Fi Hotspot / Tethering multiplayer & team formation engine.
 * Enables students and tutors to form squads, chat, and play Kahoot-style trivia
 * over a phone Wi-Fi hotspot or local LAN with zero internet connectivity.
 */
class TetheringHubManager(
    private val context: Context? = null
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _state = MutableStateFlow(
        TetheringUiState(localIpAddresses = detectLocalIpv4Addresses())
    )
    val state: StateFlow<TetheringUiState> = _state.asStateFlow()

    private var serverSocket: ServerSocket? = null
    private var udpSocket: DatagramSocket? = null
    private var peerSocket: Socket? = null
    private var peerWriter: BufferedWriter? = null

    private var acceptJob: Job? = null
    private var udpResponderJob: Job? = null
    private var scanJob: Job? = null
    private var peerReadJob: Job? = null

    private val clientHandlers = CopyOnWriteArrayList<ClientConnection>()
    private var nsdManager: NsdManager? = null
    private var registeredNsdListener: NsdManager.RegistrationListener? = null
    private var discoveryNsdListener: NsdManager.DiscoveryListener? = null

    private class ClientConnection(
        val socket: Socket,
        val writer: BufferedWriter,
        @Volatile var peer: TetheringPeer? = null
    )

    fun refreshLocalAddresses() {
        _state.value = _state.value.copy(localIpAddresses = detectLocalIpv4Addresses())
    }

    fun hostHotspotTeam(
        teamName: String,
        hostUid: String,
        hostName: String,
        cefrLevel: CefrLevel,
        motto: String,
        accentColor: String = "INDIGO"
    ): TeamChannel {
        disconnect()

        val teamId = "tether_${UUID.randomUUID().toString().take(8)}"
        val teamCode = (1000..9999).random().toString()
        val ips = detectLocalIpv4Addresses()
        val team = TeamChannel(
            id = teamId,
            visibility = "HOTSPOT",
            name = teamName.trim().ifBlank { "Hotspot Squad" }.take(50),
            cefrLevel = cefrLevel.name,
            motto = motto.trim().ifBlank { "Joined via Wi-Fi Hotspot ($teamCode)" }.take(120),
            accentColor = accentColor,
            leaderUid = hostUid,
            leaderName = hostName,
            channelKind = TeamChannelKind.TEAM.name,
            memberCount = 1L
        )
        val hostPeer = TetheringPeer(uid = hostUid, name = hostName, avatarColor = accentColor)

        val openedSocket = runCatching { ServerSocket(DEFAULT_TCP_PORT) }
            .getOrElse { ServerSocket(0) }
        val boundPort = openedSocket.localPort
        serverSocket = openedSocket

        _state.value = TetheringUiState(
            role = TetheringRole.HOST,
            localIpAddresses = ips,
            hostPort = boundPort,
            teamCode = teamCode,
            activeTeam = team,
            connectedPeers = listOf(hostPeer),
            statusNote = if (ips.isNotEmpty()) {
                "Hotspot squad open on ${ips.first()}:$boundPort (Code $teamCode)"
            } else {
                "Turn on Phone Hotspot or Wi-Fi • Code $teamCode"
            }
        )

        acceptJob = scope.launch {
            while (isActive && !openedSocket.isClosed) {
                val client = runCatching { openedSocket.accept() }.getOrNull() ?: break
                launch { handleIncomingClient(client) }
            }
        }

        startUdpDiscoveryResponder(boundPort)
        registerNsdService(team.name, boundPort, teamCode)
        return team
    }

    private suspend fun handleIncomingClient(socket: Socket) {
        val reader = BufferedReader(InputStreamReader(socket.getInputStream(), Charsets.UTF_8))
        val writer = BufferedWriter(OutputStreamWriter(socket.getOutputStream(), Charsets.UTF_8))
        val conn = ClientConnection(socket = socket, writer = writer)
        clientHandlers.add(conn)

        try {
            while (!socket.isClosed) {
                val line = reader.readLine() ?: break
                val packet = runCatching { JSONObject(line) }.getOrNull() ?: continue
                when (packet.optString("type")) {
                    TYPE_PROBE -> {
                        val cur = _state.value
                        val team = cur.activeTeam
                        if (team != null) {
                            sendLine(
                                writer,
                                encodeHostAnnounce(
                                    team = team,
                                    teamCode = cur.teamCode,
                                    hostName = team.leaderName,
                                    hostIp = socket.localAddress?.hostAddress.orEmpty(),
                                    port = cur.hostPort,
                                    memberCount = cur.connectedPeers.size.coerceAtLeast(1),
                                    activeQuizTitle = cur.liveRoom?.quizTitle.orEmpty()
                                ).apply { put("type", TYPE_PROBE_REPLY) }
                            )
                        }
                        break
                    }

                    TYPE_HELLO -> {
                        val reqPin = packet.optString("teamCode", "").trim()
                        val cur = _state.value
                        if (cur.teamCode.isNotBlank() && reqPin.isNotBlank() && reqPin != cur.teamCode) {
                            sendLine(writer, JSONObject().apply {
                                put("type", TYPE_ERROR)
                                put("message", "Wrong squad code. Expected ${cur.teamCode}.")
                            })
                            break
                        }
                        val peerUid = packet.optString("uid", UUID.randomUUID().toString())
                        val peerName = packet.optString("name", "Friend").take(24)
                        val avatar = packet.optString("avatarColor", "CORAL")
                        val newPeer = TetheringPeer(peerUid, peerName, avatar)
                        conn.peer = newPeer

                        val updatedPeers = (_state.value.connectedPeers.filterNot { it.uid == peerUid } + newPeer)
                        val updatedTeam = _state.value.activeTeam?.copy(memberCount = updatedPeers.size.toLong())
                        _state.value = _state.value.copy(
                            connectedPeers = updatedPeers,
                            activeTeam = updatedTeam,
                            statusNote = "$peerName joined your hotspot squad!"
                        )

                        // Send welcome snapshot to new peer
                        sendLine(writer, encodeWelcomePacket(_state.value))

                        // If a live quiz is active, register peer in players list if absent
                        if (_state.value.liveRoom != null) {
                            val existingPlayer = _state.value.roomPlayers.any { it.playerUid == peerUid }
                            if (!existingPlayer) {
                                val rp = RoomPlayer(
                                    id = peerUid,
                                    playerUid = peerUid,
                                    roomCode = _state.value.liveRoom?.id ?: _state.value.teamCode,
                                    hostUid = _state.value.liveRoom?.hostUid.orEmpty(),
                                    nickname = peerName,
                                    avatarColor = avatar
                                )
                                updateHostPlayersAndBroadcast(_state.value.roomPlayers + rp)
                            }
                        }
                        broadcastPacket(encodePeersPacket(updatedPeers, updatedTeam))
                    }

                    TYPE_CHAT_MSG -> {
                        val msg = decodeChatMessage(packet.getJSONObject("message"))
                        appendAndBroadcastChat(msg)
                    }

                    TYPE_ROOM_CHAT -> {
                        val roomMsg = decodeRoomChatMessage(packet.getJSONObject("message"))
                        appendAndBroadcastRoomChat(roomMsg)
                    }

                    TYPE_QUIZ_ANSWER -> {
                        val playerUid = packet.optString("playerUid", "")
                        val playerName = packet.optString("playerName", "Friend")
                        val avatar = packet.optString("avatarColor", "CORAL")
                        val qIndex = packet.optLong("questionIndex", -1L)
                        val selectedIndex = packet.optLong("selectedIndex", -1L)
                        val correct = packet.optBoolean("correct", false)
                        val points = packet.optLong("pointsEarned", 0L)
                        val newScore = packet.optLong("newScore", 0L)
                        val newStreak = packet.optLong("newStreak", 0L)
                        applyHostQuizAnswer(
                            playerUid = playerUid,
                            playerName = playerName,
                            avatarColor = avatar,
                            qIndex = qIndex,
                            selectedIndex = selectedIndex,
                            correct = correct,
                            pointsEarned = points,
                            newScore = newScore,
                            newStreak = newStreak
                        )
                    }
                }
            }
        } catch (t: Throwable) {
            Log.d(TAG, "Client connection ended: ${t.message}")
        } finally {
            clientHandlers.remove(conn)
            runCatching { socket.close() }
            val departed = conn.peer
            if (departed != null && _state.value.role == TetheringRole.HOST) {
                val remaining = _state.value.connectedPeers.filterNot { it.uid == departed.uid }
                val updatedTeam = _state.value.activeTeam?.copy(memberCount = remaining.size.toLong().coerceAtLeast(1L))
                _state.value = _state.value.copy(
                    connectedPeers = remaining,
                    activeTeam = updatedTeam
                )
                broadcastPacket(encodePeersPacket(remaining, updatedTeam))
            }
        }
    }

    private fun startUdpDiscoveryResponder(tcpPort: Int) {
        udpResponderJob?.cancel()
        udpResponderJob = scope.launch {
            val socket = runCatching {
                DatagramSocket(DEFAULT_UDP_PORT).apply { broadcast = true }
            }.getOrNull() ?: return@launch
            udpSocket = socket

            val buffer = ByteArray(1024)
            while (isActive && !socket.isClosed) {
                val packet = DatagramPacket(buffer, buffer.size)
                val received = runCatching { socket.receive(packet) }.isSuccess
                if (!received) break
                val text = String(packet.data, 0, packet.length, Charsets.UTF_8).trim()
                if (text.startsWith(DISCOVER_MAGIC)) {
                    val cur = _state.value
                    val team = cur.activeTeam ?: continue
                    val bestIp = cur.localIpAddresses.firstOrNull().orEmpty()
                    val payload = encodeHostAnnounce(
                        team = team,
                        teamCode = cur.teamCode,
                        hostName = team.leaderName,
                        hostIp = bestIp,
                        port = tcpPort,
                        memberCount = cur.connectedPeers.size.coerceAtLeast(1),
                        activeQuizTitle = cur.liveRoom?.quizTitle.orEmpty()
                    ).toString().toByteArray(Charsets.UTF_8)
                    val reply = DatagramPacket(payload, payload.size, packet.address, packet.port)
                    runCatching { socket.send(reply) }
                }
            }
        }
    }

    fun scanHotspotHosts() {
        scanJob?.cancel()
        _state.value = _state.value.copy(
            isScanning = true,
            localIpAddresses = detectLocalIpv4Addresses(),
            statusNote = "Scanning Wi-Fi hotspot & local subnet..."
        )
        startNsdDiscovery()

        scanJob = scope.launch {
            val found = LinkedHashMap<String, TetheringHostInfo>()

            // 1) UDP Broadcast discovery on local network and 255.255.255.255
            launch {
                runCatching {
                    DatagramSocket().use { sock ->
                        sock.broadcast = true
                        sock.soTimeout = 1400
                        val probe = DISCOVER_MAGIC.toByteArray(Charsets.UTF_8)
                        val targets = buildSet {
                            add("255.255.255.255")
                            detectLocalIpv4Addresses().forEach { ip ->
                                val prefix = ip.substringBeforeLast('.', "")
                                if (prefix.isNotBlank()) add("$prefix.255")
                            }
                        }
                        targets.forEach { target ->
                            runCatching {
                                sock.send(
                                    DatagramPacket(
                                        probe,
                                        probe.size,
                                        InetAddress.getByName(target),
                                        DEFAULT_UDP_PORT
                                    )
                                )
                            }
                        }
                        val buf = ByteArray(2048)
                        val deadline = System.currentTimeMillis() + 1800L
                        while (System.currentTimeMillis() < deadline) {
                            val resp = DatagramPacket(buf, buf.size)
                            val ok = runCatching { sock.receive(resp) }.isSuccess
                            if (!ok) break
                            val json = runCatching {
                                JSONObject(String(resp.data, 0, resp.length, Charsets.UTF_8))
                            }.getOrNull() ?: continue
                            val ip = resp.address?.hostAddress?.takeIf { it.isNotBlank() }
                                ?: json.optString("hostIp", "")
                            if (ip.isNotBlank()) {
                                val info = decodeHostAnnounce(json, fallbackIp = ip)
                                synchronized(found) { found["${info.hostIp}:${info.port}"] = info }
                            }
                        }
                    }
                }
            }

            // 2) Direct TCP probe on common Android / iOS / Windows tethering gateway IPs
            val gatewayCandidates = buildSet {
                add("192.168.43.1")  // Android classic hotspot gateway
                add("192.168.137.1") // Windows Mobile Hotspot
                add("172.20.10.1")   // iOS Personal Hotspot
                detectLocalIpv4Addresses().forEach { localIp ->
                    val prefix = localIp.substringBeforeLast('.', "")
                    if (prefix.isNotBlank()) {
                        add("$prefix.1")
                        add(localIp) // allows local testing / loopback check
                    }
                }
            }

            val probeJobs = gatewayCandidates.map { candidateIp ->
                launch {
                    runCatching {
                        Socket().use { s ->
                            s.connect(InetSocketAddress(candidateIp, DEFAULT_TCP_PORT), 700)
                            s.soTimeout = 900
                            val writer = BufferedWriter(OutputStreamWriter(s.getOutputStream(), Charsets.UTF_8))
                            val reader = BufferedReader(InputStreamReader(s.getInputStream(), Charsets.UTF_8))
                            sendLine(writer, JSONObject().apply { put("type", TYPE_PROBE) })
                            val replyLine = reader.readLine()
                            if (!replyLine.isNullOrBlank()) {
                                val obj = JSONObject(replyLine)
                                if (obj.optString("type") == TYPE_PROBE_REPLY || obj.has("teamName")) {
                                    val info = decodeHostAnnounce(obj, fallbackIp = candidateIp)
                                    synchronized(found) { found["${info.hostIp}:${info.port}"] = info }
                                }
                            }
                        }
                    }
                }
            }
            probeJobs.forEach { it.join() }
            delay(400)

            val list = synchronized(found) { found.values.toList() }
            _state.value = _state.value.copy(
                isScanning = false,
                discoveredHosts = list,
                statusNote = if (list.isEmpty()) {
                    "No hotspot hosts found automatically. Enter the host IP shown on the leader's screen."
                } else {
                    "Found ${list.size} hotspot squad(s) nearby!"
                }
            )
        }
    }

    fun joinHotspotHost(
        hostIp: String,
        port: Int = DEFAULT_TCP_PORT,
        peerUid: String,
        peerName: String,
        avatarColor: String = "CORAL",
        teamCode: String = ""
    ) {
        val cleanIp = hostIp.trim()
        if (cleanIp.isEmpty()) return

        disconnect()
        _state.value = _state.value.copy(
            role = TetheringRole.PEER,
            statusNote = "Connecting to hotspot host $cleanIp:$port..."
        )

        peerReadJob = scope.launch {
            try {
                val socket = Socket()
                socket.connect(InetSocketAddress(cleanIp, port), 4000)
                peerSocket = socket
                val reader = BufferedReader(InputStreamReader(socket.getInputStream(), Charsets.UTF_8))
                val writer = BufferedWriter(OutputStreamWriter(socket.getOutputStream(), Charsets.UTF_8))
                peerWriter = writer

                sendLine(writer, JSONObject().apply {
                    put("type", TYPE_HELLO)
                    put("uid", peerUid)
                    put("name", peerName)
                    put("avatarColor", avatarColor)
                    put("teamCode", teamCode.trim())
                })

                while (isActive && !socket.isClosed) {
                    val line = reader.readLine() ?: break
                    val packet = runCatching { JSONObject(line) }.getOrNull() ?: continue
                    when (packet.optString("type")) {
                        TYPE_ERROR -> {
                            _state.value = _state.value.copy(
                                role = TetheringRole.NONE,
                                statusNote = packet.optString("message", "Rejected by host")
                            )
                            break
                        }

                        TYPE_WELCOME -> {
                            val team = packet.optJSONObject("team")?.let { decodeTeamChannel(it) }
                            val peers = decodePeers(packet.optJSONArray("peers"))
                            val msgsArr = packet.optJSONArray("messages") ?: JSONArray()
                            val msgs = (0 until msgsArr.length()).map { decodeChatMessage(msgsArr.getJSONObject(it)) }
                            val room = packet.optJSONObject("liveRoom")?.let { decodeQuizRoom(it) }
                            val players = decodeRoomPlayers(packet.optJSONArray("roomPlayers"))
                            val rMsgsArr = packet.optJSONArray("roomMessages") ?: JSONArray()
                            val rMsgs = (0 until rMsgsArr.length()).map { decodeRoomChatMessage(rMsgsArr.getJSONObject(it)) }
                            _state.value = _state.value.copy(
                                role = TetheringRole.PEER,
                                activeTeam = team,
                                teamCode = packet.optString("teamCode", teamCode),
                                connectedPeers = peers,
                                messages = msgs,
                                liveRoom = room,
                                roomPlayers = players,
                                roomMessages = rMsgs,
                                statusNote = "Connected to ${team?.name ?: cleanIp} over Hotspot!"
                            )
                        }

                        TYPE_PEERS -> {
                            val peers = decodePeers(packet.optJSONArray("peers"))
                            val team = packet.optJSONObject("team")?.let { decodeTeamChannel(it) } ?: _state.value.activeTeam
                            _state.value = _state.value.copy(
                                connectedPeers = peers,
                                activeTeam = team
                            )
                        }

                        TYPE_CHAT_MSG -> {
                            val msg = decodeChatMessage(packet.getJSONObject("message"))
                            val cur = _state.value.messages
                            if (cur.none { it.id == msg.id }) {
                                _state.value = _state.value.copy(messages = (cur + msg).takeLast(120))
                            }
                        }

                        TYPE_QUIZ_ROOM_STATE -> {
                            val room = packet.optJSONObject("liveRoom")?.let { decodeQuizRoom(it) }
                            val players = decodeRoomPlayers(packet.optJSONArray("roomPlayers"))
                            _state.value = _state.value.copy(
                                liveRoom = room,
                                roomPlayers = players
                            )
                        }

                        TYPE_ROOM_CHAT -> {
                            val msg = decodeRoomChatMessage(packet.getJSONObject("message"))
                            val cur = _state.value.roomMessages
                            if (cur.none { it.id == msg.id }) {
                                _state.value = _state.value.copy(roomMessages = (cur + msg).takeLast(60))
                            }
                        }
                    }
                }
            } catch (t: Throwable) {
                _state.value = _state.value.copy(
                    role = TetheringRole.NONE,
                    statusNote = "Could not connect to $cleanIp:$port (${t.message ?: "unreachable"})"
                )
            }
        }
    }

    fun sendSquadMessage(
        senderUid: String,
        senderName: String,
        senderRole: ChatSenderRole,
        text: String,
        pinned: Boolean = false
    ) {
        val team = _state.value.activeTeam ?: return
        val msg = ChatMessage(
            id = UUID.randomUUID().toString(),
            teamId = team.id,
            senderUid = senderUid,
            senderName = senderName,
            senderTeamName = team.name,
            senderRole = senderRole.name,
            text = text.trim(),
            pinned = pinned,
            createdAt = Timestamp(Date(System.currentTimeMillis()))
        )
        val packet = JSONObject().apply {
            put("type", TYPE_CHAT_MSG)
            put("message", encodeChatMessage(msg))
        }
        when (_state.value.role) {
            TetheringRole.HOST -> appendAndBroadcastChat(msg)
            TetheringRole.PEER -> scope.launch {
                peerWriter?.let { sendLine(it, packet) }
            }
            TetheringRole.NONE -> Unit
        }
    }

    fun startHotspotLiveQuiz(
        hostUid: String,
        hostName: String,
        quizTitle: String,
        cefrLevel: CefrLevel,
        questions: List<QuizQuestionItem>
    ): QuizRoom? {
        if (_state.value.role != TetheringRole.HOST) return null
        val code = _state.value.teamCode.ifBlank { (1000..9999).random().toString() }
        val room = QuizRoom(
            id = code,
            hostUid = hostUid,
            hostName = hostName,
            quizTitle = quizTitle,
            cefrLevel = cefrLevel.name,
            status = RoomStatus.LOBBY.name,
            currentQuestionIndex = 0L,
            questionStartedAtMs = 0L,
            questions = questions,
            leaderboard = emptyList()
        )
        val initialPlayers = _state.value.connectedPeers
            .filter { it.uid != hostUid }
            .map { peer ->
                RoomPlayer(
                    id = peer.uid,
                    playerUid = peer.uid,
                    roomCode = code,
                    hostUid = hostUid,
                    nickname = peer.name,
                    avatarColor = peer.avatarColor
                )
            }
        _state.value = _state.value.copy(
            liveRoom = room,
            roomPlayers = initialPlayers,
            roomMessages = emptyList()
        )
        broadcastPacket(encodeQuizStatePacket(room, initialPlayers))
        return room
    }

    fun advanceHotspotLiveQuiz() {
        if (_state.value.role != TetheringRole.HOST) return
        val room = _state.value.liveRoom ?: return
        val status = RoomStatus.fromRaw(room.status)
        val qIdx = room.currentQuestionIndex.toInt()
        val nextRoom = when (status) {
            RoomStatus.LOBBY -> room.copy(
                status = RoomStatus.QUESTION.name,
                currentQuestionIndex = 0L,
                questionStartedAtMs = System.currentTimeMillis()
            )
            RoomStatus.QUESTION -> room.copy(
                status = RoomStatus.REVEAL.name,
                leaderboard = buildSortedLeaderboard(_state.value.roomPlayers)
            )
            RoomStatus.REVEAL -> {
                if (qIdx + 1 >= room.questions.size) {
                    room.copy(
                        status = RoomStatus.PODIUM.name,
                        leaderboard = buildSortedLeaderboard(_state.value.roomPlayers)
                    )
                } else {
                    room.copy(
                        status = RoomStatus.QUESTION.name,
                        currentQuestionIndex = (qIdx + 1).toLong(),
                        questionStartedAtMs = System.currentTimeMillis()
                    )
                }
            }
            RoomStatus.PODIUM -> room
        }
        _state.value = _state.value.copy(liveRoom = nextRoom)
        broadcastPacket(encodeQuizStatePacket(nextRoom, _state.value.roomPlayers))
    }

    fun submitHotspotQuizAnswer(
        playerUid: String,
        playerName: String,
        avatarColor: String,
        questionIndex: Int,
        selectedIndex: Int,
        correct: Boolean,
        pointsEarned: Long,
        newScore: Long,
        newStreak: Long
    ) {
        when (_state.value.role) {
            TetheringRole.HOST -> applyHostQuizAnswer(
                playerUid = playerUid,
                playerName = playerName,
                avatarColor = avatarColor,
                qIndex = questionIndex.toLong(),
                selectedIndex = selectedIndex.toLong(),
                correct = correct,
                pointsEarned = pointsEarned,
                newScore = newScore,
                newStreak = newStreak
            )
            TetheringRole.PEER -> scope.launch {
                peerWriter?.let { writer ->
                    sendLine(writer, JSONObject().apply {
                        put("type", TYPE_QUIZ_ANSWER)
                        put("playerUid", playerUid)
                        put("playerName", playerName)
                        put("avatarColor", avatarColor)
                        put("questionIndex", questionIndex.toLong())
                        put("selectedIndex", selectedIndex.toLong())
                        put("correct", correct)
                        put("pointsEarned", pointsEarned)
                        put("newScore", newScore)
                        put("newStreak", newStreak)
                    })
                }
            }
            TetheringRole.NONE -> Unit
        }
    }

    fun sendHotspotRoomMessage(
        senderUid: String,
        senderName: String,
        avatarColor: String,
        hostSender: Boolean,
        messageType: RoomMessageType,
        text: String
    ) {
        val room = _state.value.liveRoom ?: return
        val msg = RoomChatMessage(
            id = UUID.randomUUID().toString(),
            roomCode = room.id,
            senderUid = senderUid,
            senderName = senderName,
            avatarColor = avatarColor,
            hostSender = hostSender,
            messageType = messageType.name,
            text = text.trim(),
            createdAt = Timestamp(Date(System.currentTimeMillis()))
        )
        when (_state.value.role) {
            TetheringRole.HOST -> appendAndBroadcastRoomChat(msg)
            TetheringRole.PEER -> scope.launch {
                peerWriter?.let { writer ->
                    sendLine(writer, JSONObject().apply {
                        put("type", TYPE_ROOM_CHAT)
                        put("message", encodeRoomChatMessage(msg))
                    })
                }
            }
            TetheringRole.NONE -> Unit
        }
    }

    fun closeHotspotRoom() {
        _state.value = _state.value.copy(
            liveRoom = null,
            roomPlayers = emptyList(),
            roomMessages = emptyList()
        )
        if (_state.value.role == TetheringRole.HOST) {
            broadcastPacket(JSONObject().apply {
                put("type", TYPE_QUIZ_ROOM_STATE)
                put("liveRoom", JSONObject.NULL)
                put("roomPlayers", JSONArray())
            })
        }
    }

    private fun applyHostQuizAnswer(
        playerUid: String,
        playerName: String,
        avatarColor: String,
        qIndex: Long,
        selectedIndex: Long,
        correct: Boolean,
        pointsEarned: Long,
        newScore: Long,
        newStreak: Long
    ) {
        val room = _state.value.liveRoom ?: return
        val players = _state.value.roomPlayers.toMutableList()
        val idx = players.indexOfFirst { it.playerUid == playerUid }
        val updated = RoomPlayer(
            id = playerUid,
            playerUid = playerUid,
            roomCode = room.id,
            hostUid = room.hostUid,
            nickname = playerName,
            avatarColor = avatarColor,
            score = newScore,
            streak = newStreak,
            lastAnswerIndex = selectedIndex,
            lastAnsweredQuestion = qIndex,
            lastAnswerCorrect = correct,
            lastPointsEarned = pointsEarned
        )
        if (idx >= 0) players[idx] = updated else players.add(updated)
        updateHostPlayersAndBroadcast(players)
    }

    private fun updateHostPlayersAndBroadcast(players: List<RoomPlayer>) {
        val room = _state.value.liveRoom ?: return
        val updatedRoom = room.copy(leaderboard = buildSortedLeaderboard(players))
        _state.value = _state.value.copy(liveRoom = updatedRoom, roomPlayers = players)
        broadcastPacket(encodeQuizStatePacket(updatedRoom, players))
    }

    private fun appendAndBroadcastChat(msg: ChatMessage) {
        val cur = _state.value.messages
        if (cur.any { it.id == msg.id }) return
        _state.value = _state.value.copy(messages = (cur + msg).takeLast(120))
        broadcastPacket(JSONObject().apply {
            put("type", TYPE_CHAT_MSG)
            put("message", encodeChatMessage(msg))
        })
    }

    private fun appendAndBroadcastRoomChat(msg: RoomChatMessage) {
        val cur = _state.value.roomMessages
        if (cur.any { it.id == msg.id }) return
        _state.value = _state.value.copy(roomMessages = (cur + msg).takeLast(60))
        broadcastPacket(JSONObject().apply {
            put("type", TYPE_ROOM_CHAT)
            put("message", encodeRoomChatMessage(msg))
        })
    }

    private fun broadcastPacket(obj: JSONObject) {
        scope.launch {
            clientHandlers.forEach { client ->
                runCatching { sendLine(client.writer, obj) }
            }
        }
    }

    private fun sendLine(writer: BufferedWriter, obj: JSONObject) {
        synchronized(writer) {
            writer.write(obj.toString())
            writer.newLine()
            writer.flush()
        }
    }

    private fun registerNsdService(teamName: String, port: Int, teamCode: String) {
        val ctx = context ?: return
        runCatching {
            val mgr = ctx.getSystemService(Context.NSD_SERVICE) as? NsdManager ?: return
            nsdManager = mgr
            val info = NsdServiceInfo().apply {
                serviceName = "LingoClub_${teamCode}_${teamName.take(16)}"
                serviceType = NSD_SERVICE_TYPE
                setPort(port)
            }
            val listener = object : NsdManager.RegistrationListener {
                override fun onServiceRegistered(serviceInfo: NsdServiceInfo) {}
                override fun onRegistrationFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {}
                override fun onServiceUnregistered(serviceInfo: NsdServiceInfo) {}
                override fun onUnregistrationFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {}
            }
            registeredNsdListener = listener
            mgr.registerService(info, NsdManager.PROTOCOL_DNS_SD, listener)
        }
    }

    private fun startNsdDiscovery() {
        val ctx = context ?: return
        runCatching {
            val mgr = ctx.getSystemService(Context.NSD_SERVICE) as? NsdManager ?: return
            nsdManager = mgr
            discoveryNsdListener?.let { old -> runCatching { mgr.stopServiceDiscovery(old) } }
            val listener = object : NsdManager.DiscoveryListener {
                override fun onDiscoveryStarted(regType: String) {}
                override fun onServiceFound(service: NsdServiceInfo) {
                    if (service.serviceType.contains("lingoclub")) {
                        runCatching {
                            @Suppress("DEPRECATION")
                            mgr.resolveService(service, object : NsdManager.ResolveListener {
                                override fun onResolveFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {}
                                override fun onServiceResolved(serviceInfo: NsdServiceInfo) {
                                    @Suppress("DEPRECATION")
                                    val hostAddr = serviceInfo.host?.hostAddress ?: return
                                    val port = serviceInfo.port
                                    scope.launch {
                                        runCatching {
                                            Socket().use { s ->
                                                s.connect(InetSocketAddress(hostAddr, port), 1000)
                                                val w = BufferedWriter(OutputStreamWriter(s.getOutputStream(), Charsets.UTF_8))
                                                val r = BufferedReader(InputStreamReader(s.getInputStream(), Charsets.UTF_8))
                                                sendLine(w, JSONObject().apply { put("type", TYPE_PROBE) })
                                                val line = r.readLine()
                                                if (!line.isNullOrBlank()) {
                                                    val info = decodeHostAnnounce(JSONObject(line), hostAddr)
                                                    val current = _state.value.discoveredHosts.filterNot {
                                                        it.hostIp == info.hostIp && it.port == info.port
                                                    } + info
                                                    _state.value = _state.value.copy(discoveredHosts = current)
                                                }
                                            }
                                        }
                                    }
                                }
                            })
                        }
                    }
                }
                override fun onServiceLost(service: NsdServiceInfo) {}
                override fun onDiscoveryStopped(serviceType: String) {}
                override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {}
                override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {}
            }
            discoveryNsdListener = listener
            mgr.discoverServices(NSD_SERVICE_TYPE, NsdManager.PROTOCOL_DNS_SD, listener)
        }
    }

    fun disconnect() {
        acceptJob?.cancel()
        udpResponderJob?.cancel()
        scanJob?.cancel()
        peerReadJob?.cancel()

        clientHandlers.forEach { runCatching { it.socket.close() } }
        clientHandlers.clear()

        runCatching { serverSocket?.close() }
        serverSocket = null
        runCatching { udpSocket?.close() }
        udpSocket = null
        runCatching { peerSocket?.close() }
        peerSocket = null
        peerWriter = null

        registeredNsdListener?.let { l -> runCatching { nsdManager?.unregisterService(l) } }
        registeredNsdListener = null
        discoveryNsdListener?.let { l -> runCatching { nsdManager?.stopServiceDiscovery(l) } }
        discoveryNsdListener = null

        _state.value = TetheringUiState(localIpAddresses = detectLocalIpv4Addresses())
    }

    fun shutdown() {
        disconnect()
        scope.cancel()
    }

    companion object {
        private const val TAG = "TetheringHubManager"
        const val DEFAULT_TCP_PORT = 47821
        const val DEFAULT_UDP_PORT = 47822
        private const val NSD_SERVICE_TYPE = "_lingoclub._tcp."
        private const val DISCOVER_MAGIC = "DISCOVER_LINGO_V1"

        private const val TYPE_PROBE = "PROBE"
        private const val TYPE_PROBE_REPLY = "PROBE_REPLY"
        private const val TYPE_HELLO = "HELLO"
        private const val TYPE_WELCOME = "WELCOME"
        private const val TYPE_PEERS = "PEERS"
        private const val TYPE_CHAT_MSG = "CHAT_MSG"
        private const val TYPE_QUIZ_ROOM_STATE = "QUIZ_ROOM_STATE"
        private const val TYPE_QUIZ_ANSWER = "QUIZ_ANSWER"
        private const val TYPE_ROOM_CHAT = "ROOM_CHAT"
        private const val TYPE_ERROR = "ERROR"

        fun detectLocalIpv4Addresses(): List<String> {
            val prioritized = mutableListOf<Pair<Int, String>>()
            runCatching {
                val interfaces = NetworkInterface.getNetworkInterfaces() ?: return@runCatching
                while (interfaces.hasMoreElements()) {
                    val nif = interfaces.nextElement()
                    if (!nif.isUp || nif.isLoopback) continue
                    val name = nif.name.lowercase()
                    val weight = when {
                        name.contains("ap") || name.contains("softap") || name.contains("swlan") -> 0
                        name.contains("rndis") || name.contains("tether") || name.contains("usb") -> 1
                        name.contains("wlan") -> 2
                        else -> 3
                    }
                    val addrs = nif.inetAddresses
                    while (addrs.hasMoreElements()) {
                        val addr = addrs.nextElement()
                        if (addr is Inet4Address && !addr.isLoopbackAddress) {
                            val host = addr.hostAddress ?: continue
                            prioritized.add(weight to host)
                        }
                    }
                }
            }
            return prioritized.sortedBy { it.first }.map { it.second }.distinct()
        }

        internal fun buildSortedLeaderboard(players: List<RoomPlayer>): List<LeaderboardEntry> =
            players.sortedByDescending { it.score }.map {
                LeaderboardEntry(
                    uid = it.playerUid,
                    nickname = it.nickname,
                    score = it.score,
                    streak = it.streak,
                    avatarColor = it.avatarColor
                )
            }

        internal fun encodeHostAnnounce(
            team: TeamChannel,
            teamCode: String,
            hostName: String,
            hostIp: String,
            port: Int,
            memberCount: Int,
            activeQuizTitle: String
        ): JSONObject = JSONObject().apply {
            put("teamId", team.id)
            put("teamName", team.name)
            put("teamCode", teamCode)
            put("hostName", hostName)
            put("hostIp", hostIp)
            put("port", port)
            put("cefrLevel", team.cefrLevel)
            put("memberCount", memberCount)
            put("activeQuizTitle", activeQuizTitle)
        }

        internal fun decodeHostAnnounce(obj: JSONObject, fallbackIp: String): TetheringHostInfo =
            TetheringHostInfo(
                teamId = obj.optString("teamId", "tether_host"),
                teamName = obj.optString("teamName", "Hotspot Squad"),
                teamCode = obj.optString("teamCode", ""),
                hostName = obj.optString("hostName", "Host"),
                hostIp = obj.optString("hostIp", fallbackIp).ifBlank { fallbackIp },
                port = obj.optInt("port", DEFAULT_TCP_PORT),
                cefrLevel = CefrLevel.fromRaw(obj.optString("cefrLevel", CefrLevel.B1.name)),
                memberCount = obj.optInt("memberCount", 1),
                activeQuizTitle = obj.optString("activeQuizTitle", "")
            )

        internal fun encodeTeamChannel(team: TeamChannel): JSONObject = JSONObject().apply {
            put("id", team.id)
            put("visibility", team.visibility)
            put("name", team.name)
            put("cefrLevel", team.cefrLevel)
            put("motto", team.motto)
            put("accentColor", team.accentColor)
            put("leaderUid", team.leaderUid)
            put("leaderName", team.leaderName)
            put("channelKind", team.channelKind)
            put("memberCount", team.memberCount)
        }

        internal fun decodeTeamChannel(obj: JSONObject): TeamChannel = TeamChannel(
            id = obj.optString("id", ""),
            visibility = obj.optString("visibility", "HOTSPOT"),
            name = obj.optString("name", "Hotspot Squad"),
            cefrLevel = obj.optString("cefrLevel", CefrLevel.B1.name),
            motto = obj.optString("motto", ""),
            accentColor = obj.optString("accentColor", "INDIGO"),
            leaderUid = obj.optString("leaderUid", ""),
            leaderName = obj.optString("leaderName", ""),
            channelKind = obj.optString("channelKind", TeamChannelKind.TEAM.name),
            memberCount = obj.optLong("memberCount", 1L)
        )

        internal fun encodeChatMessage(msg: ChatMessage): JSONObject = JSONObject().apply {
            put("id", msg.id)
            put("teamId", msg.teamId)
            put("senderUid", msg.senderUid)
            put("senderName", msg.senderName)
            put("senderTeamName", msg.senderTeamName)
            put("senderRole", msg.senderRole)
            put("text", msg.text)
            put("pinned", msg.pinned)
            put("createdAtMs", msg.createdAt?.toDate()?.time ?: System.currentTimeMillis())
        }

        internal fun decodeChatMessage(obj: JSONObject): ChatMessage = ChatMessage(
            id = obj.optString("id", UUID.randomUUID().toString()),
            teamId = obj.optString("teamId", ""),
            senderUid = obj.optString("senderUid", ""),
            senderName = obj.optString("senderName", "Friend"),
            senderTeamName = obj.optString("senderTeamName", ""),
            senderRole = obj.optString("senderRole", ChatSenderRole.PLAYER.name),
            text = obj.optString("text", ""),
            pinned = obj.optBoolean("pinned", false),
            createdAt = Timestamp(Date(obj.optLong("createdAtMs", System.currentTimeMillis())))
        )

        internal fun encodeRoomChatMessage(msg: RoomChatMessage): JSONObject = JSONObject().apply {
            put("id", msg.id)
            put("roomCode", msg.roomCode)
            put("senderUid", msg.senderUid)
            put("senderName", msg.senderName)
            put("avatarColor", msg.avatarColor)
            put("hostSender", msg.hostSender)
            put("messageType", msg.messageType)
            put("text", msg.text)
            put("createdAtMs", msg.createdAt?.toDate()?.time ?: System.currentTimeMillis())
        }

        internal fun decodeRoomChatMessage(obj: JSONObject): RoomChatMessage = RoomChatMessage(
            id = obj.optString("id", UUID.randomUUID().toString()),
            roomCode = obj.optString("roomCode", ""),
            senderUid = obj.optString("senderUid", ""),
            senderName = obj.optString("senderName", "Friend"),
            avatarColor = obj.optString("avatarColor", "INDIGO"),
            hostSender = obj.optBoolean("hostSender", false),
            messageType = obj.optString("messageType", RoomMessageType.TEXT.name),
            text = obj.optString("text", ""),
            createdAt = Timestamp(Date(obj.optLong("createdAtMs", System.currentTimeMillis())))
        )

        internal fun encodeQuizRoom(room: QuizRoom): JSONObject = JSONObject().apply {
            put("id", room.id)
            put("hostUid", room.hostUid)
            put("hostName", room.hostName)
            put("quizTitle", room.quizTitle)
            put("cefrLevel", room.cefrLevel)
            put("status", room.status)
            put("currentQuestionIndex", room.currentQuestionIndex)
            put("questionStartedAtMs", room.questionStartedAtMs)
            put(
                "questions",
                JSONArray().apply {
                    room.questions.forEach { q ->
                        put(JSONObject().apply {
                            put("prompt", q.prompt)
                            put("options", JSONArray(q.options))
                            put("correctIndex", q.correctIndex)
                            put("timeLimitSec", q.timeLimitSec)
                            put("tip", q.tip)
                        })
                    }
                }
            )
            put(
                "leaderboard",
                JSONArray().apply {
                    room.leaderboard.forEach { entry ->
                        put(JSONObject().apply {
                            put("uid", entry.uid)
                            put("nickname", entry.nickname)
                            put("score", entry.score)
                            put("streak", entry.streak)
                            put("avatarColor", entry.avatarColor)
                        })
                    }
                }
            )
        }

        internal fun decodeQuizRoom(obj: JSONObject): QuizRoom {
            val qArr = obj.optJSONArray("questions") ?: JSONArray()
            val questions = (0 until qArr.length()).map { idx ->
                val q = qArr.getJSONObject(idx)
                val optsArr = q.optJSONArray("options") ?: JSONArray()
                val opts = (0 until optsArr.length()).map { optsArr.getString(it) }
                QuizQuestionItem(
                    prompt = q.optString("prompt", ""),
                    options = opts,
                    correctIndex = q.optLong("correctIndex", 0L),
                    timeLimitSec = q.optLong("timeLimitSec", 20L),
                    tip = q.optString("tip", "")
                )
            }
            val lbArr = obj.optJSONArray("leaderboard") ?: JSONArray()
            val lb = (0 until lbArr.length()).map { idx ->
                val e = lbArr.getJSONObject(idx)
                LeaderboardEntry(
                    uid = e.optString("uid", ""),
                    nickname = e.optString("nickname", "Player"),
                    score = e.optLong("score", 0L),
                    streak = e.optLong("streak", 0L),
                    avatarColor = e.optString("avatarColor", "INDIGO")
                )
            }
            return QuizRoom(
                id = obj.optString("id", ""),
                hostUid = obj.optString("hostUid", ""),
                hostName = obj.optString("hostName", ""),
                quizTitle = obj.optString("quizTitle", ""),
                cefrLevel = obj.optString("cefrLevel", CefrLevel.B1.name),
                status = obj.optString("status", RoomStatus.LOBBY.name),
                currentQuestionIndex = obj.optLong("currentQuestionIndex", 0L),
                questionStartedAtMs = obj.optLong("questionStartedAtMs", 0L),
                questions = questions,
                leaderboard = lb
            )
        }

        internal fun encodeRoomPlayer(player: RoomPlayer): JSONObject = JSONObject().apply {
            put("id", player.id)
            put("playerUid", player.playerUid)
            put("roomCode", player.roomCode)
            put("hostUid", player.hostUid)
            put("nickname", player.nickname)
            put("avatarColor", player.avatarColor)
            put("score", player.score)
            put("streak", player.streak)
            put("lastAnswerIndex", player.lastAnswerIndex)
            put("lastAnsweredQuestion", player.lastAnsweredQuestion)
            put("lastAnswerCorrect", player.lastAnswerCorrect)
            put("lastPointsEarned", player.lastPointsEarned)
        }

        internal fun decodeRoomPlayer(obj: JSONObject): RoomPlayer = RoomPlayer(
            id = obj.optString("id", ""),
            playerUid = obj.optString("playerUid", ""),
            roomCode = obj.optString("roomCode", ""),
            hostUid = obj.optString("hostUid", ""),
            nickname = obj.optString("nickname", ""),
            avatarColor = obj.optString("avatarColor", "CORAL"),
            score = obj.optLong("score", 0L),
            streak = obj.optLong("streak", 0L),
            lastAnswerIndex = obj.optLong("lastAnswerIndex", -1L),
            lastAnsweredQuestion = obj.optLong("lastAnsweredQuestion", -1L),
            lastAnswerCorrect = obj.optBoolean("lastAnswerCorrect", false),
            lastPointsEarned = obj.optLong("lastPointsEarned", 0L)
        )

        private fun encodeWelcomePacket(state: TetheringUiState): JSONObject = JSONObject().apply {
            put("type", TYPE_WELCOME)
            put("teamCode", state.teamCode)
            state.activeTeam?.let { put("team", encodeTeamChannel(it)) }
            put(
                "peers",
                JSONArray().apply {
                    state.connectedPeers.forEach { p ->
                        put(JSONObject().apply {
                            put("uid", p.uid)
                            put("name", p.name)
                            put("avatarColor", p.avatarColor)
                        })
                    }
                }
            )
            put(
                "messages",
                JSONArray().apply {
                    state.messages.forEach { put(encodeChatMessage(it)) }
                }
            )
            state.liveRoom?.let { put("liveRoom", encodeQuizRoom(it)) }
            put(
                "roomPlayers",
                JSONArray().apply {
                    state.roomPlayers.forEach { put(encodeRoomPlayer(it)) }
                }
            )
            put(
                "roomMessages",
                JSONArray().apply {
                    state.roomMessages.forEach { put(encodeRoomChatMessage(it)) }
                }
            )
        }

        private fun encodePeersPacket(peers: List<TetheringPeer>, team: TeamChannel?): JSONObject = JSONObject().apply {
            put("type", TYPE_PEERS)
            team?.let { put("team", encodeTeamChannel(it)) }
            put(
                "peers",
                JSONArray().apply {
                    peers.forEach { p ->
                        put(JSONObject().apply {
                            put("uid", p.uid)
                            put("name", p.name)
                            put("avatarColor", p.avatarColor)
                        })
                    }
                }
            )
        }

        private fun encodeQuizStatePacket(room: QuizRoom, players: List<RoomPlayer>): JSONObject = JSONObject().apply {
            put("type", TYPE_QUIZ_ROOM_STATE)
            put("liveRoom", encodeQuizRoom(room))
            put(
                "roomPlayers",
                JSONArray().apply {
                    players.forEach { put(encodeRoomPlayer(it)) }
                }
            )
        }

        private fun decodePeers(arr: JSONArray?): List<TetheringPeer> {
            if (arr == null) return emptyList()
            return (0 until arr.length()).map { idx ->
                val p = arr.getJSONObject(idx)
                TetheringPeer(
                    uid = p.optString("uid", ""),
                    name = p.optString("name", "Friend"),
                    avatarColor = p.optString("avatarColor", "INDIGO")
                )
            }
        }

        private fun decodeRoomPlayers(arr: JSONArray?): List<RoomPlayer> {
            if (arr == null) return emptyList()
            return (0 until arr.length()).map { idx -> decodeRoomPlayer(arr.getJSONObject(idx)) }
        }
    }
}
