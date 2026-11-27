package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
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
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Flip
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Shuffle
import androidx.compose.material.icons.filled.TipsAndUpdates
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.data.content.CuratedContent
import com.example.data.model.CardMastery
import com.example.data.model.CefrLevel
import com.example.data.model.ClubContentItem
import com.example.data.model.ClubContentType
import com.example.data.model.CustomDeck
import com.example.data.model.FlashcardItem
import com.example.ui.UiState
import com.example.ui.components.TranslatableEnglishText
import com.example.ui.components.CefrBadge
import com.example.ui.components.CefrFilterRow
import com.example.ui.components.Trophy3DFigure
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.JetBrainsMonoFontFamily
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft
import com.example.ui.theme.MintTertiary
import com.example.util.rememberTtsSpeaker

private data class ActiveStudyDeck(
    val deckId: String,
    val title: String,
    val level: CefrLevel,
    val cards: List<FlashcardItem>
)

private fun cardMasteryKey(deckId: String, originalIndex: Int): String =
    "${deckId}_$originalIndex".replace(Regex("[^a-zA-Z0-9_\\-]"), "_")

@Composable
fun CardsScreen(
    customDecksState: UiState<List<CustomDeck>>,
    clubContentState: UiState<List<ClubContentItem>> = UiState.Success(emptyList()),
    cardMasteryMap: Map<String, CardMastery>,
    isBusy: Boolean,
    selectedLevel: CefrLevel? = null,
    onSelectLevel: (CefrLevel?) -> Unit = {},
    onToggleMastery: (deckId: String, cardIndex: Int, mastered: Boolean) -> Unit,
    onSaveCustomDeck: (title: String, level: CefrLevel, cards: List<FlashcardItem>, onDone: () -> Unit) -> Unit,
    onUpdateCustomDeck: (deckId: String, title: String, level: CefrLevel, cards: List<FlashcardItem>, onDone: () -> Unit) -> Unit = { _, _, _, _, onDone -> onDone() },
    onDeleteCustomDeck: (deckId: String) -> Unit = {},
    onRecordStudySession: (deckTitle: String, level: CefrLevel, reviewedCount: Int, masteredCount: Int, totalCards: Int) -> Unit = { _, _, _, _, _ -> },
    onBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var activeDeck by remember { mutableStateOf<ActiveStudyDeck?>(null) }
    var showCreateDialog by remember { mutableStateOf(false) }
    var editingDeck by remember { mutableStateOf<CustomDeck?>(null) }
    var deckPendingDelete by remember { mutableStateOf<CustomDeck?>(null) }

    val currentDeck = activeDeck
    if (currentDeck != null) {
        BackHandler { activeDeck = null }
        FlashcardStudyView(
            deck = currentDeck,
            cardMasteryMap = cardMasteryMap,
            onToggleMastery = onToggleMastery,
            onRecordStudySession = onRecordStudySession,
            onBack = { activeDeck = null },
            modifier = modifier
        )
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
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        if (onBack != null) {
                            IconButton(
                                onClick = onBack,
                                modifier = Modifier
                                    .size(48.dp)
                                    .testTag("cards_back_button")
                            ) {
                                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                            }
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Deck Studio",
                                style = MaterialTheme.typography.displaySmall
                            )
                            Text(
                                text = "Build Firestore word decks, flip 3D cards & track mastery",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    Spacer(Modifier.width(8.dp))
                    Button(
                        onClick = { showCreateDialog = true },
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .heightIn(min = 48.dp)
                            .testTag("create_deck_button")
                    ) {
                        Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("New Deck")
                    }
                }
            }

            item {
                CefrFilterRow(
                    selectedLevel = selectedLevel,
                    onSelectLevel = onSelectLevel,
                    tagPrefix = "cards"
                )
            }

            val clubDecks = (clubContentState as? UiState.Success)?.data.orEmpty()
                .filter {
                    ClubContentType.fromRaw(it.contentType) == ClubContentType.DECK &&
                        it.cards.isNotEmpty() &&
                        (selectedLevel == null || CefrLevel.fromRaw(it.cefrLevel) == selectedLevel)
                }
            if (clubDecks.isNotEmpty()) {
                item {
                    Text(
                        text = "Official Club Decks",
                        style = MaterialTheme.typography.titleLarge
                    )
                }
                items(clubDecks, key = { "club_${it.id}" }) { item ->
                    val lvl = CefrLevel.fromRaw(item.cefrLevel)
                    val deckId = "club_${item.id}"
                    val masteredCount = item.cards.indices.count { idx ->
                        cardMasteryMap[cardMasteryKey(deckId, idx)]?.mastered == true
                    }
                    DeckSummaryCard(
                        title = item.title,
                        subtitle = "By ${item.authorName.ifBlank { "Tutor" }} • ${item.cards.size} cards • $masteredCount mastered",
                        level = lvl,
                        onOpen = {
                            activeDeck = ActiveStudyDeck(deckId, item.title, lvl, item.cards)
                        }
                    )
                }
            }

            val customDecks = (customDecksState as? UiState.Success)?.data.orEmpty()
                .filter { selectedLevel == null || CefrLevel.fromRaw(it.cefrLevel) == selectedLevel }
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Your Custom Decks",
                        style = MaterialTheme.typography.titleLarge
                    )
                    if (customDecks.isNotEmpty()) {
                        Text(
                            text = "${customDecks.size} saved",
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
            if (customDecks.isEmpty()) {
                item {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "Create your own Firestore study deck",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Save custom words, definitions, examples, and tips to Firestore so you can review them anytime.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            OutlinedButton(
                                onClick = { showCreateDialog = true },
                                modifier = Modifier.heightIn(min = 48.dp)
                            ) {
                                Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Create First Deck")
                            }
                        }
                    }
                }
            } else {
                items(customDecks, key = { it.id }) { deck ->
                    val lvl = CefrLevel.fromRaw(deck.cefrLevel)
                    val masteredCount = deck.cards.indices.count { idx ->
                        cardMasteryMap[cardMasteryKey(deck.id, idx)]?.mastered == true
                    }
                    DeckSummaryCard(
                        title = deck.title,
                        subtitle = "${deck.cards.size} cards • $masteredCount mastered • Saved in cloud",
                        level = lvl,
                        onOpen = {
                            activeDeck = ActiveStudyDeck(deck.id, deck.title, lvl, deck.cards)
                        },
                        onEdit = { editingDeck = deck },
                        onDelete = { deckPendingDelete = deck },
                        editTestTag = "edit_deck_${deck.id}",
                        deleteTestTag = "delete_deck_${deck.id}"
                    )
                }
            }

            val curatedDecks = CuratedContent.flashcardDecks.filter {
                selectedLevel == null || it.cefrLevel == selectedLevel
            }
            item {
                Text(
                    text = "Curated Teaching Decks",
                    style = MaterialTheme.typography.titleLarge
                )
            }
            if (curatedDecks.isEmpty()) {
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
                            Text("No curated decks for ${selectedLevel?.label ?: "this"} level yet", fontWeight = FontWeight.Bold)
                            OutlinedButton(onClick = { onSelectLevel(null) }) {
                                Text("Show All Levels")
                            }
                        }
                    }
                }
            } else {
                items(curatedDecks, key = { it.id }) { deck ->
                    val masteredCount = deck.cards.indices.count { idx ->
                        cardMasteryMap[cardMasteryKey(deck.id, idx)]?.mastered == true
                    }
                    DeckSummaryCard(
                        title = deck.title,
                        subtitle = "${deck.subtitle} • $masteredCount/${deck.cards.size} mastered",
                        level = deck.cefrLevel,
                        onOpen = {
                            activeDeck = ActiveStudyDeck(deck.id, deck.title, deck.cefrLevel, deck.cards)
                        }
                    )
                }
            }

            item { Spacer(Modifier.height(16.dp)) }
        }
    }

    if (showCreateDialog) {
        DeckEditorDialog(
            dialogTitle = "New Study Deck",
            confirmLabel = "Save Deck",
            isBusy = isBusy,
            onDismiss = { showCreateDialog = false },
            onSave = { title, level, cards ->
                onSaveCustomDeck(title, level, cards) {
                    showCreateDialog = false
                }
            }
        )
    }

    val deckToEdit = editingDeck
    if (deckToEdit != null) {
        DeckEditorDialog(
            dialogTitle = "Edit Study Deck",
            confirmLabel = "Save Changes",
            initialTitle = deckToEdit.title,
            initialLevel = CefrLevel.fromRaw(deckToEdit.cefrLevel),
            initialCards = deckToEdit.cards,
            isBusy = isBusy,
            onDismiss = { editingDeck = null },
            onSave = { title, level, cards ->
                onUpdateCustomDeck(deckToEdit.id, title, level, cards) {
                    editingDeck = null
                }
            }
        )
    }

    val pendingDelete = deckPendingDelete
    if (pendingDelete != null) {
        AlertDialog(
            onDismissRequest = { deckPendingDelete = null },
            title = { Text("Delete Deck?", fontWeight = FontWeight.Bold) },
            text = {
                Text("Remove '${pendingDelete.title}' (${pendingDelete.cards.size} cards) from your Firestore study decks?")
            },
            confirmButton = {
                Button(
                    onClick = {
                        onDeleteCustomDeck(pendingDelete.id)
                        deckPendingDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                    modifier = Modifier.testTag("confirm_delete_deck_button")
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { deckPendingDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
private fun DeckSummaryCard(
    title: String,
    subtitle: String,
    level: CefrLevel,
    onOpen: () -> Unit,
    onEdit: (() -> Unit)? = null,
    onDelete: (() -> Unit)? = null,
    editTestTag: String? = null,
    deleteTestTag: String? = null
) {
    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onOpen)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    CefrBadge(level = level)
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                if (onEdit != null) {
                    IconButton(
                        onClick = onEdit,
                        modifier = Modifier
                            .size(48.dp)
                            .then(if (editTestTag != null) Modifier.testTag(editTestTag) else Modifier)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Edit,
                            contentDescription = "Edit deck $title",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                }
                if (onDelete != null) {
                    IconButton(
                        onClick = onDelete,
                        modifier = Modifier
                            .size(48.dp)
                            .then(if (deleteTestTag != null) Modifier.testTag(deleteTestTag) else Modifier)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Delete,
                            contentDescription = "Delete deck $title",
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                }
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "Study",
                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun FlashcardStudyView(
    deck: ActiveStudyDeck,
    cardMasteryMap: Map<String, CardMastery>,
    onToggleMastery: (deckId: String, cardIndex: Int, mastered: Boolean) -> Unit,
    onRecordStudySession: (deckTitle: String, level: CefrLevel, reviewedCount: Int, masteredCount: Int, totalCards: Int) -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val tts = rememberTtsSpeaker()
    var needsReviewOnly by remember(deck.deckId) { mutableStateOf(false) }
    var shuffledOrder by remember(deck.deckId) { mutableStateOf<List<Int>?>(null) }
    var positionIndex by remember(deck.deckId) { mutableIntStateOf(0) }
    var reviewedIndices by remember(deck.deckId) { mutableStateOf(setOf<Int>()) }
    var sessionSaved by remember(deck.deckId) { mutableStateOf(false) }

    val baseIndices = remember(deck.cards, shuffledOrder) {
        shuffledOrder ?: deck.cards.indices.toList()
    }
    val visibleIndices = remember(baseIndices, needsReviewOnly, cardMasteryMap, deck.deckId) {
        if (!needsReviewOnly) {
            baseIndices
        } else {
            baseIndices.filter { idx ->
                cardMasteryMap[cardMasteryKey(deck.deckId, idx)]?.mastered != true
            }
        }
    }

    val totalMasteredInDeck = deck.cards.indices.count { idx ->
        cardMasteryMap[cardMasteryKey(deck.deckId, idx)]?.mastered == true
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
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack, modifier = Modifier.size(48.dp)) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back to decks")
                }
                Text(
                    text = deck.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f).padding(horizontal = 8.dp)
                )
                CefrBadge(level = deck.level)
            }

            // Study mode & shuffle controls
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                FilterChip(
                    selected = !needsReviewOnly,
                    onClick = {
                        needsReviewOnly = false
                        positionIndex = 0
                    },
                    label = { Text("All (${deck.cards.size})") },
                    modifier = Modifier.testTag("study_filter_all")
                )
                FilterChip(
                    selected = needsReviewOnly,
                    onClick = {
                        needsReviewOnly = true
                        positionIndex = 0
                    },
                    label = { Text("Needs Review (${deck.cards.size - totalMasteredInDeck})") },
                    modifier = Modifier.testTag("study_filter_review")
                )
                FilterChip(
                    selected = shuffledOrder != null,
                    onClick = {
                        shuffledOrder = if (shuffledOrder == null) {
                            deck.cards.indices.shuffled()
                        } else {
                            null
                        }
                        positionIndex = 0
                    },
                    leadingIcon = {
                        Icon(Icons.Filled.Shuffle, contentDescription = null, modifier = Modifier.size(16.dp))
                    },
                    label = { Text(if (shuffledOrder != null) "Shuffled" else "Shuffle") },
                    modifier = Modifier.testTag("study_shuffle_chip")
                )
            }

            if (visibleIndices.isEmpty()) {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MintSoft),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Trophy3DFigure(size = 96.dp)
                        Text(
                            text = "All cards mastered!",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = MintOnSoft
                        )
                        Text(
                            text = "You've mastered every card in ${deck.title}. Save your study session or switch back to All Cards.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MintOnSoft.copy(alpha = 0.9f),
                            textAlign = TextAlign.Center
                        )
                        OutlinedButton(
                            onClick = {
                                needsReviewOnly = false
                                positionIndex = 0
                            },
                            modifier = Modifier.heightIn(min = 48.dp)
                        ) {
                            Icon(Icons.Filled.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Review All Cards")
                        }
                    }
                }
            } else {
                val safePos = positionIndex.coerceIn(0, visibleIndices.lastIndex)
                val originalIndex = visibleIndices[safePos]
                var flipped by remember(deck.deckId, originalIndex, needsReviewOnly) { mutableStateOf(false) }
                val card = deck.cards[originalIndex]
                val cardKey = cardMasteryKey(deck.deckId, originalIndex)
                val mastery = cardMasteryMap[cardKey]
                val isMastered = mastery?.mastered == true
                val reviewCount = mastery?.reviewCount ?: 0L

                val rotation by animateFloatAsState(
                    targetValue = if (flipped) 180f else 0f,
                    animationSpec = spring(dampingRatio = 0.78f, stiffness = Spring.StiffnessMediumLow),
                    label = "card_flip"
                )
                val animatedProgress by animateFloatAsState(
                    targetValue = (safePos + 1).toFloat() / visibleIndices.size.toFloat(),
                    animationSpec = tween(260),
                    label = "deck_progress"
                )
                var dragOffsetX by remember(deck.deckId, originalIndex) { mutableFloatStateOf(0f) }
                var dragOffsetY by remember(deck.deckId, originalIndex) { mutableFloatStateOf(0f) }
                val tiltX by animateFloatAsState(
                    targetValue = (-dragOffsetY * 0.06f).coerceIn(-12f, 12f),
                    animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
                    label = "card_tilt_x"
                )
                val tiltY by animateFloatAsState(
                    targetValue = (dragOffsetX * 0.08f).coerceIn(-16f, 16f),
                    animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
                    label = "card_tilt_y"
                )
                val slideX by animateFloatAsState(
                    targetValue = dragOffsetX.coerceIn(-160f, 160f),
                    animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
                    label = "card_slide_x"
                )

                LinearProgressIndicator(
                    progress = { animatedProgress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(99.dp))
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Card ${safePos + 1} of ${visibleIndices.size} • Tap to flip or swipe",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Surface(
                        shape = RoundedCornerShape(99.dp),
                        color = IndigoSoft
                    ) {
                        Text(
                            text = "Reviewed ${reviewCount}x",
                            color = IndigoOnSoft,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                }

                // 3D Flipping & Tiltable Card
                Card(
                    shape = RoundedCornerShape(28.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (rotation <= 90f) MaterialTheme.colorScheme.surface
                        else MaterialTheme.colorScheme.primaryContainer
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 260.dp)
                        .graphicsLayer {
                            translationX = slideX
                            rotationX = tiltX
                            rotationY = rotation + tiltY
                            cameraDistance = 12f * density
                        }
                        .pointerInput(deck.deckId, originalIndex, visibleIndices.size) {
                            detectDragGestures(
                                onDragEnd = {
                                    if (dragOffsetX < -120f) {
                                        reviewedIndices = reviewedIndices + originalIndex
                                        positionIndex = if (safePos < visibleIndices.lastIndex) safePos + 1 else 0
                                    } else if (dragOffsetX > 120f && safePos > 0) {
                                        positionIndex = safePos - 1
                                    }
                                    dragOffsetX = 0f
                                    dragOffsetY = 0f
                                },
                                onDragCancel = {
                                    dragOffsetX = 0f
                                    dragOffsetY = 0f
                                }
                            ) { change, dragAmount ->
                                change.consume()
                                dragOffsetX += dragAmount.x
                                dragOffsetY += dragAmount.y
                            }
                        }
                        .clickable {
                            flipped = !flipped
                            reviewedIndices = reviewedIndices + originalIndex
                        }
                        .testTag("flashcard_flip_surface")
                ) {
                    if (rotation <= 90f) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = 260.dp)
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    color = AmberSoft,
                                    shape = RoundedCornerShape(99.dp)
                                ) {
                                    Text(
                                        text = card.partOfSpeech.ifBlank { "Expression" },
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = AmberOnSoft,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
                                    )
                                }
                                IconButton(
                                    onClick = { tts.speak(card.term) },
                                    modifier = Modifier.size(48.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Filled.VolumeUp,
                                        contentDescription = "Pronounce phrase",
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }

                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = card.term,
                                    style = MaterialTheme.typography.displaySmall,
                                    textAlign = TextAlign.Center
                                )
                                if (card.phonetic.isNotBlank()) {
                                    Text(
                                        text = card.phonetic,
                                        fontFamily = JetBrainsMonoFontFamily,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    Icons.Filled.Flip,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = "Tap to reveal meaning & study tip",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    } else {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = 260.dp)
                                .graphicsLayer { rotationY = 180f }
                                .padding(24.dp),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(
                                    text = card.meaning,
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                if (card.example.isNotBlank()) {
                                    TranslatableEnglishText(
                                        text = "\"${card.example}\"",
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.85f),
                                        underlineColor = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                            }
                            if (card.teachingTip.isNotBlank()) {
                                Surface(
                                    color = MaterialTheme.colorScheme.surface,
                                    shape = RoundedCornerShape(14.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            Icons.Filled.TipsAndUpdates,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.primary
                                        )
                                        TranslatableEnglishText(
                                            text = card.teachingTip,
                                            style = MaterialTheme.typography.bodyMedium
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Spaced-review & Mastery actions
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            reviewedIndices = reviewedIndices + originalIndex
                            onToggleMastery(deck.deckId, originalIndex, false)
                            if (safePos < visibleIndices.lastIndex) {
                                positionIndex = safePos + 1
                            } else {
                                positionIndex = 0
                            }
                        },
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(52.dp)
                            .testTag("still_practicing_button")
                    ) {
                        Text("Still Practicing", maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    Button(
                        onClick = {
                            reviewedIndices = reviewedIndices + originalIndex
                            onToggleMastery(deck.deckId, originalIndex, !isMastered)
                            if (!isMastered && safePos < visibleIndices.lastIndex) {
                                positionIndex = safePos + 1
                            }
                        },
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isMastered) MintSoft else MaterialTheme.colorScheme.primary,
                            contentColor = if (isMastered) MintOnSoft else MaterialTheme.colorScheme.onPrimary
                        ),
                        modifier = Modifier
                            .weight(1f)
                            .height(52.dp)
                            .testTag("master_card_button")
                    ) {
                        Icon(
                            Icons.Filled.CheckCircle,
                            contentDescription = null,
                            tint = if (isMastered) MintTertiary else MaterialTheme.colorScheme.onPrimary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = if (isMastered) "Mastered ✓" else "Master (+10 XP)",
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = { if (safePos > 0) positionIndex = safePos - 1 },
                        enabled = safePos > 0,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                    ) {
                        Text("Previous")
                    }
                    Button(
                        onClick = {
                            reviewedIndices = reviewedIndices + originalIndex
                            if (safePos < visibleIndices.lastIndex) {
                                positionIndex = safePos + 1
                            } else {
                                positionIndex = 0
                            }
                        },
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                    ) {
                        Text(if (safePos < visibleIndices.lastIndex) "Next Card" else "Restart Deck")
                    }
                }
            }

            // Record study session into Firestore history
            Button(
                onClick = {
                    val reviewedCount = reviewedIndices.size.coerceAtLeast(1)
                    onRecordStudySession(
                        deck.title,
                        deck.level,
                        reviewedCount,
                        totalMasteredInDeck,
                        deck.cards.size
                    )
                    sessionSaved = true
                },
                enabled = !sessionSaved,
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (sessionSaved) MintSoft else MaterialTheme.colorScheme.secondary,
                    contentColor = if (sessionSaved) MintOnSoft else MaterialTheme.colorScheme.onSecondary
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .testTag("save_study_session_button")
            ) {
                Icon(
                    imageVector = if (sessionSaved) Icons.Filled.CheckCircle else Icons.Filled.Save,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    if (sessionSaved) {
                        "Study Session Logged ($totalMasteredInDeck/${deck.cards.size} mastered)"
                    } else {
                        "Save Study Session (${reviewedIndices.size.coerceAtLeast(1)} reviewed)"
                    }
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun DeckEditorDialog(
    dialogTitle: String,
    confirmLabel: String,
    initialTitle: String = "",
    initialLevel: CefrLevel = CefrLevel.B2,
    initialCards: List<FlashcardItem> = emptyList(),
    isBusy: Boolean,
    onDismiss: () -> Unit,
    onSave: (title: String, level: CefrLevel, cards: List<FlashcardItem>) -> Unit
) {
    var title by remember { mutableStateOf(initialTitle) }
    var level by remember { mutableStateOf(initialLevel) }
    var term by remember { mutableStateOf("") }
    var meaning by remember { mutableStateOf("") }
    var example by remember { mutableStateOf("") }
    var tip by remember { mutableStateOf("") }
    val cards = remember { mutableStateListOf<FlashcardItem>().apply { addAll(initialCards) } }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("$dialogTitle (${cards.size} cards)") },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it.take(80) },
                    label = { Text("Deck Title") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("deck_title_input")
                )
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    CefrLevel.entries.forEach { lvl ->
                        FilterChip(
                            selected = level == lvl,
                            onClick = { level = lvl },
                            label = { Text(lvl.label) }
                        )
                    }
                }

                if (cards.isNotEmpty()) {
                    Text(
                        text = "Cards in this deck",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                    cards.forEachIndexed { index, item ->
                        Surface(
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 10.dp, vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "${index + 1}. ${item.term}",
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = item.meaning,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                IconButton(
                                    onClick = { cards.removeAt(index) },
                                    modifier = Modifier.size(48.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.Close,
                                        contentDescription = "Remove card ${item.term}",
                                        tint = MaterialTheme.colorScheme.error
                                    )
                                }
                            }
                        }
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                }

                OutlinedTextField(
                    value = term,
                    onValueChange = { term = it },
                    label = { Text("Word or Idiom") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("deck_term_input")
                )
                OutlinedTextField(
                    value = meaning,
                    onValueChange = { meaning = it },
                    label = { Text("Meaning") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("deck_meaning_input")
                )
                OutlinedTextField(
                    value = example,
                    onValueChange = { example = it },
                    label = { Text("Example Sentence") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = tip,
                    onValueChange = { tip = it },
                    label = { Text("Study Tip") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedButton(
                    onClick = {
                        if (term.isNotBlank() && meaning.isNotBlank() && cards.size < 40) {
                            cards.add(
                                FlashcardItem(
                                    term = term.trim(),
                                    phonetic = "",
                                    partOfSpeech = "Custom",
                                    meaning = meaning.trim(),
                                    example = example.trim(),
                                    teachingTip = tip.trim()
                                )
                            )
                            term = ""
                            meaning = ""
                            example = ""
                            tip = ""
                        }
                    },
                    enabled = term.isNotBlank() && meaning.isNotBlank() && cards.size < 40,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 48.dp)
                        .testTag("deck_add_card_button")
                ) {
                    Text("+ Add Card")
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val finalCards = cards.toMutableList()
                    if (term.isNotBlank() && meaning.isNotBlank() && finalCards.size < 40) {
                        finalCards.add(
                            FlashcardItem(
                                term = term.trim(),
                                phonetic = "",
                                partOfSpeech = "Custom",
                                meaning = meaning.trim(),
                                example = example.trim(),
                                teachingTip = tip.trim()
                            )
                        )
                    }
                    if (title.isNotBlank() && finalCards.isNotEmpty()) {
                        onSave(title, level, finalCards)
                    }
                },
                enabled = !isBusy && title.isNotBlank() && (cards.isNotEmpty() || (term.isNotBlank() && meaning.isNotBlank())),
                modifier = Modifier
                    .heightIn(min = 48.dp)
                    .testTag("deck_save_button")
            ) {
                Text(confirmLabel)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
