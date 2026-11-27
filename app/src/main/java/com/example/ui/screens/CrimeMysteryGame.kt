package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.data.model.CefrLevel
import com.example.ui.components.CelebrationConfettiBurst
import com.example.ui.components.CefrBadge
import com.example.ui.components.TranslatableEnglishText
import com.example.ui.components.Trophy3DFigure
import com.example.ui.theme.AmberAccent
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.CoralOnSoft
import com.example.ui.theme.CoralSoft
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft
import com.example.ui.theme.MintTertiary
import kotlin.random.Random

internal data class CrimeMysteryCase(
    val id: String,
    val title: String,
    val cefrLevel: CefrLevel,
    val crimeType: String,
    val crimeSceneSummary: String,
    val suspects: List<CrimeSuspect>,
    val correctSuspectId: String,
    val detectiveClue: String,
    val vocabularyTip: String
)

internal data class CrimeSuspect(
    val id: String,
    val name: String,
    val role: String,
    val alibi: String,
    val suspiciousDetail: String,
    val isGuilty: Boolean
)

private val CRIME_MYSTERY_CASES = listOf(
    CrimeMysteryCase(
        id = "case_manuscript",
        title = "The Missing Ancient Manuscript",
        cefrLevel = CefrLevel.B1,
        crimeType = "Theft & Burglary",
        crimeSceneSummary = "A rare 15th-century English manuscript vanished from the locked Oxford library showcase at midnight during a heavy thunderstorm.",
        suspects = listOf(
            CrimeSuspect("s1", "Professor Arthur Vance", "Chief Archivist", "Was grading student midterms in his office alone.", "Had mud on his boots and a forged library key in his coat pocket.", true),
            CrimeSuspect("s2", "Clara Sterling", "Night Custodian", "Was polishing brass floor fixtures in the west corridor.", "Her flashlight battery was dead, but she had a master key.", false),
            CrimeSuspect("s3", "Julian Thorne", "Rare Book Dealer", "Claims he was asleep at home three miles away.", "Received a suspicious cash deposit on his phone at 11:45 PM.", false)
        ),
        correctSuspectId = "s1",
        detectiveClue = "Look for conflicting alibis and physical evidence linked to the locked showcase.",
        vocabularyTip = "Key English terms: 'manuscript' (مخطوطة), 'alibi' (عذر غياب), 'archivist' (أمين محفوظات)."
    ),
    CrimeMysteryCase(
        id = "case_train_heist",
        title = "The London Express Diamond Heist",
        cefrLevel = CefrLevel.B2,
        crimeType = "Train Robbery",
        crimeSceneSummary = "A priceless blue diamond necklace disappeared from carriage B of the midnight London-to-Edinburgh express train.",
        suspects = listOf(
            CrimeSuspect("s1", "Lady Evelyn Vance", "Wealthy Socialite", "Was sipping herbal tea in the dining car with the conductor.", "Her velvet handbag contained a jeweler's magnifying glass and wire cutters.", true),
            CrimeSuspect("s2", "Marcus Brody", "Train Conductor", "Was checking tickets in carriages C through F.", "Forgot which tickets he punched in carriage B.", false),
            CrimeSuspect("s3", "Dr. Silas Finch", "Botanist", "Was sleeping in compartment 4.", "Dropped a leather glove near the robbed display case.", false)
        ),
        correctSuspectId = "s1",
        detectiveClue = "Examine the tools found in personal luggage and verify the dining car timestamps.",
        vocabularyTip = "Key English terms: 'heist' (سرقة مسلحة), 'priceless' (لا يقدر بثمن), 'evidence' (دليل)."
    ),
    CrimeMysteryCase(
        id = "case_manor_murder",
        title = "The Midnight Manor Murder",
        cefrLevel = CefrLevel.B2,
        crimeType = "Murder Mystery",
        crimeSceneSummary = "Lord Harrington was found dead in his private library behind locked double doors. An antique crystal goblet on his desk contained traces of bitter almond poison.",
        suspects = listOf(
            CrimeSuspect("s1", "Richard Harrington", "Lord's Estranged Nephew", "Claims he was walking in the rose garden smoking a cigar.", "His bank statements reveal overwhelming gambling debts, and a crushed cyanide seed was found in his coat.", true),
            CrimeSuspect("s2", "Beatrice Sterling", "Personal Butler", "Was serving midnight tea to guests in the drawing room.", "Her fingerprints were on the silver tray, but she had no motive.", false),
            CrimeSuspect("s3", "Dr. Alistair Montgomery", "Family Physician", "Claims he was in the village pharmacy preparing sleeping drops.", "Carried his medical bag, but arrived 15 minutes after the alarm sounded.", false)
        ),
        correctSuspectId = "s1",
        detectiveClue = "Identify who had both the financial motive and physical access to deadly chemical substances.",
        vocabularyTip = "Key English terms: 'poison' (سم), 'estranged' (منفصل/متباعد), 'motive' (دافع الجريمة)."
    ),
    CrimeMysteryCase(
        id = "case_gallery_forgery",
        title = "The Art Gallery Forgery",
        cefrLevel = CefrLevel.A2,
        crimeType = "Counterfeit & Swap",
        crimeSceneSummary = "A master oil painting was swapped with a clever fake right before the museum's grand opening gala.",
        suspects = listOf(
            CrimeSuspect("s1", "Leo Ramirez", "Museum Guard", "Was patrolling the sculpture garden until 9 PM.", "Left the gallery side door propped open with a wooden wedge.", false),
            CrimeSuspect("s2", "Sophie Laurent", "Assistant Curator", "Was arranging flowers in the lobby reception.", "Had fresh blue oil paint stains under her fingernails.", true),
            CrimeSuspect("s3", "Oliver Grant", "Art Collector", "Was talking on the phone outside.", "Offered to buy the painting for double price yesterday.", false)
        ),
        correctSuspectId = "s2",
        detectiveClue = "Trace the physical traces left behind by the artist's materials.",
        vocabularyTip = "Key English terms: 'forgery' (تزييف/لوحة مزيفة), 'curator' (أمين متحف), 'swap' (يستبدل)."
    ),
    CrimeMysteryCase(
        id = "case_bank_vault",
        title = "The Bank Vault Safe Cracker",
        cefrLevel = CefrLevel.B1,
        crimeType = "Bank Vault Breach",
        crimeSceneSummary = "Over three million pounds in gold bullion vanished from the subterranean vault of the Royal Midland Bank without triggering the acoustic alarms.",
        suspects = listOf(
            CrimeSuspect("s1", "Victor 'Shadow' Novak", "Security Alarm Specialist", "Claims he was at home monitoring server logs remotely.", "A thermal lance nozzle and industrial earplugs were recovered from his locker.", true),
            CrimeSuspect("s2", "Hannah Wells", "Head Bank Teller", "Was balancing receipts in the teller cages upstairs.", "Misplaced her master badge 20 minutes before closing.", false),
            CrimeSuspect("s3", "Garrison Cole", "Night Security Guard", "Was doing security rounds along the perimeter fence.", "He heard no noise because he was wearing headphones.", false)
        ),
        correctSuspectId = "s1",
        detectiveClue = "Look for specialized engineering tools capable of disabling acoustic vault sensors.",
        vocabularyTip = "Key English terms: 'bullion' (سبائك ذهبية), 'vault' (خزينة بنك), 'alarm' (إنذار)."
    ),
    CrimeMysteryCase(
        id = "case_crown_jewels",
        title = "The Tower Crown Jewels Infiltration",
        cefrLevel = CefrLevel.B2,
        crimeType = "Grand Larceny",
        crimeSceneSummary = "A jewel-encrusted coronation orb was snatched from the Tower vault during a sudden false fire alarm and smoke screen.",
        suspects = listOf(
            CrimeSuspect("s1", "Gwendolyn Frost", "Acrobatic Theater Performer", "Claims she was having dinner at a bistro across the bridge.", "A grappling hook and silk smoke bomb canister were found in her rental vehicle.", true),
            CrimeSuspect("s2", "Captain Arthur Price", "Tower Guard Captain", "Was directing tourists out of the historic armory.", "Had accidentally dropped his radio during the stampede.", false),
            CrimeSuspect("s3", "Edward Higgins", "Exhibit Electrician", "Was fixing emergency floodlights on the south parapet.", "Smelled of diesel fuel from the backup generator.", false)
        ),
        correctSuspectId = "s1",
        detectiveClue = "Analyze how the thief entered from the rooftop without tripping perimeter laser sensors.",
        vocabularyTip = "Key English terms: 'larceny' (سرقة كبرى), 'canister' (علبة اسطوانية), 'infiltration' (تسلل)."
    ),
    CrimeMysteryCase(
        id = "case_cyber_heist",
        title = "The Cyber Crypto Embezzlement",
        cefrLevel = CefrLevel.B1,
        crimeType = "Cyber Crime & Theft",
        crimeSceneSummary = "A fintech startup's cold storage cryptocurrency wallet holding 10,000 Ethereum coins was drained via an unauthorized physical key insertion.",
        suspects = listOf(
            CrimeSuspect("s1", "Zack Turner", "Senior Backend Engineer", "Claims he was off duty playing video games in his apartment.", "His terminal history showed SSH private key transfers at 3:14 AM and an encrypted hardware wallet.", true),
            CrimeSuspect("s2", "Rachel Chen", "Product Manager", "Was preparing presentation slides for investors.", "Left her company laptop unlocked in the conference room.", false),
            CrimeSuspect("s3", "Derrick Ross", "IT Support Specialist", "Was rebooting the central office network switches.", "Lost his keycard access badge in the cafeteria.", false)
        ),
        correctSuspectId = "s1",
        detectiveClue = "Inspect digital network logs and cryptographic hardware keys.",
        vocabularyTip = "Key English terms: 'embezzlement' (اختلاس), 'unauthorized' (غير مصرح به), 'terminal' (طرفية برمجية)."
    ),
    CrimeMysteryCase(
        id = "case_cruise_murder",
        title = "The Orient Luxury Cruise Poisoning",
        cefrLevel = CefrLevel.B2,
        crimeType = "Murder on High Seas",
        crimeSceneSummary = "Billionaire investor Simon Cross collapsed during the Captain's Gala dinner aboard the luxury Mediterranean yacht. Toxicologists detected aconite in his champagne.",
        suspects = listOf(
            CrimeSuspect("s1", "Daphne Dubois", "Casino Hostess", "Claims she was dealing blackjack cards on deck 3 all evening.", "She had an empty aconite tincture bottle disguised as perfume in her cabin drawer.", true),
            CrimeSuspect("s2", "Captain Henri Moreau", "Yacht Captain", "Was greeting VIP passengers at the dining entrance.", "Had argued with the victim over maritime navigation routes.", false),
            CrimeSuspect("s3", "Lucas Vance", "Venture Partner", "Was chatting with diplomats on the promenade deck.", "Lost a 500,000 dollar contract with the victim yesterday.", false)
        ),
        correctSuspectId = "s1",
        detectiveClue = "Search for concealed chemical containers and examine card dealer rotation schedules.",
        vocabularyTip = "Key English terms: 'toxicologist' (عالم سموم), 'disguised' (متنكر/مموه), 'contract' (عقد)."
    )
)

