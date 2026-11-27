package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.TipsAndUpdates
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import com.example.data.content.CuratedContent
import com.example.data.model.CefrLevel
import com.example.data.model.ChatMessage
import com.example.data.model.ClozePuzzle
import com.example.data.model.ClubContentItem
import com.example.data.model.ClubContentType
import com.example.data.model.ClubPuzzleKind
import com.example.data.model.CollocationPair
import com.example.data.model.MatchPuzzleSet
import com.example.data.model.SentencePuzzle
import com.example.data.model.TeamChannel
import com.example.ui.PuzzleSessionStats
import com.example.ui.UiState
import com.example.ui.components.CefrBadge
import com.example.ui.components.CefrFilterRow
import com.example.ui.components.InGameChatActionButton
import com.example.ui.components.InGameSquadChatSheet
import com.example.ui.components.TranslatableEnglishText
import com.example.ui.components.Trophy3DFigure
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft
import com.example.ui.theme.MintTertiary

private enum class PuzzleMode(val label: String) {
    SCRAMBLE("Scramble"),
    MATCH("Match"),
    GAP_FILL("Gap Fill")
}

@Composable
fun PuzzlesScreen(
    onAwardXp: (Long) -> Unit,
    puzzleStats: PuzzleSessionStats = PuzzleSessionStats(),
    onRecordPuzzleSolved: (title: String, level: CefrLevel, xp: Long) -> Unit = { _, _, _ -> },
    clubContentState: UiState<List<ClubContentItem>> = UiState.Success(emptyList()),
    selectedLevel: CefrLevel? = null,
    onSelectLevel: (CefrLevel?) -> Unit = {},
    teamsState: UiState<List<TeamChannel>> = UiState.Success(emptyList()),
    selectedTeamId: String = "",
    messagesState: UiState<List<ChatMessage>> = UiState.Success(emptyList()),
    currentUserId: String = "",
    onSelectChannel: (String) -> Unit = {},
    onSendTeamMessage: (TeamChannel, String) -> Unit = { _, _ -> },
    onOpenChatTab: (() -> Unit)? = null,
    onBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var mode by remember { mutableStateOf(PuzzleMode.SCRAMBLE) }
    var showSquadChat by remember { mutableStateOf(false) }
    val teamMessageCount = (messagesState as? UiState.Success)?.data?.size ?: 0
    val clubPuzzles = remember(clubContentState) {
        (clubContentState as? UiState.Success)?.data.orEmpty()
            .filter { ClubContentType.fromRaw(it.contentType) == ClubContentType.PUZZLE }
    }

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.TopCenter
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .widthIn(max = 760.dp),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
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
                                .testTag("puzzles_back_button")
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Word Forge",
                            style = MaterialTheme.typography.displaySmall
                        )
                        Text(
                            text = "Solve sentence puzzles & idioms from A1 starters to B2",
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
                    tagPrefix = "puzzle"
                )
            }

            item {
                SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                    PuzzleMode.entries.forEachIndexed { index, entry ->
                        SegmentedButton(
                            selected = mode == entry,
                            onClick = { mode = entry },
                            shape = SegmentedButtonDefaults.itemShape(index, PuzzleMode.entries.size),
                            modifier = Modifier.testTag("puzzle_tab_${entry.name.lowercase()}")
                        ) {
                            Text(entry.label, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                    }
                }
            }

            if (puzzleStats.puzzlesSolved > 0) {
                item {
                    Surface(
                        color = IndigoSoft,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Solved: ${puzzleStats.puzzlesSolved} • Streak: ${puzzleStats.currentStreak}x",
                                color = IndigoOnSoft,
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Adaptive: ${puzzleStats.adaptiveLevel.label}",
                                color = IndigoOnSoft,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            item {
                val reportSolved: (String, CefrLevel, Long) -> Unit = { title, lvl, xp ->
                    onAwardXp(xp)
                    onRecordPuzzleSolved(title, lvl, xp)
                }
                when (mode) {
                    PuzzleMode.SCRAMBLE -> SentenceScrambleView(
                        clubPuzzles = clubPuzzles,
                        selectedLevel = selectedLevel,
                        onAwardXp = { xp -> reportSolved("Sentence Scramble", selectedLevel ?: puzzleStats.adaptiveLevel, xp) }
                    )
                    PuzzleMode.MATCH -> MatchPairsView(
                        clubPuzzles = clubPuzzles,
                        selectedLevel = selectedLevel,
                        onAwardXp = { xp -> reportSolved("Collocation Match", selectedLevel ?: puzzleStats.adaptiveLevel, xp) }
                    )
                    PuzzleMode.GAP_FILL -> GapFillView(
                        clubPuzzles = clubPuzzles,
                        selectedLevel = selectedLevel,
                        onAwardXp = { xp -> reportSolved("Gap-Fill Forge", selectedLevel ?: puzzleStats.adaptiveLevel, xp) }
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
            suggestedShoutout = "🧩 Solving ${mode.label} puzzles in Word Forge! Anyone want a hint?",
            onSelectChannel = onSelectChannel,
            onSendMessage = onSendTeamMessage,
            onOpenFullChatTab = onOpenChatTab,
            onDismiss = { showSquadChat = false }
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SentenceScrambleView(
    clubPuzzles: List<ClubContentItem>,
    selectedLevel: CefrLevel?,
    onAwardXp: (Long) -> Unit
) {
    val puzzles = remember(selectedLevel, clubPuzzles) {
        val adminScrambles = clubPuzzles
            .filter { ClubPuzzleKind.fromRaw(it.puzzleKind) == ClubPuzzleKind.SCRAMBLE && it.tokens.size >= 2 }
            .map { item ->
                SentencePuzzle(
                    id = "club_${item.id}",
                    cefrLevel = CefrLevel.fromRaw(item.cefrLevel),
                    promptHint = "${item.title} (${item.authorName.ifBlank { "Club" }})",
                    tokens = item.tokens,
                    explanation = item.description.ifBlank { "Published by your club teacher!" }
                )
            }
        (adminScrambles + CuratedContent.sentencePuzzles)
            .filter { selectedLevel == null || it.cefrLevel == selectedLevel }
            .ifEmpty { CuratedContent.sentencePuzzles }
    }
    var puzzleIndex by remember(selectedLevel) {
        mutableIntStateOf(if (puzzles.isNotEmpty()) kotlin.random.Random.nextInt(puzzles.size) else 0)
    }
    var roundCounter by remember(selectedLevel) { mutableIntStateOf(kotlin.random.Random.nextInt(10000)) }
    val puzzle = puzzles[puzzleIndex % puzzles.size]

    val shuffled = remember(puzzle.id, roundCounter) {
        puzzle.tokens.mapIndexed { idx, word -> idx to word }.shuffled()
    }
    val chosenIndices = remember(puzzle.id, roundCounter) { mutableStateListOf<Int>() }
    var solved by remember(puzzle.id, roundCounter) { mutableStateOf(false) }
    var wrongCheck by remember(puzzle.id, roundCounter) { mutableStateOf(false) }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
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
                    CefrBadge(level = puzzle.cefrLevel)
                    Text(
                        text = "Puzzle ${(puzzleIndex % puzzles.size) + 1} / ${puzzles.size}",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                TranslatableEnglishText(
                    text = puzzle.promptHint,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                // Answer tray
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.65f),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(
                        1.5.dp,
                        when {
                            solved -> MintTertiary
                            wrongCheck -> MaterialTheme.colorScheme.error
                            else -> MaterialTheme.colorScheme.outline
                        }
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 96.dp)
                ) {
                    if (chosenIndices.isEmpty()) {
                        Box(
                            contentAlignment = Alignment.Center,
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Text(
                                text = "Tap word chips below in natural order",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    } else {
                        FlowRow(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            chosenIndices.forEach { tokenIdx ->
                                Surface(
                                    color = MaterialTheme.colorScheme.primary,
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.clickable(enabled = !solved) {
                                        chosenIndices.remove(tokenIdx)
                                        wrongCheck = false
                                    }
                                ) {
                                    Text(
                                        text = puzzle.tokens[tokenIdx],
                                        color = MaterialTheme.colorScheme.onPrimary,
                                        style = MaterialTheme.typography.labelLarge,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                // Word bank
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    shuffled.forEach { (origIdx, word) ->
                        val used = origIdx in chosenIndices
                        Surface(
                            color = if (used) MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
                            else IndigoSoft,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.clickable(enabled = !used && !solved) {
                                chosenIndices.add(origIdx)
                                wrongCheck = false
                            }
                        ) {
                            Text(
                                text = word,
                                color = if (used) MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                                else IndigoOnSoft,
                                style = MaterialTheme.typography.labelLarge,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                            )
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            chosenIndices.clear()
                            wrongCheck = false
                        },
                        enabled = chosenIndices.isNotEmpty() && !solved,
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(Icons.Filled.Refresh, contentDescription = "Reset", modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Clear")
                    }
                    Button(
                        onClick = {
                            val built = chosenIndices.map { puzzle.tokens[it] }
                            if (built == puzzle.tokens) {
                                solved = true
                                wrongCheck = false
                                onAwardXp(15L)
                            } else {
                                wrongCheck = true
                            }
                        },
                        enabled = chosenIndices.size == puzzle.tokens.size && !solved,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("scramble_check_button")
                    ) {
                        Text("Check Sentence")
                    }
                }
            }
        }

        AnimatedVisibility(visible = wrongCheck) {
            Surface(
                color = MaterialTheme.colorScheme.errorContainer,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "Almost! Tap a chip in the tray to remove it and try reordering.",
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    modifier = Modifier.padding(14.dp)
                )
            }
        }

        AnimatedVisibility(visible = solved) {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MintSoft),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Trophy3DFigure(size = 56.dp)
                        Column {
                            Text(
                                text = "Perfect! +15 XP",
                                color = MintOnSoft,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            TranslatableEnglishText(
                                text = puzzle.explanation,
                                color = MintOnSoft,
                                underlineColor = MintOnSoft
                            )
                        }
                    }
                    Button(
                        onClick = {
                            puzzleIndex = if (puzzles.size > 1) {
                                (puzzleIndex + 1 + kotlin.random.Random.nextInt(puzzles.size - 1)) % puzzles.size
                            } else 0
                            roundCounter++
                        },
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Next Sentence Puzzle")
                    }
                }
            }
        }
    }
}

@Composable
private fun MatchPairsView(
    clubPuzzles: List<ClubContentItem>,
    selectedLevel: CefrLevel?,
    onAwardXp: (Long) -> Unit
) {
    val sets = remember(selectedLevel, clubPuzzles) {
        val adminSets = clubPuzzles
            .filter { ClubPuzzleKind.fromRaw(it.puzzleKind) == ClubPuzzleKind.MATCH && it.matchPairs.isNotEmpty() }
            .mapNotNull { item ->
                val pairs = item.matchPairs.mapIndexedNotNull { idx, raw ->
                    val parts = raw.split("::", limit = 2)
                    if (parts.size == 2 && parts[0].isNotBlank() && parts[1].isNotBlank()) {
                        CollocationPair(
                            id = "club_${item.id}_$idx",
                            left = parts[0].trim(),
                            right = parts[1].trim()
                        )
                    } else null
                }
                if (pairs.size >= 2) {
                    MatchPuzzleSet(
                        id = "club_${item.id}",
                        title = "${item.title} (${item.authorName.ifBlank { "Club" }})",
                        cefrLevel = CefrLevel.fromRaw(item.cefrLevel),
                        pairs = pairs,
                        teachingTip = item.description.ifBlank { "Teacher club collocation challenge." }
                    )
                } else null
            }
        (adminSets + CuratedContent.matchPuzzleSets)
            .filter { selectedLevel == null || it.cefrLevel == selectedLevel }
            .ifEmpty { CuratedContent.matchPuzzleSets }
    }
    var setIndex by remember(selectedLevel) {
        mutableIntStateOf(if (sets.isNotEmpty()) kotlin.random.Random.nextInt(sets.size) else 0)
    }
    var roundCounter by remember(selectedLevel) { mutableIntStateOf(kotlin.random.Random.nextInt(10000)) }
    val set = sets[setIndex % sets.size]
    val shuffledRight = remember(set.id, roundCounter) { set.pairs.map { it.id to it.right }.shuffled() }

    var selectedLeftId by remember(set.id, roundCounter) { mutableStateOf<String?>(null) }
    val matchedIds = remember(set.id, roundCounter) { mutableStateListOf<String>() }
    var mismatchFlag by remember(set.id, roundCounter) { mutableStateOf(false) }

    val allMatched = matchedIds.size == set.pairs.size

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
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
                    CefrBadge(level = set.cefrLevel)
                    Text(
                        text = set.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    text = "Tap an expression on the left, then its match on the right.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                set.pairs.forEachIndexed { idx, pair ->
                    val rightPair = shuffledRight[idx]
                    val leftMatched = pair.id in matchedIds
                    val rightMatched = rightPair.first in matchedIds

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(IntrinsicSize.Min),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Surface(
                            color = when {
                                leftMatched -> MintSoft
                                selectedLeftId == pair.id -> MaterialTheme.colorScheme.primary
                                else -> IndigoSoft
                            },
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .heightIn(min = 56.dp)
                                .clickable(enabled = !leftMatched) {
                                    selectedLeftId = pair.id
                                    mismatchFlag = false
                                }
                        ) {
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 10.dp)
                            ) {
                                Text(
                                    text = pair.left,
                                    color = when {
                                        leftMatched -> MintOnSoft
                                        selectedLeftId == pair.id -> MaterialTheme.colorScheme.onPrimary
                                        else -> IndigoOnSoft
                                    },
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Surface(
                            color = when {
                                rightMatched -> MintSoft
                                else -> MaterialTheme.colorScheme.surfaceVariant
                            },
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .heightIn(min = 56.dp)
                                .clickable(enabled = !rightMatched && selectedLeftId != null) {
                                    if (selectedLeftId == rightPair.first) {
                                        matchedIds.add(rightPair.first)
                                        selectedLeftId = null
                                        mismatchFlag = false
                                        if (matchedIds.size == set.pairs.size) {
                                            onAwardXp(20L)
                                        }
                                    } else {
                                        mismatchFlag = true
                                        selectedLeftId = null
                                    }
                                }
                        ) {
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 10.dp)
                            ) {
                                Text(
                                    text = rightPair.second,
                                    color = if (rightMatched) MintOnSoft else MaterialTheme.colorScheme.onSurface,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                }

                if (mismatchFlag) {
                    Text(
                        text = "Not a match—pick a pair again!",
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.labelLarge
                    )
                }
            }
        }

        AnimatedVisibility(visible = allMatched) {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MintSoft),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Trophy3DFigure(size = 56.dp)
                        Column {
                            Text("All Matched! +20 XP", color = MintOnSoft, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text(text = set.teachingTip, color = MintOnSoft)
                        }
                    }
                    Button(
                        onClick = {
                            setIndex = if (sets.size > 1) {
                                (setIndex + 1 + kotlin.random.Random.nextInt(sets.size - 1)) % sets.size
                            } else 0
                            roundCounter++
                        },
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Next Match Set")
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun GapFillView(
    clubPuzzles: List<ClubContentItem>,
    selectedLevel: CefrLevel?,
    onAwardXp: (Long) -> Unit
) {
    val clozes = remember(selectedLevel, clubPuzzles) {
        val adminClozes = clubPuzzles
            .filter { ClubPuzzleKind.fromRaw(it.puzzleKind) == ClubPuzzleKind.GAP_FILL && it.clozeAnswer.isNotBlank() }
            .map { item ->
                ClozePuzzle(
                    id = "club_${item.id}",
                    cefrLevel = CefrLevel.fromRaw(item.cefrLevel),
                    beforeBlank = item.clozeBefore,
                    afterBlank = item.clozeAfter,
                    correctWord = item.clozeAnswer,
                    options = item.clozeOptions.ifEmpty { listOf(item.clozeAnswer) },
                    explanation = item.description.ifBlank { "${item.title} (${item.authorName.ifBlank { "Club" }})" }
                )
            }
        (adminClozes + CuratedContent.clozePuzzles)
            .filter { selectedLevel == null || it.cefrLevel == selectedLevel }
            .ifEmpty { CuratedContent.clozePuzzles }
    }
    var index by remember(selectedLevel) {
        mutableIntStateOf(if (clozes.isNotEmpty()) kotlin.random.Random.nextInt(clozes.size) else 0)
    }
    var roundCounter by remember(selectedLevel) { mutableIntStateOf(kotlin.random.Random.nextInt(10000)) }
    val cloze = clozes[index % clozes.size]
    var selected by remember(cloze.id, roundCounter) { mutableStateOf<String?>(null) }

    val isCorrect = selected == cloze.correctWord

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Card(
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CefrBadge(level = cloze.cefrLevel)
                    Text(
                        text = "Gap ${(index % clozes.size) + 1} / ${clozes.size}",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Text(
                    text = buildAnnotatedString {
                        append(cloze.beforeBlank)
                        append(" ")
                        withStyle(
                            SpanStyle(
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold
                            )
                        ) {
                            append("[ ${selected ?: "____"} ]")
                        }
                        append(" ")
                        append(cloze.afterBlank)
                    },
                    style = MaterialTheme.typography.headlineSmall
                )

                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    cloze.options.forEach { option ->
                        val picked = selected == option
                        Surface(
                            color = when {
                                picked && option == cloze.correctWord -> MintSoft
                                picked -> MaterialTheme.colorScheme.errorContainer
                                else -> IndigoSoft
                            },
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.clickable(enabled = !isCorrect) {
                                selected = option
                                if (option == cloze.correctWord) {
                                    onAwardXp(10L)
                                }
                            }
                        ) {
                            Text(
                                text = option,
                                fontWeight = FontWeight.Bold,
                                color = when {
                                    picked && option == cloze.correctWord -> MintOnSoft
                                    picked -> MaterialTheme.colorScheme.onErrorContainer
                                    else -> IndigoOnSoft
                                },
                                modifier = Modifier.padding(horizontal = 18.dp, vertical = 12.dp)
                            )
                        }
                    }
                }
            }
        }

        AnimatedVisibility(visible = selected != null) {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isCorrect) MintSoft else MaterialTheme.colorScheme.errorContainer
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                val resultColor = if (isCorrect) MintOnSoft else MaterialTheme.colorScheme.onErrorContainer
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = if (isCorrect) "Correct! +10 XP" else "Try another particle!",
                        color = resultColor,
                        fontWeight = FontWeight.Bold
                    )
                    if (isCorrect) {
                        TranslatableEnglishText(
                            text = cloze.explanation,
                            color = resultColor,
                            underlineColor = resultColor
                        )
                        Button(
                            onClick = {
                                index = if (clozes.size > 1) {
                                    (index + 1 + kotlin.random.Random.nextInt(clozes.size - 1)) % clozes.size
                                } else 0
                                roundCounter++
                            },
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Next Gap-Fill")
                        }
                    }
                }
            }
        }
    }
}
