package com.example.data.model

import androidx.annotation.Keep
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.IgnoreExtraProperties
import com.google.firebase.firestore.ServerTimestamp

enum class CefrLevel(val label: String) {
    A1("A1"),
    A2("A2"),
    B1("B1"),
    B2("B2");

    companion object {
        fun fromRaw(raw: String?): CefrLevel =
            entries.firstOrNull { it.name == raw } ?: B1
    }
}

enum class RoomStatus {
    LOBBY,
    QUESTION,
    REVEAL,
    PODIUM;

    companion object {
        fun fromRaw(raw: String?): RoomStatus =
            entries.firstOrNull { it.name == raw } ?: LOBBY
    }
}

enum class ActivityType(val label: String) {
    QUIZ("Quiz Clash"),
    PUZZLE("Word Forge"),
    CARDS("Deck Studio"),
    GUESSING("Taboo & Act"),
    ROLEPLAY("Roleplay Stage"),
    AUDIOBOOK("Audiobook"),
    WEEKLY_SESSION("Weekly Session"),
    GAME("Vocab Game");

    companion object {
        fun fromRaw(raw: String?): ActivityType =
            entries.firstOrNull { it.name == raw } ?: QUIZ
    }
}

enum class RoleplaySource {
    AI,
    OFFLINE;

    companion object {
        fun fromRaw(raw: String?): RoleplaySource =
            entries.firstOrNull { it.name == raw } ?: OFFLINE
    }
}

