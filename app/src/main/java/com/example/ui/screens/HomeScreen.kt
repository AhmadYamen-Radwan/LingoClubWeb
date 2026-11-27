package com.example.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Casino
import androidx.compose.material.icons.filled.Extension
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.Leaderboard
import androidx.compose.material.icons.filled.RecordVoiceOver
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.SportsEsports
import androidx.compose.material.icons.filled.Style
import androidx.compose.material.icons.filled.TheaterComedy
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.R
import com.example.data.model.CefrLevel
import com.example.data.model.ClubContentItem
import com.example.data.model.ClubContentType
import com.example.data.model.UserProfile
import com.example.ui.UiState
import com.example.ui.components.AsyncDrawableImage
import com.example.ui.components.CefrBadge
import com.example.ui.components.Interactive3DLanguageCube
import com.example.ui.components.Mascot3DStageBadge
import com.example.ui.components.Tactile3DCard
import com.example.ui.components.UserStatsRow
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.CoralOnSoft
import com.example.ui.theme.CoralSoft
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.JetBrainsMonoFontFamily
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft

private data class DashboardGameMode(
    val id: String,
    val title: String,
    val subtitle: String,
    val badge: String,
    val icon: ImageVector,
    val containerColor: Color,
    val accentColor: Color,
    val testTag: String,
    val onClick: () -> Unit
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun HomeScreen(
    profileState: UiState<UserProfile?>,
    clubContentState: UiState<List<ClubContentItem>>,
    isTutor: Boolean,
    studentsCount: Int = 0,
    fallbackName: String,
    isOfflineMode: Boolean = false,
    selectedLevel: CefrLevel?,
    onSelectLevel: (CefrLevel?) -> Unit,
    onNavigateQuiz: () -> Unit,
    onNavigateLeaderboard: () -> Unit = {},
    onNavigateArcade: () -> Unit = {},
    onNavigateSpinWheel: () -> Unit = onNavigateArcade,
    onNavigateCurriculum: () -> Unit,
    onNavigateAudiobooks: () -> Unit,
    onNavigatePuzzles: () -> Unit,
    onNavigateCards: () -> Unit,
    onNavigateGuessing: () -> Unit,
    onNavigateRoleplay: () -> Unit,
    onNavigateDictionary: () -> Unit,
    onNavigateChat: () -> Unit,
    onNavigateTutor: () -> Unit,
    onNavigateProfile: () -> Unit,
    onQuickJoinRoom: (String) -> Unit,
    onSignOut: () -> Unit,
    modifier: Modifier = Modifier
) {
    val profile = (profileState as? UiState.Success)?.data
    val displayName = profile?.displayName?.ifBlank { fallbackName } ?: fallbackName
    val firstName = displayName.substringBefore(" ").ifBlank { "Friend" }
    val profileLevel = CefrLevel.fromRaw(profile?.learningLevel)
    var quickPin by remember { mutableStateOf("") }
    val announcements = remember(clubContentState) {
        (clubContentState as? UiState.Success)?.data
            ?.filter { it.contentType == ClubContentType.ANNOUNCEMENT.name }
            .orEmpty()
    }

    val gameModes = remember(
        isTutor,
        studentsCount,
        onNavigateQuiz,
        onNavigateLeaderboard,
        onNavigateArcade,
        onNavigateCurriculum,
        onNavigateAudiobooks,
        onNavigatePuzzles,
        onNavigateCards,
        onNavigateRoleplay,
        onNavigateGuessing,
        onNavigateDictionary,
        onNavigateChat,
        onNavigateTutor
    ) {
        listOf(
            DashboardGameMode(
                id = "live_quiz",
                title = "Live Quiz",
                subtitle = "AI Kahoot rooms & live chat",
                badge = "AI + PIN",
                icon = Icons.Filled.Bolt,
                containerColor = IndigoSoft,
                accentColor = IndigoOnSoft,
                testTag = "home_tile_quiz",
                onClick = onNavigateQuiz
            ),
            DashboardGameMode(
                id = "game_arcade",
                title = "Game Arcade",
                subtitle = "Crime Mystery, Vault Cracker, Evidence & Dash",
                badge = "${ArcadeMode.entries.size} Games",
                icon = Icons.Filled.SportsEsports,
                containerColor = CoralSoft,
                accentColor = CoralOnSoft,
                testTag = "home_tile_arcade",
                onClick = onNavigateArcade
            ),
            DashboardGameMode(
                id = "global_leaderboard",
                title = "Leaderboard",
                subtitle = "Global quiz champions & streaks",
                badge = "Top 50",
                icon = Icons.Filled.Leaderboard,
                containerColor = AmberSoft,
                accentColor = AmberOnSoft,
                testTag = "home_tile_leaderboard",
                onClick = onNavigateLeaderboard
            ),
            DashboardGameMode(
                id = "curriculum",
                title = "200-Word Club",
                subtitle = "3 sessions/wk, stories & games",
                badge = "3/Week",
                icon = Icons.Filled.CalendarMonth,
                containerColor = MintSoft,
                accentColor = MintOnSoft,
                testTag = "home_tile_curriculum",
                onClick = onNavigateCurriculum
            ),
            DashboardGameMode(
                id = "team_chat",
                title = "Team Chat",
                subtitle = "Squad chat & Tutor Hub",
                badge = "Live",
                icon = Icons.Filled.Forum,
                containerColor = Color(0xFFE0F2FE),
                accentColor = Color(0xFF075985),
                testTag = "home_tile_chat",
                onClick = onNavigateChat
            ),
            DashboardGameMode(
                id = "audiobooks",
                title = "Audiobooks",
                subtitle = "Leveled listening + Arabic",
                badge = "Listen",
                icon = Icons.Filled.Headphones,
                containerColor = AmberSoft,
                accentColor = AmberOnSoft,
                testTag = "home_tile_audiobooks",
                onClick = onNavigateAudiobooks
            ),
            DashboardGameMode(
                id = "roleplay",
                title = "Roleplay",
                subtitle = "AI & offline scripts + twists",
                badge = "AI/Offline",
                icon = Icons.Filled.TheaterComedy,
                containerColor = CoralSoft,
                accentColor = CoralOnSoft,
                testTag = "home_tile_roleplay",
                onClick = onNavigateRoleplay
            ),
            DashboardGameMode(
                id = "word_puzzle",
                title = "Word Puzzle",
                subtitle = "Scramble, match & gap-fill",
                badge = "3 Modes",
                icon = Icons.Filled.Extension,
                containerColor = MintSoft,
                accentColor = MintOnSoft,
                testTag = "home_tile_puzzles",
                onClick = onNavigatePuzzles
            ),
            DashboardGameMode(
                id = "flashcards",
                title = "Flashcards",
                subtitle = "3D flip cards & friend tips",
                badge = "A1–B2",
                icon = Icons.Filled.Style,
                containerColor = AmberSoft,
                accentColor = AmberOnSoft,
                testTag = "home_tile_cards",
                onClick = onNavigateCards
            ),
            DashboardGameMode(
                id = "guessing",
                title = "Guessing Game",
                subtitle = "Taboo words & party charades",
                badge = "Party",
                icon = Icons.Filled.RecordVoiceOver,
                containerColor = Color(0xFFE8F1FF),
                accentColor = Color(0xFF0E47A1),
                testTag = "home_tile_guessing",
                onClick = onNavigateGuessing
            ),
            DashboardGameMode(
                id = "dictionary",
                title = "EN–AR Dictionary",
                subtitle = "18K+ words, Arabic & IPA",
                badge = "A1–C2",
                icon = Icons.Filled.Translate,
                containerColor = Color(0xFFF3E8FF),
                accentColor = Color(0xFF581C87),
                testTag = "home_tile_dictionary",
                onClick = onNavigateDictionary
            ),
            DashboardGameMode(
                id = "tutor_hub",
                title = "My Students",
                subtitle = "View students & track Firestore progress",
                badge = if (studentsCount > 0) "$studentsCount Tracked" else if (isTutor) "Tutor" else "Progress",
                icon = Icons.Filled.School,
                containerColor = IndigoSoft,
                accentColor = IndigoOnSoft,
                testTag = "home_tile_tutor",
                onClick = onNavigateTutor
            )
        )
    }

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.TopCenter
    ) {
        LazyVerticalGrid(
            columns = GridCells.Adaptive(minSize = 158.dp),
            modifier = Modifier
                .fillMaxSize()
                .widthIn(max = 840.dp),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Top editorial greeting bar
            item(span = { GridItemSpan(maxLineSpan) }) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Mascot3DStageBadge(
                            size = 56.dp,
                            onTap = onNavigateProfile
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Hey $firstName!",
                                style = MaterialTheme.typography.displaySmall,
                                color = MaterialTheme.colorScheme.onBackground,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "Teach & play English from A1 starters to B2 fluency",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(
                            onClick = onNavigateTutor,
                            modifier = Modifier
                                .size(48.dp)
                                .testTag("home_tutor_button")
                        ) {
                            Icon(
                                imageVector = Icons.Filled.School,
                                contentDescription = "Open Student Progress Tracker",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                        IconButton(
                            onClick = onNavigateProfile,
                            modifier = Modifier
                                .size(48.dp)
                                .testTag("home_profile_button")
                        ) {
                            Icon(
                                imageVector = Icons.Filled.AccountCircle,
                                contentDescription = "Open Profile",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                        IconButton(
                            onClick = onSignOut,
                            modifier = Modifier
                                .size(48.dp)
                                .testTag("sign_out_button")
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Logout,
                                contentDescription = stringResource(R.string.sign_out),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // Stats Strip + Profile Card
            item(span = { GridItemSpan(maxLineSpan) }) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    UserStatsRow(
                        xp = profile?.xp ?: 0L,
                        streak = profile?.streak ?: 1L,
                        mastered = profile?.cardsMastered ?: 0L
                    )
                    DailyGoalRingCard(
                        xp = profile?.xp ?: 0L,
                        badgesCount = profile?.earnedBadges?.size ?: 0,
                        onSpinClick = onNavigateSpinWheel,
                        onArcadeClick = onNavigateArcade
                    )

                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable(onClick = onNavigateProfile)
                            .testTag("home_profile_card")
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                CefrBadge(level = profileLevel)
                                Column {
                                    Text(
                                        text = "My Level: ${profileLevel.label} • ${profile?.sessionsCompleted ?: 0L} sessions",
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "${profile?.weeklyWordsMastered ?: 0L} weekly words • ${profile?.audiobooksFinished ?: 0L} audiobooks",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            Text(
                                text = "Stats →",
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    if (isOfflineMode) {
                        Card(
                            shape = RoundedCornerShape(18.dp),
                            colors = CardDefaults.cardColors(containerColor = MintSoft),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable(onClick = onNavigateChat)
                                .testTag("home_offline_hotspot_banner")
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.WifiOff,
                                        contentDescription = null,
                                        tint = MintOnSoft
                                    )
                                    Column {
                                        Text(
                                            text = "Offline & Wi-Fi Hotspot Mode",
                                            color = MintOnSoft,
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = "Form a Hotspot Squad or host offline quizzes in Teams!",
                                            color = MintOnSoft.copy(alpha = 0.85f),
                                            style = MaterialTheme.typography.bodySmall
                                        )
                                    }
                                }
                                Text(
                                    text = "Hotspot ->",
                                    color = MintOnSoft,
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    if (isTutor || studentsCount > 0) {
                        Card(
                            shape = RoundedCornerShape(18.dp),
                            colors = CardDefaults.cardColors(containerColor = IndigoSoft),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable(onClick = onNavigateTutor)
                                .testTag("home_tutor_tracker_banner")
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.School,
                                        contentDescription = null,
                                        tint = IndigoOnSoft
                                    )
                                    Column {
                                        Text(
                                            text = "Tutor Student Tracker",
                                            color = IndigoOnSoft,
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = "$studentsCount active students synced in Firestore",
                                            color = IndigoOnSoft.copy(alpha = 0.85f),
                                            style = MaterialTheme.typography.bodySmall
                                        )
                                    }
                                }
                                Text(
                                    text = "View ->",
                                    color = IndigoOnSoft,
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    if (announcements.isNotEmpty()) {
                        val latestNotice = announcements.first()
                        Card(
                            shape = RoundedCornerShape(18.dp),
                            colors = CardDefaults.cardColors(containerColor = AmberSoft),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable(onClick = onNavigateChat)
                                .testTag("home_teacher_announcement")
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.Campaign,
                                    contentDescription = "Tutor Notice",
                                    tint = AmberOnSoft
                                )
                                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Text(
                                            text = latestNotice.title,
                                            color = AmberOnSoft,
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.Bold,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                            modifier = Modifier.weight(1f, fill = false)
                                        )
                                        CefrBadge(level = CefrLevel.fromRaw(latestNotice.cefrLevel))
                                    }
                                    Text(
                                        text = latestNotice.description,
                                        color = AmberOnSoft.copy(alpha = 0.9f),
                                        style = MaterialTheme.typography.bodySmall,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Featured Kahoot Host Banner + Interactive 3D Cube
            item(span = { GridItemSpan(maxLineSpan) }) {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onNavigateQuiz() }
                        .testTag("hero_quiz_card")
                ) {
                    Column {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(152.dp)
                        ) {
                            AsyncDrawableImage(
                                resId = R.drawable.img_hero_studio,
                                contentDescription = stringResource(R.string.cd_hero_illustration),
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(
                                        Brush.verticalGradient(
                                            colors = listOf(
                                                Color.Transparent,
                                                MaterialTheme.colorScheme.primary.copy(alpha = 0.88f)
                                            )
                                        )
                                    )
                            )
                            Surface(
                                color = MaterialTheme.colorScheme.secondary,
                                shape = RoundedCornerShape(99.dp),
                                modifier = Modifier
                                    .padding(14.dp)
                                    .align(Alignment.TopStart)
                            ) {
                                Text(
                                    text = "LIVE KAHOOT HOST • 3D STUDIO",
                                    color = MaterialTheme.colorScheme.onSecondary,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                )
                            }
                            Interactive3DLanguageCube(
                                size = 92.dp,
                                onTap = onNavigateQuiz,
                                modifier = Modifier
                                    .align(Alignment.BottomEnd)
                                    .padding(end = 10.dp, bottom = 4.dp)
                            )
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 18.dp, vertical = 14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Host a Live Quiz Clash",
                                    style = MaterialTheme.typography.headlineSmall,
                                    color = MaterialTheme.colorScheme.onPrimary
                                )
                                Text(
                                    text = "Pick A1–B2 packs or spin the 3D cube to explore",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.88f)
                                )
                            }
                            Surface(
                                shape = CircleShape,
                                color = MaterialTheme.colorScheme.onPrimary,
                                modifier = Modifier.size(42.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                        contentDescription = "Open Live Quiz",
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // CEFR Level Selector (A1, A2, B1, B2)
            item(span = { GridItemSpan(maxLineSpan) }) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "Friend Level Focus",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        FilterChip(
                            selected = selectedLevel == null,
                            onClick = { onSelectLevel(null) },
                            label = { Text("All (A1–B2)") },
                            modifier = Modifier.testTag("home_level_all")
                        )
                        CefrLevel.entries.forEach { lvl ->
                            FilterChip(
                                selected = selectedLevel == lvl,
                                onClick = { onSelectLevel(if (selectedLevel == lvl) null else lvl) },
                                label = { Text(lvl.label) },
                                modifier = Modifier.testTag("home_level_${lvl.name.lowercase()}")
                            )
                        }
                    }
                }
            }

            // Game Modes Grid Heading
            item(span = { GridItemSpan(maxLineSpan) }) {
                Text(
                    text = "Game & Study Modes",
                    style = MaterialTheme.typography.titleLarge
                )
            }

            // Grid of Available Game Modes (Live Quiz, Word Puzzle, Flashcards, Roleplay, Guessing Game, EN-AR Dictionary)
            items(gameModes, key = { it.id }) { mode ->
                DashboardModeGridCard(mode = mode)
            }

            // Quick Join Room PIN Card
            item(span = { GridItemSpan(maxLineSpan) }) {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Groups,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "Join a Friend's Live Quiz",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = quickPin,
                                onValueChange = { input ->
                                    quickPin = input.uppercase().filter { it.isLetterOrDigit() }.take(6)
                                },
                                placeholder = {
                                    Text(
                                        text = "6-CHAR PIN",
                                        fontFamily = JetBrainsMonoFontFamily
                                    )
                                },
                                singleLine = true,
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("home_join_pin_input")
                            )
                            Button(
                                onClick = {
                                    if (quickPin.length == 6) {
                                        onQuickJoinRoom(quickPin)
                                    }
                                },
                                enabled = quickPin.length == 6,
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = MaterialTheme.colorScheme.secondary
                                ),
                                modifier = Modifier
                                    .height(54.dp)
                                    .testTag("home_join_pin_button")
                            ) {
                                Text("Join")
                            }
                        }
                    }
                }
            }

            item(span = { GridItemSpan(maxLineSpan) }) {
                Spacer(modifier = Modifier.height(12.dp))
            }
        }
    }
}

@Composable
private fun DashboardModeGridCard(
    mode: DashboardGameMode
) {
    Tactile3DCard(
        onClick = mode.onClick,
        containerColor = mode.containerColor,
        lipColor = mode.accentColor.copy(alpha = 0.28f),
        cornerRadius = 22.dp,
        lipHeight = 5.dp,
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 158.dp)
            .testTag(mode.testTag)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = CircleShape,
                    color = Color.White.copy(alpha = 0.86f),
                    shadowElevation = 2.dp,
                    modifier = Modifier.size(42.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = mode.icon,
                            contentDescription = mode.title,
                            tint = mode.accentColor,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }
                Surface(
                    shape = RoundedCornerShape(99.dp),
                    color = mode.accentColor.copy(alpha = 0.14f)
                ) {
                    Text(
                        text = mode.badge,
                        color = mode.accentColor,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = mode.title,
                    color = mode.accentColor,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = mode.subtitle,
                    color = mode.accentColor.copy(alpha = 0.85f),
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
private fun DailyGoalRingCard(
    xp: Long,
    badgesCount: Int,
    onSpinClick: () -> Unit,
    onArcadeClick: () -> Unit
) {
    val tierSize = 150L
    val rankNumber = (xp / tierSize) + 1L
    val progressInTier = (xp % tierSize).toFloat() / tierSize.toFloat()
    val animatedProgress by animateFloatAsState(
        targetValue = progressInTier.coerceIn(0.06f, 1f),
        animationSpec = tween(durationMillis = 700),
        label = "xp_ring_progress"
    )
    val rankTitle = when {
        rankNumber >= 10 -> "Club Legend"
        rankNumber >= 5 -> "Fluency Star"
        rankNumber >= 3 -> "Word Explorer"
        else -> "Rising Speaker"
    }
    val ringColor = MaterialTheme.colorScheme.primary
    val trackColor = MaterialTheme.colorScheme.surfaceVariant

    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onArcadeClick)
            .testTag("home_daily_goal_card")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier.size(60.dp),
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val stroke = 7.dp.toPx()
                    drawArc(
                        color = trackColor,
                        startAngle = -90f,
                        sweepAngle = 360f,
                        useCenter = false,
                        style = Stroke(width = stroke, cap = StrokeCap.Round)
                    )
                    drawArc(
                        color = ringColor,
                        startAngle = -90f,
                        sweepAngle = 360f * animatedProgress,
                        useCenter = false,
                        style = Stroke(width = stroke, cap = StrokeCap.Round)
                    )
                }
                Text(
                    text = "Lv.$rankNumber",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = "$rankTitle • $badgesCount badges",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = "${tierSize - (xp % tierSize)} XP to Level ${rankNumber + 1}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Surface(
                onClick = onSpinClick,
                shape = RoundedCornerShape(99.dp),
                color = AmberSoft,
                modifier = Modifier.testTag("home_daily_spin_button")
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.Casino,
                        contentDescription = "Daily Spin Wheel",
                        tint = AmberOnSoft,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = "Spin",
                        color = AmberOnSoft,
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
