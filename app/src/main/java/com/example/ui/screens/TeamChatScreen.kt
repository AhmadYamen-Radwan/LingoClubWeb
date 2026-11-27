package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Groups
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.WifiTethering
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.data.model.CefrLevel
import com.example.data.model.ChatMessage
import com.example.data.model.ChatSenderRole
import com.example.data.model.TeamChannel
import com.example.data.model.TeamChannelKind
import com.example.data.offline.TetheringRole
import com.example.data.offline.TetheringUiState
import com.example.ui.UiState
import com.example.ui.components.CefrBadge
import com.example.ui.components.TranslatableEnglishText
import com.example.ui.components.avatarColorForTag
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft
import com.example.util.rememberTtsSpeaker
import java.text.SimpleDateFormat
import java.util.Locale

private val QUICK_ENGLISH_PROMPTS = listOf(
    "Hey team, ready for today's session?",
    "Can anyone give an example using this word?",
    "Let's challenge another squad in Quiz Clash!",
    "Tutor, could you review our roleplay line?"
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TeamChatScreen(
    teamsState: UiState<List<TeamChannel>>,
    selectedTeamId: String,
    messagesState: UiState<List<ChatMessage>>,
    currentUserId: String,
    currentUserTeamId: String,
    isTutor: Boolean,
    isBusy: Boolean,
    onSelectChannel: (String) -> Unit,
    onCreateTeam: (name: String, level: CefrLevel, motto: String, color: String, isTeacherHub: Boolean, onDone: () -> Unit) -> Unit,
    onJoinTeam: (TeamChannel) -> Unit,
    onSendMessage: (TeamChannel, text: String, pinned: Boolean) -> Unit,
    onTogglePin: (teamId: String, messageId: String, pinned: Boolean) -> Unit,
    onDeleteMessage: (teamId: String, messageId: String) -> Unit,
    tetheringState: TetheringUiState = TetheringUiState(),
    onHostTetheringTeam: (teamName: String, level: CefrLevel, motto: String) -> Unit = { _, _, _ -> },
    onScanTetheringTeams: () -> Unit = {},
    onJoinTetheringTeam: (hostIp: String, port: Int, teamCode: String) -> Unit = { _, _, _ -> },
    onSendTetheringMessage: (text: String, pinned: Boolean) -> Unit = { _, _ -> },
    onDisconnectTethering: () -> Unit = {},
    onBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val tts = rememberTtsSpeaker()
    val teams = (teamsState as? UiState.Success)?.data.orEmpty()
    val activeTeam = remember(teams, selectedTeamId) {
        teams.firstOrNull { it.id == selectedTeamId } ?: teams.firstOrNull()
    }
    LaunchedEffect(teams, selectedTeamId) {
        if (teams.isNotEmpty() && teams.none { it.id == selectedTeamId }) {
            onSelectChannel(teams.first().id)
        }
    }

    var showCreateTeamDialog by remember { mutableStateOf(false) }
    var showHotspotPanel by remember { mutableStateOf(tetheringState.role != TetheringRole.NONE) }

    BoxWithConstraints(modifier = modifier.fillMaxSize()) {
        val isWide = maxWidth >= 720.dp

        Column(
            modifier = Modifier
                .fillMaxSize()
                .imePadding()
        ) {
            // Top Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
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
                                .testTag("chat_back_button")
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    }
                    Column {
                        Text(
                            text = "Teams & Tutor Chat",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "Coordinate with your squad or talk with your tutor",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
                Button(
                    onClick = { showCreateTeamDialog = true },
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .heightIn(min = 48.dp)
                        .testTag("chat_create_team_button")
                ) {
                    Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Team")
                }
            }

            TetheringHotspotPanel(
                tetheringState = tetheringState,
                expanded = showHotspotPanel || tetheringState.role != TetheringRole.NONE,
                onToggleExpanded = { showHotspotPanel = !showHotspotPanel },
                onHostTeam = onHostTetheringTeam,
                onScanHosts = onScanTetheringTeams,
                onJoinHost = onJoinTetheringTeam,
                onSendHotspotMessage = onSendTetheringMessage,
                onDisconnect = onDisconnectTethering
            )

            when (teamsState) {
                is UiState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                is UiState.Error -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(20.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                            shape = RoundedCornerShape(18.dp)
                        ) {
                            Text(
                                text = teamsState.message,
                                modifier = Modifier.padding(16.dp),
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                }
                is UiState.Success -> {
                    if (teams.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(20.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Card(
                                shape = RoundedCornerShape(24.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.widthIn(max = 520.dp)
                            ) {
                                Column(
                                    modifier = Modifier.padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Surface(
                                        shape = CircleShape,
                                        color = IndigoSoft,
                                        modifier = Modifier.size(64.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Icon(
                                                Icons.Filled.Forum,
                                                contentDescription = null,
                                                tint = IndigoOnSoft,
                                                modifier = Modifier.size(30.dp)
                                            )
                                        }
                                    }
                                    Text(
                                        text = "Start the First English Squad",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Create a team room for your friends or wait for a tutor hub channel to appear here.",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Button(
                                        onClick = { showCreateTeamDialog = true },
                                        modifier = Modifier.heightIn(min = 48.dp)
                                    ) {
                                        Icon(Icons.Filled.Add, contentDescription = null)
                                        Spacer(Modifier.width(6.dp))
                                        Text("Create Squad Channel")
                                    }
                                }
                            }
                        }
                    } else if (isWide) {
                        Row(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 16.dp)
                                .padding(bottom = 12.dp),
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            LazyColumn(
                                modifier = Modifier
                                    .width(290.dp)
                                    .fillMaxHeight(),
                                verticalArrangement = Arrangement.spacedBy(10.dp),
                                contentPadding = PaddingValues(vertical = 4.dp)
                            ) {
                                items(teams, key = { it.id }) { team ->
                                    ChannelSidebarCard(
                                        team = team,
                                        selected = activeTeam?.id == team.id,
                                        isMember = currentUserTeamId == team.id,
                                        onClick = { onSelectChannel(team.id) }
                                    )
                                }
                            }
                            Box(modifier = Modifier.weight(1f).fillMaxHeight()) {
                                if (activeTeam != null) {
                                    ChatThreadPane(
                                        team = activeTeam,
                                        messagesState = messagesState,
                                        currentUserId = currentUserId,
                                        currentUserTeamId = currentUserTeamId,
                                        isTutor = isTutor,
                                        onJoinTeam = { onJoinTeam(activeTeam) },
                                        onSendMessage = { txt, pin -> onSendMessage(activeTeam, txt, pin) },
                                        onTogglePin = { msgId, pin -> onTogglePin(activeTeam.id, msgId, pin) },
                                        onDeleteMessage = { msgId -> onDeleteMessage(activeTeam.id, msgId) },
                                        onSpeak = { tts.speak(it) }
                                    )
                                }
                            }
                        }
                    } else {
                        Column(
                            modifier = Modifier.fillMaxSize()
                        ) {
                            LazyRow(
                                contentPadding = PaddingValues(horizontal = 16.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(teams, key = { it.id }) { team ->
                                    val isHub = team.channelKind == TeamChannelKind.TEACHER_HUB.name
                                    val selected = activeTeam?.id == team.id
                                    FilterChip(
                                        selected = selected,
                                        onClick = { onSelectChannel(team.id) },
                                        label = {
                                            Text(
                                                text = if (isHub) "Tutor Hub" else team.name,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                        },
                                        leadingIcon = {
                                            Icon(
                                                imageVector = if (isHub) Icons.Filled.Campaign else Icons.Filled.Groups,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        },
                                        modifier = Modifier.testTag("chat_channel_chip_${team.id}")
                                    )
                                }
                            }
                            Spacer(Modifier.height(8.dp))
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp)
                                    .padding(bottom = 10.dp)
                            ) {
                                if (activeTeam != null) {
                                    ChatThreadPane(
                                        team = activeTeam,
                                        messagesState = messagesState,
                                        currentUserId = currentUserId,
                                        currentUserTeamId = currentUserTeamId,
                                        isTutor = isTutor,
                                        onJoinTeam = { onJoinTeam(activeTeam) },
                                        onSendMessage = { txt, pin -> onSendMessage(activeTeam, txt, pin) },
                                        onTogglePin = { msgId, pin -> onTogglePin(activeTeam.id, msgId, pin) },
                                        onDeleteMessage = { msgId -> onDeleteMessage(activeTeam.id, msgId) },
                                        onSpeak = { tts.speak(it) }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showCreateTeamDialog) {
        CreateTeamDialog(
            isTutor = isTutor,
            isBusy = isBusy,
            onDismiss = { showCreateTeamDialog = false },
            onCreate = { name, level, motto, color, isHub ->
                onCreateTeam(name, level, motto, color, isHub) {
                    showCreateTeamDialog = false
                }
            }
        )
    }
}

@Composable
private fun ChannelSidebarCard(
    team: TeamChannel,
    selected: Boolean,
    isMember: Boolean,
    onClick: () -> Unit
) {
    val isHub = team.channelKind == TeamChannelKind.TEACHER_HUB.name
    val accent = avatarColorForTag(team.accentColor)
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (selected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface
        ),
        border = if (selected) BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary) else null,
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                shape = CircleShape,
                color = accent,
                modifier = Modifier.size(40.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = if (isHub) Icons.Filled.Campaign else Icons.Filled.Groups,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = team.name,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = if (isHub) {
                        "Tutor <-> All Teams"
                    } else {
                        "${team.memberCount} members • ${team.cefrLevel}" + if (isMember) " • Joined" else ""
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ChatThreadPane(
    team: TeamChannel,
    messagesState: UiState<List<ChatMessage>>,
    currentUserId: String,
    currentUserTeamId: String,
    isTutor: Boolean,
    onJoinTeam: () -> Unit,
    onSendMessage: (text: String, pinned: Boolean) -> Unit,
    onTogglePin: (messageId: String, pinned: Boolean) -> Unit,
    onDeleteMessage: (messageId: String) -> Unit,
    onSpeak: (String) -> Unit
) {
    val isHub = team.channelKind == TeamChannelKind.TEACHER_HUB.name
    val isMember = currentUserTeamId == team.id
    var draft by remember(team.id) { mutableStateOf("") }
    var pinOnSend by remember(team.id) { mutableStateOf(false) }
    val listState = rememberLazyListState()
    val timeFormatter = remember { SimpleDateFormat("HH:mm", Locale.getDefault()) }

    val messages = (messagesState as? UiState.Success)?.data.orEmpty()
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.lastIndex)
        }
    }

    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxSize()
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Channel Header
            Surface(
                color = if (isHub) IndigoSoft else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = team.name,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = if (isHub) IndigoOnSoft else MaterialTheme.colorScheme.onSurface,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f, fill = false)
                            )
                            CefrBadge(level = CefrLevel.fromRaw(team.cefrLevel))
                        }
                        Text(
                            text = team.motto.ifBlank { "Practice English together in real time" },
                            style = MaterialTheme.typography.bodySmall,
                            color = if (isHub) IndigoOnSoft.copy(alpha = 0.85f) else MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    if (!isHub) {
                        if (isMember) {
                            Surface(
                                shape = RoundedCornerShape(99.dp),
                                color = MintSoft
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        Icons.Filled.CheckCircle,
                                        contentDescription = "Joined",
                                        tint = MintOnSoft,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = "My Team",
                                        color = MintOnSoft,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        } else {
                            OutlinedButton(
                                onClick = onJoinTeam,
                                modifier = Modifier
                                    .heightIn(min = 48.dp)
                                    .testTag("chat_join_team_button")
                            ) {
                                Text("Join (${team.memberCount})")
                            }
                        }
                    }
                }
            }

            // Messages List
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                when (messagesState) {
                    is UiState.Loading -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator()
                        }
                    }
                    is UiState.Error -> {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = messagesState.message,
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                    is UiState.Success -> {
                        if (messages.isEmpty()) {
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(20.dp),
                                verticalArrangement = Arrangement.Center,
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "No messages in ${team.name} yet",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    text = "Say hi in English or tap a starter phrase below!",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        } else {
                            LazyColumn(
                                state = listState,
                                modifier = Modifier.fillMaxSize(),
                                contentPadding = PaddingValues(14.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                items(messages, key = { it.id }) { msg ->
                                    ChatMessageBubble(
                                        message = msg,
                                        isMine = msg.senderUid == currentUserId,
                                        isTutor = isTutor,
                                        timeText = msg.createdAt?.toDate()?.let { timeFormatter.format(it) } ?: "now",
                                        onSpeak = { onSpeak(msg.text) },
                                        onTogglePin = { onTogglePin(msg.id, !msg.pinned) },
                                        onDelete = { onDeleteMessage(msg.id) }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Quick English conversation starters
            LazyRow(
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                items(QUICK_ENGLISH_PROMPTS) { prompt ->
                    AssistChip(
                        onClick = { draft = prompt },
                        label = { Text(prompt, maxLines = 1, overflow = TextOverflow.Ellipsis) }
                    )
                }
            }

            if (isTutor) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = pinOnSend,
                        onCheckedChange = { pinOnSend = it }
                    )
                    Text(
                        text = "Pin as Tutor Notice",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            // Message Composer
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = draft,
                    onValueChange = { if (it.length <= 500) draft = it },
                    placeholder = { Text("Write a message in English...") },
                    maxLines = 3,
                    shape = RoundedCornerShape(18.dp),
                    modifier = Modifier
                        .weight(1f)
                        .testTag("chat_message_input")
                )
                Button(
                    onClick = {
                        val trimmed = draft.trim()
                        if (trimmed.isNotEmpty()) {
                            onSendMessage(trimmed, pinOnSend)
                            draft = ""
                            pinOnSend = false
                        }
                    },
                    enabled = draft.isNotBlank(),
                    shape = RoundedCornerShape(16.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 12.dp),
                    modifier = Modifier
                        .heightIn(min = 52.dp)
                        .testTag("chat_send_button")
                ) {
                    Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send")
                }
            }
        }
    }
}

@Composable
private fun ChatMessageBubble(
    message: ChatMessage,
    isMine: Boolean,
    isTutor: Boolean,
    timeText: String,
    onSpeak: () -> Unit,
    onTogglePin: () -> Unit,
    onDelete: () -> Unit
) {
    val role = ChatSenderRole.fromRaw(message.senderRole)
    val bubbleBg = when {
        message.pinned -> AmberSoft
        isMine -> IndigoSoft
        else -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.65f)
    }
    val bubbleTextColor = when {
        message.pinned -> AmberOnSoft
        isMine -> IndigoOnSoft
        else -> MaterialTheme.colorScheme.onSurface
    }
    val bubbleMutedColor = when {
        message.pinned -> AmberOnSoft.copy(alpha = 0.78f)
        isMine -> IndigoOnSoft.copy(alpha = 0.78f)
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = bubbleBg),
        border = if (message.pinned) BorderStroke(1.dp, AmberOnSoft.copy(alpha = 0.4f)) else null,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
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
                    Text(
                        text = message.senderName,
                        color = bubbleTextColor,
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f, fill = false)
                    )
                    if (role != ChatSenderRole.PLAYER) {
                        Surface(
                            shape = RoundedCornerShape(99.dp),
                            color = if (role == ChatSenderRole.ADMIN) MaterialTheme.colorScheme.primary else AmberOnSoft
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(3.dp)
                            ) {
                                Icon(
                                    Icons.Filled.Shield,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(11.dp)
                                )
                                Text(
                                    text = role.label.uppercase(),
                                    color = Color.White,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    } else if (message.senderTeamName.isNotBlank()) {
                        Surface(
                            shape = RoundedCornerShape(99.dp),
                            color = MintSoft
                        ) {
                            Text(
                                text = message.senderTeamName,
                                color = MintOnSoft,
                                style = MaterialTheme.typography.labelSmall,
                                modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                    if (message.pinned) {
                        Text(
                            text = "PINNED",
                            style = MaterialTheme.typography.labelSmall,
                            color = AmberOnSoft,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                Text(
                    text = timeText,
                    style = MaterialTheme.typography.labelSmall,
                    color = bubbleMutedColor
                )
            }

            Text(
                text = message.text,
                style = MaterialTheme.typography.bodyMedium,
                color = bubbleTextColor
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onSpeak,
                    modifier = Modifier.size(48.dp)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.VolumeUp,
                        contentDescription = "Listen to message",
                        tint = if (message.pinned || isMine) bubbleTextColor else MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(19.dp)
                    )
                }
                if (isTutor) {
                    IconButton(
                        onClick = onTogglePin,
                        modifier = Modifier.size(48.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.PushPin,
                            contentDescription = if (message.pinned) "Unpin" else "Pin",
                            tint = if (message.pinned) AmberOnSoft else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
                if (isMine || isTutor) {
                    IconButton(
                        onClick = onDelete,
                        modifier = Modifier.size(48.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Delete,
                            contentDescription = "Delete message",
                            tint = MaterialTheme.colorScheme.error,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun CreateTeamDialog(
    isTutor: Boolean,
    isBusy: Boolean,
    onDismiss: () -> Unit,
    onCreate: (name: String, level: CefrLevel, motto: String, color: String, isTeacherHub: Boolean) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var motto by remember { mutableStateOf("") }
    var level by remember { mutableStateOf(CefrLevel.B2) }
    var colorTag by remember { mutableStateOf("INDIGO") }
    var asTeacherHub by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Team Channel", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { if (it.length <= 50) name = it },
                    label = { Text("Team Name") },
                    placeholder = { Text("e.g. B2 Falcons") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = motto,
                    onValueChange = { if (it.length <= 120) motto = it },
                    label = { Text("Team Motto / Topic") },
                    placeholder = { Text("Daily idioms & speaking challenges") },
                    maxLines = 2,
                    modifier = Modifier.fillMaxWidth()
                )
                Text("Focus Level", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    CefrLevel.entries.forEach { lvl ->
                        FilterChip(
                            selected = level == lvl,
                            onClick = { level = lvl },
                            label = { Text(lvl.label) }
                        )
                    }
                }
                Text("Badge Color", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf("INDIGO", "CORAL", "AMBER", "MINT", "PURPLE").forEach { tag ->
                        FilterChip(
                            selected = colorTag == tag,
                            onClick = { colorTag = tag },
                            label = { Text(tag.lowercase().replaceFirstChar { it.uppercase() }) }
                        )
                    }
                }
                if (isTutor) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = asTeacherHub, onCheckedChange = { asTeacherHub = it })
                        Text("Create as Official Tutor <-> Teams Hub", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onCreate(name, level, motto, colorTag, asTeacherHub) },
                enabled = !isBusy && name.trim().length >= 2,
                modifier = Modifier.heightIn(min = 48.dp)
            ) {
                Text("Create")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun TetheringHotspotPanel(
    tetheringState: TetheringUiState,
    expanded: Boolean,
    onToggleExpanded: () -> Unit,
    onHostTeam: (teamName: String, level: CefrLevel, motto: String) -> Unit,
    onScanHosts: () -> Unit,
    onJoinHost: (hostIp: String, port: Int, teamCode: String) -> Unit,
    onSendHotspotMessage: (text: String, pinned: Boolean) -> Unit,
    onDisconnect: () -> Unit
) {
    var teamNameInput by remember { mutableStateOf("Hotspot Squad") }
    var hostIpInput by remember { mutableStateOf("192.168.43.1") }
    var codeInput by remember { mutableStateOf("") }
    var msgDraft by remember { mutableStateOf("") }
    val isConnected = tetheringState.role != TetheringRole.NONE

    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isConnected) MintSoft else IndigoSoft.copy(alpha = 0.72f)
        ),
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
            .testTag("tethering_hotspot_card")
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onToggleExpanded() },
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        imageVector = Icons.Filled.WifiTethering,
                        contentDescription = null,
                        tint = if (isConnected) MintOnSoft else IndigoOnSoft
                    )
                    Column {
                        Text(
                            text = if (isConnected) {
                                val roleLabel = if (tetheringState.role == TetheringRole.HOST) "Hosting Hotspot" else "Connected to Squad"
                                "$roleLabel • ${tetheringState.activeTeam?.name ?: "Local"}"
                            } else {
                                "Wi-Fi Hotspot Squad (No Internet)"
                            },
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (isConnected) MintOnSoft else IndigoOnSoft
                        )
                        Text(
                            text = tetheringState.statusNote.ifBlank { "Form a local team and play trivia with zero internet" },
                            style = MaterialTheme.typography.labelSmall,
                            color = (if (isConnected) MintOnSoft else IndigoOnSoft).copy(alpha = 0.85f),
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
                if (isConnected) {
                    TextButton(onClick = onDisconnect) {
                        Text("Leave", color = MintOnSoft, fontWeight = FontWeight.Bold)
                    }
                } else {
                    Text(
                        text = if (expanded) "Hide" else "Open",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = IndigoOnSoft
                    )
                }
            }

            AnimatedVisibility(visible = expanded) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (!isConnected) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = teamNameInput,
                                onValueChange = { teamNameInput = it.take(32) },
                                label = { Text("Squad Name") },
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                            Button(
                                onClick = {
                                    onHostTeam(
                                        teamNameInput.ifBlank { "Hotspot Squad" },
                                        CefrLevel.B1,
                                        "Offline Wi-Fi Hotspot Study"
                                    )
                                },
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.heightIn(min = 48.dp)
                            ) {
                                Text("Host")
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedButton(
                                onClick = onScanHosts,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.heightIn(min = 48.dp)
                            ) {
                                Icon(Icons.Filled.Search, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(4.dp))
                                Text(if (tetheringState.isScanning) "Scanning..." else "Scan")
                            }
                            OutlinedTextField(
                                value = hostIpInput,
                                onValueChange = { hostIpInput = it.trim().take(30) },
                                label = { Text("Host IP") },
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                            OutlinedTextField(
                                value = codeInput,
                                onValueChange = { codeInput = it.filter { c -> c.isDigit() }.take(4) },
                                label = { Text("PIN") },
                                singleLine = true,
                                modifier = Modifier.width(76.dp)
                            )
                            Button(
                                onClick = {
                                    onJoinHost(hostIpInput, com.example.data.offline.TetheringHubManager.DEFAULT_TCP_PORT, codeInput)
                                },
                                enabled = hostIpInput.isNotBlank(),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.heightIn(min = 48.dp)
                            ) {
                                Text("Join")
                            }
                        }

                        if (tetheringState.discoveredHosts.isNotEmpty()) {
                            FlowRow(
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                tetheringState.discoveredHosts.forEach { host ->
                                    AssistChip(
                                        onClick = {
                                            hostIpInput = host.hostIp
                                            codeInput = host.teamCode
                                            onJoinHost(host.hostIp, host.port, host.teamCode)
                                        },
                                        label = { Text("Join ${host.teamName} (${host.hostIp})") }
                                    )
                                }
                            }
                        }
                    } else {
                        if (tetheringState.localIpAddresses.isNotEmpty()) {
                            Text(
                                text = "IP: ${tetheringState.localIpAddresses.joinToString()} • Code: ${tetheringState.teamCode} • Peers: ${tetheringState.connectedPeers.size}",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.SemiBold,
                                color = MintOnSoft
                            )
                        }
                        if (tetheringState.messages.isNotEmpty()) {
                            Column(
                                verticalArrangement = Arrangement.spacedBy(4.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                tetheringState.messages.takeLast(4).forEach { msg ->
                                    Surface(
                                        shape = RoundedCornerShape(10.dp),
                                        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.85f),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Text(
                                                text = "${msg.senderName}:",
                                                fontWeight = FontWeight.Bold,
                                                style = MaterialTheme.typography.labelMedium,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                            TranslatableEnglishText(
                                                text = msg.text,
                                                style = MaterialTheme.typography.bodySmall
                                            )
                                        }
                                    }
                                }
                            }
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = msgDraft,
                                onValueChange = { msgDraft = it.take(180) },
                                placeholder = { Text("Message Hotspot Squad...") },
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )
                            IconButton(
                                onClick = {
                                    if (msgDraft.isNotBlank()) {
                                        onSendHotspotMessage(msgDraft.trim(), false)
                                        msgDraft = ""
                                    }
                                },
                                modifier = Modifier.size(48.dp)
                            ) {
                                Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send Hotspot message")
                            }
                        }
                    }
                }
            }
        }
    }
}