@Keep
@IgnoreExtraProperties
data class UserProfile(
    @DocumentId val id: String = "",
    val userId: String = "",
    val displayName: String = "",
    val learningLevel: String = CefrLevel.B2.name,
    val xp: Long = 0L,
    val streak: Long = 1L,
    val quizzesHosted: Long = 0L,
    val quizzesPlayed: Long = 0L,
    val cardsMastered: Long = 0L,
    val sessionsCompleted: Long = 0L,
    val audiobooksFinished: Long = 0L,
    val weeklyWordsMastered: Long = 0L,
    val bestLiveQuizScore: Long = 0L,
    val earnedBadges: List<String> = emptyList(),
    val pinnedEvidenceIds: List<String> = emptyList(),
    val teamId: String = "",
    val teamName: String = "",
    val accountRole: String = "STUDENT",
    val tutorUid: String = "",
    val tutorName: String = "",
    val lastActiveEpochDay: Long = 0L,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class StudentActivitySummary(
    val title: String = "",
    val activityType: String = ActivityType.QUIZ.name,
    val cefrLevel: String = CefrLevel.B2.name,
    val score: Long = 0L,
    val accuracyPct: Long = 100L,
    val wordsPracticed: Long = 0L
) {
    fun toMap(): Map<String, Any> = mapOf(
        "title" to title.take(100),
        "activityType" to activityType,
        "cefrLevel" to cefrLevel,
        "score" to score.coerceIn(0L, 500000L),
        "accuracyPct" to accuracyPct.coerceIn(0L, 100L),
        "wordsPracticed" to wordsPracticed.coerceIn(0L, 200L)
    )
}

@Keep
@IgnoreExtraProperties
data class TutorStudentProgress(
    @DocumentId val id: String = "",
    val studentUid: String = "",
    val tutorUid: String = "",
    val studentName: String = "",
    val learningLevel: String = CefrLevel.B2.name,
    val xp: Long = 0L,
    val streak: Long = 1L,
    val sessionsCompleted: Long = 0L,
    val weeklyWordsMastered: Long = 0L,
    val quizzesPlayed: Long = 0L,
    val quizzesHosted: Long = 0L,
    val bestLiveQuizScore: Long = 0L,
    val cardsMastered: Long = 0L,
    val decksCreated: Long = 0L,
    val audiobooksFinished: Long = 0L,
    val teamName: String = "",
    val earnedBadges: List<String> = emptyList(),
    val recentActivities: List<StudentActivitySummary> = emptyList(),
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

data class StudentDetailBundle(
    val studentUid: String,
    val sessions: List<SessionRecord> = emptyList(),
    val weeklyProgress: List<WeeklyProgress> = emptyList(),
    val customDecks: List<CustomDeck> = emptyList()
)

data class TutorClassSummary(
    val totalStudents: Int,
    val totalXp: Long,
    val totalWeeklyWords: Long,
    val totalSessionsCompleted: Long,
    val averageBestQuizScore: Long
) {
    companion object {
        fun fromStudents(students: List<TutorStudentProgress>): TutorClassSummary {
            if (students.isEmpty()) {
                return TutorClassSummary(0, 0L, 0L, 0L, 0L)
            }
            return TutorClassSummary(
                totalStudents = students.size,
                totalXp = students.sumOf { it.xp },
                totalWeeklyWords = students.sumOf { it.weeklyWordsMastered },
                totalSessionsCompleted = students.sumOf { it.sessionsCompleted },
                averageBestQuizScore = students.map { it.bestLiveQuizScore }.average().toLong()
            )
        }
    }
}

@Keep
@IgnoreExtraProperties
data class SessionRecord(
    @DocumentId val id: String = "",
    val activityType: String = ActivityType.QUIZ.name,
    val title: String = "",
    val cefrLevel: String = CefrLevel.B2.name,
    val score: Long = 0L,
    val accuracyPct: Long = 100L,
    val wordsPracticed: Long = 0L,
    val durationMinutes: Long = 5L,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class WeeklyProgress(
    @DocumentId val id: String = "",
    val weekNumber: Long = 1L,
    val masteredWordIds: List<String> = emptyList(),
    val completedSessions: List<Long> = emptyList(),
    val gamesPlayed: Long = 0L,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class CustomRoleplay(
    @DocumentId val id: String = "",
    val title: String = "",
    val setting: String = "",
    val cefrLevel: String = CefrLevel.B2.name,
    val roleAName: String = "",
    val roleBName: String = "",
    val goal: String = "",
    val source: String = RoleplaySource.OFFLINE.name,
    val lines: List<RoleplayLine> = emptyList(),
    val plotTwists: List<String> = emptyList(),
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class QuizQuestionItem(
    val prompt: String = "",
    val options: List<String> = emptyList(),
    val correctIndex: Long = 0L,
    val timeLimitSec: Long = 20L,
    val tip: String = ""
) {
    fun toMap(): Map<String, Any> = mapOf(
        "prompt" to prompt,
        "options" to options,
        "correctIndex" to correctIndex,
        "timeLimitSec" to timeLimitSec,
        "tip" to tip
    )
}

@Keep
@IgnoreExtraProperties
data class CustomQuiz(
    @DocumentId val id: String = "",
    val title: String = "",
    val topic: String = "",
    val cefrLevel: String = CefrLevel.B2.name,
    val questions: List<QuizQuestionItem> = emptyList(),
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class FlashcardItem(
    val term: String = "",
    val phonetic: String = "",
    val partOfSpeech: String = "",
    val meaning: String = "",
    val example: String = "",
    val teachingTip: String = ""
) {
    fun toMap(): Map<String, Any> = mapOf(
        "term" to term,
        "phonetic" to phonetic,
        "partOfSpeech" to partOfSpeech,
        "meaning" to meaning,
        "example" to example,
        "teachingTip" to teachingTip
    )
}

@Keep
@IgnoreExtraProperties
data class CustomDeck(
    @DocumentId val id: String = "",
    val title: String = "",
    val cefrLevel: String = CefrLevel.B2.name,
    val cards: List<FlashcardItem> = emptyList(),
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class CardMastery(
    @DocumentId val id: String = "",
    val deckId: String = "",
    val mastered: Boolean = false,
    val reviewCount: Long = 0L,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class LeaderboardEntry(
    val uid: String = "",
    val nickname: String = "",
    val score: Long = 0L,
    val streak: Long = 0L,
    val avatarColor: String = "INDIGO"
) {
    fun toMap(): Map<String, Any> = mapOf(
        "uid" to uid,
        "nickname" to nickname,
        "score" to score,
        "streak" to streak,
        "avatarColor" to avatarColor
    )
}

@Keep
@IgnoreExtraProperties
data class QuizRoom(
    @DocumentId val id: String = "",
    val hostUid: String = "",
    val hostName: String = "",
    val quizTitle: String = "",
    val cefrLevel: String = CefrLevel.B2.name,
    val status: String = RoomStatus.LOBBY.name,
    val currentQuestionIndex: Long = 0L,
    val questionStartedAtMs: Long = 0L,
    val questions: List<QuizQuestionItem> = emptyList(),
    val leaderboard: List<LeaderboardEntry> = emptyList(),
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class RoomPlayer(
    @DocumentId val id: String = "",
    val playerUid: String = "",
    val roomCode: String = "",
    val hostUid: String = "",
    val nickname: String = "",
    val avatarColor: String = "CORAL",
    val score: Long = 0L,
    val streak: Long = 0L,
    val lastAnswerIndex: Long = -1L,
    val lastAnsweredQuestion: Long = -1L,
    val lastAnswerCorrect: Boolean = false,
    val lastPointsEarned: Long = 0L,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

enum class RoomMessageType {
    TEXT,
    REACTION;

    companion object {
        fun fromRaw(raw: String?): RoomMessageType =
            entries.firstOrNull { it.name == raw } ?: TEXT
    }
}

@Keep
@IgnoreExtraProperties
data class RoomChatMessage(
    @DocumentId val id: String = "",
    val roomCode: String = "",
    val senderUid: String = "",
    val senderName: String = "",
    val avatarColor: String = "INDIGO",
    val hostSender: Boolean = false,
    val messageType: String = RoomMessageType.TEXT.name,
    val text: String = "",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

// Curated in-app packs & interactive learning models

data class CuratedQuizPack(
    val id: String,
    val title: String,
    val topic: String,
    val cefrLevel: CefrLevel,
    val description: String,
    val questions: List<QuizQuestionItem>
)

data class CuratedFlashcardDeck(
    val id: String,
    val title: String,
    val subtitle: String,
    val cefrLevel: CefrLevel,
    val cards: List<FlashcardItem>
)

data class SentencePuzzle(
    val id: String,
    val cefrLevel: CefrLevel,
    val promptHint: String,
    val tokens: List<String>,
    val explanation: String
)

data class CollocationPair(
    val id: String,
    val left: String,
    val right: String
)

data class MatchPuzzleSet(
    val id: String,
    val title: String,
    val cefrLevel: CefrLevel,
    val pairs: List<CollocationPair>,
    val teachingTip: String
)

data class ClozePuzzle(
    val id: String,
    val cefrLevel: CefrLevel,
    val beforeBlank: String,
    val afterBlank: String,
    val correctWord: String,
    val options: List<String>,
    val explanation: String
)

data class GuessingCard(
    val word: String,
    val category: String,
    val tabooWords: List<String>,
    val clueHint: String
)

data class GuessingPack(
    val id: String,
    val title: String,
    val modeLabel: String,
    val cefrLevel: CefrLevel,
    val description: String,
    val cards: List<GuessingCard>
)

@Keep
@IgnoreExtraProperties
data class HighlightedPhrase(
    val phrase: String = "",
    val meaning: String = "",
    val example: String = ""
) {
    fun toMap(): Map<String, Any> = mapOf(
        "phrase" to phrase,
        "meaning" to meaning,
        "example" to example
    )
}

@Keep
@IgnoreExtraProperties
data class RoleplayLine(
    val speakerRole: String = "A", // "A" or "B"
    val text: String = "",
    val keyHint: String = "",
    val highlights: List<HighlightedPhrase> = emptyList()
) {
    fun toMap(): Map<String, Any> = mapOf(
        "speakerRole" to speakerRole,
        "text" to text,
        "keyHint" to keyHint,
        "highlights" to highlights.map { it.toMap() }
    )
}

data class RoleplayScenario(
    val id: String,
    val title: String,
    val setting: String,
    val cefrLevel: CefrLevel,
    val roleAName: String,
    val roleBName: String,
    val goal: String,
    val lines: List<RoleplayLine>,
    val plotTwists: List<String>
)

@Keep
@IgnoreExtraProperties
data class ScoreRecord(
    @DocumentId val id: String = "",
    val userId: String = "",
    val playerName: String = "",
    val avatarColor: String = "INDIGO",
    val quizTitle: String = "",
    val cefrLevel: String = CefrLevel.B2.name,
    val score: Long = 0L,
    val accuracyPct: Long = 100L,
    val streak: Long = 0L,
    val gameMode: String = "LIVE_QUIZ",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

data class EvidenceCard(
    val id: String,
    val title: String,
    val category: String,
    val description: String,
    val englishClue: String,
    val arabicMeaning: String,
    val cefrLevel: CefrLevel
)

data class DictionaryEntry(
    val id: String,
    val english: String,
    val arabic: String,
    val transliteration: String,
    val phonetic: String,
    val partOfSpeech: String,
    val cefrLevel: CefrLevel,
    val topic: String,
    val exampleEn: String,
    val exampleAr: String,
    val levelLabel: String = cefrLevel.label
)

data class AudiobookParagraph(
    val id: String,
    val english: String,
    val arabic: String,
    val keyVocabulary: List<String> = emptyList()
)

data class AudiobookChapter(
    val id: String,
    val chapterNumber: Int,
    val title: String,
    val durationMin: Int,
    val paragraphs: List<AudiobookParagraph>,
    val reflectionPrompt: String
)

data class Audiobook(
    val id: String,
    val title: String,
    val subtitle: String,
    val narrator: String,
    val cefrLevel: CefrLevel,
    val genre: String,
    val chapters: List<AudiobookChapter>
)

enum class VocabDomain(val label: String) {
    EVERYDAY("Everyday & Home"),
    WORK_TECH("Work & Tech"),
    TRAVEL_FOOD("Travel & Café"),
    STORY_EMOTION("Stories & Feelings"),
    IDIOMS_ACTION("Idioms & Action")
}

data class WeeklyVocabWord(
    val id: String,
    val word: String,
    val arabic: String,
    val meaning: String,
    val storyLine: String,
    val domain: VocabDomain,
    val cefrLevel: CefrLevel,
    val sessionNumber: Int // 1, 2, or 3
)

data class WeeklySessionPlan(
    val sessionNumber: Int,
    val dayLabel: String,
    val title: String,
    val storyOpening: String,
    val storyClosing: String,
    val teachingTip: String
)

data class WeeklyCurriculumWeek(
    val weekNumber: Int,
    val title: String,
    val subtitle: String,
    val themeStory: String,
    val sessions: List<WeeklySessionPlan>,
    val words: List<WeeklyVocabWord>
)

// --- Badge System ---

enum class BadgeCategory(val label: String) {
    WEEKLY("Weekly Mastery"),
    QUIZ("Live Quiz"),
    CLUB("Club & Voice")
}

enum class LingoBadge(
    val title: String,
    val subtitle: String,
    val criteria: String,
    val category: BadgeCategory
) {
    FIRST_WEEKLY_SESSION(
        title = "Session Starter",
        subtitle = "Completed your first weekly 200-word session",
        criteria = "Complete 1 weekly session",
        category = BadgeCategory.WEEKLY
    ),
    THREE_WEEKLY_SESSIONS(
        title = "Weekly Hat-Trick",
        subtitle = "Finished all 3 sessions in a weekly study cycle",
        criteria = "Complete 3 weekly sessions",
        category = BadgeCategory.WEEKLY
    ),
    WEEKLY_WORDS_50(
        title = "Word Builder",
        subtitle = "Mastered 50+ vocabulary words across domains",
        criteria = "Master 50 weekly words",
        category = BadgeCategory.WEEKLY
    ),
    WEEKLY_WORDS_200(
        title = "200-Word Champion",
        subtitle = "Mastered 200+ weekly curriculum words",
        criteria = "Master 200 weekly words",
        category = BadgeCategory.WEEKLY
    ),
    QUIZ_FIRST_CLASH(
        title = "Quiz Challenger",
        subtitle = "Completed your first interactive Quiz Clash",
        criteria = "Complete 1 quiz",
        category = BadgeCategory.QUIZ
    ),
    LIVE_QUIZ_HIGH_SCORE(
        title = "Live Quiz Ace",
        subtitle = "Hit 1,000+ points in a Live or Blitz Quiz Clash",
        criteria = "Score 1,000+ quiz points",
        category = BadgeCategory.QUIZ
    ),
    QUIZ_PERFECT_ROUND(
        title = "Sharpshooter",
        subtitle = "Achieved 90%+ accuracy in a quiz round",
        criteria = "Reach 90%+ quiz accuracy",
        category = BadgeCategory.QUIZ
    ),
    CLUB_HOST_PRO(
        title = "Club Host",
        subtitle = "Hosted a live Kahoot-style quiz room for friends",
        criteria = "Host 1 live quiz room",
        category = BadgeCategory.QUIZ
    ),
    AUDIOBOOK_LISTENER(
        title = "Story Listener",
        subtitle = "Finished an interactive audiobook chapter",
        criteria = "Complete 1 audiobook chapter",
        category = BadgeCategory.CLUB
    ),
    STAGE_SPEAKER(
        title = "Stage Speaker",
        subtitle = "Performed on the Roleplay Stage or voice coach",
        criteria = "Complete 1 roleplay or speech review",
        category = BadgeCategory.CLUB
    ),
    ARCADE_CHALLENGER(
        title = "Arcade Player",
        subtitle = "Completed a game in the Interactive Arcade",
        criteria = "Finish 1 Arcade game round",
        category = BadgeCategory.CLUB
    ),
    COMBO_STREAKER(
        title = "Combo Streak 5x",
        subtitle = "Hit a 5+ word combo streak in an arcade game",
        criteria = "Reach 5x combo in Arcade",
        category = BadgeCategory.QUIZ
    );

    companion object {
        fun fromRaw(raw: String?): LingoBadge? =
            entries.firstOrNull { it.name == raw }
    }
}

object BadgeEngine {
    fun computeNewBadges(
        existingIds: Collection<String>,
        sessionsCompleted: Long,
        weeklyWordsMastered: Long,
        quizzesPlayed: Long,
        quizzesHosted: Long,
        bestLiveQuizScore: Long,
        latestQuizAccuracyPct: Long = 0L,
        audiobooksFinished: Long = 0L,
        roleplayCompleted: Boolean = false,
        arcadePlayed: Boolean = false,
        highCombo: Int = 0
    ): List<LingoBadge> {
        val candidates = buildList {
            if (sessionsCompleted >= 1L) add(LingoBadge.FIRST_WEEKLY_SESSION)
            if (sessionsCompleted >= 3L) add(LingoBadge.THREE_WEEKLY_SESSIONS)
            if (weeklyWordsMastered >= 50L) add(LingoBadge.WEEKLY_WORDS_50)
            if (weeklyWordsMastered >= 200L) add(LingoBadge.WEEKLY_WORDS_200)
            if (quizzesPlayed >= 1L) add(LingoBadge.QUIZ_FIRST_CLASH)
            if (bestLiveQuizScore >= 1000L) add(LingoBadge.LIVE_QUIZ_HIGH_SCORE)
            if (quizzesPlayed >= 1L && latestQuizAccuracyPct >= 90L) add(LingoBadge.QUIZ_PERFECT_ROUND)
            if (quizzesHosted >= 1L) add(LingoBadge.CLUB_HOST_PRO)
            if (audiobooksFinished >= 1L) add(LingoBadge.AUDIOBOOK_LISTENER)
            if (roleplayCompleted) add(LingoBadge.STAGE_SPEAKER)
            if (arcadePlayed) add(LingoBadge.ARCADE_CHALLENGER)
            if (highCombo >= 5) add(LingoBadge.COMBO_STREAKER)
        }
        return candidates.filter { it.name !in existingIds }
    }
}

// --- Team & Tutor-Student Chat ---

enum class ChatSenderRole(val label: String) {
    ADMIN("Tutor"),
    TEACHER("Tutor"),
    PLAYER("Student");

    companion object {
        fun fromRaw(raw: String?): ChatSenderRole =
            entries.firstOrNull { it.name == raw } ?: PLAYER
    }
}

enum class TeamChannelKind(val label: String) {
    TEACHER_HUB("Tutor <-> Teams"),
    TEAM("Squad Channel");

    companion object {
        fun fromRaw(raw: String?): TeamChannelKind =
            entries.firstOrNull { it.name == raw } ?: TEAM
    }
}

@Keep
@IgnoreExtraProperties
data class TeamChannel(
    @DocumentId val id: String = "",
    val visibility: String = "CLUB",
    val name: String = "",
    val cefrLevel: String = CefrLevel.B2.name,
    val motto: String = "",
    val accentColor: String = "INDIGO",
    val leaderUid: String = "",
    val leaderName: String = "",
    val channelKind: String = TeamChannelKind.TEAM.name,
    val memberCount: Long = 1L,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class ChatMessage(
    @DocumentId val id: String = "",
    val teamId: String = "",
    val senderUid: String = "",
    val senderName: String = "",
    val senderTeamName: String = "",
    val senderRole: String = ChatSenderRole.PLAYER.name,
    val text: String = "",
    val pinned: Boolean = false,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

// --- Shared Club Content ---

enum class ClubContentType(val label: String) {
    QUIZ("Quiz"),
    PUZZLE("Puzzle"),
    DECK("Flashcards"),
    ROLEPLAY("Roleplay"),
    WEEKLY_PACK("Weekly Pack"),
    ANNOUNCEMENT("Announcement");

    companion object {
        fun fromRaw(raw: String?): ClubContentType =
            entries.firstOrNull { it.name == raw } ?: ANNOUNCEMENT
    }
}

enum class ClubPuzzleKind(val label: String) {
    SCRAMBLE("Sentence Scramble"),
    GAP_FILL("Fill the Gap"),
    MATCH("Collocation Match");

    companion object {
        fun fromRaw(raw: String?): ClubPuzzleKind =
            entries.firstOrNull { it.name == raw } ?: SCRAMBLE
    }
}

@Keep
@IgnoreExtraProperties
data class ClubVocabItem(
    val word: String = "",
    val arabic: String = "",
    val meaning: String = "",
    val storyLine: String = ""
) {
    fun toMap(): Map<String, Any> = mapOf(
        "word" to word,
        "arabic" to arabic,
        "meaning" to meaning,
        "storyLine" to storyLine
    )
}

@Keep
@IgnoreExtraProperties
data class ClubContentItem(
    @DocumentId val id: String = "",
    val visibility: String = "CLUB",
    val authorUid: String = "",
    val authorName: String = "",
    val contentType: String = ClubContentType.ANNOUNCEMENT.name,
    val title: String = "",
    val description: String = "",
    val cefrLevel: String = CefrLevel.B2.name,
    val topic: String = "",
    val puzzleKind: String = "",
    val tokens: List<String> = emptyList(),
    val clozeBefore: String = "",
    val clozeAfter: String = "",
    val clozeAnswer: String = "",
    val clozeOptions: List<String> = emptyList(),
    val matchPairs: List<String> = emptyList(),
    val questions: List<QuizQuestionItem> = emptyList(),
    val cards: List<FlashcardItem> = emptyList(),
    val roleAName: String = "",
    val roleBName: String = "",
    val goal: String = "",
    val lines: List<RoleplayLine> = emptyList(),
    val plotTwists: List<String> = emptyList(),
    val weekNumber: Long = 0L,
    val sessionNumber: Long = 0L,
    val vocabWords: List<ClubVocabItem> = emptyList(),
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)



