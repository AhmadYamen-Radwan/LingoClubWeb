package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.Timer
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
import androidx.compose.runtime.LaunchedEffect
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.R
import com.example.data.content.CuratedContent
import com.example.data.model.CefrLevel
import com.example.data.model.ChatMessage
import com.example.data.model.GuessingCard
import com.example.data.model.GuessingPack
import com.example.data.model.TeamChannel
import com.example.ui.UiState
import com.example.ui.components.AsyncDrawableImage
import com.example.ui.components.CelebrationConfettiBurst
import com.example.ui.components.CefrBadge
import com.example.ui.components.CefrFilterRow
import com.example.ui.components.InGameChatActionButton
import com.example.ui.components.InGameSquadChatSheet
import com.example.ui.components.Trophy3DFigure
import com.example.ui.theme.CoralOnSoft
import com.example.ui.theme.CoralSoft
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft
import com.example.ui.theme.MintTertiary
import kotlinx.coroutines.delay

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun GuessingScreen(
    onAwardXp: (Long) -> Unit,
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
    var activePack by remember { mutableStateOf<GuessingPack?>(null) }
    var durationSec by remember { mutableIntStateOf(60) }
    var showSquadChat by remember { mutableStateOf(false) }
    var roundShoutout by remember { mutableStateOf<String?>(null) }
    val teamMessageCount = (messagesState as? UiState.Success)?.data?.size ?: 0

    val currentPack = activePack
    if (currentPack != null) {
        BackHandler { activePack = null }
        GuessingRoundView(
            pack = currentPack,
            durationSec = durationSec,
            teamMessageCount = teamMessageCount,
            onOpenSquadChat = { shoutout ->
                roundShoutout = shoutout
                showSquadChat = true
            },
            onAwardXp = onAwardXp,
            onExit = { activePack = null },
            modifier = modifier
        )
        if (showSquadChat) {
            InGameSquadChatSheet(
                teamsState = teamsState,
                selectedTeamId = selectedTeamId,
                messagesState = messagesState,
                currentUserId = currentUserId,
                suggestedShoutout = roundShoutout,
                onSelectChannel = onSelectChannel,
                onSendMessage = onSendTeamMessage,
                onOpenFullChatTab = onOpenChatTab,
                onDismiss = { showSquadChat = false }
            )
        }
        return
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
                        IconButton(onClick = onBack, modifier = Modifier.size(48.dp)) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Taboo & Act",
                            style = MaterialTheme.typography.displaySmall
                        )
                        Text(
                            text = "One phone party games—describe or act while friends guess in English!",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    InGameChatActionButton(
                        messageCount = teamMessageCount,
                        label = "Squad",
                        onClick = {
                            roundShoutout = "🎭 Who wants to play Taboo & Act with me?"
                            showSquadChat = true
                        }
                    )
                }
            }

            item {
                AsyncDrawableImage(
                    resId = R.drawable.img_party_cards,
                    contentDescription = stringResource(R.string.cd_party_cards),
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(155.dp)
                        .clip(RoundedCornerShape(22.dp))
                )
            }

            item {
                CefrFilterRow(
                    selectedLevel = selectedLevel,
                    onSelectLevel = onSelectLevel,
                    tagPrefix = "guess"
                )
            }

            item {
                FlowRow(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        Icons.Filled.Timer,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.align(Alignment.CenterVertically)
                    )
                    Text(
                        "Round Timer:",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.align(Alignment.CenterVertically)
                    )
                    listOf(45, 60, 90).forEach { sec ->
                        FilterChip(
                            selected = durationSec == sec,
                            onClick = { durationSec = sec },
                            label = { Text("${sec}s") }
                        )
                    }
                }
            }

            val filteredPacks = CuratedContent.guessingPacks.filter {
                selectedLevel == null || it.cefrLevel == selectedLevel
            }
            if (filteredPacks.isEmpty()) {
                item {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(20.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text("No guessing packs for ${selectedLevel?.label ?: "this"} level yet", fontWeight = FontWeight.Bold)
                            OutlinedButton(onClick = { onSelectLevel(null) }) {
                                Text("Show All Levels")
                            }
                        }
                    }
                }
            } else {
                items(filteredPacks, key = { it.id }) { pack ->
                    Card(
                        shape = RoundedCornerShape(22.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { activePack = pack }
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                CefrBadge(level = pack.cefrLevel)
                                Text(
                                    text = pack.title,
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Text(
                                text = pack.modeLabel,
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = pack.description,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Button(
                                onClick = { activePack = pack },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                            ) {
                                Text("Start ${durationSec}s Round (${pack.cards.size} cards)")
                            }
                        }
                    }
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
            suggestedShoutout = roundShoutout,
            onSelectChannel = onSelectChannel,
            onSendMessage = onSendTeamMessage,
            onOpenFullChatTab = onOpenChatTab,
            onDismiss = { showSquadChat = false }
        )
    }
}

@Composable
private fun GuessingRoundView(
    pack: GuessingPack,
    durationSec: Int,
    teamMessageCount: Int,
    onOpenSquadChat: (String) -> Unit,
    onAwardXp: (Long) -> Unit,
    onExit: () -> Unit,
    modifier: Modifier = Modifier
) {
    var roundSeed by remember(pack.id) { mutableIntStateOf(0) }
    val deck = remember(pack.id, roundSeed) { pack.cards.shuffled() }
    var idx by remember(pack.id, roundSeed) { mutableIntStateOf(0) }
    var timeLeft by remember(pack.id, roundSeed) { mutableIntStateOf(durationSec) }
    var finished by remember(pack.id, roundSeed) { mutableStateOf(false) }
    var xpAwarded by remember(pack.id, roundSeed) { mutableStateOf(false) }

    val guessedWords = remember(pack.id, roundSeed) { mutableStateListOf<GuessingCard>() }
    val skippedWords = remember(pack.id, roundSeed) { mutableStateListOf<GuessingCard>() }

    fun finishRound() {
        if (!finished) {
            finished = true
        }
        if (!xpAwarded && guessedWords.isNotEmpty()) {
            xpAwarded = true
            onAwardXp((guessedWords.size * 10L).coerceAtMost(100L))
        }
    }

    LaunchedEffect(pack.id, roundSeed, finished) {
        if (!finished) {
            while (timeLeft > 0) {
                delay(1000)
                timeLeft--
            }
            finishRound()
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Column(
            modifier = Modifier.widthIn(max = 640.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onExit, modifier = Modifier.size(48.dp)) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "End round")
                }
                Text(
                    text = pack.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    InGameChatActionButton(
                        messageCount = teamMessageCount,
                        label = "Chat",
                        onClick = {
                            onOpenSquadChat("🎭 Playing ${pack.title} — ${guessedWords.size} guessed so far!")
                        }
                    )
                    Surface(
                        color = if (timeLeft <= 10) CoralSoft else MaterialTheme.colorScheme.primaryContainer,
                        shape = RoundedCornerShape(99.dp)
                    ) {
                        Text(
                            text = "${timeLeft}s",
                            color = if (timeLeft <= 10) CoralOnSoft else MaterialTheme.colorScheme.onPrimaryContainer,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                        )
                    }
                }
            }

            if (finished) {
                Box(modifier = Modifier.fillMaxWidth()) {
                    Card(
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Trophy3DFigure(size = 96.dp)
                            Text(
                                text = "Time's Up!",
                                style = MaterialTheme.typography.displaySmall,
                                color = Color.White
                            )
                            Text(
                                text = "${guessedWords.size} guessed • ${skippedWords.size} skipped",
                                style = MaterialTheme.typography.titleMedium,
                                color = Color.White.copy(alpha = 0.9f)
                            )
                            OutlinedButton(
                                onClick = {
                                    onOpenSquadChat(
                                        "🎭 Guessed ${guessedWords.size} words in ${pack.title} (${durationSec}s round)!"
                                    )
                                },
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Share Score to Squad Chat")
                            }
                        }
                    }
                    if (guessedWords.isNotEmpty()) {
                        CelebrationConfettiBurst(
                            triggerKey = "guess_win_${pack.id}_$roundSeed",
                            modifier = Modifier.matchParentSize()
                        )
                    }
                }

                if (guessedWords.isNotEmpty()) {
                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = MintSoft),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text("Guessed Correctly:", fontWeight = FontWeight.Bold, color = MintOnSoft)
                            guessedWords.forEach { Text("• ${it.word}", color = MintOnSoft) }
                        }
                    }
                }

                if (skippedWords.isNotEmpty()) {
                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = CoralSoft),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text("Review Together:", fontWeight = FontWeight.Bold, color = CoralOnSoft)
                            skippedWords.forEach {
                                Text("• ${it.word} — ${it.clueHint}", color = CoralOnSoft)
                            }
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onExit,
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(52.dp)
                    ) {
                        Text("Party Games")
                    }
                    Button(
                        onClick = { roundSeed++ },
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(52.dp)
                            .testTag("guess_play_again_button")
                    ) {
                        Text("Play Again")
                    }
                }
            } else {
                val card = deck[idx % deck.size]
                val animatedTimer by animateFloatAsState(
                    targetValue = (timeLeft.toFloat() / durationSec.toFloat()).coerceIn(0f, 1f),
                    animationSpec = tween(durationMillis = 450),
                    label = "guess_timer_bar"
                )
                LinearProgressIndicator(
                    progress = { animatedTimer },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(99.dp))
                )

                Card(
                    shape = RoundedCornerShape(28.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Surface(
                            color = MaterialTheme.colorScheme.primaryContainer,
                            shape = RoundedCornerShape(99.dp)
                        ) {
                            Text(
                                text = card.category,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                style = MaterialTheme.typography.labelLarge,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                            )
                        }

                        Text(
                            text = card.word,
                            style = MaterialTheme.typography.displaySmall,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )

                        Surface(
                            color = CoralSoft,
                            shape = RoundedCornerShape(18.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(
                                        Icons.Filled.Block,
                                        contentDescription = null,
                                        tint = CoralOnSoft,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Text(
                                        text = "FORBIDDEN WORDS",
                                        color = CoralOnSoft,
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                card.tabooWords.forEach { word ->
                                    Text(
                                        text = word,
                                        color = CoralOnSoft,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        Text(
                            text = "Host hint: ${card.clueHint}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            skippedWords.add(card)
                            if (idx + 1 >= deck.size) {
                                finishRound()
                            } else {
                                idx++
                            }
                        },
                        shape = RoundedCornerShape(18.dp),
                        modifier = Modifier
                            .weight(1f)
                            .heightIn(min = 56.dp)
                            .testTag("guess_skip_button")
                    ) {
                        Icon(Icons.Filled.SkipNext, contentDescription = null)
                        Spacer(Modifier.width(6.dp))
                        Text("Skip")
                    }
                    Button(
                        onClick = {
                            guessedWords.add(card)
                            if (idx + 1 >= deck.size) {
                                finishRound()
                            } else {
                                idx++
                            }
                        },
                        shape = RoundedCornerShape(18.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MintTertiary),
                        modifier = Modifier
                            .weight(1.4f)
                            .heightIn(min = 56.dp)
                            .testTag("guess_got_it_button")
                    ) {
                        Icon(Icons.Filled.Check, contentDescription = null)
                        Spacer(Modifier.width(6.dp))
                        Text("Got It! (${guessedWords.size})", style = MaterialTheme.typography.titleMedium)
                    }
                }
            }
        }
    }
}
