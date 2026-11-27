package com.example.data.firebase

import com.example.data.model.ActivityType
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
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.auth
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.firestore.snapshots
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await

class LingoRepository(
    private val db: FirebaseFirestore,
    private val auth: FirebaseAuth = Firebase.auth
) {

    private fun requireUserId(): String =
        auth.currentUser?.uid
            ?: throw IllegalStateException("User must be signed in with Google before accessing Firestore.")

    private fun sanitizeId(raw: String): String =
        raw.replace(Regex("[^a-zA-Z0-9_\\-]"), "_").take(120).ifBlank { "item" }

    fun observeUserProfile(userId: String): Flow<UserProfile?> = flow {
        val uid = requireUserId()
        check(uid == userId) { "Signed-in user mismatch." }
        val docRef = db.collection("users").document(uid)
        emitAll(
            docRef.snapshots()
                .map { it.toObject(UserProfile::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE) }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(ex, OperationType.GET, docRef.path)
                    }
                    throw error
                }
        )
    }

    private fun currentEpochDay(): Long =
        (System.currentTimeMillis() / 86_400_000L).coerceIn(1L, 100_000L)

    fun isBootstrappedTutor(): Boolean {
        val user = auth.currentUser ?: return false
        return user.isEmailVerified && user.email?.equals(BOOTSTRAPPED_TUTOR_EMAIL, ignoreCase = true) == true
    }

    suspend fun ensureUserProfile(displayName: String): Result<Unit> {
        var path = "users"
        return try {
            val uid = requireUserId()
            val docRef = db.collection("users").document(uid)
            path = docRef.path
            val existing = docRef.get().await()
            val today = currentEpochDay()
            val expectedRole = if (isBootstrappedTutor()) "TUTOR" else "STUDENT"
            if (!existing.exists()) {
                val safeName = displayName.trim().ifBlank { "Lingo Member" }.take(50)
                val payload = mapOf(
                    "userId" to uid,
                    "displayName" to safeName,
                    "learningLevel" to CefrLevel.B2.name,
                    "xp" to 0L,
                    "streak" to 1L,
                    "quizzesHosted" to 0L,
                    "quizzesPlayed" to 0L,
                    "cardsMastered" to 0L,
                    "sessionsCompleted" to 0L,
                    "audiobooksFinished" to 0L,
                    "weeklyWordsMastered" to 0L,
                    "bestLiveQuizScore" to 0L,
                    "earnedBadges" to emptyList<String>(),
                    "pinnedEvidenceIds" to emptyList<String>(),
                    "teamId" to "",
                    "teamName" to "",
                    "accountRole" to expectedRole,
                    "tutorUid" to "",
                    "tutorName" to "",
                    "lastActiveEpochDay" to today,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
                docRef.set(payload).await()
            } else {
                // Backfill profile stat fields & update daily streak
                val patch = mutableMapOf<String, Any>()
                if (existing.getString("learningLevel") == null) patch["learningLevel"] = CefrLevel.B2.name
                if (existing.get("quizzesPlayed") == null) patch["quizzesPlayed"] = 0L
                if (existing.get("sessionsCompleted") == null) patch["sessionsCompleted"] = 0L
                if (existing.get("audiobooksFinished") == null) patch["audiobooksFinished"] = 0L
                if (existing.get("weeklyWordsMastered") == null) patch["weeklyWordsMastered"] = 0L
                if (existing.get("bestLiveQuizScore") == null) patch["bestLiveQuizScore"] = 0L
                if (existing.get("earnedBadges") == null) patch["earnedBadges"] = emptyList<String>()
                if (existing.get("pinnedEvidenceIds") == null) patch["pinnedEvidenceIds"] = emptyList<String>()
                if (existing.getString("teamId") == null) patch["teamId"] = ""
                if (existing.getString("teamName") == null) patch["teamName"] = ""
                if (existing.getString("accountRole") != expectedRole) patch["accountRole"] = expectedRole
                if (existing.getString("tutorUid") == null) patch["tutorUid"] = ""
                if (existing.getString("tutorName") == null) patch["tutorName"] = ""

                val lastDay = (existing.get("lastActiveEpochDay") as? Number)?.toLong() ?: 0L
                val currentStreak = (existing.get("streak") as? Number)?.toLong() ?: 1L
                when {
                    lastDay == 0L -> patch["lastActiveEpochDay"] = today
                    today == lastDay + 1L -> {
                        patch["streak"] = (currentStreak + 1L).coerceAtMost(10_000L)
                        patch["lastActiveEpochDay"] = today
                    }
                    today > lastDay + 1L -> {
                        patch["streak"] = 1L
                        patch["lastActiveEpochDay"] = today
                    }
                }
                if (patch.isNotEmpty()) {
                    patch["updatedAt"] = FieldValue.serverTimestamp()
                    docRef.update(patch).await()
                }
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, path)
            Result.failure(e)
        }
    }

    suspend fun updateLearningLevel(level: CefrLevel): Result<Unit> {
        var path = "users"
        return try {
            val uid = requireUserId()
            val docRef = db.collection("users").document(uid)
            path = docRef.path
            docRef.update(
                mapOf(
                    "learningLevel" to level.name,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun awardProgress(
        xpDelta: Long,
        quizzesHostedDelta: Long = 0L,
        quizzesPlayedDelta: Long = 0L,
        cardsMasteredDelta: Long = 0L,
        sessionsCompletedDelta: Long = 0L,
        audiobooksFinishedDelta: Long = 0L,
        weeklyWordsMasteredDelta: Long = 0L,
        bestLiveQuizScoreCandidate: Long = 0L,
        newEarnedBadges: List<LingoBadge> = emptyList()
    ): Result<Unit> {
        var path = "users"
        return try {
            val uid = requireUserId()
            val docRef = db.collection("users").document(uid)
            path = docRef.path
            val updates = mutableMapOf<String, Any>(
                "updatedAt" to FieldValue.serverTimestamp()
            )
            if (xpDelta > 0L) updates["xp"] = FieldValue.increment(xpDelta)
            if (quizzesHostedDelta > 0L) updates["quizzesHosted"] = FieldValue.increment(quizzesHostedDelta)
            if (quizzesPlayedDelta > 0L) updates["quizzesPlayed"] = FieldValue.increment(quizzesPlayedDelta)
            if (cardsMasteredDelta != 0L) updates["cardsMastered"] = FieldValue.increment(cardsMasteredDelta)
            if (sessionsCompletedDelta > 0L) updates["sessionsCompleted"] = FieldValue.increment(sessionsCompletedDelta)
            if (audiobooksFinishedDelta > 0L) updates["audiobooksFinished"] = FieldValue.increment(audiobooksFinishedDelta)
            if (weeklyWordsMasteredDelta != 0L) updates["weeklyWordsMastered"] = FieldValue.increment(weeklyWordsMasteredDelta)
            if (bestLiveQuizScoreCandidate > 0L) {
                val snap = docRef.get().await()
                val currentBest = (snap.get("bestLiveQuizScore") as? Number)?.toLong() ?: 0L
                val boundedCandidate = bestLiveQuizScoreCandidate.coerceIn(0L, 500_000L)
                if (boundedCandidate > currentBest) {
                    updates["bestLiveQuizScore"] = boundedCandidate
                }
            }
            if (newEarnedBadges.isNotEmpty()) {
                val badgeIds = newEarnedBadges.map { it.name }.distinct().toTypedArray()
                updates["earnedBadges"] = FieldValue.arrayUnion(*badgeIds)
            }
            docRef.update(updates).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun grantBadges(badges: List<LingoBadge>): Result<Unit> {
        if (badges.isEmpty()) return Result.success(Unit)
        var path = "users"
        return try {
            val uid = requireUserId()
            val docRef = db.collection("users").document(uid)
            path = docRef.path
            val badgeIds = badges.map { it.name }.distinct().toTypedArray()
            docRef.update(
                mapOf(
                    "earnedBadges" to FieldValue.arrayUnion(*badgeIds),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    // --- Historical Performance Stats (Session History) ---

    fun observeSessionHistory(userId: String): Flow<List<SessionRecord>> = flow {
        val uid = requireUserId()
        check(uid == userId) { "Signed-in user mismatch." }
        val colRef = db.collection("users").document(uid).collection("session_history")
        emitAll(
            colRef.snapshots()
                .map { snapshot ->
                    snapshot.toObjects(SessionRecord::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.createdAt?.seconds ?: 0L }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(ex, OperationType.LIST, colRef.path)
                    }
                    throw error
                }
        )
    }

    suspend fun logSessionRecord(
        activityType: ActivityType,
        title: String,
        cefrLevel: CefrLevel,
        score: Long,
        accuracyPct: Long,
        wordsPracticed: Long,
        durationMinutes: Long
    ): Result<Unit> {
        var path = "users/session_history"
        return try {
            val uid = requireUserId()
            val docRef = db.collection("users").document(uid).collection("session_history").document()
            path = docRef.path
            val payload = mapOf(
                "activityType" to activityType.name,
                "title" to title.trim().ifBlank { activityType.label }.take(100),
                "cefrLevel" to cefrLevel.name,
                "score" to score.coerceIn(0L, 500000L),
                "accuracyPct" to accuracyPct.coerceIn(0L, 100L),
                "wordsPracticed" to wordsPracticed.coerceIn(0L, 200L),
                "durationMinutes" to durationMinutes.coerceIn(0L, 300L),
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            docRef.set(payload).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    // --- Weekly 200-Word Mastery & 3-Session Progress ---

    fun observeWeeklyProgress(userId: String): Flow<Map<Int, WeeklyProgress>> = flow {
        val uid = requireUserId()
        check(uid == userId) { "Signed-in user mismatch." }
        val colRef = db.collection("users").document(uid).collection("weekly_progress")
        emitAll(
            colRef.snapshots()
                .map { snapshot ->
                    snapshot.toObjects(WeeklyProgress::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .associateBy { it.weekNumber.toInt() }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(ex, OperationType.LIST, colRef.path)
                    }
                    throw error
                }
        )
    }

    suspend fun updateWeeklyWordMastery(
        weekNumber: Int,
        updatedMasteredIds: List<String>
    ): Result<Unit> {
        val weekId = "week_$weekNumber"
        var path = "users/weekly_progress/$weekId"
        return try {
            val uid = requireUserId()
            val cleanIds = updatedMasteredIds.distinct().take(200)
            val docRef = db.collection("users").document(uid).collection("weekly_progress").document(weekId)
            path = docRef.path
            val snap = docRef.get().await()
            if (snap.exists()) {
                docRef.update(
                    mapOf(
                        "masteredWordIds" to cleanIds,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } else {
                docRef.set(
                    mapOf(
                        "weekNumber" to weekNumber.toLong(),
                        "masteredWordIds" to cleanIds,
                        "completedSessions" to emptyList<Long>(),
                        "gamesPlayed" to 0L,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, path)
            Result.failure(e)
        }
    }

    suspend fun markWeeklySessionComplete(
        weekNumber: Int,
        sessionNumber: Int,
        incrementGames: Boolean = false
    ): Result<Boolean> {
        val weekId = "week_$weekNumber"
        var path = "users/weekly_progress/$weekId"
        return try {
            val uid = requireUserId()
            val docRef = db.collection("users").document(uid).collection("weekly_progress").document(weekId)
            path = docRef.path
            val snap = docRef.get().await()
            val currentSessions = if (snap.exists()) {
                val raw = snap.get("completedSessions") as? List<*>
                raw?.mapNotNull { (it as? Number)?.toLong() }.orEmpty()
            } else {
                emptyList()
            }
            val newlyCompleted = sessionNumber.toLong() !in currentSessions
            val updatedSessions = (currentSessions + sessionNumber.toLong()).distinct().sorted().take(3)
            if (snap.exists()) {
                val updates = mutableMapOf<String, Any>(
                    "completedSessions" to updatedSessions,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
                if (incrementGames) updates["gamesPlayed"] = FieldValue.increment(1L)
                docRef.update(updates).await()
            } else {
                docRef.set(
                    mapOf(
                        "weekNumber" to weekNumber.toLong(),
                        "masteredWordIds" to emptyList<String>(),
                        "completedSessions" to updatedSessions,
                        "gamesPlayed" to if (incrementGames) 1L else 0L,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            Result.success(newlyCompleted)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, path)
            Result.failure(e)
        }
    }

    suspend fun recordWeeklyGamePlayed(weekNumber: Int): Result<Unit> {
        val weekId = "week_$weekNumber"
        var path = "users/weekly_progress/$weekId"
        return try {
            val uid = requireUserId()
            val docRef = db.collection("users").document(uid).collection("weekly_progress").document(weekId)
            path = docRef.path
            val snap = docRef.get().await()
            if (snap.exists()) {
                docRef.update(
                    mapOf(
                        "gamesPlayed" to FieldValue.increment(1L),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } else {
                docRef.set(
                    mapOf(
                        "weekNumber" to weekNumber.toLong(),
                        "masteredWordIds" to emptyList<String>(),
                        "completedSessions" to emptyList<Long>(),
                        "gamesPlayed" to 1L,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, path)
            Result.failure(e)
        }
    }

    // --- Custom & AI/Offline Roleplays ---

    fun observeCustomRoleplays(userId: String): Flow<List<CustomRoleplay>> = flow {
        val uid = requireUserId()
        check(uid == userId) { "Signed-in user mismatch." }
        val colRef = db.collection("users").document(uid).collection("custom_roleplays")
        emitAll(
            colRef.snapshots()
                .map { snapshot ->
                    snapshot.toObjects(CustomRoleplay::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.createdAt?.seconds ?: 0L }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(ex, OperationType.LIST, colRef.path)
                    }
                    throw error
                }
        )
    }

    suspend fun saveCustomRoleplay(
        title: String,
        setting: String,
        cefrLevel: CefrLevel,
        roleAName: String,
        roleBName: String,
        goal: String,
        source: RoleplaySource,
        lines: List<RoleplayLine>,
        plotTwists: List<String>
    ): Result<Unit> {
        var path = "users/custom_roleplays"
        return try {
            val uid = requireUserId()
            require(lines.isNotEmpty() && lines.size <= 20) { "Roleplay must have 1-20 dialogue turns." }
            val docRef = db.collection("users").document(uid).collection("custom_roleplays").document()
            path = docRef.path
            val payload = mapOf(
                "title" to title.trim().ifBlank { "Custom Scene" }.take(80),
                "setting" to setting.trim().ifBlank { "Interactive Stage" }.take(160),
                "cefrLevel" to cefrLevel.name,
                "roleAName" to roleAName.trim().ifBlank { "Speaker A" }.take(40),
                "roleBName" to roleBName.trim().ifBlank { "Speaker B" }.take(40),
                "goal" to goal.trim().ifBlank { "Practice English together." }.take(200),
                "source" to source.name,
                "lines" to lines.take(20).map { it.toMap() },
                "plotTwists" to plotTwists.take(10),
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            docRef.set(payload).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun deleteCustomRoleplay(roleplayId: String): Result<Unit> {
        var path = "users/custom_roleplays/$roleplayId"
        return try {
            val uid = requireUserId()
            require(roleplayId.isNotBlank()) { "Roleplay ID required." }
            val docRef = db.collection("users").document(uid).collection("custom_roleplays").document(roleplayId)
            path = docRef.path
            docRef.delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }

    // --- Custom Quizzes & Decks ---

    fun observeCustomQuizzes(userId: String): Flow<List<CustomQuiz>> = flow {
        val uid = requireUserId()
        check(uid == userId) { "Signed-in user mismatch." }
        val colRef = db.collection("users").document(uid).collection("custom_quizzes")
        emitAll(
            colRef.snapshots()
                .map { snapshot ->
                    snapshot.toObjects(CustomQuiz::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.createdAt?.seconds ?: 0L }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(ex, OperationType.LIST, colRef.path)
                    }
                    throw error
                }
        )
    }

    suspend fun saveCustomQuiz(
        title: String,
        topic: String,
        cefrLevel: CefrLevel,
        questions: List<QuizQuestionItem>
    ): Result<Unit> {
        var path = "users/custom_quizzes"
        return try {
            val uid = requireUserId()
            val cleanTitle = title.trim().take(80)
            val cleanTopic = topic.trim().ifBlank { "English" }.take(40)
            require(cleanTitle.isNotEmpty()) { "Quiz title is required." }
            require(questions.isNotEmpty() && questions.size <= 20) { "Add between 1 and 20 questions." }

            val docRef = db.collection("users").document(uid).collection("custom_quizzes").document()
            path = docRef.path
            val payload = mapOf(
                "title" to cleanTitle,
                "topic" to cleanTopic,
                "cefrLevel" to cefrLevel.name,
                "questions" to questions.map { it.toMap() },
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            docRef.set(payload).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun deleteCustomQuiz(quizId: String): Result<Unit> {
        var path = "users/custom_quizzes/$quizId"
        return try {
            val uid = requireUserId()
            require(quizId.isNotBlank()) { "Quiz ID required." }
            val docRef = db.collection("users").document(uid).collection("custom_quizzes").document(quizId)
            path = docRef.path
            docRef.delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }

    fun observeCustomDecks(userId: String): Flow<List<CustomDeck>> = flow {
        val uid = requireUserId()
        check(uid == userId) { "Signed-in user mismatch." }
        val colRef = db.collection("users").document(uid).collection("custom_decks")
        emitAll(
            colRef.snapshots()
                .map { snapshot ->
                    snapshot.toObjects(CustomDeck::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.createdAt?.seconds ?: 0L }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(ex, OperationType.LIST, colRef.path)
                    }
                    throw error
                }
        )
    }

    suspend fun saveCustomDeck(
        title: String,
        cefrLevel: CefrLevel,
        cards: List<FlashcardItem>
    ): Result<Unit> {
        var path = "users/custom_decks"
        return try {
            val uid = requireUserId()
            val cleanTitle = title.trim().take(80)
            require(cleanTitle.isNotEmpty()) { "Deck title is required." }
            require(cards.isNotEmpty() && cards.size <= 40) { "Add between 1 and 40 cards." }

            val docRef = db.collection("users").document(uid).collection("custom_decks").document()
            path = docRef.path
            val payload = mapOf(
                "title" to cleanTitle,
                "cefrLevel" to cefrLevel.name,
                "cards" to cards.map { it.toMap() },
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            docRef.set(payload).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun updateCustomDeck(
        deckId: String,
        title: String,
        cefrLevel: CefrLevel,
        cards: List<FlashcardItem>
    ): Result<Unit> {
        val cleanId = sanitizeId(deckId)
        var path = "users/custom_decks/$cleanId"
        return try {
            val uid = requireUserId()
            require(deckId.isNotBlank()) { "Deck ID required." }
            val cleanTitle = title.trim().take(80)
            require(cleanTitle.isNotEmpty()) { "Deck title is required." }
            require(cards.isNotEmpty() && cards.size <= 40) { "Keep between 1 and 40 cards in a deck." }

            val docRef = db.collection("users").document(uid).collection("custom_decks").document(cleanId)
            path = docRef.path
            docRef.update(
                mapOf(
                    "title" to cleanTitle,
                    "cefrLevel" to cefrLevel.name,
                    "cards" to cards.take(40).map { it.toMap() },
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun deleteCustomDeck(deckId: String): Result<Unit> {
        val cleanId = sanitizeId(deckId)
        var path = "users/custom_decks/$cleanId"
        return try {
            val uid = requireUserId()
            require(deckId.isNotBlank()) { "Deck ID required." }
            val docRef = db.collection("users").document(uid).collection("custom_decks").document(cleanId)
            path = docRef.path
            docRef.delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, path)
            Result.failure(e)
        }
    }

    fun observeCardMastery(userId: String): Flow<Map<String, CardMastery>> = flow {
        val uid = requireUserId()
        check(uid == userId) { "Signed-in user mismatch." }
        val colRef = db.collection("users").document(uid).collection("card_mastery")
        emitAll(
            colRef.snapshots()
                .map { snapshot ->
                    snapshot.toObjects(CardMastery::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .associateBy { it.id }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(ex, OperationType.LIST, colRef.path)
                    }
                    throw error
                }
        )
    }

    suspend fun toggleCardMastery(
        deckId: String,
        cardIndex: Int,
        mastered: Boolean
    ): Result<Unit> {
        val cardKey = sanitizeId("${deckId}_$cardIndex")
        var path = "users/card_mastery/$cardKey"
        return try {
            val uid = requireUserId()
            val docRef = db.collection("users").document(uid).collection("card_mastery").document(cardKey)
            path = docRef.path
            val snap = docRef.get().await()
            if (snap.exists()) {
                docRef.update(
                    mapOf(
                        "mastered" to mastered,
                        "reviewCount" to FieldValue.increment(1L),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } else {
                docRef.set(
                    mapOf(
                        "deckId" to deckId.take(80),
                        "mastered" to mastered,
                        "reviewCount" to 1L,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, path)
            Result.failure(e)
        }
    }

    // --- Live Kahoot-Style Multiplayer Rooms ---

    private fun generateRoomCode(): String {
        val chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        return (1..6).map { chars.random() }.joinToString("")
    }

    suspend fun createQuizRoom(
        hostName: String,
        quizTitle: String,
        cefrLevel: CefrLevel,
        questions: List<QuizQuestionItem>
    ): Result<String> {
        var path = "quiz_rooms"
        return try {
            val uid = requireUserId()
            require(questions.isNotEmpty() && questions.size <= 20) { "Quiz must have 1-20 questions." }
            var selectedCode: String? = null
            repeat(5) {
                if (selectedCode == null) {
                    val candidate = generateRoomCode()
                    val snap = db.collection("quiz_rooms").document(candidate).get().await()
                    if (!snap.exists()) {
                        selectedCode = candidate
                    }
                }
            }
            val code = selectedCode ?: return Result.failure(
                IllegalStateException("Busy quiz room codes right now. Please tap Host again.")
            )
            val docRef = db.collection("quiz_rooms").document(code)
            path = docRef.path
            val payload = mapOf(
                "hostUid" to uid,
                "hostName" to hostName.trim().ifBlank { "Host" }.take(50),
                "quizTitle" to quizTitle.trim().take(80),
                "cefrLevel" to cefrLevel.name,
                "status" to RoomStatus.LOBBY.name,
                "currentQuestionIndex" to 0L,
                "questionStartedAtMs" to 0L,
                "questions" to questions.take(20).map { it.toMap() },
                "leaderboard" to emptyList<Map<String, Any>>(),
                "createdAt" to FieldValue.serverTimestamp(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            docRef.set(payload).await()
            Result.success(code)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    fun observeRoom(roomCode: String): Flow<QuizRoom?> = flow {
        requireUserId()
        val cleanCode = roomCode.trim().uppercase()
        val docRef = db.collection("quiz_rooms").document(cleanCode)
        emitAll(
            docRef.snapshots()
                .map { it.toObject(QuizRoom::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE) }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser != null) {
                        handleFirestoreError(ex, OperationType.GET, docRef.path)
                    }
                    throw error
                }
        )
    }

    fun observeRoomPlayers(roomCode: String, hostUid: String): Flow<List<RoomPlayer>> = flow {
        val uid = requireUserId()
        val cleanCode = roomCode.trim().uppercase()
        val query = db.collection("quiz_rooms")
            .document(cleanCode)
            .collection("players")
            .whereEqualTo("hostUid", hostUid)
        emitAll(
            query.snapshots()
                .map { snapshot ->
                    snapshot.toObjects(RoomPlayer::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.score }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(ex, OperationType.LIST, "quiz_rooms/$cleanCode/players")
                    }
                    throw error
                }
        )
    }

    suspend fun joinRoom(
        roomCode: String,
        nickname: String,
        avatarColor: String
    ): Result<QuizRoom> {
        val cleanCode = roomCode.trim().uppercase()
        var path = "quiz_rooms/$cleanCode"
        return try {
            val uid = requireUserId()
            require(cleanCode.matches(Regex("^[A-Z0-9]{6}$"))) { "Enter a valid 6-character Room PIN." }
            val cleanNick = nickname.trim().ifBlank { "Friend" }.take(24)

            val roomRef = db.collection("quiz_rooms").document(cleanCode)
            val roomSnap = roomRef.get().await()
            if (!roomSnap.exists()) {
                return Result.failure(IllegalArgumentException("No active room found for PIN $cleanCode."))
            }
            val room = roomSnap.toObject(QuizRoom::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                ?: return Result.failure(IllegalStateException("Could not load room."))

            if (RoomStatus.fromRaw(room.status) == RoomStatus.PODIUM) {
                return Result.failure(IllegalStateException("This quiz round has already finished."))
            }

            val playerRef = roomRef.collection("players").document(uid)
            path = playerRef.path
            val existingPlayer = playerRef.get().await()
            if (!existingPlayer.exists()) {
                val payload = mapOf(
                    "playerUid" to uid,
                    "roomCode" to cleanCode,
                    "hostUid" to room.hostUid,
                    "nickname" to cleanNick,
                    "avatarColor" to avatarColor.take(20),
                    "score" to 0L,
                    "streak" to 0L,
                    "lastAnswerIndex" to -1L,
                    "lastAnsweredQuestion" to -1L,
                    "lastAnswerCorrect" to false,
                    "lastPointsEarned" to 0L,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
                playerRef.set(payload).await()
            } else {
                playerRef.update(
                    mapOf(
                        "nickname" to cleanNick,
                        "avatarColor" to avatarColor.take(20),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            Result.success(room)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, path)
            Result.failure(e)
        }
    }

    suspend fun submitRoomAnswer(
        roomCode: String,
        questionIndex: Int,
        selectedIndex: Int,
        correct: Boolean,
        pointsEarned: Long,
        newScore: Long,
        newStreak: Long
    ): Result<Unit> {
        val cleanCode = roomCode.trim().uppercase()
        var path = "quiz_rooms/$cleanCode/players"
        return try {
            val uid = requireUserId()
            val playerRef = db.collection("quiz_rooms")
                .document(cleanCode)
                .collection("players")
                .document(uid)
            path = playerRef.path
            playerRef.update(
                mapOf(
                    "score" to newScore.coerceIn(0L, 500000L),
                    "streak" to newStreak.coerceIn(0L, 50L),
                    "lastAnswerIndex" to selectedIndex.toLong(),
                    "lastAnsweredQuestion" to questionIndex.toLong(),
                    "lastAnswerCorrect" to correct,
                    "lastPointsEarned" to pointsEarned.coerceIn(0L, 2000L),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun advanceRoomPhase(
        roomCode: String,
        newStatus: RoomStatus,
        questionIndex: Int,
        questionStartedAtMs: Long,
        leaderboard: List<LeaderboardEntry>
    ): Result<Unit> {
        val cleanCode = roomCode.trim().uppercase()
        val docRef = db.collection("quiz_rooms").document(cleanCode)
        return try {
            requireUserId()
            docRef.update(
                mapOf(
                    "status" to newStatus.name,
                    "currentQuestionIndex" to questionIndex.toLong(),
                    "questionStartedAtMs" to questionStartedAtMs,
                    "leaderboard" to leaderboard.take(25).map { it.toMap() },
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, docRef.path)
            Result.failure(e)
        }
    }

    fun observeRoomMessages(roomCode: String): Flow<List<RoomChatMessage>> = flow {
        val uid = requireUserId()
        val cleanCode = roomCode.trim().uppercase()
        val query = db.collection("quiz_rooms")
            .document(cleanCode)
            .collection("messages")
            .whereEqualTo("roomCode", cleanCode)
        emitAll(
            query.snapshots()
                .map { snapshot ->
                    snapshot.toObjects(RoomChatMessage::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedWith(
                            compareBy<RoomChatMessage> { it.createdAt?.seconds ?: Long.MAX_VALUE }
                                .thenBy { it.createdAt?.nanoseconds ?: 0 }
                        )
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(ex, OperationType.LIST, "quiz_rooms/$cleanCode/messages")
                    }
                    throw error
                }
        )
    }

    suspend fun sendRoomMessage(
        roomCode: String,
        senderName: String,
        avatarColor: String,
        hostSender: Boolean,
        messageType: RoomMessageType,
        text: String
    ): Result<Unit> {
        val cleanCode = roomCode.trim().uppercase()
        var path = "quiz_rooms/$cleanCode/messages"
        return try {
            val uid = requireUserId()
            require(cleanCode.matches(Regex("^[A-Z0-9]{6}$"))) { "Invalid Room PIN." }
            val cleanText = text.trim().take(240)
            require(cleanText.isNotEmpty()) { "Message cannot be empty." }
            val msgRef = db.collection("quiz_rooms")
                .document(cleanCode)
                .collection("messages")
                .document()
            path = msgRef.path
            msgRef.set(
                mapOf(
                    "roomCode" to cleanCode,
                    "senderUid" to uid,
                    "senderName" to senderName.trim().ifBlank { "Player" }.take(50),
                    "avatarColor" to avatarColor.trim().ifBlank { "INDIGO" }.take(20),
                    "hostSender" to hostSender,
                    "messageType" to messageType.name,
                    "text" to cleanText,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun deleteRoomMessage(roomCode: String, messageId: String): Result<Unit> {
        val cleanCode = roomCode.trim().uppercase()
        val cleanMsgId = sanitizeId(messageId)
        val msgRef = db.collection("quiz_rooms")
            .document(cleanCode)
            .collection("messages")
            .document(cleanMsgId)
        return try {
            requireUserId()
            msgRef.delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, msgRef.path)
            Result.failure(e)
        }
    }

    // --- Tutor-Student Progress & Roster ---

    suspend fun connectToTutor(
        tutorUid: String,
        tutorLabel: String,
        profile: UserProfile?,
        decksCount: Int,
        recentSessions: List<SessionRecord>
    ): Result<Unit> {
        val cleanTutorUid = tutorUid.trim()
        var path = "users"
        return try {
            val uid = requireUserId()
            require(cleanTutorUid.matches(Regex("^[a-zA-Z0-9_\\-]{3,128}$"))) {
                "Enter a valid Tutor Code (3-128 letters, numbers, - or _)."
            }
            val cleanTutorName = tutorLabel.trim().ifBlank { "My Tutor" }.take(50)
            val userRef = db.collection("users").document(uid)
            path = userRef.path
            userRef.update(
                mapOf(
                    "tutorUid" to cleanTutorUid,
                    "tutorName" to cleanTutorName,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()

            val effectiveProfile = (profile ?: UserProfile(userId = uid)).copy(
                tutorUid = cleanTutorUid,
                tutorName = cleanTutorName
            )
            syncStudentProgressToTutor(
                profile = effectiveProfile,
                decksCount = decksCount,
                recentSessions = recentSessions
            )
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, path)
            Result.failure(e)
        }
    }

    suspend fun disconnectFromTutor(previousTutorUid: String): Result<Unit> {
        var path = "users"
        return try {
            val uid = requireUserId()
            val userRef = db.collection("users").document(uid)
            path = userRef.path
            userRef.update(
                mapOf(
                    "tutorUid" to "",
                    "tutorName" to "",
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()

            val cleanPrev = previousTutorUid.trim()
            if (cleanPrev.matches(Regex("^[a-zA-Z0-9_\\-]{1,128}$"))) {
                db.collection("tutors")
                    .document(cleanPrev)
                    .collection("students")
                    .document(uid)
                    .delete()
                    .await()
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    suspend fun syncStudentProgressToTutor(
        profile: UserProfile,
        decksCount: Int,
        recentSessions: List<SessionRecord>
    ): Result<Unit> {
        val cleanTutorUid = profile.tutorUid.trim()
        if (cleanTutorUid.isBlank() || !cleanTutorUid.matches(Regex("^[a-zA-Z0-9_\\-]{1,128}$"))) {
            return Result.success(Unit)
        }
        var path = "tutors/$cleanTutorUid/students"
        return try {
            val uid = requireUserId()
            val docRef = db.collection("tutors")
                .document(cleanTutorUid)
                .collection("students")
                .document(uid)
            path = docRef.path
            val existing = docRef.get().await()
            val activities = recentSessions.take(10).map {
                StudentActivitySummary(
                    title = it.title.ifBlank { "Activity" },
                    activityType = it.activityType,
                    cefrLevel = CefrLevel.fromRaw(it.cefrLevel).name,
                    score = it.score.coerceIn(0L, 500000L),
                    accuracyPct = it.accuracyPct.coerceIn(0L, 100L),
                    wordsPracticed = it.wordsPracticed.coerceIn(0L, 200L)
                ).toMap()
            }
            val safeName = profile.displayName.trim().ifBlank { "Student" }.take(50)
            val safeLevel = CefrLevel.fromRaw(profile.learningLevel).name
            val safeBadges = profile.earnedBadges.take(30)
            if (existing.exists()) {
                docRef.update(
                    mapOf(
                        "studentName" to safeName,
                        "learningLevel" to safeLevel,
                        "xp" to profile.xp.coerceIn(0L, 10_000_000L),
                        "streak" to profile.streak.coerceIn(0L, 10_000L),
                        "sessionsCompleted" to profile.sessionsCompleted.coerceIn(0L, 10_000L),
                        "weeklyWordsMastered" to profile.weeklyWordsMastered.coerceIn(0L, 100_000L),
                        "quizzesPlayed" to profile.quizzesPlayed.coerceIn(0L, 100_000L),
                        "quizzesHosted" to profile.quizzesHosted.coerceIn(0L, 100_000L),
                        "bestLiveQuizScore" to profile.bestLiveQuizScore.coerceIn(0L, 500_000L),
                        "cardsMastered" to profile.cardsMastered.coerceIn(0L, 100_000L),
                        "decksCreated" to decksCount.coerceIn(0, 1000).toLong(),
                        "audiobooksFinished" to profile.audiobooksFinished.coerceIn(0L, 10_000L),
                        "teamName" to profile.teamName.trim().take(50),
                        "earnedBadges" to safeBadges,
                        "recentActivities" to activities,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } else {
                docRef.set(
                    mapOf(
                        "studentUid" to uid,
                        "tutorUid" to cleanTutorUid,
                        "studentName" to safeName,
                        "learningLevel" to safeLevel,
                        "xp" to profile.xp.coerceIn(0L, 10_000_000L),
                        "streak" to profile.streak.coerceIn(0L, 10_000L),
                        "sessionsCompleted" to profile.sessionsCompleted.coerceIn(0L, 10_000L),
                        "weeklyWordsMastered" to profile.weeklyWordsMastered.coerceIn(0L, 100_000L),
                        "quizzesPlayed" to profile.quizzesPlayed.coerceIn(0L, 100_000L),
                        "quizzesHosted" to profile.quizzesHosted.coerceIn(0L, 100_000L),
                        "bestLiveQuizScore" to profile.bestLiveQuizScore.coerceIn(0L, 500_000L),
                        "cardsMastered" to profile.cardsMastered.coerceIn(0L, 100_000L),
                        "decksCreated" to decksCount.coerceIn(0, 1000).toLong(),
                        "audiobooksFinished" to profile.audiobooksFinished.coerceIn(0L, 10_000L),
                        "teamName" to profile.teamName.trim().take(50),
                        "earnedBadges" to safeBadges,
                        "recentActivities" to activities,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, path)
            Result.failure(e)
        }
    }

    fun observeLinkedStudents(tutorUid: String): Flow<List<TutorStudentProgress>> = flow {
        val uid = requireUserId()
        check(uid == tutorUid) { "Signed-in user mismatch." }
        val colRef = db.collection("tutors").document(uid).collection("students")
        emitAll(
            colRef.snapshots()
                .map { snap ->
                    snap.toObjects(TutorStudentProgress::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.xp }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(ex, OperationType.LIST, colRef.path)
                    }
                    throw error
                }
        )
    }

    fun observeBootstrappedStudents(): Flow<List<UserProfile>> = flow {
        val uid = requireUserId()
        if (!isBootstrappedTutor()) {
            emit(emptyList())
            return@flow
        }
        val query = db.collection("users").whereEqualTo("accountRole", "STUDENT")
        emitAll(
            query.snapshots()
                .map { snap ->
                    snap.toObjects(UserProfile::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.xp }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(ex, OperationType.LIST, "users")
                    }
                    throw error
                }
        )
    }

    fun observeDirectAssignedStudents(tutorUid: String): Flow<List<UserProfile>> = flow {
        val uid = requireUserId()
        check(uid == tutorUid) { "Signed-in user mismatch." }
        val query = db.collection("users").whereEqualTo("tutorUid", uid)
        emitAll(
            query.snapshots()
                .map { snap ->
                    snap.toObjects(UserProfile::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.xp }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(ex, OperationType.LIST, "users")
                    }
                    throw error
                }
        )
    }

    suspend fun fetchStudentDetailBundle(studentUid: String): Result<StudentDetailBundle> {
        val cleanUid = sanitizeId(studentUid)
        var path = "users/$cleanUid"
        return try {
            requireUserId()
            if (!isBootstrappedTutor()) {
                return Result.success(StudentDetailBundle(studentUid = cleanUid))
            }
            val userDoc = db.collection("users").document(cleanUid)
            path = "${userDoc.path}/session_history"
            val sessionsSnap = userDoc.collection("session_history").get().await()
            path = "${userDoc.path}/weekly_progress"
            val weeklySnap = userDoc.collection("weekly_progress").get().await()
            path = "${userDoc.path}/custom_decks"
            val decksSnap = userDoc.collection("custom_decks").get().await()

            val sessions = sessionsSnap
                .toObjects(SessionRecord::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                .sortedByDescending { it.createdAt?.seconds ?: 0L }
            val weekly = weeklySnap
                .toObjects(WeeklyProgress::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                .sortedBy { it.weekNumber }
            val decks = decksSnap
                .toObjects(CustomDeck::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                .sortedByDescending { it.createdAt?.seconds ?: 0L }

            Result.success(
                StudentDetailBundle(
                    studentUid = cleanUid,
                    sessions = sessions,
                    weeklyProgress = weekly,
                    customDecks = decks
                )
            )
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.LIST, path)
            Result.failure(e)
        }
    }

    // --- Team & Tutor-Student Chat ---

    fun observeTeams(): Flow<List<TeamChannel>> = flow {
        val uid = requireUserId()
        val query = db.collection("teams").whereEqualTo("visibility", "CLUB")
        emitAll(
            query.snapshots()
                .map { snap ->
                    snap.toObjects(TeamChannel::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedWith(
                            compareByDescending<TeamChannel> {
                                it.channelKind == TeamChannelKind.TEACHER_HUB.name
                            }.thenByDescending { it.memberCount }
                                .thenBy { it.name.lowercase() }
                        )
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(ex, OperationType.LIST, "teams")
                    }
                    throw error
                }
        )
    }

    suspend fun ensureDefaultTutorHubIfTutor(tutorDisplayName: String): Result<Unit> {
        val hubRef = db.collection("teams").document(DEFAULT_TEACHER_HUB_ID)
        return try {
            val uid = requireUserId()
            val snap = hubRef.get().await()
            if (!snap.exists()) {
                hubRef.set(
                    mapOf(
                        "visibility" to "CLUB",
                        "name" to "Tutor <-> All Teams",
                        "cefrLevel" to CefrLevel.B2.name,
                        "motto" to "Direct tutor announcements, speaking tips, and student Q&A",
                        "accentColor" to "INDIGO",
                        "leaderUid" to uid,
                        "leaderName" to tutorDisplayName.trim().ifBlank { "Tutor" }.take(50),
                        "channelKind" to TeamChannelKind.TEACHER_HUB.name,
                        "memberCount" to 1L,
                        "createdAt" to FieldValue.serverTimestamp(),
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, hubRef.path)
            Result.failure(e)
        }
    }

    suspend fun createTeam(
        name: String,
        cefrLevel: CefrLevel,
        motto: String,
        accentColor: String,
        channelKind: TeamChannelKind,
        creatorName: String
    ): Result<String> {
        var path = "teams"
        return try {
            val uid = requireUserId()
            val cleanName = name.trim().take(50)
            require(cleanName.length >= 2) { "Team name must be at least 2 characters." }
            val allowedColor = accentColor.takeIf {
                it in setOf("INDIGO", "CORAL", "AMBER", "MINT", "PURPLE")
            } ?: "INDIGO"
            val docRef = db.collection("teams").document()
            path = docRef.path
            docRef.set(
                mapOf(
                    "visibility" to "CLUB",
                    "name" to cleanName,
                    "cefrLevel" to cefrLevel.name,
                    "motto" to motto.trim().take(120),
                    "accentColor" to allowedColor,
                    "leaderUid" to uid,
                    "leaderName" to creatorName.trim().ifBlank { "Team Lead" }.take(50),
                    "channelKind" to channelKind.name,
                    "memberCount" to 1L,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            if (channelKind == TeamChannelKind.TEAM) {
                db.collection("users").document(uid).update(
                    mapOf(
                        "teamId" to docRef.id,
                        "teamName" to cleanName,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            Result.success(docRef.id)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun joinTeam(team: TeamChannel, previousTeamId: String): Result<Unit> {
        var path = "teams/${team.id}"
        return try {
            val uid = requireUserId()
            require(team.id.isNotBlank()) { "Team ID missing." }
            if (previousTeamId == team.id) return Result.success(Unit)
            val targetRef = db.collection("teams").document(team.id)
            path = targetRef.path
            val targetSnap = targetRef.get().await()
            val curCount = (targetSnap.get("memberCount") as? Number)?.toLong() ?: team.memberCount
            targetRef.update(
                mapOf(
                    "memberCount" to (curCount + 1L).coerceAtMost(10_000L),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()

            if (previousTeamId.isNotBlank() && previousTeamId != DEFAULT_TEACHER_HUB_ID) {
                val prevRef = db.collection("teams").document(previousTeamId)
                val prevSnap = prevRef.get().await()
                if (prevSnap.exists()) {
                    val prevCount = (prevSnap.get("memberCount") as? Number)?.toLong() ?: 1L
                    prevRef.update(
                        mapOf(
                            "memberCount" to (prevCount - 1L).coerceAtLeast(0L),
                            "updatedAt" to FieldValue.serverTimestamp()
                        )
                    ).await()
                }
            }

            db.collection("users").document(uid).update(
                mapOf(
                    "teamId" to team.id,
                    "teamName" to team.name.take(50),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, path)
            Result.failure(e)
        }
    }

    fun observeTeamMessages(teamId: String): Flow<List<ChatMessage>> = flow {
        val uid = requireUserId()
        val cleanId = sanitizeId(teamId)
        val query = db.collection("teams")
            .document(cleanId)
            .collection("messages")
            .whereEqualTo("teamId", cleanId)
        emitAll(
            query.snapshots()
                .map { snap ->
                    snap.toObjects(ChatMessage::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedWith(
                            compareByDescending<ChatMessage> { it.pinned }
                                .thenBy { it.createdAt?.seconds ?: Long.MAX_VALUE }
                                .thenBy { it.createdAt?.nanoseconds ?: 0 }
                        )
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(ex, OperationType.LIST, "teams/$cleanId/messages")
                    }
                    throw error
                }
        )
    }

    suspend fun sendTeamMessage(
        teamId: String,
        senderName: String,
        senderTeamName: String,
        senderRole: ChatSenderRole,
        text: String,
        pinned: Boolean = false
    ): Result<Unit> {
        val cleanTeamId = sanitizeId(teamId)
        var path = "teams/$cleanTeamId/messages"
        return try {
            val uid = requireUserId()
            val cleanText = text.trim().take(500)
            require(cleanText.isNotEmpty()) { "Message cannot be empty." }
            val msgRef = db.collection("teams").document(cleanTeamId).collection("messages").document()
            path = msgRef.path
            msgRef.set(
                mapOf(
                    "teamId" to cleanTeamId,
                    "senderUid" to uid,
                    "senderName" to senderName.trim().ifBlank { "Member" }.take(50),
                    "senderTeamName" to senderTeamName.trim().take(50),
                    "senderRole" to senderRole.name,
                    "text" to cleanText,
                    "pinned" to pinned,
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, path)
            Result.failure(e)
        }
    }

    suspend fun toggleMessagePin(teamId: String, messageId: String, pinned: Boolean): Result<Unit> {
        val cleanTeamId = sanitizeId(teamId)
        val cleanMsgId = sanitizeId(messageId)
        val msgRef = db.collection("teams").document(cleanTeamId).collection("messages").document(cleanMsgId)
        return try {
            requireUserId()
            msgRef.update(
                mapOf(
                    "pinned" to pinned,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, msgRef.path)
            Result.failure(e)
        }
    }

    suspend fun deleteTeamMessage(teamId: String, messageId: String): Result<Unit> {
        val cleanTeamId = sanitizeId(teamId)
        val cleanMsgId = sanitizeId(messageId)
        val msgRef = db.collection("teams").document(cleanTeamId).collection("messages").document(cleanMsgId)
        return try {
            requireUserId()
            msgRef.delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, msgRef.path)
            Result.failure(e)
        }
    }

    // --- Shared Club Content (Read-Only Feed) ---

    fun observeClubContent(): Flow<List<ClubContentItem>> = flow {
        val uid = requireUserId()
        val query = db.collection("club_content").whereEqualTo("visibility", "CLUB")
        emitAll(
            query.snapshots()
                .map { snap ->
                    snap.toObjects(ClubContentItem::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                        .sortedByDescending { it.createdAt?.seconds ?: 0L }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(ex, OperationType.LIST, "club_content")
                    }
                    throw error
                }
        )
    }

    // --- Global Live Quiz & Arcade Leaderboard ---

    fun observeGlobalScores(limit: Long = 30): Flow<List<ScoreRecord>> = flow {
        val uid = requireUserId()
        val query = db.collection("scores")
            .orderBy("score", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .limit(limit)
        emitAll(
            query.snapshots()
                .map { snap ->
                    snap.toObjects(ScoreRecord::class.java, DocumentSnapshot.ServerTimestampBehavior.ESTIMATE)
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val ex = firestoreError ?: (error as? Exception)
                    if (ex != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(ex, OperationType.LIST, "scores")
                    }
                    throw error
                }
        )
    }

    suspend fun publishScoreRecord(
        quizTitle: String,
        cefrLevel: CefrLevel,
        score: Long,
        accuracyPct: Long,
        streak: Long,
        gameMode: String = "LIVE_QUIZ",
        avatarColor: String = "INDIGO"
    ): Result<Unit> {
        val uid = requireUserId()
        val displayName = (auth.currentUser?.displayName ?: "Lingo Member").trim().take(50).ifBlank { "Lingo Member" }
        val scoreId = "${uid}_${sanitizeId(gameMode)}_${sanitizeId(quizTitle)}"
        val docRef = db.collection("scores").document(scoreId)
        return try {
            val existing = docRef.get().await()
            val existingScore = existing.getLong("score") ?: 0L
            if (existing.exists() && score <= existingScore) {
                return Result.success(Unit)
            }
            val payload = mapOf(
                "userId" to uid,
                "playerName" to displayName,
                "avatarColor" to avatarColor.take(24).ifBlank { "INDIGO" },
                "quizTitle" to quizTitle.take(100).ifBlank { "Quiz Clash" },
                "cefrLevel" to cefrLevel.name,
                "score" to score.coerceIn(0L, 500000L),
                "accuracyPct" to accuracyPct.coerceIn(0L, 100L),
                "streak" to streak.coerceIn(0L, 100L),
                "gameMode" to gameMode.take(40).ifBlank { "LIVE_QUIZ" },
                "createdAt" to (existing.getTimestamp("createdAt") ?: FieldValue.serverTimestamp()),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            docRef.set(payload).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, docRef.path)
            Result.failure(e)
        }
    }

    suspend fun togglePinEvidence(cardId: String, pinned: Boolean): Result<Unit> {
        val uid = requireUserId()
        val userRef = db.collection("users").document(uid)
        return try {
            val cleanId = cardId.trim().take(80)
            if (cleanId.isNotBlank()) {
                val op = if (pinned) FieldValue.arrayUnion(cleanId) else FieldValue.arrayRemove(cleanId)
                userRef.update(
                    mapOf(
                        "pinnedEvidenceIds" to op,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, userRef.path)
            Result.failure(e)
        }
    }

    companion object {
        const val BOOTSTRAPPED_TUTOR_EMAIL = "radwana423@gmail.com"
        const val DEFAULT_TEACHER_HUB_ID = "hub_teacher_all"
    }
}
