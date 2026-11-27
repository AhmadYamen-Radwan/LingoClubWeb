package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Casino
import androidx.compose.material.icons.filled.Extension
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.TheaterComedy
import com.example.data.model.EvidenceCard
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.CefrLevel
import com.example.data.model.ChatMessage
import com.example.data.model.TeamChannel
import com.example.ui.UiState
import com.example.ui.components.CelebrationConfettiBurst
import com.example.ui.components.CefrFilterRow
import com.example.ui.components.InGameChatActionButton
import com.example.ui.components.InGameSquadChatSheet
import com.example.ui.components.Trophy3DFigure
import com.example.ui.theme.AmberAccent
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.CoralSecondary
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoPrimary
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft
import com.example.ui.theme.MintTertiary
import kotlinx.coroutines.launch
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

enum class ArcadeMode(val label: String, val icon: ImageVector) {
    WORD_DASH("Word Dash", Icons.Filled.Bolt),
    DETECTIVE("Word Detective", Icons.Filled.Search),
    CRIME_MYSTERY("Crime Mystery", Icons.Filled.Security),
    EVIDENCE_BOARD("Evidence Board", Icons.Filled.PushPin),
    VAULT_CODEBREAKER("Vault Cracker", Icons.Filled.LockOpen),
    SPEED_DUEL("Speed Duel", Icons.Filled.Speed),
    MEMORY_3D("3D Memory", Icons.Filled.GridView),
    SPIN_WHEEL("Spin Wheel", Icons.Filled.Casino)
}

val CURATED_EVIDENCE_CARDS = listOf(
    EvidenceCard(
        id = "ev_library_catalog",
        title = "Torn Catalog Card",
        category = "Documents",
        description = "15th-century index card with a forged archival seal found near the unlocked display case.",
        englishClue = "The date stamp is missing an official watermark.",
        arabicMeaning = "بطاقة فهرسة ممزقة بخاتم مزيف",
        cefrLevel = CefrLevel.B1
    ),
    EvidenceCard(
        id = "ev_wirecutters",
        title = "Velvet Handbag with Cutters",
        category = "Tools",
        description = "Jeweler's wire cutters with blue diamond dust traces found under passenger seat 4B.",
        englishClue = "The steel blades match the severed security wire.",
        arabicMeaning = "حقيبة مخملية بداخلها قواطع أسلاك مجوهرات",
        cefrLevel = CefrLevel.B2
    ),
    EvidenceCard(
        id = "ev_oil_smudge",
        title = "Cobalt Blue Pigment Smudge",
        category = "Forensics",
        description = "Freshly mixed oil paint residue on an assistant curator's rubber gloves.",
        englishClue = "The pigment was synthesized only two days ago.",
        arabicMeaning = "بقعة طلاء زيتي أزرق كوبالت حديث التحضير",
        cefrLevel = CefrLevel.A2
    ),
    EvidenceCard(
        id = "ev_poison_goblet",
        title = "Antique Goblet Cyanide Trace",
        category = "Tox-Screen",
        description = "Crystalline residue smelling of bitter almonds inside the lord's locked library.",
        englishClue = "A lethal dose of cyanide dissolved in vintage port.",
        arabicMeaning = "بقايا سم السيانيد داخل كأس نبيذ عتيق",
        cefrLevel = CefrLevel.B2
    ),
    EvidenceCard(
        id = "ev_thermal_lance",
        title = "Thermal Lance Cutting Tip",
        category = "Burglary Tools",
        description = "An ultra-high temperature gas torch nozzle found discarded in the bank ventilation shaft.",
        englishClue = "Used to melt the six-inch vault hinges silently.",
        arabicMeaning = "فوهة شعلة حرارية لصهر مفصلات الخزينة",
        cefrLevel = CefrLevel.B1
    ),
    EvidenceCard(
        id = "ev_grappling_hook",
        title = "Titanium Grappling Hook",
        category = "Infiltration",
        description = "Silenced rope climber equipment found coiled on the Tower parapet.",
        englishClue = "Allowed the cat burglar to rappel from the roof.",
        arabicMeaning = "خطاف تسلق تيتانيوم صامت للهبوط من السطح",
        cefrLevel = CefrLevel.B2
    ),
    EvidenceCard(
        id = "ev_crypto_ledger",
        title = "Encrypted Cold Storage Token",
        category = "Cyber",
        description = "USB hardware security key loaded with an unauthorized transaction script at 3:14 AM.",
        englishClue = "The cryptographic signature traces to the engineer's laptop.",
        arabicMeaning = "مفتاح أمان مشفر يحتوي على أمر تحويل رقمي",
        cefrLevel = CefrLevel.B1
    ),
    EvidenceCard(
        id = "ev_tincture_bottle",
        title = "Disguised Perfume Vial",
        category = "Smuggling",
        description = "Vintage atomizer containing concentrated cardiac neurotoxin rather than lavender.",
        englishClue = "Concealed in a locked dresser compartment on Deck 3.",
        arabicMeaning = "قارورة عطر مموهة تحوي مادة سامة للقلب",
        cefrLevel = CefrLevel.B2
    )
)

