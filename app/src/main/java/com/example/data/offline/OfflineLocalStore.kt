package com.example.data.offline

import android.content.Context
import android.content.SharedPreferences
import com.example.data.model.ActivityType
import com.example.data.model.CardMastery
import com.example.data.model.CefrLevel
import com.example.data.model.ChatMessage
import com.example.data.model.ChatSenderRole
import com.example.data.model.CustomDeck
import com.example.data.model.CustomQuiz
import com.example.data.model.CustomRoleplay
import com.example.data.model.LingoBadge
import com.example.data.model.QuizQuestionItem
import com.example.data.model.ScoreRecord
import com.example.data.model.SessionRecord
import com.example.data.model.TeamChannel
import com.example.data.model.TeamChannelKind
import com.example.data.model.UserProfile
import com.example.data.model.WeeklyProgress
import com.google.firebase.Timestamp
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray
import org.json.JSONObject
import java.util.Date
import java.util.UUID

class OfflineLocalStore(
    context: Context,
    private val userId: String,
    defaultDisplayName: String
) {
    private val prefs: SharedPreferences = context.applicationContext
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val _profileFlow = MutableStateFlow(loadOrInitProfile(defaultDisplayName))
    val profileFlow: StateFlow<UserProfile?> = _profileFlow.asStateFlow()

    private val _sessionHistoryFlow = MutableStateFlow(loadSessions())
    val sessionHistoryFlow: StateFlow<List<SessionRecord>> = _sessionHistoryFlow.asStateFlow()

    private val _weeklyProgressFlow = MutableStateFlow(loadWeeklyProgress())
    val weeklyProgressFlow: StateFlow<Map<Int, WeeklyProgress>> = _weeklyProgressFlow.asStateFlow()

    private val _cardMasteryFlow = MutableStateFlow(loadCardMastery())
    val cardMasteryFlow: StateFlow<Map<String, CardMastery>> = _cardMasteryFlow.asStateFlow()

    private val _scoresFlow = MutableStateFlow(loadScores())
    val scoresFlow: StateFlow<List<ScoreRecord>> = _scoresFlow.asStateFlow()

    private val _teamsFlow = MutableStateFlow(loadOrInitTeams())
    val teamsFlow: StateFlow<List<TeamChannel>> = _teamsFlow.asStateFlow()

    private val _messagesMapFlow = MutableStateFlow(loadMessagesMap())
    val messagesMapFlow: StateFlow<Map<String, List<ChatMessage>>> = _messagesMapFlow.asStateFlow()

    private val _customQuizzesFlow = MutableStateFlow(loadCustomQuizzes())
    val customQuizzesFlow: StateFlow<List<CustomQuiz>> = _customQuizzesFlow.asStateFlow()

    private val _customDecksFlow = MutableStateFlow<List<CustomDeck>>(emptyList())
    val customDecksFlow: StateFlow<List<CustomDeck>> = _customDecksFlow.asStateFlow()

    private val _customRoleplaysFlow = MutableStateFlow<List<CustomRoleplay>>(emptyList())
    val customRoleplaysFlow: StateFlow<List<CustomRoleplay>> = _customRoleplaysFlow.asStateFlow()

    private fun key(suffix: String): String = "${userId}_$suffix"

    private fun loadOrInitProfile(defaultName: String): UserProfile {
        val raw = prefs.getString(key("profile"), null)
        if (!raw.isNullOrBlank()) {
            runCatching {
                val obj = JSONObject(raw)
                return UserProfile(
                    id = userId,
                    userId = userId,
                    displayName = obj.optString("displayName", defaultName).ifBlank { defaultName },
                    learningLevel = obj.optString("learningLevel", CefrLevel.B1.name),
                    xp = obj.optLong("xp", 0L),
                    streak = obj.optLong("streak", 1L).coerceAtLeast(1L),
                    quizzesHosted = obj.optLong("quizzesHosted", 0L),
                    quizzesPlayed = obj.optLong("quizzesPlayed", 0L),
                    cardsMastered = obj.optLong("cardsMastered", 0L),
                    sessionsCompleted = obj.optLong("sessionsCompleted", 0L),
                    audiobooksFinished = obj.optLong("audiobooksFinished", 0L),
                    weeklyWordsMastered = obj.optLong("weeklyWordsMastered", 0L),
                    bestLiveQuizScore = obj.optLong("bestLiveQuizScore", 0L),
                    earnedBadges = jsonArrayToStringList(obj.optJSONArray("earnedBadges")),
                    pinnedEvidenceIds = jsonArrayToStringList(obj.optJSONArray("pinnedEvidenceIds")),
                    teamId = obj.optString("teamId", ""),
                    teamName = obj.optString("teamName", ""),
                    accountRole = obj.optString("accountRole", "STUDENT")
                )
            }
        }
        val initial = UserProfile(
            id = userId,
            userId = userId,
            displayName = defaultName.ifBlank { "Offline Explorer" },
            learningLevel = CefrLevel.B1.name,
            xp = 0L,
            streak = 1L
        )
        persistProfileJson(initial)
        return initial
    }

    private fun saveProfile(profile: UserProfile) {
        _profileFlow.value = profile
        persistProfileJson(profile)
    }

    private fun persistProfileJson(profile: UserProfile) {
        val obj = JSONObject().apply {
            put("displayName", profile.displayName)
            put("learningLevel", profile.learningLevel)
            put("xp", profile.xp)
            put("streak", profile.streak)
            put("quizzesHosted", profile.quizzesHosted)
            put("quizzesPlayed", profile.quizzesPlayed)
            put("cardsMastered", profile.cardsMastered)
            put("sessionsCompleted", profile.sessionsCompleted)
            put("audiobooksFinished", profile.audiobooksFinished)
            put("weeklyWordsMastered", profile.weeklyWordsMastered)
            put("bestLiveQuizScore", profile.bestLiveQuizScore)
            put("earnedBadges", JSONArray(profile.earnedBadges))
            put("pinnedEvidenceIds", JSONArray(profile.pinnedEvidenceIds))
            put("teamId", profile.teamId)
            put("teamName", profile.teamName)
            put("accountRole", profile.accountRole)
        }
        prefs.edit().putString(key("profile"), obj.toString()).apply()
    }

    fun updateDisplayName(name: String) {
        val clean = name.trim()
        if (clean.isEmpty()) return
        saveProfile(_profileFlow.value.copy(displayName = clean))
    }

    fun updateLearningLevel(level: CefrLevel) {
        saveProfile(_profileFlow.value.copy(learningLevel = level.name))
    }

    fun awardProgress(
        xpDelta: Long = 0L,
        quizzesHostedDelta: Long = 0L,
        quizzesPlayedDelta: Long = 0L,
        cardsMasteredDelta: Long = 0L,
        sessionsCompletedDelta: Long = 0L,
        audiobooksFinishedDelta: Long = 0L,
        weeklyWordsMasteredDelta: Long = 0L,
        bestLiveQuizScoreCandidate: Long = 0L,
        newEarnedBadges: List<LingoBadge> = emptyList()
    ) {
        val cur = _profileFlow.value
        val mergedBadges = (cur.earnedBadges + newEarnedBadges.map { it.name }).distinct()
        val updated = cur.copy(
            xp = (cur.xp + xpDelta).coerceAtLeast(0L),
            quizzesHosted = (cur.quizzesHosted + quizzesHostedDelta).coerceAtLeast(0L),
            quizzesPlayed = (cur.quizzesPlayed + quizzesPlayedDelta).coerceAtLeast(0L),
            cardsMastered = (cur.cardsMastered + cardsMasteredDelta).coerceAtLeast(0L),
            sessionsCompleted = (cur.sessionsCompleted + sessionsCompletedDelta).coerceAtLeast(0L),
            audiobooksFinished = (cur.audiobooksFinished + audiobooksFinishedDelta).coerceAtLeast(0L),
            weeklyWordsMastered = (cur.weeklyWordsMastered + weeklyWordsMasteredDelta).coerceAtLeast(0L),
            bestLiveQuizScore = maxOf(cur.bestLiveQuizScore, bestLiveQuizScoreCandidate),
            earnedBadges = mergedBadges
        )
        saveProfile(updated)
    }

    fun togglePinEvidence(cardId: String, pinned: Boolean) {
        val cur = _profileFlow.value
        val nextIds = if (pinned) {
            (cur.pinnedEvidenceIds + cardId).distinct()
        } else {
            cur.pinnedEvidenceIds.filterNot { it == cardId }
        }
        saveProfile(cur.copy(pinnedEvidenceIds = nextIds))
    }

    fun logSessionRecord(
        activityType: ActivityType,
        title: String,
        cefrLevel: CefrLevel,
        score: Long,
        accuracyPct: Long,
        wordsPracticed: Long,
        durationMinutes: Long
    ) {
        val record = SessionRecord(
            id = UUID.randomUUID().toString(),
            activityType = activityType.name,
            title = title.take(100),
            cefrLevel = cefrLevel.name,
            score = score.coerceAtLeast(0L),
            accuracyPct = accuracyPct.coerceIn(0L, 100L),
            wordsPracticed = wordsPracticed.coerceAtLeast(0L),
            durationMinutes = durationMinutes.coerceAtLeast(1L),
            createdAt = Timestamp(Date(System.currentTimeMillis()))
        )
        val next = (listOf(record) + _sessionHistoryFlow.value).take(50)
        _sessionHistoryFlow.value = next
        saveSessions(next)
    }

    private fun loadSessions(): List<SessionRecord> {
        val raw = prefs.getString(key("sessions"), null) ?: return emptyList()
        return runCatching {
            val arr = JSONArray(raw)
            (0 until arr.length()).map { idx ->
                val obj = arr.getJSONObject(idx)
                val tsMs = obj.optLong("createdAtMs", System.currentTimeMillis())
                SessionRecord(
                    id = obj.optString("id", UUID.randomUUID().toString()),
                    activityType = obj.optString("activityType", ActivityType.QUIZ.name),
                    title = obj.optString("title", "Session"),
                    cefrLevel = obj.optString("cefrLevel", CefrLevel.B1.name),
                    score = obj.optLong("score", 0L),
                    accuracyPct = obj.optLong("accuracyPct", 100L),
                    wordsPracticed = obj.optLong("wordsPracticed", 0L),
                    durationMinutes = obj.optLong("durationMinutes", 5L),
                    createdAt = Timestamp(Date(tsMs))
                )
            }
        }.getOrDefault(emptyList())
    }

    private fun saveSessions(list: List<SessionRecord>) {
        val arr = JSONArray()
        list.forEach { s ->
            arr.put(
                JSONObject().apply {
                    put("id", s.id)
                    put("activityType", s.activityType)
                    put("title", s.title)
                    put("cefrLevel", s.cefrLevel)
                    put("score", s.score)
                    put("accuracyPct", s.accuracyPct)
                    put("wordsPracticed", s.wordsPracticed)
                    put("durationMinutes", s.durationMinutes)
                    put("createdAtMs", s.createdAt?.toDate()?.time ?: System.currentTimeMillis())
                }
            )
        }
        prefs.edit().putString(key("sessions"), arr.toString()).apply()
    }

    fun updateWeeklyWordMastery(weekNumber: Int, masteredIds: List<String>) {
        val map = _weeklyProgressFlow.value.toMutableMap()
        val cur = map[weekNumber] ?: WeeklyProgress(id = "week_$weekNumber", weekNumber = weekNumber.toLong())
        map[weekNumber] = cur.copy(masteredWordIds = masteredIds.distinct())
        _weeklyProgressFlow.value = map
        saveWeeklyProgress(map)
    }

    fun markWeeklySessionComplete(weekNumber: Int, sessionNumber: Int): Boolean {
        val map = _weeklyProgressFlow.value.toMutableMap()
        val cur = map[weekNumber] ?: WeeklyProgress(id = "week_$weekNumber", weekNumber = weekNumber.toLong())
        val sLong = sessionNumber.toLong()
        val newlyCompleted = sLong !in cur.completedSessions
        if (newlyCompleted) {
            map[weekNumber] = cur.copy(completedSessions = (cur.completedSessions + sLong).distinct())
            _weeklyProgressFlow.value = map
            saveWeeklyProgress(map)
        }
        return newlyCompleted
    }

    fun recordWeeklyGamePlayed(weekNumber: Int) {
        val map = _weeklyProgressFlow.value.toMutableMap()
        val cur = map[weekNumber] ?: WeeklyProgress(id = "week_$weekNumber", weekNumber = weekNumber.toLong())
        map[weekNumber] = cur.copy(gamesPlayed = cur.gamesPlayed + 1L)
        _weeklyProgressFlow.value = map
        saveWeeklyProgress(map)
    }

    private fun loadWeeklyProgress(): Map<Int, WeeklyProgress> {
        val raw = prefs.getString(key("weekly"), null) ?: return emptyMap()
        return runCatching {
            val obj = JSONObject(raw)
            val result = LinkedHashMap<Int, WeeklyProgress>()
            obj.keys().forEach { weekKey ->
                val weekNum = weekKey.toIntOrNull() ?: return@forEach
                val wObj = obj.getJSONObject(weekKey)
                val completedArr = wObj.optJSONArray("completedSessions") ?: JSONArray()
                val completedList = (0 until completedArr.length()).map { completedArr.getLong(it) }
                result[weekNum] = WeeklyProgress(
                    id = "week_$weekNum",
                    weekNumber = weekNum.toLong(),
                    masteredWordIds = jsonArrayToStringList(wObj.optJSONArray("masteredWordIds")),
                    completedSessions = completedList,
                    gamesPlayed = wObj.optLong("gamesPlayed", 0L)
                )
            }
            result
        }.getOrDefault(emptyMap())
    }

    private fun saveWeeklyProgress(map: Map<Int, WeeklyProgress>) {
        val obj = JSONObject()
        map.forEach { (weekNum, wp) ->
            obj.put(
                weekNum.toString(),
                JSONObject().apply {
                    put("masteredWordIds", JSONArray(wp.masteredWordIds))
                    put("completedSessions", JSONArray(wp.completedSessions))
                    put("gamesPlayed", wp.gamesPlayed)
                }
            )
        }
        prefs.edit().putString(key("weekly"), obj.toString()).apply()
    }

    fun toggleCardMastery(deckId: String, cardIndex: Int, newMastered: Boolean) {
        val docId = "${deckId}_$cardIndex"
        val map = _cardMasteryFlow.value.toMutableMap()
        val prev = map[docId]
        map[docId] = CardMastery(
            id = docId,
            deckId = deckId,
            mastered = newMastered,
            reviewCount = (prev?.reviewCount ?: 0L) + 1L
        )
        _cardMasteryFlow.value = map
        saveCardMastery(map)
    }

    private fun loadCardMastery(): Map<String, CardMastery> {
        val raw = prefs.getString(key("card_mastery"), null) ?: return emptyMap()
        return runCatching {
            val obj = JSONObject(raw)
            val out = LinkedHashMap<String, CardMastery>()
            obj.keys().forEach { id ->
                val item = obj.getJSONObject(id)
                out[id] = CardMastery(
                    id = id,
                    deckId = item.optString("deckId", ""),
                    mastered = item.optBoolean("mastered", false),
                    reviewCount = item.optLong("reviewCount", 0L)
                )
            }
            out
        }.getOrDefault(emptyMap())
    }

    private fun saveCardMastery(map: Map<String, CardMastery>) {
        val obj = JSONObject()
        map.forEach { (id, cm) ->
            obj.put(
                id,
                JSONObject().apply {
                    put("deckId", cm.deckId)
                    put("mastered", cm.mastered)
                    put("reviewCount", cm.reviewCount)
                }
            )
        }
        prefs.edit().putString(key("card_mastery"), obj.toString()).apply()
    }

    fun publishScoreRecord(
        playerName: String,
        quizTitle: String,
        cefrLevel: CefrLevel,
        score: Long,
        accuracyPct: Long,
        streak: Long,
        gameMode: String,
        avatarColor: String = "INDIGO"
    ) {
        val entry = ScoreRecord(
            id = UUID.randomUUID().toString(),
            userId = userId,
            playerName = playerName.ifBlank { _profileFlow.value.displayName },
            avatarColor = avatarColor,
            quizTitle = quizTitle.take(100),
            cefrLevel = cefrLevel.name,
            score = score.coerceAtLeast(0L),
            accuracyPct = accuracyPct.coerceIn(0L, 100L),
            streak = streak.coerceAtLeast(0L),
            gameMode = gameMode,
            createdAt = Timestamp(Date(System.currentTimeMillis()))
        )
        val next = (_scoresFlow.value + entry)
            .sortedByDescending { it.score }
            .take(100)
        _scoresFlow.value = next
        saveScores(next)
    }

    private fun loadScores(): List<ScoreRecord> {
        val raw = prefs.getString(SHARED_SCORES_KEY, null) ?: return emptyList()
        return runCatching {
            val arr = JSONArray(raw)
            (0 until arr.length()).map { i ->
                val obj = arr.getJSONObject(i)
                val tsMs = obj.optLong("createdAtMs", System.currentTimeMillis())
                ScoreRecord(
                    id = obj.optString("id", UUID.randomUUID().toString()),
                    userId = obj.optString("userId", userId),
                    playerName = obj.optString("playerName", "Player"),
                    avatarColor = obj.optString("avatarColor", "INDIGO"),
                    quizTitle = obj.optString("quizTitle", "Quiz"),
                    cefrLevel = obj.optString("cefrLevel", CefrLevel.B1.name),
                    score = obj.optLong("score", 0L),
                    accuracyPct = obj.optLong("accuracyPct", 100L),
                    streak = obj.optLong("streak", 0L),
                    gameMode = obj.optString("gameMode", "LIVE_QUIZ"),
                    createdAt = Timestamp(Date(tsMs))
                )
            }.sortedByDescending { it.score }
        }.getOrDefault(emptyList())
    }

    private fun saveScores(scores: List<ScoreRecord>) {
        val arr = JSONArray()
        scores.forEach { s ->
            arr.put(
                JSONObject().apply {
                    put("id", s.id)
                    put("userId", s.userId)
                    put("playerName", s.playerName)
                    put("avatarColor", s.avatarColor)
                    put("quizTitle", s.quizTitle)
                    put("cefrLevel", s.cefrLevel)
                    put("score", s.score)
                    put("accuracyPct", s.accuracyPct)
                    put("streak", s.streak)
                    put("gameMode", s.gameMode)
                    put("createdAtMs", s.createdAt?.toDate()?.time ?: System.currentTimeMillis())
                }
            )
        }
        prefs.edit().putString(SHARED_SCORES_KEY, arr.toString()).apply()
    }

    private fun loadOrInitTeams(): List<TeamChannel> {
        val raw = prefs.getString(SHARED_TEAMS_KEY, null)
        if (!raw.isNullOrBlank()) {
            val parsed = runCatching {
                val arr = JSONArray(raw)
                (0 until arr.length()).map { i ->
                    val o = arr.getJSONObject(i)
                    TeamChannel(
                        id = o.getString("id"),
                        visibility = "OFFLINE",
                        name = o.getString("name"),
                        cefrLevel = o.optString("cefrLevel", CefrLevel.B1.name),
                        motto = o.optString("motto", ""),
                        accentColor = o.optString("accentColor", "INDIGO"),
                        leaderUid = o.optString("leaderUid", userId),
                        leaderName = o.optString("leaderName", "Squad Host"),
                        channelKind = o.optString("channelKind", TeamChannelKind.TEAM.name),
                        memberCount = o.optLong("memberCount", 1L)
                    )
                }
            }.getOrNull()
            if (!parsed.isNullOrEmpty()) return parsed
        }
        val defaults = listOf(
            TeamChannel(
                id = OFFLINE_DEFAULT_TEAM_ID,
                visibility = "OFFLINE",
                name = "Offline Explorers",
                cefrLevel = CefrLevel.B1.name,
                motto = "Practice English offline or share on a Wi-Fi Hotspot!",
                accentColor = "INDIGO",
                leaderUid = userId,
                leaderName = _profileFlow.value.displayName,
                channelKind = TeamChannelKind.TEAM.name,
                memberCount = 1L
            )
        )
        saveTeams(defaults)
        return defaults
    }

    private fun saveTeams(teams: List<TeamChannel>) {
        val arr = JSONArray()
        teams.forEach { t ->
            arr.put(
                JSONObject().apply {
                    put("id", t.id)
                    put("name", t.name)
                    put("cefrLevel", t.cefrLevel)
                    put("motto", t.motto)
                    put("accentColor", t.accentColor)
                    put("leaderUid", t.leaderUid)
                    put("leaderName", t.leaderName)
                    put("channelKind", t.channelKind)
                    put("memberCount", t.memberCount)
                }
            )
        }
        prefs.edit().putString(SHARED_TEAMS_KEY, arr.toString()).apply()
    }

    fun upsertOfflineTeam(team: TeamChannel, joinImmediately: Boolean = true): TeamChannel {
        val current = _teamsFlow.value.toMutableList()
        val idx = current.indexOfFirst { it.id == team.id }
        if (idx >= 0) {
            current[idx] = team
        } else {
            current.add(0, team)
        }
        _teamsFlow.value = current
        saveTeams(current)
        if (joinImmediately) {
            saveProfile(_profileFlow.value.copy(teamId = team.id, teamName = team.name))
        }
        return team
    }

    fun createOfflineTeam(
        name: String,
        cefrLevel: CefrLevel,
        motto: String,
        accentColor: String,
        isTeacherHub: Boolean
    ): TeamChannel {
        val team = TeamChannel(
            id = "offline_team_${UUID.randomUUID().toString().take(8)}",
            visibility = "OFFLINE",
            name = name.trim().take(50),
            cefrLevel = cefrLevel.name,
            motto = motto.trim().take(120),
            accentColor = accentColor,
            leaderUid = userId,
            leaderName = _profileFlow.value.displayName,
            channelKind = if (isTeacherHub) TeamChannelKind.TEACHER_HUB.name else TeamChannelKind.TEAM.name,
            memberCount = 1L
        )
        return upsertOfflineTeam(team, joinImmediately = true)
    }

    fun joinOfflineTeam(team: TeamChannel) {
        val cur = _profileFlow.value
        val updatedTeam = if (cur.teamId != team.id) {
            team.copy(memberCount = team.memberCount + 1L)
        } else team
        upsertOfflineTeam(updatedTeam, joinImmediately = true)
    }

    fun appendOfflineMessage(message: ChatMessage) {
        val map = _messagesMapFlow.value.toMutableMap()
        val existing = map[message.teamId].orEmpty()
        if (existing.any { it.id == message.id }) return
        val nextList = (existing + message).takeLast(120)
        map[message.teamId] = nextList
        _messagesMapFlow.value = map
        saveMessagesMap(map)
    }

    fun toggleOfflineMessagePin(teamId: String, messageId: String, pinned: Boolean) {
        val map = _messagesMapFlow.value.toMutableMap()
        val next = map[teamId].orEmpty().map { msg ->
            if (msg.id == messageId) msg.copy(pinned = pinned) else msg
        }
        map[teamId] = next
        _messagesMapFlow.value = map
        saveMessagesMap(map)
    }

    fun deleteOfflineMessage(teamId: String, messageId: String) {
        val map = _messagesMapFlow.value.toMutableMap()
        map[teamId] = map[teamId].orEmpty().filterNot { it.id == messageId }
        _messagesMapFlow.value = map
        saveMessagesMap(map)
    }

    private fun loadMessagesMap(): Map<String, List<ChatMessage>> {
        val raw = prefs.getString(SHARED_MESSAGES_KEY, null) ?: return emptyMap()
        return runCatching {
            val obj = JSONObject(raw)
            val result = LinkedHashMap<String, List<ChatMessage>>()
            obj.keys().forEach { teamId ->
                val arr = obj.getJSONArray(teamId)
                val list = (0 until arr.length()).map { idx ->
                    val m = arr.getJSONObject(idx)
                    val tsMs = m.optLong("createdAtMs", System.currentTimeMillis())
                    ChatMessage(
                        id = m.optString("id", UUID.randomUUID().toString()),
                        teamId = teamId,
                        senderUid = m.optString("senderUid", ""),
                        senderName = m.optString("senderName", "Player"),
                        senderTeamName = m.optString("senderTeamName", ""),
                        senderRole = m.optString("senderRole", ChatSenderRole.PLAYER.name),
                        text = m.optString("text", ""),
                        pinned = m.optBoolean("pinned", false),
                        createdAt = Timestamp(Date(tsMs))
                    )
                }
                result[teamId] = list
            }
            result
        }.getOrDefault(emptyMap())
    }

    private fun saveMessagesMap(map: Map<String, List<ChatMessage>>) {
        val obj = JSONObject()
        map.forEach { (teamId, msgs) ->
            val arr = JSONArray()
            msgs.forEach { m ->
                arr.put(
                    JSONObject().apply {
                        put("id", m.id)
                        put("senderUid", m.senderUid)
                        put("senderName", m.senderName)
                        put("senderTeamName", m.senderTeamName)
                        put("senderRole", m.senderRole)
                        put("text", m.text)
                        put("pinned", m.pinned)
                        put("createdAtMs", m.createdAt?.toDate()?.time ?: System.currentTimeMillis())
                    }
                )
            }
            obj.put(teamId, arr)
        }
        prefs.edit().putString(SHARED_MESSAGES_KEY, obj.toString()).apply()
    }

    fun saveCustomQuiz(title: String, topic: String, level: CefrLevel, questions: List<QuizQuestionItem>) {
        val q = CustomQuiz(
            id = "offline_quiz_${UUID.randomUUID().toString().take(8)}",
            title = title.trim(),
            topic = topic.trim(),
            cefrLevel = level.name,
            questions = questions,
            createdAt = Timestamp(Date(System.currentTimeMillis()))
        )
        val next = listOf(q) + _customQuizzesFlow.value
        _customQuizzesFlow.value = next
        saveCustomQuizzes(next)
    }

    fun deleteCustomQuiz(quizId: String) {
        val next = _customQuizzesFlow.value.filterNot { it.id == quizId }
        _customQuizzesFlow.value = next
        saveCustomQuizzes(next)
    }

    private fun loadCustomQuizzes(): List<CustomQuiz> {
        val raw = prefs.getString(key("custom_quizzes"), null) ?: return emptyList()
        return runCatching {
            val arr = JSONArray(raw)
            (0 until arr.length()).map { idx ->
                val o = arr.getJSONObject(idx)
                val qArr = o.optJSONArray("questions") ?: JSONArray()
                val questions = (0 until qArr.length()).map { qi ->
                    val qo = qArr.getJSONObject(qi)
                    QuizQuestionItem(
                        prompt = qo.optString("prompt", ""),
                        options = jsonArrayToStringList(qo.optJSONArray("options")),
                        correctIndex = qo.optLong("correctIndex", 0L),
                        timeLimitSec = qo.optLong("timeLimitSec", 20L),
                        tip = qo.optString("tip", "")
                    )
                }
                CustomQuiz(
                    id = o.optString("id", UUID.randomUUID().toString()),
                    title = o.optString("title", "Custom Quiz"),
                    topic = o.optString("topic", ""),
                    cefrLevel = o.optString("cefrLevel", CefrLevel.B1.name),
                    questions = questions
                )
            }
        }.getOrDefault(emptyList())
    }

    private fun saveCustomQuizzes(list: List<CustomQuiz>) {
        val arr = JSONArray()
        list.forEach { quiz ->
            arr.put(
                JSONObject().apply {
                    put("id", quiz.id)
                    put("title", quiz.title)
                    put("topic", quiz.topic)
                    put("cefrLevel", quiz.cefrLevel)
                    put(
                        "questions",
                        JSONArray().apply {
                            quiz.questions.forEach { q ->
                                put(
                                    JSONObject().apply {
                                        put("prompt", q.prompt)
                                        put("options", JSONArray(q.options))
                                        put("correctIndex", q.correctIndex)
                                        put("timeLimitSec", q.timeLimitSec)
                                        put("tip", q.tip)
                                    }
                                )
                            }
                        }
                    )
                }
            )
        }
        prefs.edit().putString(key("custom_quizzes"), arr.toString()).apply()
    }

    private fun jsonArrayToStringList(arr: JSONArray?): List<String> {
        if (arr == null) return emptyList()
        return (0 until arr.length()).mapNotNull { idx ->
            arr.optString(idx).takeIf { it.isNotBlank() }
        }
    }

    companion object {
        private const val PREFS_NAME = "lingoclub_offline_store"
        private const val SHARED_SCORES_KEY = "shared_offline_scores"
        private const val SHARED_TEAMS_KEY = "shared_offline_teams"
        private const val SHARED_MESSAGES_KEY = "shared_offline_messages"
        const val OFFLINE_DEFAULT_TEAM_ID = "offline_explorers_hub"
    }
}
