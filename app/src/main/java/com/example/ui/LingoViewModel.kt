package com.example.ui

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.ai.GeneratedQuizDraft
import com.example.data.ai.LingoAiGenerator
import com.example.data.ai.RoleplaySpeechFeedback
import com.example.data.content.OfflineRoleplayGenerator
import com.example.data.firebase.LingoRepository
import com.example.data.model.ActivityType
import com.example.data.model.BadgeEngine
import com.example.data.model.CardMastery
import com.example.data.model.CefrLevel
import com.example.data.model.ChatMessage
import com.example.data.model.ChatSenderRole
import com.example.data.model.ClubContentItem
import com.example.data.model.CustomDeck
import com.example.data.model.CustomQuiz
import com.example.data.model.CustomRoleplay
import com.example.data.model.FlashcardItem
import com.example.data.model.LeaderboardEntry
import com.example.data.model.LingoBadge
import com.example.data.model.QuizQuestionItem
import com.example.data.model.QuizRoom
import com.example.data.model.RoleplayLine
import com.example.data.model.RoleplayScenario
import com.example.data.model.RoleplaySource
import com.example.data.model.RoomChatMessage
import com.example.data.model.RoomMessageType
import com.example.data.model.RoomPlayer
import com.example.data.model.RoomStatus
import com.example.data.model.ScoreRecord
import com.example.data.model.SessionRecord
import com.example.data.model.StudentActivitySummary
import com.example.data.model.StudentDetailBundle
import com.example.data.model.TeamChannel
import com.example.data.model.TeamChannelKind
import com.example.data.model.TutorStudentProgress
import com.example.data.model.UserProfile
import com.example.data.model.WeeklyProgress
import com.example.data.offline.OfflineLocalStore
import com.google.firebase.firestore.FirebaseFirestoreException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}

sealed interface AiGenState<out T> {
    data object Idle : AiGenState<Nothing>
    data object Loading : AiGenState<Nothing>
    data class Success<T>(val data: T) : AiGenState<T>
    data class Error(val message: String) : AiGenState<Nothing>
}

data class ActiveRoomSession(
    val roomCode: String,
    val isHost: Boolean,
    val localNickname: String = "",
    val localAvatarColor: String = "INDIGO",
    val room: QuizRoom? = null,
    val players: List<RoomPlayer> = emptyList(),
    val roomMessages: List<RoomChatMessage> = emptyList(),
    val localScore: Long = 0L,
    val localStreak: Long = 0L,
    val correctAnswersCount: Int = 0,
    val answeredQuestionIndex: Int = -1,
    val selectedOptionIndex: Int = -1
)

