package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.BookmarkAdd
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.content.CuratedDictionary
import com.example.data.model.CefrLevel
import com.example.data.model.DictionaryEntry
import com.example.data.model.FlashcardItem
import com.example.ui.components.CefrBadge
import com.example.ui.components.Interactive3DLanguageCube
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.JetBrainsMonoFontFamily
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft
import com.example.util.rememberTtsSpeaker

private val AllLevelLabels = listOf("A1", "A2", "B1", "B2", "C1", "C2")
private val TopicFilters = listOf("All Topics", "Daily Life", "Academic", "Science", "Technology", "Medical", "Business", "Legal")

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun DictionaryScreen(
    selectedLevel: CefrLevel?,
    onSelectLevel: (CefrLevel?) -> Unit,
    onSaveWordAsDeck: (title: String, level: CefrLevel, cards: List<FlashcardItem>) -> Unit,
    onBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val tts = rememberTtsSpeaker()
    var query by remember { mutableStateOf("") }
    var expandedId by remember { mutableStateOf<String?>(null) }
    var activeLevelLabel by remember(selectedLevel) { mutableStateOf(selectedLevel?.label) }
    var activeTopic by remember { mutableStateOf("All Topics") }
    var isLoadingFull by remember { mutableStateOf(true) }

    val allEntries by produceState(initialValue = CuratedDictionary.entries, context) {
        value = CuratedDictionary.loadFullDictionary(context)
        isLoadingFull = false
    }

    LaunchedEffect(selectedLevel) {
        activeLevelLabel = selectedLevel?.label
    }

    val filtered = remember(allEntries, query, activeLevelLabel, activeTopic) {
        val q = query.trim().lowercase()
        allEntries.filter { entry ->
            val levelMatch = activeLevelLabel == null || entry.levelLabel == activeLevelLabel
            val topicMatch = activeTopic == "All Topics" || entry.topic.equals(activeTopic, ignoreCase = true)
            val textMatch = q.isEmpty() ||
                entry.english.lowercase().contains(q) ||
                entry.arabic.contains(q) ||
                entry.transliteration.lowercase().contains(q) ||
                entry.topic.lowercase().contains(q)
            levelMatch && topicMatch && textMatch
        }
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
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Row(
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
                            text = "English – Arabic",
                            style = MaterialTheme.typography.displaySmall
                        )
                        Text(
                            text = "Verified A1–C2 vocabulary with IPA phonetics, categories & audio",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Interactive3DLanguageCube(size = 64.dp)
                }
            }

            if (isLoadingFull) {
                item {
                    LinearProgressIndicator(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(4.dp)
                    )
                }
            }

            item {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    placeholder = { Text("Search English, العربية, or domain...") },
                    leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
                    trailingIcon = {
                        if (query.isNotEmpty()) {
                            IconButton(onClick = { query = "" }) {
                                Icon(Icons.Filled.Clear, contentDescription = "Clear search")
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("dictionary_search_input")
                )
            }

            item {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    FilterChip(
                        selected = activeLevelLabel == null,
                        onClick = {
                            activeLevelLabel = null
                            onSelectLevel(null)
                        },
                        label = { Text("All (${allEntries.size})") }
                    )
                    AllLevelLabels.forEach { lvlLabel ->
                        FilterChip(
                            selected = activeLevelLabel == lvlLabel,
                            onClick = {
                                val next = if (activeLevelLabel == lvlLabel) null else lvlLabel
                                activeLevelLabel = next
                                val cefr = CefrLevel.entries.firstOrNull { it.label == next }
                                onSelectLevel(cefr)
                            },
                            label = { Text(lvlLabel) },
                            modifier = Modifier.testTag("dict_level_${lvlLabel.lowercase()}")
                        )
                    }
                }
            }

            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    TopicFilters.forEach { topic ->
                        FilterChip(
                            selected = activeTopic == topic,
                            onClick = { activeTopic = topic },
                            label = { Text(topic) }
                        )
                    }
                }
            }

            item {
                Text(
                    text = "Showing ${filtered.size} valid English entries • Tap a word to save or practice",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (filtered.isEmpty()) {
                item {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                Icons.Filled.Search,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(36.dp)
                            )
                            Text("No matching words found", style = MaterialTheme.typography.titleMedium)
                            Text(
                                "Try clearing your search or switching CEFR levels or domains.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                items(filtered, key = { it.id }) { entry ->
                    DictionaryEntryCard(
                        entry = entry,
                        expanded = expandedId == entry.id,
                        onToggleExpand = {
                            expandedId = if (expandedId == entry.id) null else entry.id
                        },
                        onSpeak = { tts.speak(entry.english) },
                        onSaveCard = {
                            val meaningText = if (entry.transliteration.isNotBlank()) {
                                "${entry.arabic} (${entry.transliteration})"
                            } else {
                                entry.arabic
                            }
                            onSaveWordAsDeck(
                                "${entry.english} (${entry.arabic})",
                                entry.cefrLevel,
                                listOf(
                                    FlashcardItem(
                                        term = entry.english,
                                        phonetic = entry.phonetic,
                                        partOfSpeech = entry.partOfSpeech,
                                        meaning = meaningText,
                                        example = entry.exampleEn.ifBlank { "Domain: ${entry.topic} (${entry.levelLabel})" },
                                        teachingTip = if (entry.exampleAr.isNotBlank()) {
                                            "Arabic example: ${entry.exampleAr}"
                                        } else {
                                            "CEFR ${entry.levelLabel} • ${entry.topic}"
                                        }
                                    )
                                )
                            )
                        }
                    )
                }
            }

            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}

@Composable
private fun DictionaryEntryCard(
    entry: DictionaryEntry,
    expanded: Boolean,
    onToggleExpand: () -> Unit,
    onSpeak: () -> Unit,
    onSaveCard: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onToggleExpand)
            .testTag("dict_card_${entry.id}")
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (entry.levelLabel == "C1" || entry.levelLabel == "C2") {
                            Surface(
                                color = IndigoSoft,
                                shape = RoundedCornerShape(99.dp)
                            ) {
                                Text(
                                    text = entry.levelLabel,
                                    color = IndigoOnSoft,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 3.dp)
                                )
                            }
                        } else {
                            CefrBadge(level = entry.cefrLevel)
                        }
                        Text(
                            text = entry.partOfSpeech,
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = entry.english,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    if (entry.phonetic.isNotBlank()) {
                        Text(
                            text = entry.phonetic,
                            fontFamily = JetBrainsMonoFontFamily,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Column(
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier.padding(horizontal = 6.dp)
                ) {
                    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                        Text(
                            text = entry.arabic,
                            fontSize = 21.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    if (entry.transliteration.isNotBlank()) {
                        Text(
                            text = entry.transliteration,
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                IconButton(
                    onClick = onSpeak,
                    modifier = Modifier.size(48.dp)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.VolumeUp,
                        contentDescription = "Pronounce ${entry.english}",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }

            AnimatedVisibility(visible = expanded) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    if (entry.exampleEn.isNotBlank()) {
                        Surface(
                            color = MintSoft,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = entry.exampleEn,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MintOnSoft
                                )
                                if (entry.exampleAr.isNotBlank()) {
                                    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                                        Text(
                                            text = entry.exampleAr,
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MintOnSoft,
                                            modifier = Modifier.fillMaxWidth()
                                        )
                                    }
                                }
                            }
                        }
                    } else {
                        Surface(
                            color = MintSoft,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Domain: ${entry.topic} • CEFR ${entry.levelLabel}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MintOnSoft
                                )
                            }
                        }
                    }
                    OutlinedButton(
                        onClick = onSaveCard,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                    ) {
                        Icon(Icons.Filled.BookmarkAdd, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Save to Flashcard Deck")
                    }
                }
            }
        }
    }
}
