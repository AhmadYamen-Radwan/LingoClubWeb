package com.example.ui

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.firebase.LingoRepository
import com.example.data.model.ActivityType
import com.example.data.model.BadgeEngine
import com.example.data.model.CefrLevel
import com.example.data.model.ChatSenderRole
import com.example.data.model.LeaderboardEntry
import com.example.data.model.LingoBadge
import com.example.data.model.QuizQuestionItem
import com.example.data.model.RoomMessageType
import com.example.data.model.RoomStatus
import com.example.data.model.ScoreRecord
import com.example.data.model.TeamChannel
import com.example.data.model.UserProfile
import com.example.data.offline.OfflineLocalStore
import com.example.data.offline.TetheringHubManager
import com.example.data.offline.TetheringRole
import com.example.data.offline.TetheringUiState
import com.google.firebase.firestore.FirebaseFirestoreException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class PuzzleSessionStats(
    val puzzlesSolved: Int = 0,
    val currentStreak: Int = 0,
    val bestStreak: Int = 0,
    val totalPuzzleXp: Long = 0L,
    val adaptiveLevel: CefrLevel = CefrLevel.B1,
    val lastResultNote: String = ""
)

class GameViewModel(
    private val repository: LingoRepository,
    private val offlineStore: OfflineLocalStore,
    val tetheringHub: TetheringHubManager,
    val currentUserId: String,
    val currentUserName: String,
    val isOfflineMode: Boolean = false
) : ViewModel() {

    val tetheringState: StateFlow<TetheringUiState> = tetheringHub.state

    private val _puzzleProgressState = MutableStateFlow(PuzzleSessionStats())
    val puzzleProgressState: StateFlow<PuzzleSessionStats> = _puzzleProgressState.asStateFlow()

    private val _firestoreRoomSession = MutableStateFlow<ActiveRoomSession?>(null)

    private val _hotspotLocalProgress = MutableStateFlow(HotspotLocalPlayerState())
    private data class HotspotLocalPlayerState(
        val roomCode: String = "",
        val localNickname: String = "",
        val localAvatarColor: String = "CORAL",
        val localScore: Long = 0L,
        val localStreak: Long = 0L,
        val correctAnswersCount: Int = 0,
        val answeredQuestionIndex: Int = -1,
        val selectedOptionIndex: Int = -1
    )

    val roomSession: StateFlow<ActiveRoomSession?> = combine(
        _firestoreRoomSession,
        tetheringHub.state,
        _hotspotLocalProgress
    ) { fsSession, tether, hotspotProgress ->
        val tetherRoom = tether.liveRoom
        if (tether.role != TetheringRole.NONE && tetherRoom != null) {
            ActiveRoomSession(
                roomCode = tetherRoom.id.ifBlank { tether.teamCode },
                isHost = tether.role == TetheringRole.HOST,
                localNickname = hotspotProgress.localNickname.ifBlank { currentUserName },
                localAvatarColor = hotspotProgress.localAvatarColor,
                room = tetherRoom,
                players = tether.roomPlayers,
                roomMessages = tether.roomMessages,
                localScore = hotspotProgress.localScore,
                localStreak = hotspotProgress.localStreak,
                correctAnswersCount = hotspotProgress.correctAnswersCount,
                answeredQuestionIndex = hotspotProgress.answeredQuestionIndex,
                selectedOptionIndex = hotspotProgress.selectedOptionIndex
            )
        } else {
            fsSession
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
        initialValue = null
    )

    private val firestoreScoresFlow = if (isOfflineMode) {
        flowOf(emptyList())
    } else {
        repository.observeGlobalScores()
            .catch { error ->
                val fsErr = unwrapFirestoreErrorOrThrow(error)
                Log.w(TAG, "Error observing global scores in GameViewModel", fsErr)
                emit(emptyList())
            }
    }

    val globalScoresState: StateFlow<UiState<List<ScoreRecord>>> = combine(
        firestoreScoresFlow,
        offlineStore.scoresFlow
    ) { remoteScores, localScores ->
        val merged = (remoteScores + localScores)
            .distinctBy { it.id }
            .sortedByDescending { it.score }
            .take(50)
        UiState.Success(merged) as UiState<List<ScoreRecord>>
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
        initialValue = UiState.Success(offlineStore.scoresFlow.value)
    )

    private val _gameBanner = MutableStateFlow<String?>(null)
    val gameBanner: StateFlow<String?> = _gameBanner.asStateFlow()

    private val _isBusy = MutableStateFlow(false)
    val isBusy: StateFlow<Boolean> = _isBusy.asStateFlow()

    private var roomObserveJob: Job? = null
    private var playersObserveJob: Job? = null
    private var roomMessagesObserveJob: Job? = null
    private val recordedLivePodiumRooms = mutableSetOf<String>()

    init {
        viewModelScope.launch {
            tetheringHub.state.collect { tether ->
                val room = tether.liveRoom ?: return@collect
                if (RoomStatus.fromRaw(room.status) == RoomStatus.PODIUM &&
                    recordedLivePodiumRooms.add("tether_${room.id}")
                ) {
                    val hp = _hotspotLocalProgress.value
                    val totalQs = room.questions.size.coerceAtLeast(1)
                    val isHost = tether.role == TetheringRole.HOST
                    val acc = if (!isHost) {
                        ((hp.correctAnswersCount * 100L) / totalQs).coerceIn(0L, 100L)
                    } else 100L
                    val finalScore = if (!isHost) hp.localScore else 0L
                    if (!isHost || hp.answeredQuestionIndex >= 0) {
                        recordQuizCompletion(
                            title = "Hotspot: ${room.quizTitle}",
                            level = CefrLevel.fromRaw(room.cefrLevel),
                            score = finalScore,
                            accuracyPct = acc,
                            streak = hp.localStreak
                        )
                    }
                }
            }
        }
    }

    fun clearBanner() {
        _gameBanner.value = null
    }

    fun awardXp(xp: Long) {
        val safeXp = xp.coerceIn(0L, 500L)
        if (safeXp == 0L) return
        offlineStore.awardProgress(xpDelta = safeXp)
        if (!isOfflineMode) {
            viewModelScope.launch {
                repository.awardProgress(xpDelta = safeXp)
            }
        }
    }

    fun recordPuzzleSolved(
        puzzleTitle: String,
        cefrLevel: CefrLevel,
        xpEarned: Long = 15L,
        solvedCleanly: Boolean = true
    ) {
        val current = _puzzleProgressState.value
        val nextStreak = if (solvedCleanly) current.currentStreak + 1 else 0
        val nextBest = maxOf(current.bestStreak, nextStreak)
        val nextSolved = current.puzzlesSolved + 1
        val nextAdaptive = computeAdaptiveDifficulty(cefrLevel, nextStreak, solvedCleanly)

        _puzzleProgressState.value = current.copy(
            puzzlesSolved = nextSolved,
            currentStreak = nextStreak,
            bestStreak = nextBest,
            totalPuzzleXp = current.totalPuzzleXp + xpEarned,
            adaptiveLevel = nextAdaptive,
            lastResultNote = if (nextStreak >= 3) {
                "Hot streak (${nextStreak}x)! Adaptive level tuned to ${nextAdaptive.label}"
            } else {
                "$puzzleTitle solved (+$xpEarned XP)"
            }
        )

        offlineStore.awardProgress(xpDelta = xpEarned)
        offlineStore.logSessionRecord(
            activityType = ActivityType.PUZZLE,
            title = puzzleTitle,
            cefrLevel = cefrLevel,
            score = xpEarned,
            accuracyPct = if (solvedCleanly) 100L else 70L,
            wordsPracticed = 4L,
            durationMinutes = 3L
        )
        if (!isOfflineMode) {
            viewModelScope.launch {
                repository.awardProgress(xpDelta = xpEarned)
                repository.logSessionRecord(
                    activityType = ActivityType.PUZZLE,
                    title = puzzleTitle,
                    cefrLevel = cefrLevel,
                    score = xpEarned,
                    accuracyPct = if (solvedCleanly) 100L else 70L,
                    wordsPracticed = 4L,
                    durationMinutes = 3L
                )
            }
        }
    }

    fun recordQuizCompletion(
        title: String,
        level: CefrLevel,
        score: Long,
        accuracyPct: Long,
        streak: Long = 1L,
        profileSnapshot: UserProfile? = offlineStore.profileFlow.value
    ) {
        val newBadges = computeBadges(
            profile = profileSnapshot,
            quizzesPlayedDelta = 1L,
            bestScoreCandidate = score,
            latestQuizAccuracyPct = accuracyPct
        )
        offlineStore.awardProgress(
            xpDelta = 20L,
            quizzesPlayedDelta = 1L,
            bestLiveQuizScoreCandidate = score,
            newEarnedBadges = newBadges
        )
        offlineStore.logSessionRecord(
            activityType = ActivityType.QUIZ,
            title = title,
            cefrLevel = level,
            score = score,
            accuracyPct = accuracyPct,
            wordsPracticed = 6L,
            durationMinutes = 5L
        )
        offlineStore.publishScoreRecord(
            playerName = profileSnapshot?.displayName?.ifBlank { currentUserName } ?: currentUserName,
            quizTitle = title,
            cefrLevel = level,
            score = score,
            accuracyPct = accuracyPct,
            streak = streak,
            gameMode = "LIVE_QUIZ",
            avatarColor = "INDIGO"
        )

        if (!isOfflineMode) {
            viewModelScope.launch {
                repository.awardProgress(
                    xpDelta = 20L,
                    quizzesPlayedDelta = 1L,
                    bestLiveQuizScoreCandidate = score,
                    newEarnedBadges = newBadges
                )
                repository.logSessionRecord(
                    activityType = ActivityType.QUIZ,
                    title = title,
                    cefrLevel = level,
                    score = score,
                    accuracyPct = accuracyPct,
                    wordsPracticed = 6L,
                    durationMinutes = 5L
                )
                repository.publishScoreRecord(
                    quizTitle = title,
                    cefrLevel = level,
                    score = score,
                    accuracyPct = accuracyPct,
                    streak = streak,
                    gameMode = "LIVE_QUIZ",
                    avatarColor = "INDIGO"
                )
            }
        }

        if (newBadges.isNotEmpty()) {
            _gameBanner.value = "Badge unlocked: ${newBadges.joinToString { it.title }}!"
        }
    }

    fun recordArcadeGameResult(
        gameTitle: String,
        cefrLevel: CefrLevel,
        scoreXp: Long,
        accuracyPct: Long,
        wordsPracticed: Int,
        maxCombo: Int,
        profileSnapshot: UserProfile? = offlineStore.profileFlow.value
    ) {
        val safeXp = scoreXp.coerceIn(5L, 250L)
        val newBadges = computeBadges(
            profile = profileSnapshot,
            arcadePlayed = true,
            highCombo = maxCombo
        )
        offlineStore.awardProgress(xpDelta = safeXp, newEarnedBadges = newBadges)
        offlineStore.logSessionRecord(
            activityType = ActivityType.GAME,
            title = gameTitle,
            cefrLevel = cefrLevel,
            score = safeXp,
            accuracyPct = accuracyPct.coerceIn(0L, 100L),
            wordsPracticed = wordsPracticed.coerceIn(1, 200).toLong(),
            durationMinutes = 3L
        )
        offlineStore.publishScoreRecord(
            playerName = profileSnapshot?.displayName?.ifBlank { currentUserName } ?: currentUserName,
            quizTitle = gameTitle,
            cefrLevel = cefrLevel,
            score = safeXp * 10L,
            accuracyPct = accuracyPct.coerceIn(0L, 100L),
            streak = maxCombo.toLong(),
            gameMode = "ARCADE",
            avatarColor = "CORAL"
        )

        if (!isOfflineMode) {
            viewModelScope.launch {
                repository.awardProgress(xpDelta = safeXp, newEarnedBadges = newBadges)
                repository.logSessionRecord(
                    activityType = ActivityType.GAME,
                    title = gameTitle,
                    cefrLevel = cefrLevel,
                    score = safeXp,
                    accuracyPct = accuracyPct.coerceIn(0L, 100L),
                    wordsPracticed = wordsPracticed.coerceIn(1, 200).toLong(),
                    durationMinutes = 3L
                )
                repository.publishScoreRecord(
                    quizTitle = gameTitle,
                    cefrLevel = cefrLevel,
                    score = safeXp * 10L,
                    accuracyPct = accuracyPct.coerceIn(0L, 100L),
                    streak = maxCombo.toLong(),
                    gameMode = "ARCADE",
                    avatarColor = "CORAL"
                )
            }
        }
        val badgeNote = if (newBadges.isNotEmpty()) {
            " • Badge unlocked: ${newBadges.joinToString { it.title }}!"
        } else {
            ""
        }
        _gameBanner.value = "$gameTitle finished! +$safeXp XP$badgeNote"
    }

    // --- Live Multiplayer Room (Firestore OR Wi-Fi Hotspot Tethering) ---

    fun hostLiveRoom(
        quizTitle: String,
        cefrLevel: CefrLevel,
        questions: List<QuizQuestionItem>,
        preferHotspotIfOffline: Boolean = true
    ) {
        val tether = tetheringHub.state.value
        val hostName = offlineStore.profileFlow.value?.displayName?.ifBlank { currentUserName } ?: currentUserName
        if ((isOfflineMode && preferHotspotIfOffline) || tether.role == TetheringRole.HOST) {
            viewModelScope.launch(Dispatchers.IO) {
                if (tether.role != TetheringRole.HOST) {
                    tetheringHub.hostHotspotTeam(
                        teamName = "$hostName's Quiz Hub",
                        hostUid = currentUserId,
                        hostName = hostName,
                        cefrLevel = cefrLevel,
                        motto = "Live Hotspot Quiz: $quizTitle",
                        accentColor = "INDIGO"
                    )
                }
                val room = tetheringHub.startHotspotLiveQuiz(
                    hostUid = currentUserId,
                    hostName = hostName,
                    quizTitle = quizTitle,
                    cefrLevel = cefrLevel,
                    questions = questions
                )
                if (room != null) {
                    _hotspotLocalProgress.value = HotspotLocalPlayerState(
                        roomCode = room.id,
                        localNickname = hostName,
                        localAvatarColor = "INDIGO"
                    )
                    offlineStore.awardProgress(xpDelta = 30L, quizzesHostedDelta = 1L)
                    val ipHint = tetheringHub.state.value.localIpAddresses.firstOrNull() ?: "Hotspot IP"
                    _gameBanner.value = "Offline Hotspot Quiz live on $ipHint (Code ${room.id})!"
                }
            }
            return
        }

        viewModelScope.launch {
            _isBusy.value = true
            val result = repository.createQuizRoom(hostName, quizTitle, cefrLevel, questions)
            _isBusy.value = false
            result.onSuccess { code ->
                val newBadges = computeBadges(
                    profile = offlineStore.profileFlow.value,
                    quizzesHostedDelta = 1L
                )
                repository.awardProgress(
                    xpDelta = 30L,
                    quizzesHostedDelta = 1L,
                    newEarnedBadges = newBadges
                )
                offlineStore.awardProgress(
                    xpDelta = 30L,
                    quizzesHostedDelta = 1L,
                    newEarnedBadges = newBadges
                )
                if (newBadges.isNotEmpty()) {
                    _gameBanner.value = "Badge unlocked: ${newBadges.joinToString { it.title }}!"
                }
                attachToFirestoreRoom(
                    roomCode = code,
                    isHost = true,
                    hostUid = currentUserId,
                    localNickname = hostName,
                    localAvatarColor = "INDIGO"
                )
            }.onFailure { err ->
                _gameBanner.value = err.message ?: "Could not create online quiz room. Try Hotspot Squad!"
            }
        }
    }

    fun joinLiveRoom(roomCode: String, nickname: String, avatarColor: String) {
        if (isOfflineMode) {
            _gameBanner.value = "You're offline — join a friend's Hotspot Squad in Teams tab or connect to Wi-Fi!"
            return
        }
        viewModelScope.launch {
            _isBusy.value = true
            val result = repository.joinRoom(roomCode, nickname, avatarColor)
            _isBusy.value = false
            result.onSuccess { room ->
                attachToFirestoreRoom(
                    roomCode = roomCode.trim().uppercase(),
                    isHost = room.hostUid == currentUserId,
                    hostUid = room.hostUid,
                    localNickname = nickname.trim().ifBlank { currentUserName },
                    localAvatarColor = avatarColor
                )
            }.onFailure { err ->
                _gameBanner.value = err.message ?: "Could not join room."
            }
        }
    }

    private fun attachToFirestoreRoom(
        roomCode: String,
        isHost: Boolean,
        hostUid: String,
        localNickname: String,
        localAvatarColor: String
    ) {
        roomObserveJob?.cancel()
        playersObserveJob?.cancel()
        roomMessagesObserveJob?.cancel()
        _firestoreRoomSession.value = ActiveRoomSession(
            roomCode = roomCode,
            isHost = isHost,
            localNickname = localNickname,
            localAvatarColor = localAvatarColor
        )

        roomObserveJob = viewModelScope.launch {
            repository.observeRoom(roomCode)
                .catch { error ->
                    val fsErr = unwrapFirestoreErrorOrThrow(error)
                    _gameBanner.value = fsErr.message ?: "Room connection lost."
                }
                .collect { room ->
                    val current = _firestoreRoomSession.value ?: return@collect
                    _firestoreRoomSession.value = current.copy(room = room)
                    if (room != null &&
                        RoomStatus.fromRaw(room.status) == RoomStatus.PODIUM &&
                        recordedLivePodiumRooms.add(roomCode)
                    ) {
                        val totalQs = room.questions.size.coerceAtLeast(1)
                        val accuracyPct = if (!current.isHost) {
                            ((current.correctAnswersCount * 100L) / totalQs.toLong()).coerceIn(0L, 100L)
                        } else 100L
                        val scoreToRecord = if (!current.isHost) current.localScore else 0L
                        if (!current.isHost || current.answeredQuestionIndex >= 0) {
                            recordQuizCompletion(
                                title = "Live: ${room.quizTitle}",
                                level = CefrLevel.fromRaw(room.cefrLevel),
                                score = scoreToRecord,
                                accuracyPct = accuracyPct,
                                streak = current.localStreak
                            )
                        }
                    }
                }
        }

        if (isHost) {
            playersObserveJob = viewModelScope.launch {
                repository.observeRoomPlayers(roomCode, hostUid)
                    .catch { error ->
                        val fsErr = unwrapFirestoreErrorOrThrow(error)
                        _gameBanner.value = fsErr.message ?: "Player sync error."
                    }
                    .collect { players ->
                        val current = _firestoreRoomSession.value ?: return@collect
                        _firestoreRoomSession.value = current.copy(players = players)
                    }
            }
        }

        roomMessagesObserveJob = viewModelScope.launch {
            repository.observeRoomMessages(roomCode)
                .catch { error ->
                    val fsErr = unwrapFirestoreErrorOrThrow(error)
                    Log.w(TAG, "Error observing room chat for $roomCode", fsErr)
                }
                .collect { messages ->
                    val current = _firestoreRoomSession.value ?: return@collect
                    _firestoreRoomSession.value = current.copy(roomMessages = messages)
                }
        }
    }

    fun hostStartOrNextQuestion() {
        val tether = tetheringHub.state.value
        if (tether.role == TetheringRole.HOST && tether.liveRoom != null) {
            tetheringHub.advanceHotspotLiveQuiz()
            return
        }
        val session = _firestoreRoomSession.value ?: return
        val room = session.room ?: return
        if (!session.isHost) return

        val qIdx = room.currentQuestionIndex.toInt()
        val leaderboard = session.players
            .sortedByDescending { it.score }
            .map {
                LeaderboardEntry(
                    uid = it.playerUid,
                    nickname = it.nickname,
                    score = it.score,
                    streak = it.streak,
                    avatarColor = it.avatarColor
                )
            }
        viewModelScope.launch {
            when (RoomStatus.fromRaw(room.status)) {
                RoomStatus.LOBBY -> repository.advanceRoomPhase(
                    roomCode = session.roomCode,
                    newStatus = RoomStatus.QUESTION,
                    questionIndex = 0,
                    questionStartedAtMs = System.currentTimeMillis(),
                    leaderboard = leaderboard
                )
                RoomStatus.QUESTION -> repository.advanceRoomPhase(
                    roomCode = session.roomCode,
                    newStatus = RoomStatus.REVEAL,
                    questionIndex = qIdx,
                    questionStartedAtMs = room.questionStartedAtMs,
                    leaderboard = leaderboard
                )
                RoomStatus.REVEAL -> {
                    val nextIdx = qIdx + 1
                    if (nextIdx >= room.questions.size) {
                        repository.advanceRoomPhase(
                            roomCode = session.roomCode,
                            newStatus = RoomStatus.PODIUM,
                            questionIndex = qIdx,
                            questionStartedAtMs = room.questionStartedAtMs,
                            leaderboard = leaderboard
                        )
                    } else {
                        repository.advanceRoomPhase(
                            roomCode = session.roomCode,
                            newStatus = RoomStatus.QUESTION,
                            questionIndex = nextIdx,
                            questionStartedAtMs = System.currentTimeMillis(),
                            leaderboard = leaderboard
                        )
                    }
                }
                RoomStatus.PODIUM -> Unit
            }
        }
    }

    fun submitLiveAnswer(optionIndex: Int) {
        val tether = tetheringHub.state.value
        val tetherRoom = tether.liveRoom
        if (tether.role != TetheringRole.NONE && tetherRoom != null) {
            if (tether.role == TetheringRole.HOST) return
            if (RoomStatus.fromRaw(tetherRoom.status) != RoomStatus.QUESTION) return
            val qIdx = tetherRoom.currentQuestionIndex.toInt()
            val curHp = _hotspotLocalProgress.value
            if (curHp.answeredQuestionIndex == qIdx) return
            val q = tetherRoom.questions.getOrNull(qIdx) ?: return

            val elapsedMs = (System.currentTimeMillis() - tetherRoom.questionStartedAtMs).coerceAtLeast(0L)
            val limitMs = (q.timeLimitSec.coerceAtLeast(10L) * 1000L)
            val remainingRatio = ((limitMs - elapsedMs).toFloat() / limitMs.toFloat()).coerceIn(0f, 1f)
            val isCorrect = optionIndex.toLong() == q.correctIndex
            val newStreak = if (isCorrect) curHp.localStreak + 1L else 0L
            val pointsEarned = computeQuizPointsEarned(isCorrect, remainingRatio, newStreak)
            val newScore = curHp.localScore + pointsEarned

            _hotspotLocalProgress.value = curHp.copy(
                localScore = newScore,
                localStreak = newStreak,
                correctAnswersCount = curHp.correctAnswersCount + if (isCorrect) 1 else 0,
                answeredQuestionIndex = qIdx,
                selectedOptionIndex = optionIndex
            )
            tetheringHub.submitHotspotQuizAnswer(
                playerUid = currentUserId,
                playerName = curHp.localNickname.ifBlank { currentUserName },
                avatarColor = curHp.localAvatarColor,
                questionIndex = qIdx,
                selectedIndex = optionIndex,
                correct = isCorrect,
                pointsEarned = pointsEarned,
                newScore = newScore,
                newStreak = newStreak
            )
            if (isCorrect) awardXp(15L)
            return
        }

        val session = _firestoreRoomSession.value ?: return
        val room = session.room ?: return
        if (session.isHost) return
        if (RoomStatus.fromRaw(room.status) != RoomStatus.QUESTION) return

        val qIdx = room.currentQuestionIndex.toInt()
        if (session.answeredQuestionIndex == qIdx) return
        val question = room.questions.getOrNull(qIdx) ?: return

        val elapsedMs = (System.currentTimeMillis() - room.questionStartedAtMs).coerceAtLeast(0L)
        val limitMs = (question.timeLimitSec.coerceAtLeast(10L) * 1000L)
        val remainingRatio = ((limitMs - elapsedMs).toFloat() / limitMs.toFloat()).coerceIn(0f, 1f)

        val isCorrect = optionIndex.toLong() == question.correctIndex
        val newStreak = if (isCorrect) session.localStreak + 1L else 0L
        val newCorrectCount = if (isCorrect) session.correctAnswersCount + 1 else session.correctAnswersCount
        val pointsEarned = computeQuizPointsEarned(isCorrect, remainingRatio, newStreak)
        val newScore = session.localScore + pointsEarned

        _firestoreRoomSession.value = session.copy(
            localScore = newScore,
            localStreak = newStreak,
            correctAnswersCount = newCorrectCount,
            answeredQuestionIndex = qIdx,
            selectedOptionIndex = optionIndex
        )

        viewModelScope.launch {
            repository.submitRoomAnswer(
                roomCode = session.roomCode,
                questionIndex = qIdx,
                selectedIndex = optionIndex,
                correct = isCorrect,
                pointsEarned = pointsEarned,
                newScore = newScore,
                newStreak = newStreak
            )
            if (isCorrect) {
                awardXp(15L)
            }
        }
    }

    fun leaveLiveRoom() {
        val tether = tetheringHub.state.value
        if (tether.role != TetheringRole.NONE && tether.liveRoom != null) {
            tetheringHub.closeHotspotRoom()
            _hotspotLocalProgress.value = HotspotLocalPlayerState()
        }
        roomObserveJob?.cancel()
        playersObserveJob?.cancel()
        roomMessagesObserveJob?.cancel()
        _firestoreRoomSession.value = null
    }

    fun sendRoomChatMessage(text: String, messageType: RoomMessageType = RoomMessageType.TEXT) {
        val tether = tetheringHub.state.value
        if (tether.role != TetheringRole.NONE && tether.liveRoom != null) {
            tetheringHub.sendHotspotRoomMessage(
                senderUid = currentUserId,
                senderName = _hotspotLocalProgress.value.localNickname.ifBlank { currentUserName },
                avatarColor = _hotspotLocalProgress.value.localAvatarColor,
                hostSender = tether.role == TetheringRole.HOST,
                messageType = messageType,
                text = text
            )
            return
        }

        val session = _firestoreRoomSession.value ?: return
        val senderName = session.localNickname.ifBlank { currentUserName }
        val isActualHost = session.room?.hostUid == currentUserId
        viewModelScope.launch {
            repository.sendRoomMessage(
                roomCode = session.roomCode,
                senderName = senderName,
                avatarColor = session.localAvatarColor,
                hostSender = isActualHost,
                messageType = messageType,
                text = text
            ).onFailure {
                _gameBanner.value = it.message ?: "Could not send room message."
            }
        }
    }

    fun deleteRoomChatMessage(messageId: String) {
        val session = _firestoreRoomSession.value ?: return
        viewModelScope.launch {
            repository.deleteRoomMessage(session.roomCode, messageId).onFailure {
                _gameBanner.value = it.message ?: "Could not delete room message."
            }
        }
    }

    // --- Tethering / Hotspot Offline Team Formation ---

    fun hostTetheringTeam(
        teamName: String,
        cefrLevel: CefrLevel,
        motto: String,
        accentColor: String = "INDIGO"
    ) {
        val hostName = offlineStore.profileFlow.value?.displayName?.ifBlank { currentUserName } ?: currentUserName
        viewModelScope.launch(Dispatchers.IO) {
            val team = tetheringHub.hostHotspotTeam(
                teamName = teamName,
                hostUid = currentUserId,
                hostName = hostName,
                cefrLevel = cefrLevel,
                motto = motto,
                accentColor = accentColor
            )
            offlineStore.upsertOfflineTeam(team, joinImmediately = true)
            _gameBanner.value = "Hotspot Team '${team.name}' open! Code: ${tetheringHub.state.value.teamCode}"
        }
    }

    fun scanTetheringTeams() {
        tetheringHub.scanHotspotHosts()
    }

    fun joinTetheringTeam(
        hostIp: String,
        port: Int = TetheringHubManager.DEFAULT_TCP_PORT,
        teamCode: String = "",
        avatarColor: String = "CORAL"
    ) {
        val myName = offlineStore.profileFlow.value?.displayName?.ifBlank { currentUserName } ?: currentUserName
        tetheringHub.joinHotspotHost(
            hostIp = hostIp,
            port = port,
            peerUid = currentUserId,
            peerName = myName,
            avatarColor = avatarColor,
            teamCode = teamCode
        )
    }

    fun sendTetheringChatMessage(text: String, pinned: Boolean = false) {
        val myName = offlineStore.profileFlow.value?.displayName?.ifBlank { currentUserName } ?: currentUserName
        val isHost = tetheringHub.state.value.role == TetheringRole.HOST
        tetheringHub.sendSquadMessage(
            senderUid = currentUserId,
            senderName = myName,
            senderRole = if (isHost) ChatSenderRole.TEACHER else ChatSenderRole.PLAYER,
            text = text,
            pinned = pinned && isHost
        )
    }

    fun disconnectTethering() {
        tetheringHub.disconnect()
        _hotspotLocalProgress.value = HotspotLocalPlayerState()
    }

    fun cleanupListeners() {
        roomObserveJob?.cancel()
        playersObserveJob?.cancel()
        roomMessagesObserveJob?.cancel()
        _firestoreRoomSession.value = null
        tetheringHub.disconnect()
    }

    override fun onCleared() {
        super.onCleared()
        cleanupListeners()
        tetheringHub.shutdown()
    }

    private fun computeBadges(
        profile: UserProfile?,
        quizzesPlayedDelta: Long = 0L,
        quizzesHostedDelta: Long = 0L,
        bestScoreCandidate: Long = 0L,
        latestQuizAccuracyPct: Long = 0L,
        arcadePlayed: Boolean = false,
        highCombo: Int = 0
    ): List<LingoBadge> = BadgeEngine.computeNewBadges(
        existingIds = profile?.earnedBadges.orEmpty(),
        sessionsCompleted = profile?.sessionsCompleted ?: 0L,
        weeklyWordsMastered = profile?.weeklyWordsMastered ?: 0L,
        quizzesPlayed = (profile?.quizzesPlayed ?: 0L) + quizzesPlayedDelta,
        quizzesHosted = (profile?.quizzesHosted ?: 0L) + quizzesHostedDelta,
        bestLiveQuizScore = maxOf(profile?.bestLiveQuizScore ?: 0L, bestScoreCandidate),
        latestQuizAccuracyPct = latestQuizAccuracyPct,
        audiobooksFinished = profile?.audiobooksFinished ?: 0L,
        roleplayCompleted = false,
        arcadePlayed = arcadePlayed,
        highCombo = highCombo
    )

    private fun unwrapFirestoreErrorOrThrow(error: Throwable): Throwable {
        val firestoreError = generateSequence(error) { it.cause }
            .filterIsInstance<FirebaseFirestoreException>()
            .firstOrNull()
        if (firestoreError == null && error is CancellationException) throw error
        return firestoreError ?: error
    }

    companion object {
        private const val TAG = "GameViewModel"
        private const val STOP_TIMEOUT_MILLIS = 5000L

        fun computeQuizPointsEarned(
            isCorrect: Boolean,
            remainingRatio: Float,
            newStreak: Long
        ): Long {
            if (!isCorrect) return 0L
            val clampedRatio = remainingRatio.coerceIn(0f, 1f)
            return 500L + (500L * clampedRatio).toLong() + (newStreak.coerceAtMost(5L) * 50L)
        }

        fun computeAdaptiveDifficulty(
            currentLevel: CefrLevel,
            currentStreak: Int,
            solvedCleanly: Boolean
        ): CefrLevel {
            val ordered = CefrLevel.entries
            val idx = ordered.indexOf(currentLevel)
            return when {
                solvedCleanly && currentStreak >= 3 && idx < ordered.lastIndex -> ordered[idx + 1]
                !solvedCleanly && currentStreak == 0 && idx > 0 -> ordered[idx - 1]
                else -> currentLevel
            }
        }
    }
}
