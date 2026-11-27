package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.SportsEsports
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.data.model.CefrLevel
import com.example.data.model.WeeklySessionPlan
import com.example.data.model.WeeklyVocabWord
import com.example.ui.components.CefrBadge
import com.example.ui.components.TranslatableEnglishText
import com.example.ui.components.Trophy3DFigure
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft
import com.example.util.TtsSpeaker

private enum class MiniGameKind(val label: String) {
    BLITZ("Meaning Blitz"),
    MATCH("Speed Match")
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun StoryChainInteractiveCard(
    weekNumber: Int,
    sessionPlan: WeeklySessionPlan,
    sessionWords: List<WeeklyVocabWord>,
    tts: TtsSpeaker,
    onWordPracticed: (String) -> Unit,
    onFinishChain: (title: String, level: CefrLevel, xp: Long, accuracyPct: Long, wordsCount: Int) -> Unit
) {
    var seed by remember(weekNumber, sessionPlan.sessionNumber) { mutableIntStateOf(kotlin.random.Random.nextInt(10000)) }
    val storyDeck = remember(weekNumber, sessionPlan.sessionNumber, seed) {
        sessionWords.shuffled().take(6)
    }
    var stepIndex by remember(weekNumber, sessionPlan.sessionNumber, seed) { mutableIntStateOf(0) }
    var correctFirstTry by remember(weekNumber, sessionPlan.sessionNumber, seed) { mutableIntStateOf(0) }
    var madeMistakeOnStep by remember(weekNumber, sessionPlan.sessionNumber, seed) { mutableStateOf(false) }
    var feedback by remember(weekNumber, sessionPlan.sessionNumber, seed) { mutableStateOf<String?>(null) }
    var finished by remember(weekNumber, sessionPlan.sessionNumber, seed) { mutableStateOf(false) }

    if (storyDeck.size < 4) {
        Card(
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = "Not enough words in this session yet to start the Story Chain.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(18.dp)
            )
        }
        return
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Card(
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = IndigoSoft),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.AutoMirrored.Filled.MenuBook, contentDescription = null, tint = IndigoOnSoft)
                    Text(
                        text = "Interactive Story Chain",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = IndigoOnSoft
                    )
                }
                TranslatableEnglishText(
                    text = sessionPlan.storyOpening,
                    style = MaterialTheme.typography.bodyMedium,
                    color = IndigoOnSoft.copy(alpha = 0.9f),
                    underlineColor = IndigoOnSoft
                )
            }
        }

        if (finished) {
            val accuracy = ((correctFirstTry * 100f) / storyDeck.size).toLong().coerceIn(40L, 100L)
            Card(
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(22.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Trophy3DFigure(size = 86.dp)
                    Text(
                        text = "Chapter Complete!",
                        style = MaterialTheme.typography.headlineSmall,
                        color = MaterialTheme.colorScheme.onPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    TranslatableEnglishText(
                        text = sessionPlan.storyClosing,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.9f),
                        underlineColor = MaterialTheme.colorScheme.onPrimary
                    )
                    Text(
                        text = "Story Accuracy: $accuracy%",
                        color = Color(0xFFFFD54F),
                        fontWeight = FontWeight.Bold
                    )
                    OutlinedButton(
                        onClick = { seed++ },
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.6f))
                    ) {
                        Icon(Icons.Filled.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Play Another Story Path")
                    }
                }
            }
        } else {
            val target = storyDeck[stepIndex]
            val maskedSentence = remember(target.id) {
                val regex = Regex("\\b${Regex.escape(target.word)}\\b", RegexOption.IGNORE_CASE)
                if (regex.containsMatchIn(target.storyLine)) {
                    regex.replaceFirst(target.storyLine, "_____")
                } else {
                    "${target.storyLine} (Word: _____)"
                }
            }
            val options = remember(target.id, seed) {
                val distractors = sessionWords.filter { it.id != target.id }.shuffled().take(3)
                (distractors + target).shuffled()
            }

            LinearProgressIndicator(
                progress = { (stepIndex + 1).toFloat() / storyDeck.size.toFloat() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(99.dp))
            )

            Card(
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Beat ${stepIndex + 1} of ${storyDeck.size} • ${target.domain.label}",
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.primary
                        )
                        CefrBadge(level = target.cefrLevel)
                    }
                    Text(
                        text = maskedSentence,
                        style = MaterialTheme.typography.headlineSmall
                    )
                    Text(
                        text = "Clue: ${target.meaning} (${target.arabic})",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        options.forEach { opt ->
                            Button(
                                onClick = {
                                    if (opt.id == target.id) {
                                        if (!madeMistakeOnStep) correctFirstTry++
                                        tts.speak(target.storyLine)
                                        onWordPracticed(target.id)
                                        if (stepIndex + 1 >= storyDeck.size) {
                                            finished = true
                                            val acc = ((correctFirstTry * 100f) / storyDeck.size).toLong().coerceIn(40L, 100L)
                                            onFinishChain(
                                                "Story Chain W$weekNumber S${sessionPlan.sessionNumber}",
                                                target.cefrLevel,
                                                30L,
                                                acc,
                                                storyDeck.size
                                            )
                                        } else {
                                            stepIndex++
                                            madeMistakeOnStep = false
                                            feedback = null
                                        }
                                    } else {
                                        madeMistakeOnStep = true
                                        feedback = "Not '${opt.word}' — look at the clue: ${target.meaning}"
                                    }
                                },
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            ) {
                                Text(opt.word, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    val currentFeedback = feedback
                    if (currentFeedback != null) {
                        Surface(
                            color = AmberSoft,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = currentFeedback,
                                color = AmberOnSoft,
                                style = MaterialTheme.typography.bodyMedium,
                                modifier = Modifier.padding(12.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun WeeklyInteractiveGamesCard(
    weekNumber: Int,
    sessionPlan: WeeklySessionPlan,
    sessionWords: List<WeeklyVocabWord>,
    tts: TtsSpeaker,
    onRecordGameResult: (title: String, level: CefrLevel, xp: Long, accuracyPct: Long, wordsCount: Int) -> Unit
) {
    var activeGame by remember { mutableStateOf(MiniGameKind.BLITZ) }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            MiniGameKind.entries.forEach { kind ->
                FilterChip(
                    selected = activeGame == kind,
                    onClick = { activeGame = kind },
                    label = { Text(kind.label) },
                    leadingIcon = {
                        Icon(
                            imageVector = if (kind == MiniGameKind.BLITZ) Icons.Filled.Bolt else Icons.Filled.SportsEsports,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                    },
                    modifier = Modifier.testTag("weekly_game_${kind.name.lowercase()}")
                )
            }
        }

        if (activeGame == MiniGameKind.BLITZ) {
            MeaningBlitzGame(
                weekNumber = weekNumber,
                sessionNumber = sessionPlan.sessionNumber,
                words = sessionWords,
                tts = tts,
                onFinished = onRecordGameResult
            )
        } else {
            SpeedMatchGame(
                weekNumber = weekNumber,
                sessionNumber = sessionPlan.sessionNumber,
                words = sessionWords,
                tts = tts,
                onFinished = onRecordGameResult
            )
        }
    }
}

@Composable
private fun MeaningBlitzGame(
    weekNumber: Int,
    sessionNumber: Int,
    words: List<WeeklyVocabWord>,
    tts: TtsSpeaker,
    onFinished: (title: String, level: CefrLevel, xp: Long, accuracyPct: Long, wordsCount: Int) -> Unit
) {
    var seed by remember(weekNumber, sessionNumber) { mutableIntStateOf(kotlin.random.Random.nextInt(10000)) }
    val deck = remember(weekNumber, sessionNumber, seed) { words.shuffled().take(6) }
    var index by remember(weekNumber, sessionNumber, seed) { mutableIntStateOf(0) }
    var score by remember(weekNumber, sessionNumber, seed) { mutableIntStateOf(0) }
    var correctCount by remember(weekNumber, sessionNumber, seed) { mutableIntStateOf(0) }
    var selectedId by remember(weekNumber, sessionNumber, seed) { mutableStateOf<String?>(null) }
    var finished by remember(weekNumber, sessionNumber, seed) { mutableStateOf(false) }

    if (deck.size < 4) return

    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (finished) {
                val acc = ((correctCount * 100f) / deck.size).toLong().coerceIn(0L, 100L)
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Trophy3DFigure(size = 84.dp)
                    Text("Meaning Blitz Complete!", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text("Score: $score pts • Accuracy: $acc% ($correctCount/${deck.size})")
                    Button(onClick = { seed++ }, shape = RoundedCornerShape(14.dp)) {
                        Icon(Icons.Filled.Refresh, contentDescription = null)
                        Spacer(Modifier.width(6.dp))
                        Text("Play New Blitz Set")
                    }
                }
            } else {
                val qWord = deck[index]
                val choices = remember(qWord.id, seed) {
                    (words.filter { it.id != qWord.id }.shuffled().take(3) + qWord).shuffled()
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Round ${index + 1}/${deck.size} • $score pts", style = MaterialTheme.typography.labelLarge)
                    CefrBadge(level = qWord.cefrLevel)
                }
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = qWord.word,
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.weight(1f)
                    )
                    IconButton(onClick = { tts.speak(qWord.word) }, modifier = Modifier.size(48.dp)) {
                        Icon(Icons.AutoMirrored.Filled.VolumeUp, contentDescription = "Pronounce word")
                    }
                }
                choices.forEach { choice ->
                    val isSelected = selectedId == choice.id
                    val isCorrect = choice.id == qWord.id
                    val bg = when {
                        selectedId == null -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                        isCorrect -> MintSoft
                        isSelected -> MaterialTheme.colorScheme.errorContainer
                        else -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                    }
                    val titleColor = when {
                        selectedId == null -> MaterialTheme.colorScheme.onSurface
                        isCorrect -> MintOnSoft
                        isSelected -> MaterialTheme.colorScheme.onErrorContainer
                        else -> MaterialTheme.colorScheme.onSurface
                    }
                    val subColor = when {
                        selectedId == null -> MaterialTheme.colorScheme.onSurfaceVariant
                        isCorrect -> MintOnSoft.copy(alpha = 0.85f)
                        isSelected -> MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.85f)
                        else -> MaterialTheme.colorScheme.onSurfaceVariant
                    }
                    Surface(
                        color = bg,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(enabled = selectedId == null) {
                                selectedId = choice.id
                                if (isCorrect) {
                                    correctCount++
                                    score += 100
                                }
                            }
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(choice.meaning, fontWeight = FontWeight.SemiBold, color = titleColor)
                            Text(choice.arabic, style = MaterialTheme.typography.bodySmall, color = subColor)
                        }
                    }
                }
                if (selectedId != null) {
                    Button(
                        onClick = {
                            if (index + 1 >= deck.size) {
                                finished = true
                                val acc = ((correctCount * 100f) / deck.size).toLong().coerceIn(0L, 100L)
                                onFinished("Meaning Blitz W$weekNumber S$sessionNumber", qWord.cefrLevel, (correctCount * 6L).coerceAtLeast(10L), acc, deck.size)
                            } else {
                                index++
                                selectedId = null
                            }
                        },
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(if (index + 1 >= deck.size) "Finish & Save Score" else "Next Word")
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SpeedMatchGame(
    weekNumber: Int,
    sessionNumber: Int,
    words: List<WeeklyVocabWord>,
    tts: TtsSpeaker,
    onFinished: (title: String, level: CefrLevel, xp: Long, accuracyPct: Long, wordsCount: Int) -> Unit
) {
    var seed by remember(weekNumber, sessionNumber) { mutableIntStateOf(kotlin.random.Random.nextInt(10000)) }
    val boardWords = remember(weekNumber, sessionNumber, seed) { words.shuffled().take(4) }
    val shuffledAr = remember(weekNumber, sessionNumber, seed) { boardWords.shuffled() }
    var pickedWordId by remember(weekNumber, sessionNumber, seed) { mutableStateOf<String?>(null) }
    val matchedIds = remember(weekNumber, sessionNumber, seed) { mutableStateListOf<String>() }
    var mistakes by remember(weekNumber, sessionNumber, seed) { mutableIntStateOf(0) }
    var mismatchError by remember(weekNumber, sessionNumber, seed) { mutableStateOf(false) }
    var recorded by remember(weekNumber, sessionNumber, seed) { mutableStateOf(false) }

    if (boardWords.size < 4) return

    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Tap English, then tap its Arabic/Meaning pair",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )
                Text("${matchedIds.size}/4", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            }

            if (matchedIds.size == 4) {
                Surface(color = MintSoft, shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth()) {
                    FlowRow(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Filled.CheckCircle, contentDescription = null, tint = MintOnSoft)
                            Text("All 4 paired! Mistakes: $mistakes", color = MintOnSoft, fontWeight = FontWeight.Bold)
                        }
                        OutlinedButton(onClick = { seed++ }) {
                            Text("New 4")
                        }
                    }
                }
            } else {
                AnimatedVisibility(visible = mismatchError) {
                    Surface(
                        color = MaterialTheme.colorScheme.errorContainer,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "Not a match — pick an English word and try another pair!",
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            style = MaterialTheme.typography.labelLarge,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                        )
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        boardWords.forEach { w ->
                            val isMatched = w.id in matchedIds
                            val isPicked = pickedWordId == w.id
                            val textColor = when {
                                isMatched -> MintOnSoft
                                isPicked -> IndigoOnSoft
                                else -> MaterialTheme.colorScheme.onSurface
                            }
                            Surface(
                                color = when {
                                    isMatched -> MintSoft
                                    isPicked -> IndigoSoft
                                    else -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                                },
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .heightIn(min = 52.dp)
                                    .clickable(enabled = !isMatched) {
                                        pickedWordId = w.id
                                        mismatchError = false
                                        tts.speak(w.word)
                                    }
                            ) {
                                Text(
                                    text = w.word,
                                    color = textColor,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(12.dp)
                                )
                            }
                        }
                    }
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        shuffledAr.forEach { ar ->
                            val isMatched = ar.id in matchedIds
                            val rightTextColor = if (isMatched) MintOnSoft else AmberOnSoft
                            Surface(
                                color = if (isMatched) MintSoft else AmberSoft.copy(alpha = 0.85f),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .heightIn(min = 52.dp)
                                    .clickable(enabled = !isMatched && pickedWordId != null) {
                                        if (pickedWordId == ar.id) {
                                            matchedIds.add(ar.id)
                                            pickedWordId = null
                                            mismatchError = false
                                            if (matchedIds.size == 4 && !recorded) {
                                                recorded = true
                                                val acc = (100L - (mistakes * 15L)).coerceIn(40L, 100L)
                                                onFinished("Speed Match W$weekNumber S$sessionNumber", ar.cefrLevel, 25L, acc, 4)
                                            }
                                        } else {
                                            mistakes++
                                            mismatchError = true
                                            pickedWordId = null
                                        }
                                    }
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Text(ar.arabic, fontWeight = FontWeight.Bold, color = rightTextColor)
                                    Text(
                                        ar.meaning,
                                        color = rightTextColor.copy(alpha = 0.85f),
                                        style = MaterialTheme.typography.labelSmall,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