private data class WheelChallengeSlice(
    val shortLabel: String,
    val title: String,
    val challengePrompt: String,
    val bonusXp: Long,
    val color: Color,
    val actionTarget: String // "QUIZ", "ROLEPLAY", "PUZZLE", "NONE"
)

private val WHEEL_SLICES = listOf(
    WheelChallengeSlice(
        shortLabel = "+25 XP",
        title = "Say 3 Daily Sentences",
        challengePrompt = "Speak or type 3 sentences about your day in Squad Chat for +25 XP!",
        bonusXp = 25L,
        color = IndigoPrimary,
        actionTarget = "NONE"
    ),
    WheelChallengeSlice(
        shortLabel = "Quiz!",
        title = "Lightning Quiz Bonus",
        challengePrompt = "Launch Quiz Clash and try a 5-question round in English!",
        bonusXp = 30L,
        color = CoralSecondary,
        actionTarget = "QUIZ"
    ),
    WheelChallengeSlice(
        shortLabel = "Idiom",
        title = "Arabic ↔ English Swap",
        challengePrompt = "Share your favorite English idiom and its Arabic meaning with your squad!",
        bonusXp = 20L,
        color = MintTertiary,
        actionTarget = "NONE"
    ),
    WheelChallengeSlice(
        shortLabel = "Stage!",
        title = "Roleplay Twist Challenge",
        challengePrompt = "Act out a 2-minute café or airport scene with a plot twist!",
        bonusXp = 35L,
        color = AmberAccent,
        actionTarget = "ROLEPLAY"
    ),
    WheelChallengeSlice(
        shortLabel = "+45 XP",
        title = "Jackpot Vocab Sprint",
        challengePrompt = "Awesome spin! You unlocked +45 bonus XP — keep your combo streak alive!",
        bonusXp = 45L,
        color = Color(0xFF7C3AED),
        actionTarget = "NONE"
    ),
    WheelChallengeSlice(
        shortLabel = "Forge!",
        title = "Sentence Scramble Run",
        challengePrompt = "Solve two sentence scrambles or collocation matches in Word Forge!",
        bonusXp = 25L,
        color = Color(0xFF0284C7),
        actionTarget = "PUZZLE"
    ),
    WheelChallengeSlice(
        shortLabel = "Voice",
        title = "Pronunciation Spotlight",
        challengePrompt = "Pick 3 words from your level and read them aloud using TTS!",
        bonusXp = 20L,
        color = Color(0xFF059669),
        actionTarget = "NONE"
    ),
    WheelChallengeSlice(
        shortLabel = "+35 XP",
        title = "Team Cheer Boost",
        challengePrompt = "Drop an encouraging English message in Squad Chat to rally your team!",
        bonusXp = 35L,
        color = Color(0xFFDB2777),
        actionTarget = "NONE"
    )
)

