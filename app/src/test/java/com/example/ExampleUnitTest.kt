package com.example

import com.example.data.model.BadgeEngine
import com.example.data.model.LingoBadge
import com.example.data.model.RoomMessageType
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ExampleUnitTest {
    @Test
    fun badgeEngine_unlocksArcadeAndComboBadges() {
        val unlocked = BadgeEngine.computeNewBadges(
            existingIds = emptyList(),
            sessionsCompleted = 0L,
            weeklyWordsMastered = 0L,
            quizzesPlayed = 0L,
            quizzesHosted = 0L,
            bestLiveQuizScore = 0L,
            arcadePlayed = true,
            highCombo = 5
        )
        assertTrue(LingoBadge.ARCADE_CHALLENGER in unlocked)
        assertTrue(LingoBadge.COMBO_STREAKER in unlocked)
    }

    @Test
    fun badgeEngine_skipsAlreadyEarnedBadges() {
        val unlocked = BadgeEngine.computeNewBadges(
            existingIds = listOf(LingoBadge.ARCADE_CHALLENGER.name),
            sessionsCompleted = 0L,
            weeklyWordsMastered = 0L,
            quizzesPlayed = 0L,
            quizzesHosted = 0L,
            bestLiveQuizScore = 0L,
            arcadePlayed = true,
            highCombo = 3
        )
        assertFalse(LingoBadge.ARCADE_CHALLENGER in unlocked)
        assertFalse(LingoBadge.COMBO_STREAKER in unlocked)
    }

    @Test
    fun roomMessageType_defaultsSafelyToText() {
        assertEquals(RoomMessageType.REACTION, RoomMessageType.fromRaw("REACTION"))
        assertEquals(RoomMessageType.TEXT, RoomMessageType.fromRaw("UNKNOWN"))
    }
}