class LingoViewModel(
    private val repository: LingoRepository,
    val currentUserId: String,
    val currentUserName: String,
    private val aiGenerator: LingoAiGenerator = LingoAiGenerator(),
    val isOfflineMode: Boolean = false,
    private val offlineStore: OfflineLocalStore? = null
) : ViewModel() {

    val userProfileState: StateFlow<UiState<UserProfile?>> = if (isOfflineMode && offlineStore != null) {
        offlineStore.profileFlow
            .map<UserProfile?, UiState<UserProfile?>> { UiState.Success(it) }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Success(offlineStore.profileFlow.value)
            )
    } else {
        repository.observeUserProfile(currentUserId)
            .map<UserProfile?, UiState<UserProfile?>> { UiState.Success(it) }
            .catch { error ->
                val firestoreError = unwrapFirestoreErrorOrThrow(error)
                Log.w(TAG, "Error observing profile", firestoreError)
                emit(UiState.Error(firestoreError.message ?: "Failed to load profile"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Loading
            )
    }

    val sessionHistoryState: StateFlow<UiState<List<SessionRecord>>> = if (isOfflineMode && offlineStore != null) {
        offlineStore.sessionHistoryFlow
            .map<List<SessionRecord>, UiState<List<SessionRecord>>> { UiState.Success(it) }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Success(offlineStore.sessionHistoryFlow.value)
            )
    } else {
        repository.observeSessionHistory(currentUserId)
            .map<List<SessionRecord>, UiState<List<SessionRecord>>> { UiState.Success(it) }
            .catch { error ->
                val firestoreError = unwrapFirestoreErrorOrThrow(error)
                Log.w(TAG, "Error observing session history", firestoreError)
                emit(UiState.Error(firestoreError.message ?: "Failed to load history"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Loading
            )
    }

    val weeklyProgressState: StateFlow<Map<Int, WeeklyProgress>> = if (isOfflineMode && offlineStore != null) {
        offlineStore.weeklyProgressFlow
    } else {
        repository.observeWeeklyProgress(currentUserId)
            .catch { error ->
                val firestoreError = unwrapFirestoreErrorOrThrow(error)
                Log.w(TAG, "Error observing weekly progress", firestoreError)
                emit(emptyMap())
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = emptyMap()
            )
    }

    val customRoleplaysState: StateFlow<UiState<List<CustomRoleplay>>> = if (isOfflineMode && offlineStore != null) {
        offlineStore.customRoleplaysFlow
            .map<List<CustomRoleplay>, UiState<List<CustomRoleplay>>> { UiState.Success(it) }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Success(emptyList())
            )
    } else {
        repository.observeCustomRoleplays(currentUserId)
            .map<List<CustomRoleplay>, UiState<List<CustomRoleplay>>> { UiState.Success(it) }
            .catch { error ->
                val firestoreError = unwrapFirestoreErrorOrThrow(error)
                Log.w(TAG, "Error observing custom roleplays", firestoreError)
                emit(UiState.Error(firestoreError.message ?: "Failed to load custom roleplays"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Loading
            )
    }

    val customQuizzesState: StateFlow<UiState<List<CustomQuiz>>> = if (isOfflineMode && offlineStore != null) {
        offlineStore.customQuizzesFlow
            .map<List<CustomQuiz>, UiState<List<CustomQuiz>>> { UiState.Success(it) }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Success(offlineStore.customQuizzesFlow.value)
            )
    } else {
        repository.observeCustomQuizzes(currentUserId)
            .map<List<CustomQuiz>, UiState<List<CustomQuiz>>> { UiState.Success(it) }
            .catch { error ->
                val firestoreError = unwrapFirestoreErrorOrThrow(error)
                Log.w(TAG, "Error observing custom quizzes", firestoreError)
                emit(UiState.Error(firestoreError.message ?: "Failed to load quizzes"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Loading
            )
    }

    val customDecksState: StateFlow<UiState<List<CustomDeck>>> = if (isOfflineMode && offlineStore != null) {
        offlineStore.customDecksFlow
            .map<List<CustomDeck>, UiState<List<CustomDeck>>> { UiState.Success(it) }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Success(emptyList())
            )
    } else {
        repository.observeCustomDecks(currentUserId)
            .map<List<CustomDeck>, UiState<List<CustomDeck>>> { UiState.Success(it) }
            .catch { error ->
                val firestoreError = unwrapFirestoreErrorOrThrow(error)
                Log.w(TAG, "Error observing custom decks", firestoreError)
                emit(UiState.Error(firestoreError.message ?: "Failed to load decks"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Loading
            )
    }

    val cardMasteryState: StateFlow<Map<String, CardMastery>> = if (isOfflineMode && offlineStore != null) {
        offlineStore.cardMasteryFlow
    } else {
        repository.observeCardMastery(currentUserId)
            .catch { error ->
                val firestoreError = unwrapFirestoreErrorOrThrow(error)
                Log.w(TAG, "Error observing mastery", firestoreError)
                emit(emptyMap())
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = emptyMap()
            )
    }

    val isBootstrappedTutor: Boolean = !isOfflineMode && repository.isBootstrappedTutor()

    val studentsProgressState: StateFlow<UiState<List<TutorStudentProgress>>> = if (isOfflineMode) {
        flowOf(UiState.Success(emptyList<TutorStudentProgress>()) as UiState<List<TutorStudentProgress>>).stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
            initialValue = UiState.Success(emptyList())
        )
    } else {
        combine(
            repository.observeLinkedStudents(currentUserId).catch { emit(emptyList()) },
            repository.observeBootstrappedStudents().catch { emit(emptyList()) },
            repository.observeDirectAssignedStudents(currentUserId).catch { emit(emptyList()) }
        ) { linked, bootstrapped, direct ->
            val merged = linked.associateBy { it.studentUid }.toMutableMap()
            (bootstrapped + direct).forEach { user ->
                val existing = merged[user.userId]
                if (existing == null) {
                    merged[user.userId] = TutorStudentProgress(
                        id = user.userId,
                        studentUid = user.userId,
                        tutorUid = user.tutorUid.ifBlank { currentUserId },
                        studentName = user.displayName,
                        learningLevel = user.learningLevel,
                        xp = user.xp,
                        streak = user.streak,
                        sessionsCompleted = user.sessionsCompleted,
                        weeklyWordsMastered = user.weeklyWordsMastered,
                        quizzesPlayed = user.quizzesPlayed,
                        quizzesHosted = user.quizzesHosted,
                        bestLiveQuizScore = user.bestLiveQuizScore,
                        cardsMastered = user.cardsMastered,
                        decksCreated = 0L,
                        audiobooksFinished = user.audiobooksFinished,
                        teamName = user.teamName,
                        earnedBadges = user.earnedBadges,
                        recentActivities = emptyList(),
                        createdAt = user.createdAt,
                        updatedAt = user.updatedAt
                    )
                } else {
                    merged[user.userId] = existing.copy(
                        studentName = user.displayName.ifBlank { existing.studentName },
                        learningLevel = user.learningLevel,
                        xp = maxOf(existing.xp, user.xp),
                        streak = user.streak,
                        sessionsCompleted = maxOf(existing.sessionsCompleted, user.sessionsCompleted),
                        weeklyWordsMastered = maxOf(existing.weeklyWordsMastered, user.weeklyWordsMastered),
                        quizzesPlayed = maxOf(existing.quizzesPlayed, user.quizzesPlayed),
                        quizzesHosted = maxOf(existing.quizzesHosted, user.quizzesHosted),
                        bestLiveQuizScore = maxOf(existing.bestLiveQuizScore, user.bestLiveQuizScore),
                        cardsMastered = maxOf(existing.cardsMastered, user.cardsMastered),
                        audiobooksFinished = maxOf(existing.audiobooksFinished, user.audiobooksFinished),
                        teamName = user.teamName.ifBlank { existing.teamName },
                        earnedBadges = (existing.earnedBadges + user.earnedBadges).distinct()
                    )
                }
            }
            UiState.Success(merged.values.sortedByDescending { it.xp }) as UiState<List<TutorStudentProgress>>
        }.catch { error ->
            val firestoreError = unwrapFirestoreErrorOrThrow(error)
            emit(UiState.Error(firestoreError.message ?: "Failed to load student progress"))
        }.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
            initialValue = UiState.Loading
        )
    }

    private val _selectedStudentDetailState = MutableStateFlow<UiState<StudentDetailBundle?>>(UiState.Success(null))
    val selectedStudentDetailState: StateFlow<UiState<StudentDetailBundle?>> = _selectedStudentDetailState.asStateFlow()

    val teamsState: StateFlow<UiState<List<TeamChannel>>> = if (isOfflineMode && offlineStore != null) {
        offlineStore.teamsFlow
            .map<List<TeamChannel>, UiState<List<TeamChannel>>> { UiState.Success(it) }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Success(offlineStore.teamsFlow.value)
            )
    } else {
        repository.observeTeams()
            .map<List<TeamChannel>, UiState<List<TeamChannel>>> { UiState.Success(it) }
            .catch { error ->
                val firestoreError = unwrapFirestoreErrorOrThrow(error)
                Log.w(TAG, "Error observing teams", firestoreError)
                emit(UiState.Error(firestoreError.message ?: "Failed to load teams"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Loading
            )
    }

    private val _selectedTeamId = MutableStateFlow(
        if (isOfflineMode) OfflineLocalStore.OFFLINE_DEFAULT_TEAM_ID else LingoRepository.DEFAULT_TEACHER_HUB_ID
    )
    val selectedTeamId: StateFlow<String> = _selectedTeamId.asStateFlow()

    @OptIn(ExperimentalCoroutinesApi::class)
    val chatMessagesState: StateFlow<UiState<List<ChatMessage>>> = if (isOfflineMode && offlineStore != null) {
        combine(_selectedTeamId, offlineStore.messagesMapFlow) { teamId, map ->
            UiState.Success(map[teamId].orEmpty()) as UiState<List<ChatMessage>>
        }.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
            initialValue = UiState.Success(emptyList())
        )
    } else {
        _selectedTeamId
            .filterNotNull()
            .flatMapLatest { teamId ->
                repository.observeTeamMessages(teamId)
                    .map<List<ChatMessage>, UiState<List<ChatMessage>>> { UiState.Success(it) }
                    .catch { error ->
                        val firestoreError = unwrapFirestoreErrorOrThrow(error)
                        Log.w(TAG, "Error observing chat messages for $teamId", firestoreError)
                        emit(UiState.Error(firestoreError.message ?: "Failed to load team messages"))
                    }
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Loading
            )
    }

    val clubContentState: StateFlow<UiState<List<ClubContentItem>>> = if (isOfflineMode) {
        flowOf(UiState.Success(emptyList<ClubContentItem>()) as UiState<List<ClubContentItem>>).stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
            initialValue = UiState.Success(emptyList())
        )
    } else {
        repository.observeClubContent()
            .map<List<ClubContentItem>, UiState<List<ClubContentItem>>> { UiState.Success(it) }
            .catch { error ->
                val firestoreError = unwrapFirestoreErrorOrThrow(error)
                Log.w(TAG, "Error observing club content", firestoreError)
                emit(UiState.Error(firestoreError.message ?: "Failed to load club content"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Loading
            )
    }

    val globalScoresState: StateFlow<UiState<List<ScoreRecord>>> = if (isOfflineMode && offlineStore != null) {
        offlineStore.scoresFlow
            .map<List<ScoreRecord>, UiState<List<ScoreRecord>>> { UiState.Success(it) }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Success(offlineStore.scoresFlow.value)
            )
    } else {
        repository.observeGlobalScores()
            .map<List<ScoreRecord>, UiState<List<ScoreRecord>>> { UiState.Success(it) }
            .catch { error ->
                val firestoreError = unwrapFirestoreErrorOrThrow(error)
                Log.w(TAG, "Error observing global scores", firestoreError)
                emit(UiState.Error(firestoreError.message ?: "Failed to load global leaderboard"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
                initialValue = UiState.Loading
            )
    }

    private val _roomSession = MutableStateFlow<ActiveRoomSession?>(null)
    val roomSession: StateFlow<ActiveRoomSession?> = _roomSession.asStateFlow()

    private val _statusBanner = MutableStateFlow<String?>(null)
    val statusBanner: StateFlow<String?> = _statusBanner.asStateFlow()

    private val _isBusy = MutableStateFlow(false)
    val isBusy: StateFlow<Boolean> = _isBusy.asStateFlow()

    private val _aiQuizGenState = MutableStateFlow<AiGenState<GeneratedQuizDraft>>(AiGenState.Idle)
    val aiQuizGenState: StateFlow<AiGenState<GeneratedQuizDraft>> = _aiQuizGenState.asStateFlow()

    private val _aiRoleplayGenState = MutableStateFlow<AiGenState<RoleplayScenario>>(AiGenState.Idle)
    val aiRoleplayGenState: StateFlow<AiGenState<RoleplayScenario>> = _aiRoleplayGenState.asStateFlow()

    private val _roleplayFeedbackState = MutableStateFlow<AiGenState<RoleplaySpeechFeedback>>(AiGenState.Idle)
    val roleplayFeedbackState: StateFlow<AiGenState<RoleplaySpeechFeedback>> = _roleplayFeedbackState.asStateFlow()

    private var roomObserveJob: Job? = null
    private var playersObserveJob: Job? = null
    private var roomMessagesObserveJob: Job? = null
    private val recordedLivePodiumRooms = mutableSetOf<String>()

    init {
        if (!isOfflineMode) {
            viewModelScope.launch(Dispatchers.IO) {
                repository.ensureUserProfile(currentUserName)
            }
            if (isBootstrappedTutor) {
                viewModelScope.launch(Dispatchers.IO) {
                    repository.ensureDefaultTutorHubIfTutor(currentUserName)
                }
            }
            // Automatically mirror linked student's progress to their tutor whenever profile/sessions/decks change
            viewModelScope.launch(Dispatchers.IO) {
                combine(
                    userProfileState.map { (it as? UiState.Success)?.data },
                    customDecksState.map { (it as? UiState.Success)?.data?.size ?: 0 },
                    sessionHistoryState.map { (it as? UiState.Success)?.data.orEmpty() }
                ) { profile, decksCount, sessions ->
                    Triple(profile, decksCount, sessions)
                }.collect { (profile, decksCount, sessions) ->
                    if (profile != null && profile.tutorUid.isNotBlank()) {
                        repository.syncStudentProgressToTutor(
                            profile = profile,
                            decksCount = decksCount,
                            recentSessions = sessions
                        )
                    }
                }
            }
        }
    }

    fun clearBanner() {
        _statusBanner.value = null
    }

    fun awardXp(xp: Long) {
        offlineStore?.awardProgress(xpDelta = xp)
        if (!isOfflineMode) {
            viewModelScope.launch {
                repository.awardProgress(xpDelta = xp)
            }
        }
    }

    fun updateLearningLevel(level: CefrLevel) {
        offlineStore?.updateLearningLevel(level)
        if (isOfflineMode) {
            _statusBanner.value = "Learning level updated to ${level.label}!"
            return
        }
        viewModelScope.launch {
            repository.updateLearningLevel(level).onSuccess {
                _statusBanner.value = "Learning level updated to ${level.label}!"
            }.onFailure {
                _statusBanner.value = it.message ?: "Could not update learning level."
            }
        }
    }

    private fun currentProfileOrNull(): UserProfile? =
        (userProfileState.value as? UiState.Success)?.data

    private fun computeProjectedBadges(
        sessionsCompletedDelta: Long = 0L,
        weeklyWordsDelta: Long = 0L,
        quizzesPlayedDelta: Long = 0L,
        quizzesHostedDelta: Long = 0L,
        bestScoreCandidate: Long = 0L,
        latestQuizAccuracyPct: Long = 0L,
        audiobooksDelta: Long = 0L,
        roleplayCompleted: Boolean = false,
        arcadePlayed: Boolean = false,
        highCombo: Int = 0
    ): List<LingoBadge> {
        val profile = currentProfileOrNull()
        val existing = profile?.earnedBadges.orEmpty()
        return BadgeEngine.computeNewBadges(
            existingIds = existing,
            sessionsCompleted = (profile?.sessionsCompleted ?: 0L) + sessionsCompletedDelta,
            weeklyWordsMastered = ((profile?.weeklyWordsMastered ?: 0L) + weeklyWordsDelta).coerceAtLeast(0L),
            quizzesPlayed = (profile?.quizzesPlayed ?: 0L) + quizzesPlayedDelta,
            quizzesHosted = (profile?.quizzesHosted ?: 0L) + quizzesHostedDelta,
            bestLiveQuizScore = maxOf(profile?.bestLiveQuizScore ?: 0L, bestScoreCandidate),
            latestQuizAccuracyPct = latestQuizAccuracyPct,
            audiobooksFinished = (profile?.audiobooksFinished ?: 0L) + audiobooksDelta,
            roleplayCompleted = roleplayCompleted,
            arcadePlayed = arcadePlayed,
            highCombo = highCombo
        )
    }

    fun recordArcadeGameResult(
        gameTitle: String,
        cefrLevel: CefrLevel,
        scoreXp: Long,
        accuracyPct: Long,
        wordsPracticed: Int,
        maxCombo: Int
    ) {
        viewModelScope.launch {
            val safeXp = scoreXp.coerceIn(5L, 250L)
            val newBadges = computeProjectedBadges(
                arcadePlayed = true,
                highCombo = maxCombo
            )
            repository.awardProgress(
                xpDelta = safeXp,
                newEarnedBadges = newBadges
            )
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
            val badgeNote = if (newBadges.isNotEmpty()) {
                " • Badge unlocked: ${newBadges.joinToString { it.title }}!"
            } else {
                ""
            }
            _statusBanner.value = "$gameTitle finished! +$safeXp XP$badgeNote"
        }
    }

    fun togglePinEvidence(cardId: String, pinned: Boolean) {
        offlineStore?.togglePinEvidence(cardId, pinned)
        if (!isOfflineMode) {
            viewModelScope.launch {
                repository.togglePinEvidence(cardId, pinned)
            }
        }
    }

    fun toggleWeeklyWord(weekNumber: Int, wordId: String) {
        viewModelScope.launch {
            val currentList = weeklyProgressState.value[weekNumber]?.masteredWordIds.orEmpty()
            val isAdding = wordId !in currentList
            val updatedList = if (isAdding) {
                (currentList + wordId).distinct().take(200)
            } else {
                currentList.filterNot { it == wordId }
            }
            val currentMasteredTotal = currentProfileOrNull()?.weeklyWordsMastered ?: 0L
            val delta = when {
                isAdding -> 1L
                currentMasteredTotal > 0L -> -1L
                else -> 0L
            }
            val xp = if (isAdding) 5L else 0L
            val newBadges = if (isAdding) computeProjectedBadges(weeklyWordsDelta = delta) else emptyList()

            offlineStore?.updateWeeklyWordMastery(weekNumber, updatedList)
            if (xp > 0L || delta != 0L || newBadges.isNotEmpty()) {
                offlineStore?.awardProgress(
                    xpDelta = xp,
                    weeklyWordsMasteredDelta = delta,
                    newEarnedBadges = newBadges
                )
            }
            if (isOfflineMode) {
                if (newBadges.isNotEmpty()) {
                    _statusBanner.value = "Badge unlocked: ${newBadges.joinToString { it.title }}!"
                }
                return@launch
            }

            repository.updateWeeklyWordMastery(weekNumber, updatedList).onSuccess {
                if (xp > 0L || delta != 0L || newBadges.isNotEmpty()) {
                    repository.awardProgress(
                        xpDelta = xp,
                        weeklyWordsMasteredDelta = delta,
                        newEarnedBadges = newBadges
                    )
                }
                if (newBadges.isNotEmpty()) {
                    _statusBanner.value = "Badge unlocked: ${newBadges.joinToString { it.title }}!"
                }
            }.onFailure {
                _statusBanner.value = it.message ?: "Could not save word mastery."
            }
        }
    }

    fun completeWeeklySession(
        weekNumber: Int,
        sessionNumber: Int,
        level: CefrLevel,
        title: String,
        wordsPracticed: Int
    ) {
        viewModelScope.launch {
            if (isOfflineMode && offlineStore != null) {
                val newlyCompleted = offlineStore.markWeeklySessionComplete(weekNumber, sessionNumber)
                val xp = if (newlyCompleted) 40L else 15L
                val sessionDelta = if (newlyCompleted) 1L else 0L
                val newBadges = computeProjectedBadges(sessionsCompletedDelta = sessionDelta)
                offlineStore.awardProgress(xpDelta = xp, sessionsCompletedDelta = sessionDelta, newEarnedBadges = newBadges)
                offlineStore.logSessionRecord(
                    activityType = ActivityType.WEEKLY_SESSION,
                    title = "W$weekNumber S$sessionNumber: $title",
                    cefrLevel = level,
                    score = xp,
                    accuracyPct = 100L,
                    wordsPracticed = wordsPracticed.toLong(),
                    durationMinutes = 15L
                )
                val badgeNote = if (newBadges.isNotEmpty()) " • Badge unlocked: ${newBadges.joinToString { it.title }}!" else ""
                _statusBanner.value = if (newlyCompleted) {
                    "Session $sessionNumber complete! +40 XP$badgeNote"
                } else {
                    "Session $sessionNumber reviewed! +15 XP$badgeNote"
                }
                return@launch
            }

            repository.markWeeklySessionComplete(weekNumber, sessionNumber).onSuccess { newlyCompleted ->
                val xp = if (newlyCompleted) 40L else 15L
                val sessionDelta = if (newlyCompleted) 1L else 0L
                val newBadges = computeProjectedBadges(sessionsCompletedDelta = sessionDelta)
                repository.awardProgress(
                    xpDelta = xp,
                    sessionsCompletedDelta = sessionDelta,
                    newEarnedBadges = newBadges
                )
                repository.logSessionRecord(
                    activityType = ActivityType.WEEKLY_SESSION,
                    title = "W$weekNumber S$sessionNumber: $title",
                    cefrLevel = level,
                    score = xp,
                    accuracyPct = 100L,
                    wordsPracticed = wordsPracticed.toLong(),
                    durationMinutes = 15L
                )
                val badgeNote = if (newBadges.isNotEmpty()) {
                    " • Badge unlocked: ${newBadges.joinToString { it.title }}!"
                } else {
                    ""
                }
                _statusBanner.value = if (newlyCompleted) {
                    "Session $sessionNumber complete! +40 XP$badgeNote"
                } else {
                    "Session $sessionNumber reviewed! +15 XP$badgeNote"
                }
            }.onFailure {
                _statusBanner.value = it.message ?: "Could not complete session."
            }
        }
    }

    fun recordWeeklyGameResult(
        weekNumber: Int,
        title: String,
        level: CefrLevel,
        scoreXp: Long,
        accuracyPct: Long,
        wordsPracticed: Int
    ) {
        viewModelScope.launch {
            offlineStore?.recordWeeklyGamePlayed(weekNumber)
            offlineStore?.awardProgress(xpDelta = scoreXp)
            offlineStore?.logSessionRecord(
                activityType = ActivityType.GAME,
                title = title,
                cefrLevel = level,
                score = scoreXp,
                accuracyPct = accuracyPct,
                wordsPracticed = wordsPracticed.toLong(),
                durationMinutes = 4L
            )
            if (!isOfflineMode) {
                repository.recordWeeklyGamePlayed(weekNumber)
                repository.awardProgress(xpDelta = scoreXp)
                repository.logSessionRecord(
                    activityType = ActivityType.GAME,
                    title = title,
                    cefrLevel = level,
                    score = scoreXp,
                    accuracyPct = accuracyPct,
                    wordsPracticed = wordsPracticed.toLong(),
                    durationMinutes = 4L
                )
            }
            _statusBanner.value = "Game finished! +$scoreXp XP ($accuracyPct% accuracy)"
        }
    }

    fun completeAudiobookChapter(
        title: String,
        level: CefrLevel,
        durationMin: Int
    ) {
        viewModelScope.launch {
            val newBadges = computeProjectedBadges(audiobooksDelta = 1L)
            offlineStore?.awardProgress(
                xpDelta = 30L,
                audiobooksFinishedDelta = 1L,
                newEarnedBadges = newBadges
            )
            offlineStore?.logSessionRecord(
                activityType = ActivityType.AUDIOBOOK,
                title = title,
                cefrLevel = level,
                score = 30L,
                accuracyPct = 100L,
                wordsPracticed = 8L,
                durationMinutes = durationMin.toLong()
            )
            if (!isOfflineMode) {
                repository.awardProgress(
                    xpDelta = 30L,
                    audiobooksFinishedDelta = 1L,
                    newEarnedBadges = newBadges
                )
                repository.logSessionRecord(
                    activityType = ActivityType.AUDIOBOOK,
                    title = title,
                    cefrLevel = level,
                    score = 30L,
                    accuracyPct = 100L,
                    wordsPracticed = 8L,
                    durationMinutes = durationMin.toLong()
                )
            }
            val badgeNote = if (newBadges.isNotEmpty()) {
                " • Badge unlocked: ${newBadges.joinToString { it.title }}!"
            } else {
                ""
            }
            _statusBanner.value = "Listening complete! +30 XP$badgeNote"
        }
    }

    fun recordQuizCompletion(
        title: String,
        level: CefrLevel,
        score: Long,
        accuracyPct: Long
    ) {
        viewModelScope.launch {
            val newBadges = computeProjectedBadges(
                quizzesPlayedDelta = 1L,
                bestScoreCandidate = score,
                latestQuizAccuracyPct = accuracyPct
            )
            offlineStore?.awardProgress(
                xpDelta = 20L,
                quizzesPlayedDelta = 1L,
                bestLiveQuizScoreCandidate = score,
                newEarnedBadges = newBadges
            )
            offlineStore?.logSessionRecord(
                activityType = ActivityType.QUIZ,
                title = title,
                cefrLevel = level,
                score = score,
                accuracyPct = accuracyPct,
                wordsPracticed = 6L,
                durationMinutes = 5L
            )
            offlineStore?.publishScoreRecord(
                playerName = currentProfileOrNull()?.displayName ?: currentUserName,
                quizTitle = title,
                cefrLevel = level,
                score = score,
                accuracyPct = accuracyPct,
                streak = 1L,
                gameMode = "LIVE_QUIZ",
                avatarColor = "INDIGO"
            )
            if (!isOfflineMode) {
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
                    streak = 1L,
                    gameMode = "LIVE_QUIZ",
                    avatarColor = "INDIGO"
                )
            }
            if (newBadges.isNotEmpty()) {
                _statusBanner.value = "Badge unlocked: ${newBadges.joinToString { it.title }}!"
            }
        }
    }

    fun recordRoleplayCompletion(
        title: String,
        level: CefrLevel
    ) {
        viewModelScope.launch {
            val newBadges = computeProjectedBadges(roleplayCompleted = true)
            offlineStore?.awardProgress(xpDelta = 25L, newEarnedBadges = newBadges)
            offlineStore?.logSessionRecord(
                activityType = ActivityType.ROLEPLAY,
                title = title,
                cefrLevel = level,
                score = 25L,
                accuracyPct = 100L,
                wordsPracticed = 10L,
                durationMinutes = 6L
            )
            if (!isOfflineMode) {
                repository.awardProgress(xpDelta = 25L, newEarnedBadges = newBadges)
                repository.logSessionRecord(
                    activityType = ActivityType.ROLEPLAY,
                    title = title,
                    cefrLevel = level,
                    score = 25L,
                    accuracyPct = 100L,
                    wordsPracticed = 10L,
                    durationMinutes = 6L
                )
            }
            if (newBadges.isNotEmpty()) {
                _statusBanner.value = "Badge unlocked: ${newBadges.joinToString { it.title }}!"
            }
        }
    }

    fun generateAiQuiz(
        topic: String,
        cefrLevel: CefrLevel,
        questionCount: Int,
        focusWords: List<String> = emptyList()
    ) {
        viewModelScope.launch {
            _aiQuizGenState.value = AiGenState.Loading
            val result = aiGenerator.generateKahootQuiz(
                topic = topic,
                cefrLevel = cefrLevel,
                questionCount = questionCount,
                focusWords = focusWords
            )
            result.onSuccess { draft ->
                _aiQuizGenState.value = AiGenState.Success(draft)
            }.onFailure { error ->
                _aiQuizGenState.value = AiGenState.Error(
                    error.message ?: "AI quiz generation failed. Check your connection and try again."
                )
            }
        }
    }

    fun clearAiQuizGen() {
        _aiQuizGenState.value = AiGenState.Idle
    }

    fun generateRoleplay(
        setting: String,
        cefrLevel: CefrLevel,
        tone: String,
        useAi: Boolean
    ) {
        if (!useAi) {
            val offlineScene = OfflineRoleplayGenerator.generate(
                topicInput = setting,
                cefrLevel = cefrLevel,
                tone = tone
            )
            _aiRoleplayGenState.value = AiGenState.Success(offlineScene)
            return
        }
        viewModelScope.launch {
            _aiRoleplayGenState.value = AiGenState.Loading
            val result = aiGenerator.generateRoleplay(
                setting = setting,
                cefrLevel = cefrLevel,
                tone = tone
            )
            result.onSuccess { scene ->
                _aiRoleplayGenState.value = AiGenState.Success(scene)
            }.onFailure { error ->
                _aiRoleplayGenState.value = AiGenState.Error(
                    error.message ?: "AI roleplay generation failed. Switch to Offline Instant or retry."
                )
            }
        }
    }

    fun clearAiRoleplayGen() {
        _aiRoleplayGenState.value = AiGenState.Idle
    }

    fun evaluateRoleplaySpeech(
        scenarioTitle: String,
        cefrLevel: CefrLevel,
        speakerRoleName: String,
        targetScript: String,
        spokenTranscript: String
    ) {
        viewModelScope.launch {
            _roleplayFeedbackState.value = AiGenState.Loading
            val result = aiGenerator.evaluateRoleplaySpeech(
                scenarioTitle = scenarioTitle,
                cefrLevel = cefrLevel,
                speakerRoleName = speakerRoleName,
                targetScript = targetScript,
                spokenTranscript = spokenTranscript
            )
            result.onSuccess { feedback ->
                _roleplayFeedbackState.value = AiGenState.Success(feedback)
                val newBadges = computeProjectedBadges(roleplayCompleted = true)
                repository.awardProgress(xpDelta = 15L, newEarnedBadges = newBadges)
                if (newBadges.isNotEmpty()) {
                    _statusBanner.value = "Badge unlocked: ${newBadges.joinToString { it.title }}!"
                }
            }.onFailure { error ->
                _roleplayFeedbackState.value = AiGenState.Error(
                    error.message ?: "Could not evaluate your spoken line. Please check your connection and try again."
                )
            }
        }
    }

    fun clearRoleplayFeedback() {
        _roleplayFeedbackState.value = AiGenState.Idle
    }

    fun saveGeneratedRoleplay(
        scenario: RoleplayScenario,
        source: RoleplaySource,
        onDone: () -> Unit
    ) {
        viewModelScope.launch {
            _isBusy.value = true
            val result = repository.saveCustomRoleplay(
                title = scenario.title,
                setting = scenario.setting,
                cefrLevel = scenario.cefrLevel,
                roleAName = scenario.roleAName,
                roleBName = scenario.roleBName,
                goal = scenario.goal,
                source = source,
                lines = scenario.lines,
                plotTwists = scenario.plotTwists
            )
            _isBusy.value = false
            result.onSuccess {
                _statusBanner.value = "Saved roleplay '${scenario.title}'!"
                repository.awardProgress(xpDelta = 15L)
                onDone()
            }.onFailure {
                _statusBanner.value = it.message ?: "Could not save roleplay."
            }
        }
    }

    fun deleteCustomRoleplay(roleplayId: String) {
        viewModelScope.launch {
            repository.deleteCustomRoleplay(roleplayId).onFailure {
                _statusBanner.value = it.message ?: "Failed to delete roleplay."
            }
        }
    }

    fun saveCustomQuiz(
        title: String,
        topic: String,
        cefrLevel: CefrLevel,
        questions: List<QuizQuestionItem>,
        onDone: () -> Unit
    ) {
        viewModelScope.launch {
            if (isOfflineMode && offlineStore != null) {
                offlineStore.saveCustomQuiz(title, topic, cefrLevel, questions)
                offlineStore.awardProgress(xpDelta = 25L)
                _statusBanner.value = "Saved quiz '$title' offline!"
                onDone()
                return@launch
            }
            _isBusy.value = true
            val result = repository.saveCustomQuiz(title, topic, cefrLevel, questions)
            _isBusy.value = false
            result.onSuccess {
                _statusBanner.value = "Saved quiz '$title'!"
                repository.awardProgress(xpDelta = 25L)
                onDone()
            }.onFailure {
                _statusBanner.value = it.message ?: "Could not save quiz."
            }
        }
    }

    fun deleteCustomQuiz(quizId: String) {
        viewModelScope.launch {
            if (isOfflineMode && offlineStore != null) {
                offlineStore.deleteCustomQuiz(quizId)
                return@launch
            }
            repository.deleteCustomQuiz(quizId).onFailure {
                _statusBanner.value = it.message ?: "Failed to delete quiz."
            }
        }
    }

    fun saveCustomDeck(
        title: String,
        cefrLevel: CefrLevel,
        cards: List<FlashcardItem>,
        onDone: () -> Unit
    ) {
        if (isOfflineMode) {
            _statusBanner.value = "Connect to the internet to save custom decks to the cloud."
            return
        }
        viewModelScope.launch {
            _isBusy.value = true
            val result = repository.saveCustomDeck(title, cefrLevel, cards)
            _isBusy.value = false
            result.onSuccess {
                _statusBanner.value = "Saved deck '$title' to Firestore!"
                repository.awardProgress(xpDelta = 20L)
                onDone()
            }.onFailure {
                _statusBanner.value = it.message ?: "Could not save deck."
            }
        }
    }

    fun updateCustomDeck(
        deckId: String,
        title: String,
        cefrLevel: CefrLevel,
        cards: List<FlashcardItem>,
        onDone: () -> Unit
    ) {
        if (isOfflineMode) return
        viewModelScope.launch {
            _isBusy.value = true
            val result = repository.updateCustomDeck(deckId, title, cefrLevel, cards)
            _isBusy.value = false
            result.onSuccess {
                _statusBanner.value = "Updated deck '$title'!"
                onDone()
            }.onFailure {
                _statusBanner.value = it.message ?: "Could not update deck."
            }
        }
    }

    fun deleteCustomDeck(deckId: String) {
        if (isOfflineMode) return
        viewModelScope.launch {
            repository.deleteCustomDeck(deckId).onSuccess {
                _statusBanner.value = "Deleted flashcard deck."
            }.onFailure {
                _statusBanner.value = it.message ?: "Could not delete deck."
            }
        }
    }

    fun toggleCardMastery(deckId: String, cardIndex: Int, newMastered: Boolean) {
        viewModelScope.launch {
            val currentCards = (userProfileState.value as? UiState.Success)?.data?.cardsMastered ?: 0L
            val delta = when {
                newMastered -> 1L
                currentCards > 0L -> -1L
                else -> 0L
            }
            val xp = if (newMastered) 10L else 0L
            offlineStore?.toggleCardMastery(deckId, cardIndex, newMastered)
            offlineStore?.awardProgress(xpDelta = xp, cardsMasteredDelta = delta)
            if (isOfflineMode) return@launch

            val result = repository.toggleCardMastery(deckId, cardIndex, newMastered)
            result.onSuccess {
                repository.awardProgress(xpDelta = xp, cardsMasteredDelta = delta)
            }.onFailure {
                _statusBanner.value = it.message ?: "Failed to update mastery."
            }
        }
    }

    fun recordFlashcardStudySession(
        deckTitle: String,
        cefrLevel: CefrLevel,
        reviewedCount: Int,
        masteredCount: Int,
        totalCards: Int
    ) {
        viewModelScope.launch {
            val safeTotal = totalCards.coerceAtLeast(1)
            val acc = ((masteredCount * 100L) / safeTotal).coerceIn(0L, 100L)
            val xp = (reviewedCount.coerceAtLeast(1) * 5L).coerceAtMost(60L)
            offlineStore?.awardProgress(xpDelta = xp)
            offlineStore?.logSessionRecord(
                activityType = ActivityType.CARDS,
                title = "Studied: $deckTitle",
                cefrLevel = cefrLevel,
                score = xp,
                accuracyPct = acc,
                wordsPracticed = reviewedCount.toLong().coerceIn(1L, 200L),
                durationMinutes = (reviewedCount / 3).coerceIn(1, 30).toLong()
            )
            if (!isOfflineMode) {
                repository.awardProgress(xpDelta = xp)
                repository.logSessionRecord(
                    activityType = ActivityType.CARDS,
                    title = "Studied: $deckTitle",
                    cefrLevel = cefrLevel,
                    score = xp,
                    accuracyPct = acc,
                    wordsPracticed = reviewedCount.toLong().coerceIn(1L, 200L),
                    durationMinutes = (reviewedCount / 3).coerceIn(1, 30).toLong()
                )
            }
            _statusBanner.value = "Study session saved! +$xp XP ($masteredCount/$safeTotal mastered)"
        }
    }

    // --- Live Kahoot Multiplayer Room Actions ---

    fun hostLiveRoom(
        quizTitle: String,
        cefrLevel: CefrLevel,
        questions: List<QuizQuestionItem>
    ) {
        viewModelScope.launch {
            _isBusy.value = true
            val hostDisplay = when (val prof = userProfileState.value) {
                is UiState.Success -> prof.data?.displayName?.ifBlank { currentUserName } ?: currentUserName
                else -> currentUserName
            }
            val result = repository.createQuizRoom(hostDisplay, quizTitle, cefrLevel, questions)
            _isBusy.value = false
            result.onSuccess { code ->
                val newBadges = computeProjectedBadges(quizzesHostedDelta = 1L)
                repository.awardProgress(
                    xpDelta = 30L,
                    quizzesHostedDelta = 1L,
                    newEarnedBadges = newBadges
                )
                if (newBadges.isNotEmpty()) {
                    _statusBanner.value = "Badge unlocked: ${newBadges.joinToString { it.title }}!"
                }
                attachToRoom(
                    roomCode = code,
                    isHost = true,
                    hostUid = currentUserId,
                    localNickname = hostDisplay,
                    localAvatarColor = "INDIGO"
                )
            }.onFailure {
                _statusBanner.value = it.message ?: "Could not create live room."
            }
        }
    }

    fun joinLiveRoom(roomCode: String, nickname: String, avatarColor: String) {
        viewModelScope.launch {
            _isBusy.value = true
            val result = repository.joinRoom(roomCode, nickname, avatarColor)
            _isBusy.value = false
            result.onSuccess { room ->
                attachToRoom(
                    roomCode = roomCode.trim().uppercase(),
                    isHost = room.hostUid == currentUserId,
                    hostUid = room.hostUid,
                    localNickname = nickname.trim().ifBlank { currentUserName },
                    localAvatarColor = avatarColor
                )
            }.onFailure {
                _statusBanner.value = it.message ?: "Could not join room."
            }
        }
    }

    private fun attachToRoom(
        roomCode: String,
        isHost: Boolean,
        hostUid: String,
        localNickname: String,
        localAvatarColor: String
    ) {
        roomObserveJob?.cancel()
        playersObserveJob?.cancel()
        roomMessagesObserveJob?.cancel()
        _roomSession.value = ActiveRoomSession(
            roomCode = roomCode,
            isHost = isHost,
            localNickname = localNickname,
            localAvatarColor = localAvatarColor
        )

        roomObserveJob = viewModelScope.launch {
            repository.observeRoom(roomCode)
                .catch { error ->
                    val firestoreError = unwrapFirestoreErrorOrThrow(error)
                    _statusBanner.value = firestoreError.message ?: "Room connection lost."
                }
                .collect { room ->
                    val current = _roomSession.value ?: return@collect
                    _roomSession.value = current.copy(room = room)
                    if (room != null &&
                        RoomStatus.fromRaw(room.status) == RoomStatus.PODIUM &&
                        recordedLivePodiumRooms.add(roomCode)
                    ) {
                        val totalQs = room.questions.size.coerceAtLeast(1)
                        val accuracyPct = if (!current.isHost) {
                            ((current.correctAnswersCount * 100L) / totalQs.toLong()).coerceIn(0L, 100L)
                        } else {
                            100L
                        }
                        val scoreToRecord = if (!current.isHost) current.localScore else 0L
                        if (!current.isHost || current.answeredQuestionIndex >= 0) {
                            val newBadges = computeProjectedBadges(
                                quizzesPlayedDelta = 1L,
                                bestScoreCandidate = scoreToRecord,
                                latestQuizAccuracyPct = accuracyPct
                            )
                            repository.awardProgress(
                                xpDelta = 30L,
                                quizzesPlayedDelta = 1L,
                                bestLiveQuizScoreCandidate = scoreToRecord,
                                newEarnedBadges = newBadges
                            )
                            repository.logSessionRecord(
                                activityType = ActivityType.QUIZ,
                                title = "Live: ${room.quizTitle}",
                                cefrLevel = CefrLevel.fromRaw(room.cefrLevel),
                                score = scoreToRecord,
                                accuracyPct = accuracyPct,
                                wordsPracticed = totalQs.toLong(),
                                durationMinutes = 5L
                            )
                            if (newBadges.isNotEmpty()) {
                                _statusBanner.value = "Live podium complete! Badge unlocked: ${newBadges.joinToString { it.title }}!"
                            }
                        }
                    }
                }
        }

        if (isHost) {
            playersObserveJob = viewModelScope.launch {
                repository.observeRoomPlayers(roomCode, hostUid)
                    .catch { error ->
                        val firestoreError = unwrapFirestoreErrorOrThrow(error)
                        _statusBanner.value = firestoreError.message ?: "Player sync error."
                    }
                    .collect { players ->
                        val current = _roomSession.value ?: return@collect
                        _roomSession.value = current.copy(players = players)
                    }
            }
        }

        roomMessagesObserveJob = viewModelScope.launch {
            repository.observeRoomMessages(roomCode)
                .catch { error ->
                    val firestoreError = unwrapFirestoreErrorOrThrow(error)
                    Log.w(TAG, "Error observing room chat for $roomCode", firestoreError)
                }
                .collect { messages ->
                    val current = _roomSession.value ?: return@collect
                    _roomSession.value = current.copy(roomMessages = messages)
                }
        }
    }

    fun hostStartOrNextQuestion() {
        val session = _roomSession.value ?: return
        val room = session.room ?: return
        if (!session.isHost) return

        val currentStatus = RoomStatus.fromRaw(room.status)
        val nextIndex = when (currentStatus) {
            RoomStatus.LOBBY -> 0
            RoomStatus.REVEAL -> room.currentQuestionIndex.toInt() + 1
            RoomStatus.QUESTION -> room.currentQuestionIndex.toInt()
            RoomStatus.PODIUM -> return
        }

        val leaderboard = session.players
            .sortedByDescending { it.score }
            .take(25)
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
            if (currentStatus == RoomStatus.QUESTION) {
                repository.advanceRoomPhase(
                    roomCode = session.roomCode,
                    newStatus = RoomStatus.REVEAL,
                    questionIndex = room.currentQuestionIndex.toInt(),
                    questionStartedAtMs = room.questionStartedAtMs,
                    leaderboard = leaderboard
                )
            } else if (nextIndex >= room.questions.size) {
                repository.advanceRoomPhase(
                    roomCode = session.roomCode,
                    newStatus = RoomStatus.PODIUM,
                    questionIndex = (room.questions.size - 1).coerceAtLeast(0),
                    questionStartedAtMs = room.questionStartedAtMs,
                    leaderboard = leaderboard
                )
            } else {
                repository.advanceRoomPhase(
                    roomCode = session.roomCode,
                    newStatus = RoomStatus.QUESTION,
                    questionIndex = nextIndex,
                    questionStartedAtMs = System.currentTimeMillis(),
                    leaderboard = leaderboard
                )
            }
        }
    }

    fun submitLiveAnswer(optionIndex: Int) {
        val session = _roomSession.value ?: return
        val room = session.room ?: return
        val qIdx = room.currentQuestionIndex.toInt()
        if (RoomStatus.fromRaw(room.status) != RoomStatus.QUESTION) return
        if (session.answeredQuestionIndex == qIdx) return
        val question = room.questions.getOrNull(qIdx) ?: return

        val elapsedMs = (System.currentTimeMillis() - room.questionStartedAtMs).coerceAtLeast(0L)
        val limitMs = (question.timeLimitSec.coerceAtLeast(10L) * 1000L)
        val remainingRatio = ((limitMs - elapsedMs).toFloat() / limitMs.toFloat()).coerceIn(0f, 1f)

        val isCorrect = optionIndex.toLong() == question.correctIndex
        val newStreak = if (isCorrect) session.localStreak + 1L else 0L
        val newCorrectCount = if (isCorrect) session.correctAnswersCount + 1 else session.correctAnswersCount
        val pointsEarned = if (isCorrect) {
            500L + (500L * remainingRatio).toLong() + (newStreak.coerceAtMost(5L) * 50L)
        } else {
            0L
        }
        val newScore = session.localScore + pointsEarned

        _roomSession.value = session.copy(
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
                repository.awardProgress(xpDelta = 15L)
            }
        }
    }

    fun leaveLiveRoom() {
        roomObserveJob?.cancel()
        playersObserveJob?.cancel()
        roomMessagesObserveJob?.cancel()
        _roomSession.value = null
    }

    fun sendRoomChatMessage(text: String, messageType: RoomMessageType = RoomMessageType.TEXT) {
        val session = _roomSession.value ?: return
        val senderName = session.localNickname.ifBlank {
            currentProfileOrNull()?.displayName?.ifBlank { currentUserName } ?: currentUserName
        }
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
                _statusBanner.value = it.message ?: "Could not send room message."
            }
        }
    }

    fun deleteRoomChatMessage(messageId: String) {
        val session = _roomSession.value ?: return
        viewModelScope.launch {
            repository.deleteRoomMessage(session.roomCode, messageId).onFailure {
                _statusBanner.value = it.message ?: "Could not delete room message."
            }
        }
    }

    // --- Team & Teacher-Team Chat Actions ---

    fun selectTeamChannel(teamId: String) {
        if (teamId.isNotBlank()) {
            _selectedTeamId.value = teamId
        }
    }

    fun createTeam(
        name: String,
        cefrLevel: CefrLevel,
        motto: String,
        accentColor: String,
        isTeacherHub: Boolean = false,
        onDone: () -> Unit = {}
    ) {
        viewModelScope.launch {
            if (isOfflineMode && offlineStore != null) {
                val created = offlineStore.createOfflineTeam(name, cefrLevel, motto, accentColor, isTeacherHub)
                _selectedTeamId.value = created.id
                _statusBanner.value = "Offline team '${created.name}' created!"
                onDone()
                return@launch
            }
            _isBusy.value = true
            val creatorName = currentProfileOrNull()?.displayName?.ifBlank { currentUserName } ?: currentUserName
            val kind = if (isTeacherHub && isBootstrappedTutor) TeamChannelKind.TEACHER_HUB else TeamChannelKind.TEAM
            val result = repository.createTeam(
                name = name,
                cefrLevel = cefrLevel,
                motto = motto,
                accentColor = accentColor,
                channelKind = kind,
                creatorName = creatorName
            )
            _isBusy.value = false
            result.onSuccess { teamId ->
                _selectedTeamId.value = teamId
                _statusBanner.value = if (kind == TeamChannelKind.TEACHER_HUB) {
                    "Tutor hub '$name' launched!"
                } else {
                    "Team '$name' created and joined!"
                }
                onDone()
            }.onFailure {
                _statusBanner.value = it.message ?: "Could not create team."
            }
        }
    }

    fun joinTeam(team: TeamChannel) {
        viewModelScope.launch {
            if (isOfflineMode && offlineStore != null) {
                offlineStore.joinOfflineTeam(team)
                _selectedTeamId.value = team.id
                _statusBanner.value = "Joined ${team.name}!"
                return@launch
            }
            val prevTeamId = currentProfileOrNull()?.teamId.orEmpty()
            repository.joinTeam(team, prevTeamId).onSuccess {
                _selectedTeamId.value = team.id
                _statusBanner.value = "Joined ${team.name}!"
            }.onFailure {
                _statusBanner.value = it.message ?: "Could not join team."
            }
        }
    }

    fun sendChatMessage(
        team: TeamChannel,
        text: String,
        pinned: Boolean = false
    ) {
        viewModelScope.launch {
            val profile = currentProfileOrNull()
            val senderName = profile?.displayName?.ifBlank { currentUserName } ?: currentUserName
            val senderTeamName = profile?.teamName.orEmpty().ifBlank {
                if (isBootstrappedTutor) "Tutor" else "Student"
            }
            val role = when {
                isBootstrappedTutor || team.leaderUid == currentUserId -> ChatSenderRole.TEACHER
                else -> ChatSenderRole.PLAYER
            }
            val canPin = pinned && (isBootstrappedTutor || team.leaderUid == currentUserId)
            if (isOfflineMode && offlineStore != null) {
                offlineStore.appendOfflineMessage(
                    ChatMessage(
                        id = java.util.UUID.randomUUID().toString(),
                        teamId = team.id,
                        senderUid = currentUserId,
                        senderName = senderName,
                        senderTeamName = senderTeamName,
                        senderRole = role.name,
                        text = text.trim(),
                        pinned = canPin,
                        createdAt = com.google.firebase.Timestamp(java.util.Date(System.currentTimeMillis()))
                    )
                )
                return@launch
            }
            repository.sendTeamMessage(
                teamId = team.id,
                senderName = senderName,
                senderTeamName = senderTeamName,
                senderRole = role,
                text = text,
                pinned = canPin
            ).onFailure {
                _statusBanner.value = it.message ?: "Could not send message."
            }
        }
    }

    fun togglePinMessage(teamId: String, messageId: String, pinned: Boolean) {
        viewModelScope.launch {
            if (isOfflineMode && offlineStore != null) {
                offlineStore.toggleOfflineMessagePin(teamId, messageId, pinned)
                return@launch
            }
            repository.toggleMessagePin(teamId, messageId, pinned).onFailure {
                _statusBanner.value = it.message ?: "Could not update pin."
            }
        }
    }

    fun deleteChatMessage(teamId: String, messageId: String) {
        viewModelScope.launch {
            if (isOfflineMode && offlineStore != null) {
                offlineStore.deleteOfflineMessage(teamId, messageId)
                return@launch
            }
            repository.deleteTeamMessage(teamId, messageId).onFailure {
                _statusBanner.value = it.message ?: "Could not delete message."
            }
        }
    }

    // --- Tutor-Student Actions ---

    fun connectToTutor(tutorCode: String, tutorLabel: String, onDone: () -> Unit = {}) {
        viewModelScope.launch {
            _isBusy.value = true
            val profile = currentProfileOrNull()
            val decksCount = (customDecksState.value as? UiState.Success)?.data?.size ?: 0
            val sessions = (sessionHistoryState.value as? UiState.Success)?.data.orEmpty()
            val result = repository.connectToTutor(
                tutorUid = tutorCode,
                tutorLabel = tutorLabel,
                profile = profile,
                decksCount = decksCount,
                recentSessions = sessions
            )
            _isBusy.value = false
            result.onSuccess {
                _statusBanner.value = "Connected to tutor & synced your progress!"
                onDone()
            }.onFailure {
                _statusBanner.value = it.message ?: "Could not connect to tutor."
            }
        }
    }

    fun disconnectFromTutor() {
        viewModelScope.launch {
            val prevTutorUid = currentProfileOrNull()?.tutorUid.orEmpty()
            _isBusy.value = true
            val result = repository.disconnectFromTutor(prevTutorUid)
            _isBusy.value = false
            result.onSuccess {
                _statusBanner.value = "Disconnected from tutor."
            }.onFailure {
                _statusBanner.value = it.message ?: "Could not disconnect."
            }
        }
    }

    fun syncMyProgressToTutor() {
        viewModelScope.launch {
            val profile = currentProfileOrNull()
            if (profile == null || profile.tutorUid.isBlank()) {
                _statusBanner.value = "Connect to a tutor first to share progress."
                return@launch
            }
            _isBusy.value = true
            val decksCount = (customDecksState.value as? UiState.Success)?.data?.size ?: 0
            val sessions = (sessionHistoryState.value as? UiState.Success)?.data.orEmpty()
            val result = repository.syncStudentProgressToTutor(profile, decksCount, sessions)
            _isBusy.value = false
            result.onSuccess {
                _statusBanner.value = "Progress synced with ${profile.tutorName.ifBlank { "your tutor" }}!"
            }.onFailure {
                _statusBanner.value = it.message ?: "Could not sync progress."
            }
        }
    }

    fun loadStudentDetails(studentUid: String) {
        if (!isBootstrappedTutor) {
            _selectedStudentDetailState.value = UiState.Success(StudentDetailBundle(studentUid))
            return
        }
        viewModelScope.launch {
            _selectedStudentDetailState.value = UiState.Loading
            repository.fetchStudentDetailBundle(studentUid).onSuccess { bundle ->
                _selectedStudentDetailState.value = UiState.Success(bundle)
            }.onFailure {
                _selectedStudentDetailState.value = UiState.Error(it.message ?: "Failed to load student details.")
            }
        }
    }

    fun clearSelectedStudentDetails() {
        _selectedStudentDetailState.value = UiState.Success(null)
    }

    fun cleanupListenersBeforeSignOut() {
        roomObserveJob?.cancel()
        playersObserveJob?.cancel()
        roomMessagesObserveJob?.cancel()
        _roomSession.value = null
    }

    private fun unwrapFirestoreErrorOrThrow(error: Throwable): Throwable {
        val firestoreError = generateSequence(error) { it.cause }
            .filterIsInstance<FirebaseFirestoreException>()
            .firstOrNull()
        if (firestoreError == null && error is CancellationException) throw error
        return firestoreError ?: error
    }

    private companion object {
        const val TAG = "LingoViewModel"
        const val STOP_TIMEOUT_MILLIS = 5000L
    }
}
