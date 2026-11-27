package com.example

import android.content.Context
import androidx.compose.ui.graphics.Color
import androidx.test.core.app.ApplicationProvider
import com.example.data.content.ArabicWordGlossary
import com.example.data.model.CefrLevel
import com.example.data.model.ChatSenderRole
import com.example.data.model.QuizQuestionItem
import com.example.data.model.RoomStatus
import com.example.data.offline.OfflineLocalStore
import com.example.data.offline.TetheringHubManager
import com.example.data.offline.TetheringRole
import com.example.ui.GameViewModel
import com.example.ui.components.buildTranslatableAnnotatedText
import com.example.ui.screens.prepareDynamicQuizQuestions
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class GameAndOfflineFeaturesTest {

    @Test
    fun `arabic glossary resolves exact words stemmed inflections and filters stop words`() {
        val detective = ArabicWordGlossary.lookup("detective")
        assertNotNull(detective)
        assertEquals("محقق", detective?.arabic)

        val alibi = ArabicWordGlossary.lookup("Alibi,")
        assertNotNull(alibi)
        assertEquals("عذر غياب / ذريعة", alibi?.arabic)

        // Stemmed inflections (-s, -ed)
        val pluralDetectives = ArabicWordGlossary.lookup("detectives")
        assertNotNull(pluralDetectives)
        assertEquals("محقق", pluralDetectives?.arabic)

        val forged = ArabicWordGlossary.lookup("forged")
        assertNotNull(forged)
        assertFalse(forged!!.arabic.isBlank())

        // Stop words must NOT be underlined/translated unnecessarily
        assertNull(ArabicWordGlossary.lookup("the"))
        assertNull(ArabicWordGlossary.lookup("is"))
        assertNull(ArabicWordGlossary.lookup("and"))
    }

    @Test
    fun `translatable annotated text underlines only recognized vocabulary words`() {
        val sentence = "The detective found an alibi near the vault."
        val (annotated, matches) = buildTranslatableAnnotatedText(sentence, Color.Blue)

        assertEquals(sentence, annotated.text)
        assertTrue(matches.values.any { it.word.equals("detective", ignoreCase = true) })
        assertTrue(matches.values.any { it.word.equals("alibi", ignoreCase = true) })
        assertTrue(matches.values.any { it.word.equals("vault", ignoreCase = true) })
        assertFalse(matches.values.any { it.word.equals("the", ignoreCase = true) })

        val spans = annotated.getStringAnnotations(tag = "AR_WORD", start = 0, end = annotated.length)
        assertEquals(matches.size, spans.size)
    }

    @Test
    fun `prepareDynamicQuizQuestions shuffles options while preserving correct answer`() {
        val source = listOf(
            QuizQuestionItem(
                prompt = "Who left the forged signature?",
                options = listOf("Archivist", "Baker", "Pilot", "Chef"),
                correctIndex = 0L,
                tip = "Match original index 0"
            ),
            QuizQuestionItem(
                prompt = "What is an alibi?",
                options = listOf("Poison", "Proof of absence", "Locked safe", "Diamond"),
                correctIndex = 1L,
                tip = "Match original index 1"
            )
        )

        repeat(10) {
            val prepared = prepareDynamicQuizQuestions(source)
            assertEquals(2, prepared.size)
            val q1 = prepared.first { it.prompt == "Who left the forged signature?" }
            val q2 = prepared.first { it.prompt == "What is an alibi?" }
            assertEquals("Archivist", q1.options[q1.correctIndex.toInt()])
            assertEquals("Proof of absence", q2.options[q2.correctIndex.toInt()])
        }
    }

    @Test
    fun `offline local store persists profile xp pinned evidence scores and teams`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val uid = "test_offline_user_${System.currentTimeMillis()}"
        val store = OfflineLocalStore(
            context = context,
            userId = uid,
            defaultDisplayName = "Nadia"
        )

        assertEquals("Nadia", store.profileFlow.value?.displayName)

        store.awardProgress(xpDelta = 120L, quizzesPlayedDelta = 1L, bestLiveQuizScoreCandidate = 980L)
        store.togglePinEvidence("ev_cipher_01", pinned = true)
        store.publishScoreRecord(
            playerName = "Nadia",
            quizTitle = "Museum Mystery",
            cefrLevel = CefrLevel.B2,
            score = 980L,
            accuracyPct = 90L,
            streak = 3L,
            gameMode = "SOLO"
        )
        val createdTeam = store.createOfflineTeam(
            name = "Detective Squad",
            cefrLevel = CefrLevel.B1,
            motto = "Solve together",
            accentColor = "INDIGO",
            isTeacherHub = false
        )

        // Re-instantiate store for the same userId to verify SharedPreferences durability
        val reloaded = OfflineLocalStore(
            context = context,
            userId = uid,
            defaultDisplayName = "Fallback"
        )
        val profile = reloaded.profileFlow.value
        assertNotNull(profile)
        assertEquals(120L, profile?.xp)
        assertEquals(980L, profile?.bestLiveQuizScore)
        assertTrue("ev_cipher_01" in profile?.pinnedEvidenceIds.orEmpty())
        assertTrue(reloaded.scoresFlow.value.any { it.quizTitle == "Museum Mystery" && it.score == 980L })
        assertTrue(reloaded.teamsFlow.value.any { it.id == createdTeam.id && it.name == "Detective Squad" })
    }

    @Test
    fun `tethering hub manager forms local squad exchanges chat and syncs live quiz over TCP`() = runBlocking {
        val hostHub = TetheringHubManager(context = null)
        val peerHub = TetheringHubManager(context = null)
        try {
            val team = hostHub.hostHotspotTeam(
                teamName = "Offline Hotspot Detectives",
                hostUid = "host_1",
                hostName = "HostLayla",
                cefrLevel = CefrLevel.B1,
                motto = "Zero internet trivia"
            )
            val hostState = hostHub.state.value
            assertEquals(TetheringRole.HOST, hostState.role)
            assertEquals(team.id, hostState.activeTeam?.id)

            peerHub.joinHotspotHost(
                hostIp = "127.0.0.1",
                port = hostState.hostPort,
                peerUid = "peer_1",
                peerName = "PeerOmar",
                avatarColor = "CORAL",
                teamCode = hostState.teamCode
            )

            // Wait briefly for loopback TCP handshake
            var connected = false
            repeat(30) {
                if (peerHub.state.value.role == TetheringRole.PEER &&
                    peerHub.state.value.activeTeam?.id == team.id
                ) {
                    connected = true
                    return@repeat
                }
                delay(50)
            }
            assertTrue("Peer should join host hotspot squad", connected)
            assertTrue(hostHub.state.value.connectedPeers.any { it.uid == "peer_1" })

            // Exchange squad chat message
            peerHub.sendSquadMessage(
                senderUid = "peer_1",
                senderName = "PeerOmar",
                senderRole = ChatSenderRole.PLAYER,
                text = "Ready for clue #1!"
            )
            var chatSynced = false
            repeat(30) {
                if (hostHub.state.value.messages.any { it.text == "Ready for clue #1!" } &&
                    peerHub.state.value.messages.any { it.text == "Ready for clue #1!" }
                ) {
                    chatSynced = true
                    return@repeat
                }
                delay(50)
            }
            assertTrue("Squad chat should sync bidirectionally", chatSynced)

            // Host starts and advances live hotspot quiz
            val questions = listOf(
                QuizQuestionItem(
                    prompt = "What means proof a suspect was elsewhere?",
                    options = listOf("Alibi", "Vault", "Goblet", "Mud"),
                    correctIndex = 0L
                )
            )
            val room = hostHub.startHotspotLiveQuiz(
                hostUid = "host_1",
                hostName = "HostLayla",
                quizTitle = "Hotspot Crime Trivia",
                cefrLevel = CefrLevel.B1,
                questions = questions
            )
            assertNotNull(room)
            hostHub.advanceHotspotLiveQuiz() // LOBBY -> QUESTION

            var peerSawQuestion = false
            repeat(30) {
                if (peerHub.state.value.liveRoom?.status == RoomStatus.QUESTION.name) {
                    peerSawQuestion = true
                    return@repeat
                }
                delay(50)
            }
            assertTrue("Peer should receive QUESTION state from host", peerSawQuestion)

            // Peer submits answer and host updates leaderboard
            peerHub.submitHotspotQuizAnswer(
                playerUid = "peer_1",
                playerName = "PeerOmar",
                avatarColor = "CORAL",
                questionIndex = 0,
                selectedIndex = 0,
                correct = true,
                pointsEarned = 950L,
                newScore = 950L,
                newStreak = 1L
            )
            var scoreSynced = false
            repeat(30) {
                if (hostHub.state.value.roomPlayers.any { it.playerUid == "peer_1" && it.score == 950L }) {
                    scoreSynced = true
                    return@repeat
                }
                delay(50)
            }
            assertTrue("Host should record peer quiz answer score", scoreSynced)
        } finally {
            peerHub.shutdown()
            hostHub.shutdown()
        }
    }

    @Test
    fun `game viewmodel scoring and adaptive difficulty progress appropriately`() {
        assertEquals(0L, GameViewModel.computeQuizPointsEarned(isCorrect = false, remainingRatio = 1f, newStreak = 3L))
        val fastPoints = GameViewModel.computeQuizPointsEarned(isCorrect = true, remainingRatio = 1f, newStreak = 2L)
        val slowPoints = GameViewModel.computeQuizPointsEarned(isCorrect = true, remainingRatio = 0f, newStreak = 1L)
        assertEquals(1100L, fastPoints)
        assertEquals(550L, slowPoints)

        // Streak >= 3 cleanly advances CEFR tier
        assertEquals(
            CefrLevel.B2,
            GameViewModel.computeAdaptiveDifficulty(CefrLevel.B1, currentStreak = 3, solvedCleanly = true)
        )
        // Failure with 0 streak lowers CEFR tier safely
        assertEquals(
            CefrLevel.A2,
            GameViewModel.computeAdaptiveDifficulty(CefrLevel.B1, currentStreak = 0, solvedCleanly = false)
        )
        // Does not underflow A1 or overflow B2
        assertEquals(
            CefrLevel.A1,
            GameViewModel.computeAdaptiveDifficulty(CefrLevel.A1, currentStreak = 0, solvedCleanly = false)
        )
        assertEquals(
            CefrLevel.B2,
            GameViewModel.computeAdaptiveDifficulty(CefrLevel.B2, currentStreak = 4, solvedCleanly = true)
        )
    }
}