@Composable
fun GamesArcadeScreen(
    selectedLevel: CefrLevel? = null,
    onSelectLevel: (CefrLevel?) -> Unit = {},
    initialMode: ArcadeMode = ArcadeMode.WORD_DASH,
    teamsState: UiState<List<TeamChannel>> = UiState.Success(emptyList()),
    selectedTeamId: String = "",
    messagesState: UiState<List<ChatMessage>> = UiState.Success(emptyList()),
    currentUserId: String = "",
    onSelectChannel: (String) -> Unit = {},
    onSendTeamMessage: (TeamChannel, String) -> Unit = { _, _ -> },
    onOpenChatTab: (() -> Unit)? = null,
    onRecordArcadeResult: (
        gameTitle: String,
        level: CefrLevel,
        scoreXp: Long,
        accuracyPct: Long,
        wordsPracticed: Int,
        maxCombo: Int
    ) -> Unit,
    onNavigateQuiz: () -> Unit = {},
    onNavigateRoleplay: () -> Unit = {},
    onNavigatePuzzles: () -> Unit = {},
    pinnedEvidenceIds: Set<String> = emptySet(),
    onTogglePinEvidence: (String, Boolean) -> Unit = { _, _ -> },
    onAwardXp: (Long) -> Unit = {},
    onBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var mode by remember(initialMode) { mutableStateOf(initialMode) }
    var showSquadChat by remember { mutableStateOf(false) }
    var latestShoutout by remember { mutableStateOf<String?>(null) }

    val wordPool = remember(selectedLevel) { buildArcadeWordPool(selectedLevel) }
    val activeLevel = selectedLevel ?: CefrLevel.B1
    val teamMessageCount = (messagesState as? UiState.Success)?.data?.size ?: 0

    fun openChatWithShoutout(message: String) {
        latestShoutout = message
        showSquadChat = true
    }

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.TopCenter
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .widthIn(max = 780.dp),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (onBack != null) {
                        IconButton(
                            onClick = onBack,
                            modifier = Modifier
                                .size(48.dp)
                                .testTag("arcade_back_button")
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Game Arcade",
                            style = MaterialTheme.typography.displaySmall
                        )
                        Text(
                            text = "Fast vocabulary blitz, detective clues, 3D flips & spin wheel",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    InGameChatActionButton(
                        messageCount = teamMessageCount,
                        label = "Squad",
                        onClick = { showSquadChat = true }
                    )
                }
            }

            item {
                CefrFilterRow(
                    selectedLevel = selectedLevel,
                    onSelectLevel = onSelectLevel,
                    tagPrefix = "arcade"
                )
            }

            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ArcadeMode.entries.forEach { entry ->
                        FilterChip(
                            selected = mode == entry,
                            onClick = { mode = entry },
                            leadingIcon = {
                                Icon(
                                    imageVector = entry.icon,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                            },
                            label = { Text(entry.label) },
                            modifier = Modifier.testTag("arcade_mode_${entry.name.lowercase()}")
                        )
                    }
                }
            }

            item {
                when (mode) {
                    ArcadeMode.WORD_DASH -> WordDashBlitzGame(
                        words = wordPool,
                        selectedLevel = selectedLevel,
                        onShareScore = ::openChatWithShoutout,
                        onFinished = { xp, acc, count, combo ->
                            latestShoutout = "⚡ Scored +$xp XP ($acc% accuracy, ${combo}x combo) in Word Dash Blitz!"
                            onRecordArcadeResult("Word Dash Blitz", activeLevel, xp, acc, count, combo)
                        }
                    )
                    ArcadeMode.DETECTIVE -> WordDetectiveGame(
                        words = wordPool,
                        selectedLevel = selectedLevel,
                        onShareScore = ::openChatWithShoutout,
                        onFinished = { xp, acc, count, combo ->
                            latestShoutout = "🕵️ Solved a mystery word (+$xp XP) in Word Detective!"
                            onRecordArcadeResult("Word Detective", activeLevel, xp, acc, count, combo)
                        }
                    )
                    ArcadeMode.MEMORY_3D -> MemoryFlip3DGame(
                        words = wordPool,
                        selectedLevel = selectedLevel,
                        onShareScore = ::openChatWithShoutout,
                        onFinished = { xp, acc, count, combo ->
                            latestShoutout = "🧠 Cleared the 3D Memory Flip Arena (+$xp XP)!"
                            onRecordArcadeResult("3D Memory Flip", activeLevel, xp, acc, count, combo)
                        }
                    )
                    ArcadeMode.SPIN_WHEEL -> SpinChallengeWheelGame(
                        onShareChallenge = ::openChatWithShoutout,
                        onClaimSpinReward = { slice ->
                            latestShoutout = "🎡 Spun '${slice.title}' (+${slice.bonusXp} XP) on the LingoClub Wheel!"
                            onRecordArcadeResult(
                                "Spin & Challenge: ${slice.title}",
                                activeLevel,
                                slice.bonusXp,
                                100L,
                                3,
                                1
                            )
                        },
                        onLaunchTarget = { target ->
                            when (target) {
                                "QUIZ" -> onNavigateQuiz()
                                "ROLEPLAY" -> onNavigateRoleplay()
                                "PUZZLE" -> onNavigatePuzzles()
                            }
                        }
                    )
                    ArcadeMode.CRIME_MYSTERY -> CrimeMysteryGame(
                        selectedLevel = selectedLevel,
                        onShareScore = ::openChatWithShoutout,
                        onFinished = { xp, acc, count, combo ->
                            latestShoutout = "🔍 Solved a Crime Mystery case (+$xp XP)!"
                            onRecordArcadeResult("Crime Mystery", activeLevel, xp, acc, count, combo)
                        }
                    )
                    ArcadeMode.VAULT_CODEBREAKER -> VaultCodebreakerGame(
                        words = wordPool,
                        selectedLevel = selectedLevel,
                        onShareScore = ::openChatWithShoutout,
                        onFinished = { xp, acc, count, combo ->
                            latestShoutout = "🔐 Cracked the Vault Cipher (+$xp XP)!"
                            onRecordArcadeResult("Vault Codebreaker", activeLevel, xp, acc, count, combo)
                        }
                    )
                    ArcadeMode.SPEED_DUEL -> MysteryOddOneSpeedDuelGame(
                        words = wordPool,
                        selectedLevel = selectedLevel,
                        onShareScore = ::openChatWithShoutout,
                        onFinished = { xp, acc, count, combo ->
                            latestShoutout = "⚡ Won Mystery Speed Duel (+$xp XP, ${combo}x streak)!"
                            onRecordArcadeResult("Mystery Speed Duel", activeLevel, xp, acc, count, combo)
                        }
                    )
                    ArcadeMode.EVIDENCE_BOARD -> EvidenceBoardScreen(
                        evidenceList = CURATED_EVIDENCE_CARDS,
                        pinnedEvidenceIds = pinnedEvidenceIds,
                        selectedLevel = selectedLevel,
                        onSelectLevel = onSelectLevel,
                        onTogglePinEvidence = onTogglePinEvidence,
                        onAwardXp = { xp ->
                            onAwardXp(xp)
                            latestShoutout = "📌 Pinned evidence cards & connected the conspiracy (+${xp} XP) on Evidence Board!"
                        }
                    )
                }
            }

            item { Spacer(Modifier.height(16.dp)) }
        }
    }

    if (showSquadChat) {
        InGameSquadChatSheet(
            teamsState = teamsState,
            selectedTeamId = selectedTeamId,
            messagesState = messagesState,
            currentUserId = currentUserId,
            suggestedShoutout = latestShoutout,
            onSelectChannel = onSelectChannel,
            onSendMessage = onSendTeamMessage,
            onOpenFullChatTab = onOpenChatTab,
            onDismiss = { showSquadChat = false }
        )
    }
}

