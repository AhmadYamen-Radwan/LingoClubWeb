package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.data.model.ActivityType
import com.example.data.model.BadgeEngine
import com.example.data.model.CefrLevel
import com.example.data.model.LingoBadge
import com.example.data.model.StudentActivitySummary
import com.example.data.model.TutorClassSummary
import com.example.data.model.TutorStudentProgress
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

  @Test
  fun `read string from context`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val appName = context.getString(R.string.app_name)
    assertEquals("LingoClub", appName)
    assertEquals("ENGLISH CLUB STUDIO", context.getString(R.string.auth_badge_english_studio))
  }

  @Test
  fun `badge engine awards weekly session and word milestones`() {
    val badges = BadgeEngine.computeNewBadges(
      existingIds = emptyList(),
      sessionsCompleted = 3L,
      weeklyWordsMastered = 200L,
      quizzesPlayed = 0L,
      quizzesHosted = 0L,
      bestLiveQuizScore = 0L
    )
    assertTrue(LingoBadge.FIRST_WEEKLY_SESSION in badges)
    assertTrue(LingoBadge.THREE_WEEKLY_SESSIONS in badges)
    assertTrue(LingoBadge.WEEKLY_WORDS_50 in badges)
    assertTrue(LingoBadge.WEEKLY_WORDS_200 in badges)
  }

  @Test
  fun `badge engine awards live quiz high score accuracy and deduplicates existing`() {
    val badges = BadgeEngine.computeNewBadges(
      existingIds = listOf(LingoBadge.QUIZ_FIRST_CLASH.name),
      sessionsCompleted = 1L,
      weeklyWordsMastered = 10L,
      quizzesPlayed = 2L,
      quizzesHosted = 1L,
      bestLiveQuizScore = 1450L,
      latestQuizAccuracyPct = 95L,
      audiobooksFinished = 1L,
      roleplayCompleted = true
    )
    assertTrue(LingoBadge.QUIZ_FIRST_CLASH !in badges)
    assertTrue(LingoBadge.LIVE_QUIZ_HIGH_SCORE in badges)
    assertTrue(LingoBadge.QUIZ_PERFECT_ROUND in badges)
    assertTrue(LingoBadge.CLUB_HOST_PRO in badges)
    assertTrue(LingoBadge.FIRST_WEEKLY_SESSION in badges)
    assertTrue(LingoBadge.AUDIOBOOK_LISTENER in badges)
    assertTrue(LingoBadge.STAGE_SPEAKER in badges)
  }

  @Test
  fun `tutor class summary aggregates student metrics accurately`() {
    val emptySummary = TutorClassSummary.fromStudents(emptyList())
    assertEquals(0, emptySummary.totalStudents)
    assertEquals(0L, emptySummary.totalXp)
    assertEquals(0L, emptySummary.averageBestQuizScore)

    val students = listOf(
      TutorStudentProgress(
        studentUid = "s1",
        studentName = "Ali",
        xp = 450L,
        weeklyWordsMastered = 80L,
        sessionsCompleted = 3L,
        bestLiveQuizScore = 1200L
      ),
      TutorStudentProgress(
        studentUid = "s2",
        studentName = "Sara",
        xp = 650L,
        weeklyWordsMastered = 120L,
        sessionsCompleted = 5L,
        bestLiveQuizScore = 1600L
      )
    )
    val summary = TutorClassSummary.fromStudents(students)
    assertEquals(2, summary.totalStudents)
    assertEquals(1100L, summary.totalXp)
    assertEquals(200L, summary.totalWeeklyWords)
    assertEquals(8L, summary.totalSessionsCompleted)
    assertEquals(1400L, summary.averageBestQuizScore)
  }

  @Test
  fun `student activity summary clamps bounds in map`() {
    val summary = StudentActivitySummary(
      title = "Flashcard Study: Travel Idioms",
      activityType = ActivityType.CARDS.name,
      cefrLevel = CefrLevel.B2.name,
      score = 45L,
      accuracyPct = 120L,
      wordsPracticed = 250L
    )
    val map = summary.toMap()
    assertEquals("Flashcard Study: Travel Idioms", map["title"])
    assertEquals("CARDS", map["activityType"])
    assertEquals("B2", map["cefrLevel"])
    assertEquals(45L, map["score"])
    assertEquals(100L, map["accuracyPct"])
    assertEquals(200L, map["wordsPracticed"])
  }
}