@Composable
internal fun CrimeMysteryGame(
    selectedLevel: CefrLevel?,
    onShareScore: (String) -> Unit,
    onFinished: (xp: Long, accuracyPct: Long, count: Int, maxCombo: Int) -> Unit
) {
    val haptic = LocalHapticFeedback.current

    val filteredPool = remember(selectedLevel) {
        val filtered = CRIME_MYSTERY_CASES.filter { selectedLevel == null || it.cefrLevel == selectedLevel }
        if (filtered.isNotEmpty()) filtered else CRIME_MYSTERY_CASES
    }

    // Dynamic initial case randomization: NEVER starts on the same case
    var caseIndex by remember(selectedLevel) {
        mutableIntStateOf(if (filteredPool.isNotEmpty()) Random.nextInt(filteredPool.size) else 0)
    }
    var roundSeed by remember(selectedLevel) { mutableIntStateOf(Random.nextInt(1000)) }
    var streakCombo by remember(selectedLevel) { mutableIntStateOf(0) }
    var maxStreak by remember(selectedLevel) { mutableIntStateOf(0) }
    var showAdaptiveHint by remember(caseIndex, roundSeed) { mutableStateOf(false) }

    val currentCase = remember(caseIndex, roundSeed, filteredPool) {
        filteredPool[caseIndex % filteredPool.size]
    }

    // Dynamic suspect order shuffling: culprit is randomized in position every round
    val shuffledSuspects = remember(currentCase.id, roundSeed) {
        currentCase.suspects.shuffled(Random(roundSeed))
    }

    var selectedSuspectId by remember(currentCase.id, roundSeed) { mutableStateOf<String?>(null) }
    var revealedVerdict by remember(currentCase.id, roundSeed) { mutableStateOf(false) }
    var recorded by remember(currentCase.id, roundSeed) { mutableStateOf(false) }

    val isCorrect = selectedSuspectId == currentCase.correctSuspectId

    LaunchedEffect(revealedVerdict) {
        if (revealedVerdict && !recorded) {
            recorded = true
            if (isCorrect) {
                streakCombo++
                if (streakCombo > maxStreak) maxStreak = streakCombo
                val bonus = (streakCombo.coerceAtMost(4) * 15L)
                val xp = 45L + bonus
                onFinished(xp, 100L, 1, streakCombo)
            } else {
                streakCombo = 0
                onFinished(15L, 30L, 1, 0)
            }
        }
    }

    Box(modifier = Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            // Case Briefing Card
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
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            CefrBadge(level = currentCase.cefrLevel)
                            Surface(
                                color = CoralSoft,
                                shape = RoundedCornerShape(99.dp)
                            ) {
                                Text(
                                    text = currentCase.crimeType,
                                    color = CoralOnSoft,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }

                        if (streakCombo > 0) {
                            Surface(
                                shape = RoundedCornerShape(99.dp),
                                color = AmberSoft
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.LocalFireDepartment,
                                        contentDescription = null,
                                        tint = AmberAccent,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Text(
                                        text = "${streakCombo}x Streak",
                                        color = AmberOnSoft,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }

                    Text(
                        text = currentCase.title,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.ExtraBold
                    )

                    Surface(
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = "CRIME SCENE REPORT",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            TranslatableEnglishText(
                                text = currentCase.crimeSceneSummary,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }

                    // Adaptive Hint Affordance
                    if (!revealedVerdict) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedButton(
                                onClick = {
                                    showAdaptiveHint = !showAdaptiveHint
                                    haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                },
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.Lightbulb,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(Modifier.width(6.dp))
                                Text(if (showAdaptiveHint) "Hide Detective Tip" else "Forensic Clue Tip")
                            }

                            Text(
                                text = "Case ${(caseIndex % filteredPool.size) + 1} of ${filteredPool.size}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        AnimatedVisibility(visible = showAdaptiveHint) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = AmberSoft,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.Search,
                                        contentDescription = null,
                                        tint = AmberOnSoft,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    TranslatableEnglishText(
                                        text = currentCase.detectiveClue,
                                        color = AmberOnSoft,
                                        underlineColor = AmberOnSoft,
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Suspect Interrogation Section Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.Fingerprint,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = "Suspect Interrogation & Alibis",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    text = "Tap to Accuse",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Interactive Suspect Cards
            shuffledSuspects.forEach { suspect ->
                val isSelected = selectedSuspectId == suspect.id
                val cardBg = when {
                    revealedVerdict && suspect.isGuilty -> MintSoft
                    revealedVerdict && isSelected && !suspect.isGuilty -> CoralSoft
                    isSelected -> IndigoSoft
                    else -> MaterialTheme.colorScheme.surface
                }
                val cardFg = when {
                    revealedVerdict && suspect.isGuilty -> MintOnSoft
                    revealedVerdict && isSelected && !suspect.isGuilty -> CoralOnSoft
                    isSelected -> IndigoOnSoft
                    else -> MaterialTheme.colorScheme.onSurface
                }

                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = cardBg),
                    border = BorderStroke(
                        1.5.dp,
                        when {
                            revealedVerdict && suspect.isGuilty -> MintTertiary
                            isSelected -> MaterialTheme.colorScheme.primary
                            else -> MaterialTheme.colorScheme.outline.copy(alpha = 0.22f)
                        }
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(enabled = !revealedVerdict) {
                            selectedSuspectId = suspect.id
                            haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                        }
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = suspect.name,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = cardFg
                                )
                                Text(
                                    text = "Role: ${suspect.role}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = cardFg.copy(alpha = 0.8f)
                                )
                            }
                            Surface(
                                shape = RoundedCornerShape(99.dp),
                                color = if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.2f) else MaterialTheme.colorScheme.surfaceVariant
                            ) {
                                Text(
                                    text = if (isSelected) "Accused" else "Select",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                                )
                            }
                        }

                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = Color.White.copy(alpha = if (isSelected) 0.5f else 0.08f)
                        ) {
                            Column(
                                modifier = Modifier.padding(10.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                TranslatableEnglishText(
                                    text = "Statement / Alibi: \"${suspect.alibi}\"",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = cardFg,
                                    underlineColor = if (isSelected) MaterialTheme.colorScheme.primary else cardFg
                                )
                                TranslatableEnglishText(
                                    text = "Suspicious Evidence: ${suspect.suspiciousDetail}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = cardFg.copy(alpha = 0.9f),
                                    underlineColor = if (isSelected) MaterialTheme.colorScheme.primary else cardFg,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }
            }

            // Accuse Button
            if (!revealedVerdict) {
                Button(
                    onClick = {
                        revealedVerdict = true
                        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                    },
                    enabled = selectedSuspectId != null,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                ) {
                    Text("Submit Formal Accusation", fontWeight = FontWeight.Bold)
                }
            }

            // Verdict Resolution Card
            AnimatedVisibility(visible = revealedVerdict) {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isCorrect) MintSoft else CoralSoft
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    val verdictFg = if (isCorrect) MintOnSoft else CoralOnSoft
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        if (isCorrect) Trophy3DFigure(size = 72.dp)
                        Text(
                            text = if (isCorrect) {
                                if (streakCombo > 1) "Brilliant Deduction! ${streakCombo}x Streak Bonus!" else "Case Solved Successfully!"
                            } else {
                                "Incorrect Deduction! The Mastermind Escaped."
                            },
                            color = verdictFg,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )
                        Text(
                            text = currentCase.vocabularyTip,
                            color = verdictFg.copy(alpha = 0.9f),
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            OutlinedButton(
                                onClick = {
                                    onShareScore(
                                        "🔍 Solved crime case '${currentCase.title}' with ${streakCombo}x streak in LingoClub!"
                                    )
                                },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Share to Chat")
                            }
                            Button(
                                onClick = {
                                    // Adaptive next case: pick randomly from unplayed cases so games change every time!
                                    val nextIdx = (caseIndex + 1 + Random.nextInt(filteredPool.size.coerceAtLeast(2) - 1)) % filteredPool.size
                                    caseIndex = nextIdx
                                    roundSeed = Random.nextInt(10000)
                                    selectedSuspectId = null
                                    revealedVerdict = false
                                    recorded = false
                                    showAdaptiveHint = false
                                },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("New Random Case")
                            }
                        }
                    }
                }
            }
        }

        if (revealedVerdict && isCorrect) {
            CelebrationConfettiBurst(
                triggerKey = "crime_win_${currentCase.id}_$roundSeed",
                modifier = Modifier.matchParentSize()
            )
        }
    }
}
