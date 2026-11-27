package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Percent
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.CefrLevel
import com.example.data.model.ScoreRecord
import com.example.ui.UiState
import com.example.ui.components.CefrBadge
import com.example.ui.components.CefrFilterRow
import com.example.ui.components.Trophy3DFigure
import com.example.ui.components.avatarColorForTag
import com.example.ui.theme.AmberAccent
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.CoralOnSoft
import com.example.ui.theme.CoralSecondary
import com.example.ui.theme.CoralSoft
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoPrimary
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.JetBrainsMonoFontFamily
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft
import com.example.ui.theme.MintTertiary

@Composable
fun GlobalLeaderboardScreen(
    scoresState: UiState<List<ScoreRecord>>,
    currentUserId: String = "",
    selectedLevel: CefrLevel? = null,
    onSelectLevel: (CefrLevel?) -> Unit = {},
    onBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var modeFilter by remember { mutableStateOf<String?>(null) }

    val rawScores = (scoresState as? UiState.Success)?.data.orEmpty()
    val filteredScores = remember(rawScores, selectedLevel, modeFilter) {
        rawScores.filter { score ->
            val levelMatches = selectedLevel == null || score.cefrLevel.equals(selectedLevel.name, ignoreCase = true)
            val modeMatches = modeFilter == null || score.gameMode.equals(modeFilter, ignoreCase = true)
            levelMatches && modeMatches
        }.sortedByDescending { it.score }
    }

    val top3 = remember(filteredScores) { filteredScores.take(3) }
    val remaining = remember(filteredScores) { if (filteredScores.size > 3) filteredScores.drop(3) else emptyList() }

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
            // Header Bar
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
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "Global Leaderboard",
                                style = MaterialTheme.typography.displaySmall
                            )
                            Surface(
                                shape = CircleShape,
                                color = AmberSoft
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.EmojiEvents,
                                        contentDescription = null,
                                        tint = AmberOnSoft,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = "LIVE",
                                        color = AmberOnSoft,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                        Text(
                            text = "Live rankings of top English quiz contenders across all CEFR leagues",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // CEFR Filter Row
            item {
                CefrFilterRow(
                    selectedLevel = selectedLevel,
                    onSelectLevel = onSelectLevel,
                    tagPrefix = "leaderboard"
                )
            }

            // Mode Filter Chips
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = modeFilter == null,
                        onClick = { modeFilter = null },
                        label = { Text("All Leagues") }
                    )
                    FilterChip(
                        selected = modeFilter == "LIVE_QUIZ",
                        onClick = { modeFilter = if (modeFilter == "LIVE_QUIZ") null else "LIVE_QUIZ" },
                        label = { Text("Live Quizzes") }
                    )
                    FilterChip(
                        selected = modeFilter == "ARCADE",
                        onClick = { modeFilter = if (modeFilter == "ARCADE") null else "ARCADE" },
                        label = { Text("Arcade Blitz") }
                    )
                }
            }

            // Loading / Error / Empty States
            when (scoresState) {
                is UiState.Loading -> {
                    item {
                        Card(
                            shape = RoundedCornerShape(22.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                CircularProgressIndicator(modifier = Modifier.size(36.dp))
                                Text(
                                    text = "Loading global quiz scores...",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
                is UiState.Error -> {
                    item {
                        Card(
                            shape = RoundedCornerShape(22.dp),
                            colors = CardDefaults.cardColors(containerColor = CoralSoft),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = "Unable to connect to live leaderboard",
                                    color = CoralOnSoft,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = scoresState.message,
                                    color = CoralOnSoft.copy(alpha = 0.85f),
                                    style = MaterialTheme.typography.bodySmall,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }
                    }
                }
                is UiState.Success -> {
                    if (filteredScores.isEmpty()) {
                        item {
                            Card(
                                shape = RoundedCornerShape(24.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(32.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Trophy3DFigure(size = 80.dp)
                                    Text(
                                        text = "Be the First on the Board!",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Complete a Kahoot-style Live Quiz or Arcade challenge to record your high score on the global leaderboard.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        }
                    } else {
                        // Top 3 Podium Presentation
                        item {
                            LeaderboardPodiumView(top3 = top3, currentUserId = currentUserId)
                        }

                        // Section Header for rest
                        if (remaining.isNotEmpty()) {
                            item {
                                Text(
                                    text = "Global Challengers (Rank 4 - ${filteredScores.size})",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }

                        // Remaining Rankings
                        itemsIndexed(remaining, key = { _, item -> item.id }) { index, score ->
                            val rank = index + 4
                            val isMe = score.userId == currentUserId
                            LeaderboardRankRow(rank = rank, score = score, isCurrentUser = isMe)
                        }
                    }
                }
            }

            item { Spacer(Modifier.height(20.dp)) }
        }
    }
}

@Composable
private fun LeaderboardPodiumView(
    top3: List<ScoreRecord>,
    currentUserId: String
) {
    Card(
        shape = RoundedCornerShape(26.dp),
        colors = CardDefaults.cardColors(containerColor = IndigoSoft),
        border = BorderStroke(1.5.dp, IndigoPrimary.copy(alpha = 0.25f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
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
                        imageVector = Icons.Filled.EmojiEvents,
                        contentDescription = null,
                        tint = IndigoOnSoft,
                        modifier = Modifier.size(24.dp)
                    )
                    Text(
                        text = "Global Podium",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = IndigoOnSoft
                    )
                }
                Trophy3DFigure(size = 56.dp)
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.Bottom
            ) {
                // Rank 2 (Silver)
                if (top3.size > 1) {
                    PodiumPillar(
                        rank = 2,
                        record = top3[1],
                        isCurrentUser = top3[1].userId == currentUserId,
                        modifier = Modifier.weight(1f)
                    )
                } else {
                    Spacer(modifier = Modifier.weight(1f))
                }

                // Rank 1 (Gold - Center & Tallest)
                if (top3.isNotEmpty()) {
                    PodiumPillar(
                        rank = 1,
                        record = top3[0],
                        isCurrentUser = top3[0].userId == currentUserId,
                        modifier = Modifier.weight(1.15f)
                    )
                }

                // Rank 3 (Bronze)
                if (top3.size > 2) {
                    PodiumPillar(
                        rank = 3,
                        record = top3[2],
                        isCurrentUser = top3[2].userId == currentUserId,
                        modifier = Modifier.weight(1f)
                    )
                } else {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun PodiumPillar(
    rank: Int,
    record: ScoreRecord,
    isCurrentUser: Boolean,
    modifier: Modifier = Modifier
) {
    val (pillarColor, crownColor, label) = when (rank) {
        1 -> Triple(AmberAccent, AmberOnSoft, "🥇 1st")
        2 -> Triple(Color(0xFFE2E8F0), Color(0xFF334155), "🥈 2nd")
        else -> Triple(Color(0xFFFED7AA), Color(0xFF7C2D12), "🥉 3rd")
    }

    val heightDp = when (rank) {
        1 -> 156.dp
        2 -> 136.dp
        else -> 118.dp
    }

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        // Player Avatar with Rank Badge
        Box(contentAlignment = Alignment.BottomEnd) {
            Surface(
                shape = CircleShape,
                color = avatarColorForTag(record.avatarColor),
                border = if (isCurrentUser) BorderStroke(2.dp, IndigoPrimary) else null,
                modifier = Modifier.size(if (rank == 1) 48.dp else 42.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = record.playerName.take(1).uppercase(),
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        fontSize = if (rank == 1) 18.sp else 15.sp
                    )
                }
            }
            Surface(
                shape = CircleShape,
                color = crownColor,
                modifier = Modifier.size(18.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = "$rank",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Text(
            text = if (isCurrentUser) "${record.playerName} (You)" else record.playerName,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center
        )

        Surface(
            shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
            color = pillarColor,
            modifier = Modifier
                .fillMaxWidth()
                .height(heightDp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = label,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    color = crownColor
                )
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Text(
                        text = "${record.score} pts",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = if (rank == 1) 14.sp else 12.sp,
                        fontFamily = JetBrainsMonoFontFamily,
                        color = crownColor
                    )
                    Text(
                        text = "${record.accuracyPct}% acc",
                        fontSize = 10.sp,
                        color = crownColor.copy(alpha = 0.8f)
                    )
                }
            }
        }
    }
}

@Composable
private fun LeaderboardRankRow(
    rank: Int,
    score: ScoreRecord,
    isCurrentUser: Boolean
) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isCurrentUser) IndigoSoft else MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(
            1.dp,
            if (isCurrentUser) IndigoPrimary else MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
        ),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("leaderboard_row_$rank")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.weight(1f)
            ) {
                // Rank number
                Text(
                    text = "#$rank",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = if (isCurrentUser) IndigoOnSoft else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.width(36.dp)
                )

                // Avatar
                Surface(
                    shape = CircleShape,
                    color = avatarColorForTag(score.avatarColor),
                    modifier = Modifier.size(38.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = score.playerName.take(1).uppercase(),
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = if (isCurrentUser) "${score.playerName} (You)" else score.playerName,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        CefrBadge(level = CefrLevel.fromRaw(score.cefrLevel))
                    }
                    Text(
                        text = "${score.quizTitle} • ${score.gameMode.replace('_', ' ')}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            // Score & Streak Indicators
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = "${score.score} pts",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.ExtraBold,
                    fontFamily = JetBrainsMonoFontFamily,
                    color = MaterialTheme.colorScheme.primary
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    if (score.streak > 0) {
                        Icon(
                            imageVector = Icons.Filled.LocalFireDepartment,
                            contentDescription = null,
                            tint = AmberAccent,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = "${score.streak}x",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = AmberAccent
                        )
                    }
                    Text(
                        text = "• ${score.accuracyPct}%",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