@Composable
private fun SpinChallengeWheelGame(
    onShareChallenge: (String) -> Unit,
    onClaimSpinReward: (WheelChallengeSlice) -> Unit,
    onLaunchTarget: (String) -> Unit
) {
    val scope = rememberCoroutineScope()
    val haptic = LocalHapticFeedback.current
    val textMeasurer = rememberTextMeasurer()

    val wheelRotation = remember { Animatable(0f) }
    var isSpinning by remember { mutableStateOf(false) }
    var landedSlice by remember { mutableStateOf<WheelChallengeSlice?>(null) }
    var spinCount by remember { mutableIntStateOf(0) }

    fun spinWheel() {
        if (isSpinning) return
        scope.launch {
            isSpinning = true
            landedSlice = null
            haptic.performHapticFeedback(HapticFeedbackType.LongPress)
            val sliceCount = WHEEL_SLICES.size
            val sliceAngle = 360f / sliceCount
            val chosenIndex = Random.nextInt(sliceCount)
            // Pointer sits at top (-90 deg / 270 deg).
            // Slice i occupies [i * sliceAngle, (i+1) * sliceAngle] before wheel rotation.
            // To place slice i's center at 270 deg: rot + midAngle == 270 (mod 360).
            val midAngle = chosenIndex * sliceAngle + sliceAngle / 2f
            val currentMod = ((wheelRotation.value % 360f) + 360f) % 360f
            val targetMod = ((270f - midAngle) % 360f + 360f) % 360f
            val deltaToTarget = ((targetMod - currentMod) + 360f) % 360f
            val extraTurns = 360f * (4 + Random.nextInt(2))
            val jitter = (Random.nextFloat() - 0.5f) * (sliceAngle * 0.45f)
            val destination = wheelRotation.value + extraTurns + deltaToTarget + jitter

            wheelRotation.animateTo(
                targetValue = destination,
                animationSpec = androidx.compose.animation.core.tween(
                    durationMillis = 3100,
                    easing = CubicBezierEasing(0.14f, 0.85f, 0.22f, 1f)
                )
            )
            val finalNorm = ((wheelRotation.value % 360f) + 360f) % 360f
            val angleUnderPointer = ((270f - finalNorm) % 360f + 360f) % 360f
            val actualIndex = (angleUnderPointer / sliceAngle).toInt().coerceIn(0, sliceCount - 1)
            val wonSlice = WHEEL_SLICES[actualIndex]
            landedSlice = wonSlice
            spinCount++
            isSpinning = false
            haptic.performHapticFeedback(HapticFeedbackType.LongPress)
            onClaimSpinReward(wonSlice)
        }
    }

    Box(modifier = Modifier.fillMaxWidth()) {
        Column(
            verticalArrangement = Arrangement.spacedBy(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Daily English Spin Wheel",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Spin for instant bonus XP and interactive club challenges!",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center
                    )

                    Box(
                        modifier = Modifier
                            .size(264.dp)
                            .clickable(enabled = !isSpinning) { spinWheel() }
                            .testTag("spin_wheel_canvas"),
                        contentAlignment = Alignment.Center
                    ) {
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val diameter = minOf(size.width, size.height) * 0.90f
                            val radius = diameter / 2f
                            val topLeft = Offset((size.width - diameter) / 2f, (size.height - diameter) / 2f + 8f)
                            val cx = size.width / 2f
                            val cy = topLeft.y + radius
                            val sliceAngle = 360f / WHEEL_SLICES.size
                            val rot = wheelRotation.value

                            // Outer ring shadow & frame
                            drawCircle(
                                color = Color(0xFF1E1B4B).copy(alpha = 0.20f),
                                radius = radius + 8f,
                                center = Offset(cx, cy + 4f)
                            )

                            WHEEL_SLICES.forEachIndexed { idx, slice ->
                                val startDeg = rot + idx * sliceAngle
                                drawArc(
                                    color = slice.color,
                                    startAngle = startDeg,
                                    sweepAngle = sliceAngle,
                                    useCenter = true,
                                    topLeft = topLeft,
                                    size = Size(diameter, diameter)
                                )
                                drawArc(
                                    color = Color.White.copy(alpha = 0.75f),
                                    startAngle = startDeg,
                                    sweepAngle = sliceAngle,
                                    useCenter = true,
                                    topLeft = topLeft,
                                    size = Size(diameter, diameter),
                                    style = Stroke(width = 3f)
                                )

                                // Label placed along slice bisector
                                val midRad = ((startDeg + sliceAngle / 2f) * PI / 180.0).toFloat()
                                val lx = cx + cos(midRad) * (radius * 0.64f)
                                val ly = cy + sin(midRad) * (radius * 0.64f)
                                val measured = textMeasurer.measure(
                                    text = slice.shortLabel,
                                    style = TextStyle(
                                        color = Color.White,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                )
                                drawText(
                                    textLayoutResult = measured,
                                    topLeft = Offset(
                                        lx - measured.size.width / 2f,
                                        ly - measured.size.height / 2f
                                    )
                                )
                            }

                            // Outer rim
                            drawCircle(
                                color = Color.White,
                                radius = radius,
                                center = Offset(cx, cy),
                                style = Stroke(width = 6f)
                            )

                            // Top pointer triangle
                            val pointerPath = Path().apply {
                                moveTo(cx, topLeft.y + 12f)
                                lineTo(cx - 14f, topLeft.y - 16f)
                                lineTo(cx + 14f, topLeft.y - 16f)
                                close()
                            }
                            drawPath(pointerPath, color = AmberAccent)
                            drawPath(pointerPath, color = Color.White, style = Stroke(width = 2.5f))
                        }

                        // Center hub button
                        Surface(
                            shape = CircleShape,
                            color = MaterialTheme.colorScheme.surface,
                            shadowElevation = 6.dp,
                            modifier = Modifier.size(60.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = if (isSpinning) "..." else "SPIN",
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }

                    Button(
                        onClick = { spinWheel() },
                        enabled = !isSpinning,
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .testTag("spin_wheel_button")
                    ) {
                        Icon(Icons.Filled.Casino, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text(if (isSpinning) "Spinning..." else "Spin the Wheel!")
                    }
                }
            }

            val prize = landedSlice
            AnimatedVisibility(visible = prize != null) {
                if (prize != null) {
                    Card(
                        shape = RoundedCornerShape(22.dp),
                        colors = CardDefaults.cardColors(containerColor = MintSoft),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Trophy3DFigure(size = 74.dp)
                            Surface(color = IndigoSoft, shape = RoundedCornerShape(99.dp)) {
                                Text(
                                    text = "+${prize.bonusXp} XP EARNED",
                                    color = IndigoOnSoft,
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.ExtraBold,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                                )
                            }
                            Text(
                                text = prize.title,
                                color = MintOnSoft,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                textAlign = TextAlign.Center
                            )
                            Text(
                                text = prize.challengePrompt,
                                color = MintOnSoft.copy(alpha = 0.88f),
                                style = MaterialTheme.typography.bodyMedium,
                                textAlign = TextAlign.Center
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                OutlinedButton(
                                    onClick = {
                                        onShareChallenge(
                                            "🎡 Wheel Challenge: ${prize.title} (+${prize.bonusXp} XP)! ${prize.challengePrompt}"
                                        )
                                    },
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Filled.Forum, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(Modifier.width(4.dp))
                                    Text("Share", maxLines = 1)
                                }
                                if (prize.actionTarget != "NONE") {
                                    Button(
                                        onClick = { onLaunchTarget(prize.actionTarget) },
                                        shape = RoundedCornerShape(12.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Icon(
                                            imageVector = when (prize.actionTarget) {
                                                "QUIZ" -> Icons.Filled.Bolt
                                                "ROLEPLAY" -> Icons.Filled.TheaterComedy
                                                else -> Icons.Filled.Extension
                                            },
                                            contentDescription = null,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(Modifier.width(4.dp))
                                        Text("Go Play", maxLines = 1)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (landedSlice != null && spinCount > 0) {
            CelebrationConfettiBurst(
                triggerKey = "wheel_win_$spinCount",
                modifier = Modifier.matchParentSize()
            )
        }
    }
}
