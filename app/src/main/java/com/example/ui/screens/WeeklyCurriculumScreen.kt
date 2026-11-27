package com.example.ui.screens

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material.icons.filled.Search
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
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.data.content.CuratedWeeklyCurriculum
import com.example.data.model.CefrLevel
import com.example.data.model.ClubContentItem
import com.example.data.model.ClubContentType
import com.example.data.model.VocabDomain
import com.example.data.model.WeeklyProgress
import com.example.data.model.WeeklyVocabWord
import com.example.ui.UiState
import com.example.ui.components.CefrBadge
import com.example.ui.components.TranslatableEnglishText
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft
import com.example.util.rememberTtsSpeaker

private enum class CurriculumTab(val label: String) {
    WORDS_STORY("Words & Story"),
    STORY_CHAIN("Story Chain"),
    GAMES("Mini-Games")
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun WeeklyCurriculumScreen(
    weeklyProgressMap: Map<Int, WeeklyProgress>,
    clubContentState: UiState<List<ClubContentItem>> = UiState.Success(emptyList()),
    onToggleWord: (weekNumber: Int, wordId: String) -> Unit,
    onCompleteSession: (weekNumber: Int, sessionNumber: Int, level: CefrLevel, title: String, wordsPracticed: Int) -> Unit,
    onRecordGameResult: (weekNumber: Int, title: String, level: CefrLevel, xp: Long, accuracyPct: Long, wordsCount: Int) -> Unit,
    onGenerateAiQuizFromSession: (topic: String, level: CefrLevel, focusWords: List<String>) -> Unit,
    onBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val tts = rememberTtsSpeaker()
    var selectedWeekNum by remember { mutableIntStateOf(1) }
    var selectedSessionNum by remember { mutableIntStateOf(1) }
    var selectedDomain by remember { mutableStateOf<VocabDomain?>(null) }
    var activeTab by remember { mutableStateOf(CurriculumTab.WORDS_STORY) }
    var searchQuery by remember { mutableStateOf("") }

    val week = CuratedWeeklyCurriculum.weeks.firstOrNull { it.weekNumber == selectedWeekNum }
        ?: CuratedWeeklyCurriculum.weeks.first()
    val progress = weeklyProgressMap[week.weekNumber]
    val masteredSet = progress?.masteredWordIds?.toSet().orEmpty()
    val completedSessions = progress?.completedSessions.orEmpty()

    val sessionPlan = week.sessions.firstOrNull { it.sessionNumber == selectedSessionNum } ?: week.sessions.first()
    val sessionWords = remember(week.weekNumber, sessionPlan.sessionNumber) {
        week.words.filter { it.sessionNumber == sessionPlan.sessionNumber }
    }
    val filteredWords = remember(sessionWords, selectedDomain, searchQuery) {
        val q = searchQuery.trim().lowercase()
        sessionWords.filter { word ->
            val domainMatch = selectedDomain == null || word.domain == selectedDomain
            val queryMatch = q.isEmpty() ||
                word.word.lowercase().contains(q) ||
                word.arabic.contains(q) ||
                word.meaning.lowercase().contains(q)
            domainMatch && queryMatch
        }
    }

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.TopCenter
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .widthIn(max = 800.dp),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
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
                                .testTag("curriculum_back_button")
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "200-Word Club",
                            style = MaterialTheme.typography.displaySmall
                        )
                        Text(
                            text = "3 sessions/week • 200 dedicated words across 5 domains",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Week Selector
            item {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    CuratedWeeklyCurriculum.weeks.forEach { w ->
                        FilterChip(
                            selected = selectedWeekNum == w.weekNumber,
                            onClick = {
                                selectedWeekNum = w.weekNumber
                                selectedSessionNum = 1
                            },
                            label = { Text("Week ${w.weekNumber}") },
                            modifier = Modifier.testTag("week_chip_${w.weekNumber}")
                        )
                    }
                }
            }

