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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Extension
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.RecordVoiceOver
import androidx.compose.material.icons.filled.SportsEsports
import androidx.compose.material.icons.filled.Style
import androidx.compose.material.icons.filled.TheaterComedy
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.BorderStroke
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MilitaryTech
import androidx.compose.material.icons.filled.Verified
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.example.data.model.ActivityType
import com.example.data.model.BadgeCategory
import com.example.data.model.CefrLevel
import com.example.data.model.LingoBadge
import com.example.data.model.SessionRecord
import com.example.data.model.UserProfile
import com.example.ui.UiState
import com.example.ui.components.CefrBadge
import com.example.ui.components.Trophy3DFigure
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.CoralOnSoft
import com.example.ui.theme.CoralSoft
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft
import java.text.SimpleDateFormat
import java.util.Locale

private fun cefrDescription(level: CefrLevel): String = when (level) {
    CefrLevel.A1 -> "A1 Starter"
    CefrLevel.A2 -> "A2 Elementary"
    CefrLevel.B1 -> "B1 Intermediate"
    CefrLevel.B2 -> "B2 Upper-Int"
}

private fun iconForActivity(type: ActivityType): ImageVector = when (type) {
    ActivityType.QUIZ -> Icons.Filled.Bolt
    ActivityType.PUZZLE -> Icons.Filled.Extension
    ActivityType.CARDS -> Icons.Filled.Style
    ActivityType.GUESSING -> Icons.Filled.RecordVoiceOver
    ActivityType.ROLEPLAY -> Icons.Filled.TheaterComedy
    ActivityType.AUDIOBOOK -> Icons.Filled.Headphones
    ActivityType.WEEKLY_SESSION -> Icons.Filled.CalendarMonth
    ActivityType.GAME -> Icons.Filled.SportsEsports
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ProfileScreen(
    profileState: UiState<UserProfile?>,
    sessionHistoryState: UiState<List<SessionRecord>>,
    fallbackName: String,
    isOfflineMode: Boolean = false,
    onSelectLearningLevel: (CefrLevel) -> Unit,
    onSignOut: () -> Unit,
    onBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val profile = (profileState as? UiState.Success)?.data
    val displayName = profile?.displayName?.ifBlank { fallbackName } ?: fallbackName
    val currentLevel = CefrLevel.fromRaw(profile?.learningLevel)
    val historyList = (sessionHistoryState as? UiState.Success)?.data.orEmpty()
    val avgAccuracyText = remember(historyList) {
        if (historyList.isEmpty()) "—" else "${historyList.map { it.accuracyPct }.average().toInt()}%"
    }
    val earnedBadgeIds = remember(profile?.earnedBadges) {
        profile?.earnedBadges?.toSet().orEmpty()
    }
    var badgeFilter by remember { mutableStateOf<BadgeCategory?>(null) }
    val dateFormatter = remember { SimpleDateFormat("MMM d • HH:mm", Locale.getDefault()) }

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
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        if (onBack != null) {
                            IconButton(
                                onClick = onBack,
                                modifier = Modifier
                                    .size(48.dp)
                                    .testTag("profile_back_button")
                            ) {
                                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                            }
                        }
                        Column {
                            Text(
                                text = "Player Profile",
                                style = MaterialTheme.typography.displaySmall
                            )
                            Text(
                                text = if (isOfflineMode) "Offline & Hotspot Mode • Progress saved locally"
                                else "Your CEFR level & Firestore performance history",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    IconButton(
                        onClick = onSignOut,
                        modifier = Modifier
                            .size(48.dp)
                            .testTag("profile_sign_out_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Logout,
                            contentDescription = if (isOfflineMode) "Sign In Online" else "Sign out",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Hero Identity Card
            item {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        val initials = displayName.split(" ")
                            .filter { it.isNotBlank() }
                            .take(2)
                            .joinToString("") { it.first().uppercase() }
                            .ifBlank { "LC" }

                        Surface(
                            shape = CircleShape,
                            color = Color.White.copy(alpha = 0.22f),
                            modifier = Modifier.size(60.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = initials,
                                    color = Color.White,
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                text = displayName,
                                color = Color.White,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            FlowRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                CefrBadge(level = currentLevel)
                                Text(
                                    text = "${profile?.xp ?: 0L} XP • ${profile?.streak ?: 1L}d Streak",
                                    color = Color.White.copy(alpha = 0.92f),
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold
                                )
                                val teamName = profile?.teamName.orEmpty()
                                if (teamName.isNotBlank()) {
                                    Surface(
                                        shape = RoundedCornerShape(99.dp),
                                        color = Color.White.copy(alpha = 0.2f)
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                                        ) {
                                            Icon(
                                                Icons.Filled.Groups,
                                                contentDescription = null,
                                                tint = Color.White,
                                                modifier = Modifier.size(14.dp)
                                            )
                                            Text(
                                                text = teamName,
                                                color = Color.White,
                                                style = MaterialTheme.typography.labelSmall,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Learning Level Selector
            item {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "Active Learning & Teaching Level",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Switch between A1, A2, B1, and B2 to tailor your study focus and track progress in Firestore.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            CefrLevel.entries.forEach { level ->
                                FilterChip(
                                    selected = currentLevel == level,
                                    onClick = { onSelectLearningLevel(level) },
                                    label = { Text(cefrDescription(level)) },
                                    leadingIcon = if (currentLevel == level) {
                                        {
                                            Icon(
                                                Icons.Filled.CheckCircle,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                    } else null,
                                    modifier = Modifier.testTag("profile_level_${level.name.lowercase()}")
                                )
                            }
                        }
                    }
                }
            }

            // Historical Performance Stats Grid
            item {
                Text(
                    text = "Performance Stats",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            }

            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        StatMetricTile(
                            title = "Weekly Words",
                            value = "${profile?.weeklyWordsMastered ?: 0L}",
                            subtitle = "200/wk club",
                            icon = Icons.AutoMirrored.Filled.MenuBook,
                            containerColor = IndigoSoft,
                            contentColor = IndigoOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                        StatMetricTile(
                            title = "3/Wk Sessions",
                            value = "${profile?.sessionsCompleted ?: 0L}",
                            subtitle = "Sessions taught",
                            icon = Icons.Filled.CalendarMonth,
                            containerColor = MintSoft,
                            contentColor = MintOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        StatMetricTile(
                            title = "Quizzes",
                            value = "${(profile?.quizzesHosted ?: 0L) + (profile?.quizzesPlayed ?: 0L)}",
                            subtitle = "${profile?.quizzesHosted ?: 0L} hosted • ${profile?.quizzesPlayed ?: 0L} solo",
                            icon = Icons.Filled.Bolt,
                            containerColor = AmberSoft,
                            contentColor = AmberOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                        StatMetricTile(
                            title = "Audiobooks",
                            value = "${profile?.audiobooksFinished ?: 0L}",
                            subtitle = "Chapters listened",
                            icon = Icons.Filled.Headphones,
                            containerColor = CoralSoft,
                            contentColor = CoralOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        StatMetricTile(
                            title = "Cards Mastered",
                            value = "${profile?.cardsMastered ?: 0L}",
                            subtitle = "Flashcard decks",
                            icon = Icons.Filled.Style,
                            containerColor = MintSoft,
                            contentColor = MintOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                        StatMetricTile(
                            title = "Avg Accuracy",
                            value = avgAccuracyText,
                            subtitle = "${historyList.size} logged runs",
                            icon = Icons.AutoMirrored.Filled.TrendingUp,
                            containerColor = IndigoSoft,
                            contentColor = IndigoOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    StatMetricTile(
                        title = "Best Live Quiz Score",
                        value = "${profile?.bestLiveQuizScore ?: 0L} pts",
                        subtitle = if ((profile?.bestLiveQuizScore ?: 0L) >= 1000L) {
                            "Live Quiz Ace threshold reached!"
                        } else {
                            "Reach 1,000 pts to unlock Live Quiz Ace badge"
                        },
                        icon = Icons.Filled.EmojiEvents,
                        containerColor = AmberSoft,
                        contentColor = AmberOnSoft,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            // Earned Badges & Achievements Showcase
            item {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("profile_badges_section")
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
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Trophy3DFigure(size = 52.dp)
                                Text(
                                    text = "Badges & Milestones",
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Surface(
                                shape = RoundedCornerShape(99.dp),
                                color = IndigoSoft
                            ) {
                                Text(
                                    text = "${earnedBadgeIds.size}/${LingoBadge.entries.size}",
                                    color = IndigoOnSoft,
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                )
                            }
                        }
                        Text(
                            text = "Earn badges by completing weekly 200-word sessions and scoring big in Live Quiz Clashes.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            FilterChip(
                                selected = badgeFilter == null,
                                onClick = { badgeFilter = null },
                                label = { Text("All") }
                            )
                            BadgeCategory.entries.forEach { cat ->
                                FilterChip(
                                    selected = badgeFilter == cat,
                                    onClick = { badgeFilter = if (badgeFilter == cat) null else cat },
                                    label = { Text(cat.label) }
                                )
                            }
                        }

                        val visibleBadges = LingoBadge.entries.filter {
                            badgeFilter == null || it.category == badgeFilter
                        }
                        visibleBadges.forEach { badge ->
                            val unlocked = badge.name in earnedBadgeIds
                            val progressHint = when (badge) {
                                LingoBadge.FIRST_WEEKLY_SESSION -> "${profile?.sessionsCompleted ?: 0L}/1 sessions"
                                LingoBadge.THREE_WEEKLY_SESSIONS -> "${profile?.sessionsCompleted ?: 0L}/3 sessions"
                                LingoBadge.WEEKLY_WORDS_50 -> "${profile?.weeklyWordsMastered ?: 0L}/50 words"
                                LingoBadge.WEEKLY_WORDS_200 -> "${profile?.weeklyWordsMastered ?: 0L}/200 words"
                                LingoBadge.QUIZ_FIRST_CLASH -> "${profile?.quizzesPlayed ?: 0L}/1 quiz"
                                LingoBadge.LIVE_QUIZ_HIGH_SCORE -> "Best ${profile?.bestLiveQuizScore ?: 0L}/1,000 pts"
                                LingoBadge.QUIZ_PERFECT_ROUND -> "90%+ accuracy in a quiz"
                                LingoBadge.CLUB_HOST_PRO -> "${profile?.quizzesHosted ?: 0L}/1 hosted"
                                LingoBadge.AUDIOBOOK_LISTENER -> "${profile?.audiobooksFinished ?: 0L}/1 chapters"
                                LingoBadge.STAGE_SPEAKER -> "1 roleplay or speech review"
                                LingoBadge.ARCADE_CHALLENGER -> "1 arcade game played"
                                LingoBadge.COMBO_STREAKER -> "5x combo streak in arcade"
                            }
                            BadgeMilestoneCard(
                                badge = badge,
                                unlocked = unlocked,
                                progressHint = progressHint
                            )
                        }
                    }
                }
            }

            // Historical Activity Timeline
            item {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Filled.History, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Text(
                        text = "Historical Performance Log",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            when (sessionHistoryState) {
                is UiState.Loading -> {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
                    }
                }
                is UiState.Error -> {
                    item {
                        Card(
                            shape = RoundedCornerShape(18.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = sessionHistoryState.message,
                                modifier = Modifier.padding(16.dp),
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                }
                is UiState.Success -> {
                    if (historyList.isEmpty()) {
                        item {
                            Card(
                                shape = RoundedCornerShape(20.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(20.dp),
                                    verticalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text("No completed sessions logged yet", fontWeight = FontWeight.Bold)
                                    Text(
                                        text = "Complete a quiz, audiobook chapter, roleplay, or weekly 200-word session to see your stats saved here.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    } else {
                        items(historyList.take(30), key = { it.id }) { record ->
                            val type = ActivityType.fromRaw(record.activityType)
                            val level = CefrLevel.fromRaw(record.cefrLevel)
                            val timeText = record.createdAt?.toDate()?.let { dateFormatter.format(it) } ?: "Just now"

                            Card(
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(14.dp),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Surface(
                                        shape = CircleShape,
                                        color = MaterialTheme.colorScheme.primaryContainer,
                                        modifier = Modifier.size(44.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Icon(
                                                imageVector = iconForActivity(type),
                                                contentDescription = type.label,
                                                tint = MaterialTheme.colorScheme.primary,
                                                modifier = Modifier.size(22.dp)
                                            )
                                        }
                                    }
                                    Column(
                                        modifier = Modifier.weight(1f),
                                        verticalArrangement = Arrangement.spacedBy(2.dp)
                                    ) {
                                        Text(
                                            text = record.title,
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Text(
                                            text = "${type.label} • $timeText",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        Text(
                                            text = "${record.accuracyPct}% accuracy • ${record.wordsPracticed} words • +${record.score} pts",
                                            style = MaterialTheme.typography.labelMedium,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                    CefrBadge(level = level)
                                }
                            }
                        }
                    }
                }
            }

            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}

@Composable
private fun StatMetricTile(
    title: String,
    value: String,
    subtitle: String,
    icon: ImageVector,
    containerColor: Color,
    contentColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        modifier = modifier
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
                Text(
                    text = title,
                    color = contentColor,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold
                )
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = contentColor,
                    modifier = Modifier.size(18.dp)
                )
            }
            Text(
                text = value,
                color = contentColor,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = subtitle,
                color = contentColor.copy(alpha = 0.8f),
                style = MaterialTheme.typography.labelSmall,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun BadgeMilestoneCard(
    badge: LingoBadge,
    unlocked: Boolean,
    progressHint: String
) {
    val (bg, accent) = when {
        !unlocked -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f) to MaterialTheme.colorScheme.onSurfaceVariant
        badge.category == BadgeCategory.WEEKLY -> MintSoft to MintOnSoft
        badge.category == BadgeCategory.QUIZ -> AmberSoft to AmberOnSoft
        else -> IndigoSoft to IndigoOnSoft
    }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = bg),
        border = if (unlocked) BorderStroke(1.dp, accent.copy(alpha = 0.35f)) else null,
        modifier = Modifier
            .fillMaxWidth()
            .testTag("badge_card_${badge.name.lowercase()}")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                shape = CircleShape,
                color = if (unlocked) accent.copy(alpha = 0.16f) else MaterialTheme.colorScheme.surface,
                modifier = Modifier.size(44.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = if (unlocked) Icons.Filled.EmojiEvents else Icons.Filled.Lock,
                        contentDescription = if (unlocked) "Unlocked" else "Locked",
                        tint = accent,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = badge.title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = if (unlocked) accent else MaterialTheme.colorScheme.onSurface
                    )
                    if (unlocked) {
                        Icon(
                            imageVector = Icons.Filled.Verified,
                            contentDescription = "Earned",
                            tint = accent,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
                Text(
                    text = if (unlocked) badge.subtitle else "${badge.criteria} • $progressHint",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (unlocked) accent.copy(alpha = 0.88f) else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Surface(
                shape = RoundedCornerShape(99.dp),
                color = if (unlocked) accent else MaterialTheme.colorScheme.surfaceVariant
            ) {
                Text(
                    text = if (unlocked) "EARNED" else badge.category.label,
                    color = if (unlocked) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
    }
}

