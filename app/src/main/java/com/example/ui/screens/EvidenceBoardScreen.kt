package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.data.model.CefrLevel
import com.example.data.model.EvidenceCard
import com.example.ui.components.CelebrationConfettiBurst
import com.example.ui.components.CefrBadge
import com.example.ui.components.CefrFilterRow
import com.example.ui.components.TranslatableEnglishText
import com.example.ui.components.Trophy3DFigure
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun EvidenceBoardScreen(
    evidenceList: List<EvidenceCard>,
    pinnedEvidenceIds: Set<String>,
    selectedLevel: CefrLevel? = null,
    onSelectLevel: (CefrLevel?) -> Unit = {},
    onTogglePinEvidence: (String, Boolean) -> Unit,
    onAwardXp: (Long) -> Unit,
    onBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var filterCategory by remember { mutableStateOf<String?>(null) }
    var solvedVerdict by remember { mutableStateOf(false) }

    val categories = remember(evidenceList) {
        evidenceList.map { it.category }.distinct()
    }

    val filteredEvidence = remember(evidenceList, selectedLevel, filterCategory) {
        evidenceList.filter { item ->
            val levelMatches = selectedLevel == null || item.cefrLevel == selectedLevel
            val categoryMatches = filterCategory == null || item.category == filterCategory
            levelMatches && categoryMatches
        }
    }

    val pinnedCount = pinnedEvidenceIds.size
    val totalCount = evidenceList.size
    val allPinned = pinnedCount >= 4 && pinnedCount == totalCount

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
                            text = "Detective Evidence Board",
                            style = MaterialTheme.typography.displaySmall
                        )
                        Text(
                            text = "Collect clues, pin red yarn evidence cards, and solve the case!",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            item {
                CefrFilterRow(
                    selectedLevel = selectedLevel,
                    onSelectLevel = onSelectLevel,
                    tagPrefix = "evidence"
                )
            }

            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = filterCategory == null,
                        onClick = { filterCategory = null },
                        label = { Text("All Clues") }
                    )
                    categories.forEach { cat ->
                        FilterChip(
                            selected = filterCategory == cat,
                            onClick = { filterCategory = if (filterCategory == cat) null else cat },
                            label = { Text(cat) }
                        )
                    }
                }
            }

            item {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = "Board Status: $pinnedCount / $totalCount Pinned",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = if (allPinned) "All clues connected! Ready to close the case." else "Pin critical evidence cards to connect the conspiracy.",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.White.copy(alpha = 0.9f)
                            )
                        }
                        Button(
                            onClick = {
                                solvedVerdict = true
                                onAwardXp(40L)
                            },
                            enabled = pinnedCount >= 3,
                            colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Text("Solve Case", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            item {
                AnimatedVisibility(visible = solvedVerdict) {
                    Card(
                        shape = RoundedCornerShape(22.dp),
                        colors = CardDefaults.cardColors(containerColor = MintSoft),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Trophy3DFigure(size = 84.dp)
                            Text(
                                text = "Case Closed! +40 XP Earned",
                                color = MintOnSoft,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "You successfully connected all red yarn evidence cards in Firestore and exposed the truth!",
                                color = MintOnSoft.copy(alpha = 0.88f),
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            }

            items(filteredEvidence, key = { it.id }) { item ->
                val pinned = item.id in pinnedEvidenceIds
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (pinned) AmberSoft else MaterialTheme.colorScheme.surface
                    ),
                    border = BorderStroke(
                        1.5.dp,
                        if (pinned) AmberOnSoft.copy(alpha = 0.4f) else MaterialTheme.colorScheme.outline.copy(alpha = 0.25f)
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            onTogglePinEvidence(item.id, !pinned)
                        }
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
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                CefrBadge(level = item.cefrLevel)
                                Surface(
                                    shape = RoundedCornerShape(99.dp),
                                    color = if (pinned) AmberOnSoft.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surfaceVariant
                                ) {
                                    Text(
                                        text = item.category,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = if (pinned) AmberOnSoft else MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                    )
                                }
                            }
                            IconButton(
                                onClick = { onTogglePinEvidence(item.id, !pinned) },
                                modifier = Modifier.size(36.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.PushPin,
                                    contentDescription = "Pin evidence",
                                    tint = if (pinned) AmberOnSoft else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Text(
                            text = item.title,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = if (pinned) AmberOnSoft else MaterialTheme.colorScheme.onSurface
                        )

                        TranslatableEnglishText(
                            text = item.description,
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (pinned) AmberOnSoft.copy(alpha = 0.9f) else MaterialTheme.colorScheme.onSurfaceVariant,
                            underlineColor = if (pinned) AmberOnSoft else MaterialTheme.colorScheme.primary
                        )

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (pinned) Color.White.copy(alpha = 0.6f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        ) {
                            TranslatableEnglishText(
                                text = "English clue: \"${item.englishClue}\" — Arabic: ${item.arabicMeaning}",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.SemiBold,
                                color = if (pinned) AmberOnSoft else MaterialTheme.colorScheme.onSurface,
                                underlineColor = if (pinned) AmberOnSoft else MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(10.dp)
                            )
                        }
                    }
                }
            }

            item { Spacer(Modifier.height(16.dp)) }
        }

        if (solvedVerdict) {
            CelebrationConfettiBurst(
                triggerKey = "evidence_board_solved",
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}
