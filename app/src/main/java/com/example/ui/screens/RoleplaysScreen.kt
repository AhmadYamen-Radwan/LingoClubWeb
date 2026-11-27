package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.R
import com.example.data.ai.RoleplaySpeechFeedback
import com.example.data.content.CuratedContent
import com.example.data.content.OfflineRoleplayGenerator
import com.example.data.model.CefrLevel
import com.example.data.model.ClubContentItem
import com.example.data.model.ClubContentType
import com.example.data.model.CustomRoleplay
import com.example.data.model.HighlightedPhrase
import com.example.data.model.RoleplayScenario
import com.example.data.model.RoleplaySource
import com.example.ui.AiGenState
import com.example.ui.components.TranslatableEnglishText
import com.example.ui.UiState
import com.example.ui.components.AsyncDrawableImage
import com.example.ui.components.CefrBadge
import com.example.ui.components.CefrFilterRow
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.CoralSoft
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft
import com.example.util.rememberSpeechToTextController
import com.example.util.rememberTtsSpeaker

private enum class ScaffoldMode(val label: String) {
    FULL("Full Script"),
    HINTS("Key Hints"),
    IMPROV("Improv")
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun RoleplaysScreen(
    customRoleplaysState: UiState<List<CustomRoleplay>>,
    clubContentState: UiState<List<ClubContentItem>> = UiState.Success(emptyList()),
    aiRoleplayGenState: AiGenState<RoleplayScenario>,
    roleplayFeedbackState: AiGenState<RoleplaySpeechFeedback>,
    isBusy: Boolean,
    onGenerateRoleplay: (setting: String, level: CefrLevel, tone: String, useAi: Boolean) -> Unit,
    onClearAiRoleplayGen: () -> Unit,
    onSaveGeneratedRoleplay: (scenario: RoleplayScenario, source: RoleplaySource, onDone: () -> Unit) -> Unit,
    onDeleteCustomRoleplay: (String) -> Unit,
    onRecordRoleplayCompletion: (title: String, level: CefrLevel) -> Unit,
    onEvaluateSpeech: (scenarioTitle: String, level: CefrLevel, roleName: String, targetScript: String, spokenTranscript: String) -> Unit,
    onClearSpeechFeedback: () -> Unit,
    selectedLevel: CefrLevel? = null,
    onSelectLevel: (CefrLevel?) -> Unit = {},
    onBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var activeScenario by remember { mutableStateOf<RoleplayScenario?>(null) }
    var showGenerateDialog by remember { mutableStateOf(false) }

    val currentScenario = activeScenario
    if (currentScenario != null) {
        BackHandler {
            onClearSpeechFeedback()
            activeScenario = null
        }
        RoleplayStageView(
            scenario = currentScenario,
            roleplayFeedbackState = roleplayFeedbackState,
            onEvaluateSpeech = onEvaluateSpeech,
            onClearSpeechFeedback = onClearSpeechFeedback,
            onCompleteScene = {
                onRecordRoleplayCompletion(currentScenario.title, currentScenario.cefrLevel)
            },
            onBack = {
                onClearSpeechFeedback()
                activeScenario = null
            },
            modifier = modifier
        )
        return
    }

    val clubRoleplays = (clubContentState as? UiState.Success)?.data.orEmpty()
        .filter {
            ClubContentType.fromRaw(it.contentType) == ClubContentType.ROLEPLAY &&
                it.lines.isNotEmpty() &&
                (selectedLevel == null || CefrLevel.fromRaw(it.cefrLevel) == selectedLevel)
        }
    val customList = (customRoleplaysState as? UiState.Success)?.data.orEmpty()
        .filter { selectedLevel == null || CefrLevel.fromRaw(it.cefrLevel) == selectedLevel }
    val filteredScenarios = CuratedContent.roleplayScenarios.filter {
        selectedLevel == null || it.cefrLevel == selectedLevel
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
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.widthIn(max = 460.dp)
                    ) {
                        if (onBack != null) {
                            IconButton(onClick = onBack, modifier = Modifier.size(48.dp)) {
                                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                            }
                        }
                        Column {
                            Text(
                                text = "Stage & Script",
                                style = MaterialTheme.typography.displaySmall
                            )
                            Text(
                                text = "Act out realistic scenes or generate AI & offline roleplays",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    Button(
                        onClick = {
                            onClearAiRoleplayGen()
                            showGenerateDialog = true
                        },
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                        modifier = Modifier
                            .heightIn(min = 48.dp)
                            .testTag("generate_roleplay_button")
                    ) {
                        Icon(Icons.Filled.AutoAwesome, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Generate", maxLines = 1)
                    }
                }
            }

            item {
                AsyncDrawableImage(
                    resId = R.drawable.img_roleplay_stage,
                    contentDescription = stringResource(R.string.cd_roleplay_stage),
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
                    tagPrefix = "roleplay"
                )
            }

            if (customList.isNotEmpty()) {
                item {
                    Text(
                        text = "Your Generated Scenes",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
                items(customList, key = { it.id }) { custom ->
                    val lvl = CefrLevel.fromRaw(custom.cefrLevel)
                    val scenario = RoleplayScenario(
                        id = custom.id,
                        title = custom.title,
                        setting = custom.setting,
                        cefrLevel = lvl,
                        roleAName = custom.roleAName,
                        roleBName = custom.roleBName,
                        goal = custom.goal,
                        lines = custom.lines,
                        plotTwists = custom.plotTwists.ifEmpty {
                            listOf("Plot Twist: A sudden surprise changes the plan!")
                        }
                    )
                    val isAi = RoleplaySource.fromRaw(custom.source) == RoleplaySource.AI
                    Card(
                        shape = RoundedCornerShape(22.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { activeScenario = scenario }
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
                                    CefrBadge(level = lvl)
                                    Surface(
                                        color = if (isAi) IndigoSoft else MintSoft,
                                        shape = RoundedCornerShape(99.dp)
                                    ) {
                                        Text(
                                            text = if (isAi) "AI" else "Offline",
                                            color = if (isAi) IndigoOnSoft else MintOnSoft,
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                        )
                                    }
                                    Text(
                                        text = custom.title,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                IconButton(
                                    onClick = { onDeleteCustomRoleplay(custom.id) },
                                    modifier = Modifier.size(48.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.Delete,
                                        contentDescription = "Delete roleplay",
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            Text(
                                text = custom.setting,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Button(
                                onClick = { activeScenario = scenario },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                            ) {
                                Text("Enter Stage")
                            }
                        }
                    }
                }
            }

            if (clubRoleplays.isNotEmpty()) {
                item {
                    Text(
                        text = "Official Club Stage",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
                items(clubRoleplays, key = { "club_${it.id}" }) { clubItem ->
                    val lvl = CefrLevel.fromRaw(clubItem.cefrLevel)
                    val scenario = RoleplayScenario(
                        id = "club_${clubItem.id}",
                        title = clubItem.title,
                        setting = clubItem.description,
                        cefrLevel = lvl,
                        roleAName = clubItem.roleAName.ifBlank { "Student A" },
                        roleBName = clubItem.roleBName.ifBlank { "Student B" },
                        goal = clubItem.goal.ifBlank { "Practice real conversation" },
                        lines = clubItem.lines,
                        plotTwists = clubItem.plotTwists.ifEmpty {
                            listOf("Plot Twist: A sudden surprise changes the plan!")
                        }
                    )
                    Card(
                        shape = RoundedCornerShape(22.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { activeScenario = scenario }
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                CefrBadge(level = lvl)
                                Surface(color = IndigoSoft, shape = RoundedCornerShape(99.dp)) {
                                    Text(
                                        text = "Teacher ${clubItem.authorName.ifBlank { "Club" }}",
                                        color = IndigoOnSoft,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                    )
                                }
                                Text(
                                    text = scenario.title,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Text(
                                text = scenario.setting,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Button(
                                onClick = { activeScenario = scenario },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                            ) {
                                Text("Enter Stage")
                            }
                        }
                    }
                }
            }

            item {
                Text(
                    text = "Curated Roleplay Stage",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            }

            if (filteredScenarios.isEmpty() && customList.isEmpty() && clubRoleplays.isEmpty()) {
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
                            Text("No roleplays for ${selectedLevel?.label ?: "this"} level yet", fontWeight = FontWeight.Bold)
                            OutlinedButton(onClick = { onSelectLevel(null) }) {
                                Text("Show All Levels")
                            }
                        }
                    }
                }
            } else {
                items(filteredScenarios, key = { it.id }) { scenario ->
                    Card(
                        shape = RoundedCornerShape(22.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { activeScenario = scenario }
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                CefrBadge(level = scenario.cefrLevel)
                                Text(
                                    text = scenario.title,
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Text(
                                text = scenario.setting,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "Roles: ${scenario.roleAName} & ${scenario.roleBName} • ${scenario.lines.size} turns",
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Button(
                                onClick = { activeScenario = scenario },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                            ) {
                                Text("Enter Stage")
                            }
                        }
                    }
                }
            }

            item { Spacer(Modifier.height(16.dp)) }
        }
    }

    if (showGenerateDialog) {
        RoleplayGeneratorDialog(
            aiRoleplayGenState = aiRoleplayGenState,
            initialLevel = selectedLevel ?: CefrLevel.B2,
            isBusy = isBusy,
            onGenerate = onGenerateRoleplay,
            onEnterStage = { scene ->
                showGenerateDialog = false
                onClearAiRoleplayGen()
                activeScenario = scene
            },
            onSaveScene = { scene, source ->
                onSaveGeneratedRoleplay(scene, source) {
                    showGenerateDialog = false
                    onClearAiRoleplayGen()
                }
            },
            onDismiss = {
                showGenerateDialog = false
                onClearAiRoleplayGen()
            }
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun RoleplayStageView(
    scenario: RoleplayScenario,
    roleplayFeedbackState: AiGenState<RoleplaySpeechFeedback>,
    onEvaluateSpeech: (scenarioTitle: String, level: CefrLevel, roleName: String, targetScript: String, spokenTranscript: String) -> Unit,
    onClearSpeechFeedback: () -> Unit,
    onCompleteScene: () -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val tts = rememberTtsSpeaker()
    val stt = rememberSpeechToTextController()
    var scaffold by remember(scenario.id) { mutableStateOf(ScaffoldMode.FULL) }
    var myRole by remember(scenario.id) { mutableStateOf("BOTH") }
    var activeTwist by remember(scenario.id) { mutableStateOf<String?>(null) }
    var twistIndex by remember(scenario.id) { mutableIntStateOf(0) }
    var selectedPhrase by remember(scenario.id) { mutableStateOf<HighlightedPhrase?>(null) }
    var completedScene by remember(scenario.id) { mutableStateOf(false) }
    // -1 = full script for selected role; >= 0 = specific line index
    var practiceLineIndex by remember(scenario.id) { mutableIntStateOf(0) }

    DisposableEffect(scenario.id) {
        onDispose { onClearSpeechFeedback() }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Column(
            modifier = Modifier.widthIn(max = 700.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack, modifier = Modifier.size(48.dp)) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back to roleplays")
                }
                Text(
                    text = scenario.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                CefrBadge(level = scenario.cefrLevel)
            }

            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = IndigoSoft),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    TranslatableEnglishText(
                        text = "Scene Goal: ${scenario.goal}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = IndigoOnSoft,
                        underlineColor = IndigoOnSoft
                    )
                    Text(
                        text = "Tip: Tap any phrase chip below a line to hear it and see how to explain it!",
                        style = MaterialTheme.typography.bodyMedium,
                        color = IndigoOnSoft.copy(alpha = 0.85f)
                    )
                }
            }

            // Scaffold mode selector
            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                ScaffoldMode.entries.forEachIndexed { index, mode ->
                    SegmentedButton(
                        selected = scaffold == mode,
                        onClick = { scaffold = mode },
                        shape = SegmentedButtonDefaults.itemShape(index, ScaffoldMode.entries.size)
                    ) {
                        Text(mode.label, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                }
            }

            // Role filter
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                FilterChip(
                    selected = myRole == "BOTH",
                    onClick = { myRole = "BOTH" },
                    label = { Text("2 Friends") }
                )
                FilterChip(
                    selected = myRole == "A",
                    onClick = { myRole = "A" },
                    label = { Text(scenario.roleAName) }
                )
                FilterChip(
                    selected = myRole == "B",
                    onClick = { myRole = "B" },
                    label = { Text(scenario.roleBName) }
                )
            }

            // Plot Twist Generator
            Button(
                onClick = {
                    activeTwist = scenario.plotTwists[twistIndex % scenario.plotTwists.size]
                    twistIndex++
                },
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .testTag("roleplay_twist_button")
            ) {
                Icon(Icons.Filled.AutoAwesome, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Drop a Surprise Plot Twist!")
            }

            val currentTwist = activeTwist
            AnimatedVisibility(visible = currentTwist != null) {
                if (currentTwist != null) {
                    Surface(
                        color = AmberSoft,
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        TranslatableEnglishText(
                            text = currentTwist,
                            color = AmberOnSoft,
                            underlineColor = AmberOnSoft,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
            }

            val currentPhrase = selectedPhrase
            AnimatedVisibility(visible = currentPhrase != null) {
                if (currentPhrase != null) {
                    Surface(
                        color = MintSoft,
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = currentPhrase.phrase,
                                    color = MintOnSoft,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = currentPhrase.meaning,
                                    color = MintOnSoft,
                                    style = MaterialTheme.typography.bodyMedium
                                )
                                Text(
                                    text = "\"${currentPhrase.example}\"",
                                    color = MintOnSoft.copy(alpha = 0.85f),
                                    style = MaterialTheme.typography.labelMedium
                                )
                            }
                            IconButton(
                                onClick = { tts.speak(currentPhrase.phrase) },
                                modifier = Modifier.size(48.dp)
                            ) {
                                Icon(Icons.AutoMirrored.Filled.VolumeUp, contentDescription = "Speak phrase", tint = MintOnSoft)
                            }
                        }
                    }
                }
            }

            // Dialogue lines
            scenario.lines.forEachIndexed { lineIndex, line ->
                val isRoleA = line.speakerRole == "A"
                val roleLabel = if (isRoleA) scenario.roleAName else scenario.roleBName
                val highlighted = myRole == "BOTH" || myRole == line.speakerRole
                val isSelectedPractice = practiceLineIndex == lineIndex

                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = when {
                            isSelectedPractice -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.55f)
                            !highlighted -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                            isRoleA -> MaterialTheme.colorScheme.surface
                            else -> MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.45f)
                        }
                    ),
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
                                text = "Turn ${lineIndex + 1} • $roleLabel",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.Bold,
                                color = if (isRoleA) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondary
                            )
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                IconButton(
                                    onClick = {
                                        practiceLineIndex = lineIndex
                                        onClearSpeechFeedback()
                                        stt.startListening()
                                    },
                                    modifier = Modifier.size(48.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.Mic,
                                        contentDescription = "Practice speaking turn ${lineIndex + 1}",
                                        tint = if (isSelectedPractice) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                if (scaffold == ScaffoldMode.FULL) {
                                    IconButton(
                                        onClick = { tts.speak(line.text) },
                                        modifier = Modifier.size(48.dp)
                                    ) {
                                        Icon(
                                            Icons.AutoMirrored.Filled.VolumeUp,
                                            contentDescription = "Listen to line",
                                            modifier = Modifier.size(20.dp)
                                        )
                                    }
                                }
                            }
                        }

                        val displayBody = when (scaffold) {
                            ScaffoldMode.FULL -> line.text
                            ScaffoldMode.HINTS -> "Cue: ${line.keyHint}"
                            ScaffoldMode.IMPROV -> "Your turn as $roleLabel — improvise freely!"
                        }
                        TranslatableEnglishText(
                            text = displayBody,
                            style = MaterialTheme.typography.bodyLarge
                        )

                        if (line.highlights.isNotEmpty() && scaffold != ScaffoldMode.IMPROV) {
                            FlowRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                line.highlights.forEach { phrase ->
                                    AssistChip(
                                        onClick = {
                                            selectedPhrase = phrase
                                            tts.speak(phrase.phrase)
                                        },
                                        label = { Text(phrase.phrase) }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Voice-to-Text Speaking Practice & AI Coach Feedback
            val selectedLine = scenario.lines.getOrNull(practiceLineIndex)
            val targetRoleLines = scenario.lines.filter {
                myRole == "BOTH" || it.speakerRole == myRole
            }
            val targetScriptText = if (practiceLineIndex >= 0 && selectedLine != null) {
                selectedLine.text
            } else {
                targetRoleLines.joinToString(" ") { it.text }
            }
            val targetRoleLabel = when {
                practiceLineIndex >= 0 && selectedLine != null ->
                    if (selectedLine.speakerRole == "A") scenario.roleAName else scenario.roleBName
                myRole == "A" -> scenario.roleAName
                myRole == "B" -> scenario.roleBName
                else -> "${scenario.roleAName} & ${scenario.roleBName}"
            }

            Card(
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
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
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                Icons.Filled.Mic,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Column {
                                Text(
                                    text = "Voice Practice & AI Coach",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Record yourself speaking for instant Gemini feedback",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        FilterChip(
                            selected = practiceLineIndex >= 0,
                            onClick = {
                                if (practiceLineIndex < 0) practiceLineIndex = 0
                                onClearSpeechFeedback()
                            },
                            label = {
                                Text(
                                    if (practiceLineIndex >= 0) "Turn ${practiceLineIndex + 1}" else "Single Turn"
                                )
                            }
                        )
                        FilterChip(
                            selected = practiceLineIndex == -1,
                            onClick = {
                                practiceLineIndex = -1
                                onClearSpeechFeedback()
                            },
                            label = { Text("Full Role Script") }
                        )
                    }

                    Surface(
                        color = IndigoSoft,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    text = "Target ($targetRoleLabel):",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = IndigoOnSoft
                                )
                                Text(
                                    text = if (scaffold == ScaffoldMode.IMPROV) {
                                        "Improv mode active — speak naturally to achieve: ${scenario.goal}"
                                    } else {
                                        targetScriptText
                                    },
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = IndigoOnSoft
                                )
                            }
                            if (scaffold != ScaffoldMode.IMPROV && targetScriptText.isNotBlank()) {
                                IconButton(
                                    onClick = { tts.speak(targetScriptText) },
                                    modifier = Modifier.size(48.dp)
                                ) {
                                    Icon(
                                        Icons.AutoMirrored.Filled.VolumeUp,
                                        contentDescription = "Hear target line",
                                        tint = IndigoOnSoft
                                    )
                                }
                            }
                        }
                    }

                    Button(
                        onClick = { stt.toggleListening() },
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (stt.isListening) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp)
                            .testTag("roleplay_mic_button")
                    ) {
                        Icon(
                            imageVector = if (stt.isListening) Icons.Filled.Stop else Icons.Filled.Mic,
                            contentDescription = if (stt.isListening) "Stop recording" else "Start voice recording"
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(if (stt.isListening) "Listening... Tap to Stop" else "Tap Mic & Speak Script")
                    }

                    if (stt.isListening) {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    Icons.Filled.GraphicEq,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(18.dp)
                                )
                                Text(
                                    text = if (stt.partialTranscript.isNotBlank()) {
                                        "Hearing: \"${stt.partialTranscript}\""
                                    } else {
                                        "Speak clearly in English..."
                                    },
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            LinearProgressIndicator(
                                progress = { stt.rmsLevel.coerceIn(0.08f, 1f) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(99.dp))
                            )
                        }
                    }

                    val sttErr = stt.errorMessage
                    AnimatedVisibility(visible = sttErr != null) {
                        if (sttErr != null) {
                            Surface(
                                color = AmberSoft,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = sttErr,
                                    color = AmberOnSoft,
                                    style = MaterialTheme.typography.bodySmall,
                                    modifier = Modifier.padding(12.dp)
                                )
                            }
                        }
                    }

                    OutlinedTextField(
                        value = stt.transcript,
                        onValueChange = { stt.updateTranscript(it) },
                        label = { Text("Your Spoken Transcript") },
                        placeholder = { Text("Tap the microphone above or edit what you said...") },
                        trailingIcon = {
                            if (stt.transcript.isNotEmpty()) {
                                IconButton(onClick = {
                                    stt.clear()
                                    onClearSpeechFeedback()
                                }) {
                                    Icon(Icons.Filled.Clear, contentDescription = "Clear transcript")
                                }
                            }
                        },
                        minLines = 2,
                        maxLines = 5,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("roleplay_transcript_input")
                    )

                    Button(
                        onClick = {
                            onEvaluateSpeech(
                                scenario.title,
                                scenario.cefrLevel,
                                targetRoleLabel,
                                targetScriptText,
                                stt.transcript
                            )
                        },
                        enabled = stt.transcript.isNotBlank() &&
                            !stt.isListening &&
                            roleplayFeedbackState !is AiGenState.Loading,
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .testTag("roleplay_ai_feedback_button")
                    ) {
                        Icon(Icons.Filled.AutoAwesome, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Get AI Coaching Feedback (+15 XP)")
                    }

                    when (roleplayFeedbackState) {
                        is AiGenState.Idle -> Unit
                        is AiGenState.Loading -> {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                CircularProgressIndicator(modifier = Modifier.size(24.dp))
                                Text("Evaluating pronunciation match & fluency with Gemini...")
                            }
                        }
                        is AiGenState.Error -> {
                            Surface(
                                color = MaterialTheme.colorScheme.errorContainer,
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = roleplayFeedbackState.message,
                                    color = MaterialTheme.colorScheme.onErrorContainer,
                                    style = MaterialTheme.typography.bodySmall,
                                    modifier = Modifier.padding(12.dp)
                                )
                            }
                        }
                        is AiGenState.Success -> {
                            val fb = roleplayFeedbackState.data
                            Surface(
                                color = MintSoft,
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("roleplay_feedback_card")
                            ) {
                                Column(
                                    modifier = Modifier.padding(14.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "AI Coach Review",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = MintOnSoft
                                        )
                                        Surface(
                                            color = MaterialTheme.colorScheme.primary,
                                            shape = RoundedCornerShape(99.dp)
                                        ) {
                                            Text(
                                                text = "Score: ${fb.score}/100",
                                                color = MaterialTheme.colorScheme.onPrimary,
                                                style = MaterialTheme.typography.labelLarge,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                            )
                                        }
                                    }
                                    Text(
                                        text = fb.summary,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MintOnSoft
                                    )
                                    Text(
                                        text = "Clarity & Script Match: ${fb.clarityFeedback}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MintOnSoft
                                    )
                                    Text(
                                        text = "Naturalness & Tone: ${fb.naturalnessFeedback}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MintOnSoft
                                    )
                                    Surface(
                                        color = MaterialTheme.colorScheme.surface,
                                        shape = RoundedCornerShape(12.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(10.dp),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = "Try saying it like this:",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    fontWeight = FontWeight.Bold,
                                                    color = MaterialTheme.colorScheme.primary
                                                )
                                                Text(
                                                    text = fb.suggestedLine,
                                                    style = MaterialTheme.typography.bodyMedium
                                                )
                                            }
                                            IconButton(
                                                onClick = { tts.speak(fb.suggestedLine) },
                                                modifier = Modifier.size(48.dp)
                                            ) {
                                                Icon(
                                                    Icons.AutoMirrored.Filled.VolumeUp,
                                                    contentDescription = "Hear suggested phrasing",
                                                    tint = MaterialTheme.colorScheme.primary
                                                )
                                            }
                                        }
                                    }
                                    Text(
                                        text = "Tip: ${fb.practiceTip}",
                                        style = MaterialTheme.typography.labelMedium,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MintOnSoft
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Button(
                onClick = {
                    if (!completedScene) {
                        completedScene = true
                        onCompleteScene()
                    } else {
                        onBack()
                    }
                },
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .testTag("roleplay_complete_button")
            ) {
                Icon(Icons.Filled.CheckCircle, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text(if (completedScene) "Scene Complete! (+25 XP) — Back" else "Mark Roleplay Complete (+25 XP)")
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun RoleplayGeneratorDialog(
    aiRoleplayGenState: AiGenState<RoleplayScenario>,
    initialLevel: CefrLevel,
    isBusy: Boolean,
    onGenerate: (setting: String, level: CefrLevel, tone: String, useAi: Boolean) -> Unit,
    onEnterStage: (RoleplayScenario) -> Unit,
    onSaveScene: (RoleplayScenario, RoleplaySource) -> Unit,
    onDismiss: () -> Unit
) {
    var useAi by remember { mutableStateOf(true) }
    var setting by remember { mutableStateOf(OfflineRoleplayGenerator.presetTopics.first()) }
    var level by remember(initialLevel) { mutableStateOf(initialLevel) }
    var tone by remember { mutableStateOf(OfflineRoleplayGenerator.presetTones.first()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(Icons.Filled.AutoAwesome, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
                Text("Roleplay Scene Studio")
            }
        },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                    SegmentedButton(
                        selected = useAi,
                        onClick = { useAi = true },
                        shape = SegmentedButtonDefaults.itemShape(0, 2),
                        modifier = Modifier.testTag("roleplay_mode_ai")
                    ) {
                        Text("AI (Gemini)")
                    }
                    SegmentedButton(
                        selected = !useAi,
                        onClick = { useAi = false },
                        shape = SegmentedButtonDefaults.itemShape(1, 2),
                        modifier = Modifier.testTag("roleplay_mode_offline")
                    ) {
                        Text("Offline Instant")
                    }
                }

                OutlinedTextField(
                    value = setting,
                    onValueChange = { setting = it.take(80) },
                    label = { Text("Scene / Setting") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("roleplay_setting_input")
                )

                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    OfflineRoleplayGenerator.presetTopics.forEach { preset ->
                        FilterChip(
                            selected = setting == preset,
                            onClick = { setting = preset },
                            label = { Text(preset) }
                        )
                    }
                }

                Text("CEFR Level", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
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

                Text("Scene Tone", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    OfflineRoleplayGenerator.presetTones.forEach { t ->
                        FilterChip(
                            selected = tone == t,
                            onClick = { tone = t },
                            label = { Text(t) }
                        )
                    }
                }

                when (aiRoleplayGenState) {
                    is AiGenState.Idle -> Unit
                    is AiGenState.Loading -> {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp))
                            Text("Writing dialogue & plot twists with Gemini...")
                        }
                    }
                    is AiGenState.Error -> {
                        Surface(
                            color = MaterialTheme.colorScheme.errorContainer,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = aiRoleplayGenState.message,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.padding(12.dp)
                            )
                        }
                    }
                    is AiGenState.Success -> {
                        val scene = aiRoleplayGenState.data
                        val resolvedSource = if (scene.id.startsWith("offline_")) RoleplaySource.OFFLINE else RoleplaySource.AI
                        Surface(
                            color = MintSoft,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(scene.title, color = MintOnSoft, fontWeight = FontWeight.Bold)
                                Text(
                                    text = "${scene.roleAName} & ${scene.roleBName} • ${scene.lines.size} turns",
                                    color = MintOnSoft,
                                    style = MaterialTheme.typography.labelMedium
                                )
                                Text(
                                    text = scene.lines.firstOrNull()?.text.orEmpty(),
                                    color = MintOnSoft,
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = { onSaveScene(scene, resolvedSource) },
                                enabled = !isBusy,
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Save Scene")
                            }
                            Button(
                                onClick = { onEnterStage(scene) },
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Enter Stage")
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onGenerate(setting, level, tone, useAi) },
                enabled = aiRoleplayGenState !is AiGenState.Loading && setting.isNotBlank(),
                modifier = Modifier.testTag("roleplay_generate_confirm")
            ) {
                Text(if (useAi) "Generate AI" else "Build Offline")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Close") }
        }
    )
}
