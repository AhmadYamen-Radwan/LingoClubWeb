package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.content.CuratedAudiobooks
import com.example.data.model.Audiobook
import com.example.data.model.AudiobookChapter
import com.example.data.model.CefrLevel
import com.example.ui.components.AnimatedEqualizerBars
import com.example.ui.components.CefrBadge
import com.example.ui.components.CefrFilterRow
import com.example.ui.components.TranslatableEnglishText
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft
import com.example.util.rememberTtsSpeaker

@Composable
fun AudiobooksScreen(
    selectedLevel: CefrLevel? = null,
    onSelectLevel: (CefrLevel?) -> Unit = {},
    onCompleteChapter: (title: String, level: CefrLevel, durationMin: Int) -> Unit,
    onBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var activeBook by remember { mutableStateOf<Audiobook?>(null) }
    var activeChapterIndex by remember { mutableIntStateOf(0) }

    val currentBook = activeBook
    if (currentBook != null) {
        val chapter = currentBook.chapters.getOrNull(activeChapterIndex) ?: currentBook.chapters.first()
        BackHandler { activeBook = null }
        AudiobookPlayerView(
            book = currentBook,
            chapter = chapter,
            chapterIndex = activeChapterIndex,
            onSelectChapter = { activeChapterIndex = it },
            onCompleteChapter = {
                onCompleteChapter("${currentBook.title} • Ch.${chapter.chapterNumber}", currentBook.cefrLevel, chapter.durationMin)
            },
            onBack = { activeBook = null },
            modifier = modifier
        )
        return
    }

    val filteredBooks = CuratedAudiobooks.books.filter {
        selectedLevel == null || it.cefrLevel == selectedLevel
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
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (onBack != null) {
                        IconButton(
                            onClick = onBack,
                            modifier = Modifier
                                .size(48.dp)
                                .testTag("audiobooks_back_button")
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Audiobook Studio",
                            style = MaterialTheme.typography.displaySmall
                        )
                        Text(
                            text = "Leveled listening stories (A1–B2) with speed control & Arabic support",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            item {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = IndigoSoft),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(18.dp),
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = IndigoOnSoft.copy(alpha = 0.14f),
                            modifier = Modifier.size(48.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Filled.Headphones,
                                    contentDescription = null,
                                    tint = IndigoOnSoft
                                )
                            }
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Listen Together & Retell",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = IndigoOnSoft
                            )
                            Text(
                                text = "Play narrated chapters with live paragraph highlights, slow to 0.75x for A1/A2 learners, and use the reflection prompt to spark conversation.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = IndigoOnSoft.copy(alpha = 0.85f)
                            )
                        }
                    }
                }
            }

            item {
                CefrFilterRow(
                    selectedLevel = selectedLevel,
                    onSelectLevel = onSelectLevel,
                    tagPrefix = "audiobooks"
                )
            }

            items(filteredBooks, key = { it.id }) { book ->
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            activeBook = book
                            activeChapterIndex = 0
                        }
                        .testTag("audiobook_card_${book.id}")
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                CefrBadge(level = book.cefrLevel)
                                Text(
                                    text = book.genre,
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            Text(
                                text = "${book.chapters.size} ch • ${book.chapters.sumOf { it.durationMin }} min",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Text(
                            text = book.title,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = book.subtitle,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "Narrated by ${book.narrator}",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Button(
                            onClick = {
                                activeBook = book
                                activeChapterIndex = 0
                            },
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                        ) {
                            Icon(Icons.Filled.Headphones, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Listen Now")
                        }
                    }
                }
            }

            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun AudiobookPlayerView(
    book: Audiobook,
    chapter: AudiobookChapter,
    chapterIndex: Int,
    onSelectChapter: (Int) -> Unit,
    onCompleteChapter: () -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val tts = rememberTtsSpeaker()
    var isPlaying by remember(chapter.id) { mutableStateOf(false) }
    var activeParagraphId by remember(chapter.id) { mutableStateOf<String?>(null) }
    var speechRate by remember { mutableFloatStateOf(0.95f) }
    var showArabic by remember { mutableStateOf(true) }
    var completed by remember(chapter.id) { mutableStateOf(false) }

    DisposableEffect(chapter.id) {
        onDispose { tts.stop() }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Column(
            modifier = Modifier.widthIn(max = 720.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = {
                        tts.stop()
                        onBack()
                    },
                    modifier = Modifier.size(48.dp)
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back to library")
                }
                Text(
                    text = book.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )
                CefrBadge(level = book.cefrLevel)
            }

            if (book.chapters.size > 1) {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    book.chapters.forEachIndexed { idx, ch ->
                        FilterChip(
                            selected = idx == chapterIndex,
                            onClick = {
                                tts.stop()
                                isPlaying = false
                                activeParagraphId = null
                                onSelectChapter(idx)
                            },
                            label = { Text("Ch ${ch.chapterNumber}: ${ch.title}") }
                        )
                    }
                }
            }

            // Player Controls Card
            Card(
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
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
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Chapter ${chapter.chapterNumber}: ${chapter.title}",
                                style = MaterialTheme.typography.headlineSmall,
                                color = MaterialTheme.colorScheme.onPrimary,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "${chapter.durationMin} min listening • ${chapter.paragraphs.size} story segments",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.85f)
                            )
                        }
                        AnimatedEqualizerBars(
                            isPlaying = isPlaying,
                            barColor = MaterialTheme.colorScheme.onPrimary
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Button(
                            onClick = {
                                if (isPlaying) {
                                    tts.stop()
                                    isPlaying = false
                                    activeParagraphId = null
                                } else {
                                    isPlaying = true
                                    tts.speakSequence(
                                        items = chapter.paragraphs.map { it.id to it.english },
                                        rate = speechRate,
                                        onUtteranceStart = { id -> activeParagraphId = id },
                                        onFinished = {
                                            isPlaying = false
                                            activeParagraphId = null
                                        }
                                    )
                                }
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.secondary
                            ),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                                .testTag("audiobook_play_button")
                        ) {
                            Icon(
                                imageVector = if (isPlaying) Icons.Filled.Stop else Icons.Filled.PlayArrow,
                                contentDescription = null
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(if (isPlaying) "Stop Audio" else "Play Chapter")
                        }

                        OutlinedButton(
                            onClick = { showArabic = !showArabic },
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = MaterialTheme.colorScheme.onPrimary
                            ),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.5f)),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.height(48.dp)
                        ) {
                            Icon(Icons.Filled.Translate, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(if (showArabic) "Hide AR" else "Show AR")
                        }
                    }

                    // Speed chips
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "Speed:",
                            color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.85f),
                            style = MaterialTheme.typography.labelLarge,
                            modifier = Modifier.align(Alignment.CenterVertically)
                        )
                        listOf(0.75f to "0.75x", 0.95f to "1.0x", 1.25f to "1.25x").forEach { (rate, label) ->
                            FilterChip(
                                selected = speechRate == rate,
                                onClick = { speechRate = rate },
                                label = { Text(label) }
                            )
                        }
                    }
                }
            }

            // Story Paragraphs
            chapter.paragraphs.forEach { para ->
                val isCurrent = activeParagraphId == para.id
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isCurrent) AmberSoft else MaterialTheme.colorScheme.surface
                    ),
                    border = if (isCurrent) BorderStroke(2.dp, AmberOnSoft.copy(alpha = 0.5f)) else null,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            TranslatableEnglishText(
                                text = para.english,
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = if (isCurrent) FontWeight.SemiBold else FontWeight.Normal,
                                color = if (isCurrent) AmberOnSoft else MaterialTheme.colorScheme.onSurface,
                                underlineColor = if (isCurrent) AmberOnSoft else MaterialTheme.colorScheme.primary,
                                modifier = Modifier.weight(1f)
                            )
                            IconButton(
                                onClick = {
                                    isPlaying = false
                                    activeParagraphId = para.id
                                    tts.speak(para.english, speechRate)
                                },
                                modifier = Modifier.size(48.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.VolumeUp,
                                    contentDescription = "Listen to paragraph",
                                    tint = if (isCurrent) AmberOnSoft else MaterialTheme.colorScheme.primary
                                )
                            }
                        }

                        if (showArabic) {
                            Surface(
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.65f),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = para.arabic,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(10.dp)
                                )
                            }
                        }

                        if (para.keyVocabulary.isNotEmpty()) {
                            FlowRow(
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                para.keyVocabulary.forEach { word ->
                                    AssistChip(
                                        onClick = { tts.speak(word, speechRate) },
                                        label = { Text(word) },
                                        leadingIcon = {
                                            Icon(
                                                Icons.AutoMirrored.Filled.VolumeUp,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Group Discussion Prompt
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MintSoft),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = "Group Story Reflection",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MintOnSoft
                    )
                    TranslatableEnglishText(
                        text = chapter.reflectionPrompt,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MintOnSoft,
                        underlineColor = MintOnSoft
                    )
                }
            }

            Button(
                onClick = {
                    if (!completed) {
                        completed = true
                        onCompleteChapter()
                    } else {
                        tts.stop()
                        onBack()
                    }
                },
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .testTag("audiobook_complete_button")
            ) {
                Icon(Icons.Filled.CheckCircle, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text(if (completed) "Chapter Logged! (+30 XP) — Back" else "Complete Listening (+30 XP)")
            }

            Spacer(Modifier.height(16.dp))
        }
    }
}