            // Weekly 200-Word Mastery Card
            item {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
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
                                text = week.title,
                                style = MaterialTheme.typography.titleLarge,
                                color = MaterialTheme.colorScheme.onPrimary,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.weight(1f)
                            )
                            Surface(
                                color = MaterialTheme.colorScheme.secondary,
                                shape = RoundedCornerShape(99.dp)
                            ) {
                                Text(
                                    text = "${masteredSet.size}/${week.words.size}",
                                    color = MaterialTheme.colorScheme.onSecondary,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                )
                            }
                        }
                        Text(
                            text = week.themeStory,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.88f)
                        )
                        LinearProgressIndicator(
                            progress = { (masteredSet.size.toFloat() / week.words.size.coerceAtLeast(1).toFloat()).coerceIn(0f, 1f) },
                            color = MaterialTheme.colorScheme.secondary,
                            trackColor = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.25f),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(99.dp))
                        )
                    }
                }
            }

            // 3 Weekly Teaching Sessions Strip
            item {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    week.sessions.forEach { session ->
                        val isDone = session.sessionNumber.toLong() in completedSessions
                        FilterChip(
                            selected = selectedSessionNum == session.sessionNumber,
                            onClick = { selectedSessionNum = session.sessionNumber },
                            label = { Text(session.dayLabel) },
                            leadingIcon = if (isDone) {
                                { Icon(Icons.Filled.CheckCircle, contentDescription = "Completed", modifier = Modifier.size(16.dp)) }
                            } else null,
                            modifier = Modifier.testTag("session_chip_${session.sessionNumber}")
                        )
                    }
                }
            }

            // Tab Switcher: Words & Story | Story Chain | Mini-Games
            item {
                SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                    CurriculumTab.entries.forEachIndexed { idx, tab ->
                        SegmentedButton(
                            selected = activeTab == tab,
                            onClick = { activeTab = tab },
                            shape = SegmentedButtonDefaults.itemShape(idx, CurriculumTab.entries.size),
                            modifier = Modifier.testTag("curriculum_tab_${tab.name.lowercase()}")
                        ) {
                            Text(tab.label, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                    }
                }
            }

            when (activeTab) {
                CurriculumTab.STORY_CHAIN -> {
                    item {
                        StoryChainInteractiveCard(
                            weekNumber = week.weekNumber,
                            sessionPlan = sessionPlan,
                            sessionWords = sessionWords,
                            tts = tts,
                            onWordPracticed = { wordId ->
                                if (wordId !in masteredSet) {
                                    onToggleWord(week.weekNumber, wordId)
                                }
                            },
                            onFinishChain = { title, lvl, xp, acc, count ->
                                onRecordGameResult(week.weekNumber, title, lvl, xp, acc, count)
                            }
                        )
                    }
                }

                CurriculumTab.GAMES -> {
                    item {
                        WeeklyInteractiveGamesCard(
                            weekNumber = week.weekNumber,
                            sessionPlan = sessionPlan,
                            sessionWords = sessionWords,
                            tts = tts,
                            onRecordGameResult = { title, lvl, xp, acc, count ->
                                onRecordGameResult(week.weekNumber, title, lvl, xp, acc, count)
                            }
                        )
                    }
                }

                CurriculumTab.WORDS_STORY -> {
                    item {
                        Card(
                            shape = RoundedCornerShape(20.dp),
                            colors = CardDefaults.cardColors(containerColor = AmberSoft),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = sessionPlan.title,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = AmberOnSoft
                                )
                                TranslatableEnglishText(
                                    text = sessionPlan.storyOpening,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = AmberOnSoft,
                                    underlineColor = AmberOnSoft
                                )
                                Text(
                                    text = sessionPlan.teachingTip,
                                    style = MaterialTheme.typography.labelLarge,
                                    color = AmberOnSoft.copy(alpha = 0.85f)
                                )
                                FlowRow(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    val isSessionDone = sessionPlan.sessionNumber.toLong() in completedSessions
                                    Button(
                                        onClick = {
                                            onCompleteSession(
                                                week.weekNumber,
                                                sessionPlan.sessionNumber,
                                                CefrLevel.B2,
                                                sessionPlan.title,
                                                sessionWords.size
                                            )
                                        },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = if (isSessionDone) MintOnSoft else MaterialTheme.colorScheme.primary
                                        ),
                                        shape = RoundedCornerShape(12.dp),
                                        modifier = Modifier
                                            .heightIn(min = 48.dp)
                                            .testTag("complete_session_button")
                                    ) {
                                        Icon(Icons.Filled.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(Modifier.width(6.dp))
                                        Text(
                                            if (isSessionDone) "Session Done" else "Complete (+40 XP)",
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                    OutlinedButton(
                                        onClick = {
                                            val sampleFocus = sessionWords.take(10).map { it.word }
                                            onGenerateAiQuizFromSession(
                                                sessionPlan.title.substringBefore("(").trim(),
                                                CefrLevel.B1,
                                                sampleFocus
                                            )
                                        },
                                        shape = RoundedCornerShape(12.dp),
                                        modifier = Modifier
                                            .heightIn(min = 48.dp)
                                            .testTag("session_ai_quiz_button")
                                    ) {
                                        Icon(Icons.Filled.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(Modifier.width(4.dp))
                                        Text("AI Quiz", maxLines = 1)
                                    }
                                }
                            }
                        }
                    }

                    val bonusPacks = (clubContentState as? UiState.Success)?.data.orEmpty()
                        .filter { item ->
                            ClubContentType.fromRaw(item.contentType) == ClubContentType.WEEKLY_PACK &&
                                item.vocabWords.isNotEmpty() &&
                                (item.weekNumber == 0L || item.weekNumber.toInt() == week.weekNumber) &&
                                (item.sessionNumber == 0L || item.sessionNumber.toInt() == sessionPlan.sessionNumber)
                        }
                    if (bonusPacks.isNotEmpty()) {
                        items(bonusPacks, key = { "bonus_${it.id}" }) { pack ->
                            Card(
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = IndigoSoft),
                                modifier = Modifier.fillMaxWidth()
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
                                        Text(
                                            text = "Teacher Bonus: ${pack.title}",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = IndigoOnSoft,
                                            modifier = Modifier.weight(1f)
                                        )
                                        CefrBadge(level = CefrLevel.fromRaw(pack.cefrLevel))
                                    }
                                    if (pack.description.isNotBlank()) {
                                        Text(
                                            text = pack.description,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = IndigoOnSoft.copy(alpha = 0.85f)
                                        )
                                    }
                                    pack.vocabWords.forEach { vocab ->
                                        Surface(
                                            color = MaterialTheme.colorScheme.surface,
                                            shape = RoundedCornerShape(12.dp),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Column(modifier = Modifier.weight(1f)) {
                                                    Text(
                                                        text = "${vocab.word} (${vocab.arabic})",
                                                        fontWeight = FontWeight.Bold
                                                    )
                                                    if (vocab.meaning.isNotBlank()) {
                                                        Text(
                                                            text = vocab.meaning,
                                                            style = MaterialTheme.typography.bodySmall,
                                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                                        )
                                                    }
                                                    if (vocab.storyLine.isNotBlank()) {
                                                        TranslatableEnglishText(
                                                            text = "\"${vocab.storyLine}\"",
                                                            style = MaterialTheme.typography.bodySmall
                                                        )
                                                    }
                                                }
                                                IconButton(
                                                    onClick = { tts.speak("${vocab.word}. ${vocab.storyLine}") },
                                                    modifier = Modifier.size(48.dp)
                                                ) {
                                                    Icon(
                                                        Icons.AutoMirrored.Filled.VolumeUp,
                                                        contentDescription = "Listen to ${vocab.word}"
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Domain Filter Chips with counts
                    item {
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            FilterChip(
                                selected = selectedDomain == null,
                                onClick = { selectedDomain = null },
                                label = { Text("All Domains (${sessionWords.size})") }
                            )
                            VocabDomain.entries.forEach { domain ->
                                val countInSession = sessionWords.count { it.domain == domain }
                                val masteredInWeek = week.words.count { it.domain == domain && it.id in masteredSet }
                                FilterChip(
                                    selected = selectedDomain == domain,
                                    onClick = { selectedDomain = if (selectedDomain == domain) null else domain },
                                    label = { Text("${domain.label} ($countInSession • ★$masteredInWeek/40)") }
                                )
                            }
                        }
                    }

                    item {
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            placeholder = { Text("Filter words in this session...") },
                            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
                            singleLine = true,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    items(filteredWords, key = { it.id }) { item ->
                        WeeklyWordCard(
                            word = item,
                            isMastered = item.id in masteredSet,
                            onSpeak = { tts.speak("${item.word}. ${item.storyLine}") },
                            onToggleMaster = { onToggleWord(week.weekNumber, item.id) }
                        )
                    }
                }
            }

            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}

@Composable
private fun WeeklyWordCard(
    word: WeeklyVocabWord,
    isMastered: Boolean,
    onSpeak: () -> Unit,
    onToggleMaster: () -> Unit
) {
    val textColor = if (isMastered) MintOnSoft else MaterialTheme.colorScheme.onSurface
    val mutedColor = if (isMastered) MintOnSoft.copy(alpha = 0.8f) else MaterialTheme.colorScheme.onSurfaceVariant
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isMastered) MintSoft else MaterialTheme.colorScheme.surface
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
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
                    CefrBadge(level = word.cefrLevel)
                    Text(
                        text = word.word,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = textColor
                    )
                    Text(
                        text = word.arabic,
                        style = MaterialTheme.typography.titleMedium,
                        color = if (isMastered) MintOnSoft else MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onSpeak, modifier = Modifier.size(48.dp)) {
                        Icon(
                            Icons.AutoMirrored.Filled.VolumeUp,
                            contentDescription = "Listen",
                            tint = textColor
                        )
                    }
                    IconButton(
                        onClick = onToggleMaster,
                        modifier = Modifier
                            .size(48.dp)
                            .testTag("master_word_${word.id}")
                    ) {
                        Icon(
                            imageVector = if (isMastered) Icons.Filled.CheckCircle else Icons.Filled.RadioButtonUnchecked,
                            contentDescription = if (isMastered) "Mastered" else "Mark mastered",
                            tint = if (isMastered) MintOnSoft else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            Text(
                text = "${word.domain.label} — ${word.meaning}",
                style = MaterialTheme.typography.bodyMedium,
                color = mutedColor
            )
            TranslatableEnglishText(
                text = "\"${word.storyLine}\"",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = textColor,
                underlineColor = if (isMastered) MintOnSoft else MaterialTheme.colorScheme.primary
            )
        }
    }
}
