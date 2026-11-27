package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.ChatBubble
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
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
import com.example.data.model.ChatMessage
import com.example.data.model.ChatSenderRole
import com.example.data.model.RoomChatMessage
import com.example.data.model.RoomMessageType
import com.example.data.model.TeamChannel
import com.example.data.model.TeamChannelKind
import com.example.ui.UiState
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft
import com.example.util.rememberTtsSpeaker
import java.text.SimpleDateFormat
import java.util.Locale

private val LIVE_ROOM_QUICK_REACTIONS = listOf(
    "👏" to "👏 Great round!",
    "🔥" to "🔥 On a streak!",
    "⚡" to "⚡ So fast!",
    "🤔" to "🤔 Tricky one!",
    "🎉" to "🎉 GG everyone!"
)

private val SQUAD_QUICK_SHOUTOUTS = listOf(
    "🔥 New combo streak!",
    "🎯 Beat my high score!",
    "💡 How do you use this word?",
    "👏 Let's play a Quiz Clash!"
)

/**
 * Compact live room chat ticker + instant 1-tap reaction bar shown inside Live Quiz Clash.
 */
@Composable
fun LiveRoomChatTickerBar(
    messages: List<RoomChatMessage>,
    onOpenChat: () -> Unit,
    onQuickReaction: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val latest = messages.lastOrNull()
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.25f)),
        modifier = modifier
            .fillMaxWidth()
            .testTag("live_room_chat_ticker")
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(onClick = onOpenChat),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    BadgedBox(
                        badge = {
                            if (messages.isNotEmpty()) {
                                Badge {
                                    Text(
                                        text = if (messages.size > 99) "99+" else messages.size.toString()
                                    )
                                }
                            }
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Forum,
                            contentDescription = "Open live room chat",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                    if (latest != null) {
                        Text(
                            text = "${latest.senderName}: ${latest.text}",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Medium,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f)
                        )
                    } else {
                        Text(
                            text = "Live room chat — tap to cheer or drop a tip!",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                Surface(
                    shape = RoundedCornerShape(99.dp),
                    color = IndigoSoft
                ) {
                    Text(
                        text = "Chat",
                        color = IndigoOnSoft,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                    )
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                LIVE_ROOM_QUICK_REACTIONS.forEach { (emoji, payload) ->
                    Surface(
                        shape = RoundedCornerShape(99.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        modifier = Modifier
                            .clickable { onQuickReaction(payload) }
                            .testTag("room_quick_react_$emoji")
                    ) {
                        Text(
                            text = payload,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        )
                    }
                }
            }
        }
    }
}

/**
 * Floating/Header Squad Chat trigger button for Arcade & Word games.
 */
@Composable
fun InGameChatActionButton(
    messageCount: Int,
    label: String = "Squad Chat",
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(99.dp),
        color = IndigoSoft,
        modifier = modifier
            .heightIn(min = 42.dp)
            .testTag("ingame_squad_chat_button")
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = Icons.Filled.ChatBubble,
                contentDescription = label,
                tint = IndigoOnSoft,
                modifier = Modifier.size(16.dp)
            )
            Text(
                text = label,
                color = IndigoOnSoft,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold
            )
            if (messageCount > 0) {
                Surface(
                    shape = CircleShape,
                    color = IndigoOnSoft
                ) {
                    Text(
                        text = messageCount.coerceAtMost(99).toString(),
                        color = Color.White,
                        style = MaterialTheme.typography.labelSmall,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 1.dp)
                    )
                }
            }
        }
    }
}

/**
 * Interactive Modal Bottom Sheet for Multiplayer Live Quiz Room Chat.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LiveRoomChatSheet(
    roomCode: String,
    messages: List<RoomChatMessage>,
    currentUserId: String,
    isHost: Boolean,
    onSendMessage: (String, RoomMessageType) -> Unit,
    onDeleteMessage: (String) -> Unit,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val listState = rememberLazyListState()
    var draft by remember { mutableStateOf("") }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        dragHandle = null
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 380.dp, max = 580.dp)
                .imePadding()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
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
                    Icon(Icons.Filled.Forum, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Column {
                        Text(
                            text = "Live Room Chat • PIN $roomCode",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Real-time messages & reactions with room players",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                IconButton(onClick = onDismiss, modifier = Modifier.size(48.dp)) {
                    Icon(Icons.Filled.Close, contentDescription = "Close live room chat")
                }
            }

            if (messages.isEmpty()) {
                Surface(
                    shape = RoundedCornerShape(18.dp),
                    color = IndigoSoft,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "No room messages yet. Tap a quick reaction below or cheer on your friends!",
                        color = IndigoOnSoft,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            } else {
                LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentPadding = PaddingValues(vertical = 4.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(messages, key = { it.id.ifBlank { "${it.senderUid}_${it.text.hashCode()}" } }) { msg ->
                        val isOwn = msg.senderUid == currentUserId
                        val isReaction = RoomMessageType.fromRaw(msg.messageType) == RoomMessageType.REACTION
                        val timeText = remember(msg.createdAt) {
                            msg.createdAt?.toDate()?.let {
                                SimpleDateFormat("HH:mm", Locale.getDefault()).format(it)
                            } ?: "now"
                        }
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = when {
                                msg.hostSender -> AmberSoft
                                isOwn -> IndigoSoft
                                isReaction -> MintSoft
                                else -> MaterialTheme.colorScheme.surfaceVariant
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Surface(
                                    shape = CircleShape,
                                    color = avatarColorForTag(msg.avatarColor),
                                    modifier = Modifier.size(34.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(
                                            text = msg.senderName.take(1).uppercase(),
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Text(
                                            text = if (isOwn) "${msg.senderName} (You)" else msg.senderName,
                                            color = when {
                                                msg.hostSender -> AmberOnSoft
                                                isOwn -> IndigoOnSoft
                                                isReaction -> MintOnSoft
                                                else -> MaterialTheme.colorScheme.onSurface
                                            },
                                            style = MaterialTheme.typography.labelMedium,
                                            fontWeight = FontWeight.Bold
                                        )
                                        if (msg.hostSender) {
                                            Surface(color = AmberOnSoft, shape = RoundedCornerShape(6.dp)) {
                                                Text(
                                                    text = "HOST",
                                                    color = Color.White,
                                                    style = MaterialTheme.typography.labelSmall,
                                                    modifier = Modifier.padding(horizontal = 5.dp, vertical = 1.dp)
                                                )
                                            }
                                        }
                                        Text(
                                            text = timeText,
                                            color = when {
                                                msg.hostSender -> AmberOnSoft.copy(alpha = 0.75f)
                                                isOwn -> IndigoOnSoft.copy(alpha = 0.75f)
                                                isReaction -> MintOnSoft.copy(alpha = 0.75f)
                                                else -> MaterialTheme.colorScheme.onSurfaceVariant
                                            },
                                            style = MaterialTheme.typography.labelSmall
                                        )
                                    }
                                    Text(
                                        text = msg.text,
                                        color = when {
                                            msg.hostSender -> AmberOnSoft
                                            isOwn -> IndigoOnSoft
                                            isReaction -> MintOnSoft
                                            else -> MaterialTheme.colorScheme.onSurface
                                        },
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = if (isReaction) FontWeight.SemiBold else FontWeight.Normal
                                    )
                                }
                                if ((isOwn || isHost) && msg.id.isNotBlank()) {
                                    IconButton(
                                        onClick = { onDeleteMessage(msg.id) },
                                        modifier = Modifier.size(36.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Filled.Delete,
                                            contentDescription = "Delete room message",
                                            tint = MaterialTheme.colorScheme.error,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                LIVE_ROOM_QUICK_REACTIONS.forEach { (_, payload) ->
                    AssistChip(
                        onClick = { onSendMessage(payload, RoomMessageType.REACTION) },
                        label = { Text(payload) }
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = draft,
                    onValueChange = { draft = it.take(240) },
                    placeholder = { Text("Say hi or cheer in English...") },
                    singleLine = true,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .weight(1f)
                        .testTag("room_chat_input")
                )
                IconButton(
                    onClick = {
                        val trimmed = draft.trim()
                        if (trimmed.isNotEmpty()) {
                            onSendMessage(trimmed, RoomMessageType.TEXT)
                            draft = ""
                        }
                    },
                    enabled = draft.trim().isNotEmpty(),
                    colors = IconButtonDefaults.filledIconButtonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    ),
                    modifier = Modifier
                        .size(50.dp)
                        .testTag("room_chat_send_button")
                ) {
                    Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send room message")
                }
            }
        }
    }
}

/**
 * Reusable In-Game Squad & Tutor Chat Bottom Sheet usable inside Arcade Games,
 * Word Forge Puzzles, and Taboo & Act so players can message or brag live mid-game.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InGameSquadChatSheet(
    teamsState: UiState<List<TeamChannel>>,
    selectedTeamId: String,
    messagesState: UiState<List<ChatMessage>>,
    currentUserId: String,
    suggestedShoutout: String? = null,
    onSelectChannel: (String) -> Unit,
    onSendMessage: (TeamChannel, String) -> Unit,
    onOpenFullChatTab: (() -> Unit)? = null,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val tts = rememberTtsSpeaker()
    val teams = (teamsState as? UiState.Success)?.data.orEmpty()
    val activeTeam = remember(teams, selectedTeamId) {
        teams.firstOrNull { it.id == selectedTeamId } ?: teams.firstOrNull()
    }
    val messages = (messagesState as? UiState.Success)?.data.orEmpty()
    val listState = rememberLazyListState()
    var draft by remember { mutableStateOf("") }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        dragHandle = null
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 380.dp, max = 590.dp)
                .imePadding()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
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
                    Icon(Icons.Filled.Forum, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Column {
                        Text(
                            text = "In-Game Squad & Tutor Chat",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = activeTeam?.name ?: "Select or create a squad channel",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
                IconButton(onClick = onDismiss, modifier = Modifier.size(48.dp)) {
                    Icon(Icons.Filled.Close, contentDescription = "Close squad chat")
                }
            }

            if (teams.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    teams.forEach { team ->
                        FilterChip(
                            selected = team.id == activeTeam?.id,
                            onClick = { onSelectChannel(team.id) },
                            label = {
                                Text(
                                    text = if (team.channelKind == TeamChannelKind.TEACHER_HUB.name) {
                                        "Tutor Hub"
                                    } else {
                                        team.name
                                    },
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        )
                    }
                }
            }

            when {
                teamsState is UiState.Loading || messagesState is UiState.Loading -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                activeTeam == null -> {
                    Surface(
                        shape = RoundedCornerShape(18.dp),
                        color = IndigoSoft,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "No Team Channel Yet",
                                color = IndigoOnSoft,
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Create or join a team in the Chat tab to share scores and practice English together!",
                                color = IndigoOnSoft.copy(alpha = 0.85f),
                                style = MaterialTheme.typography.bodySmall
                            )
                            if (onOpenFullChatTab != null) {
                                AssistChip(
                                    onClick = {
                                        onDismiss()
                                        onOpenFullChatTab()
                                    },
                                    label = { Text("Go to Teams & Chat") }
                                )
                            }
                        }
                    }
                }
                else -> {
                    if (messages.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .weight(1f),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Say hello to ${activeTeam.name} or post your game score!",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    } else {
                        LazyColumn(
                            state = listState,
                            modifier = Modifier
                                .fillMaxWidth()
                                .weight(1f),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(messages, key = { it.id.ifBlank { "${it.senderUid}_${it.text.hashCode()}" } }) { msg ->
                                val isOwn = msg.senderUid == currentUserId
                                val senderRole = ChatSenderRole.fromRaw(msg.senderRole)
                                val bg = when {
                                    msg.pinned -> AmberSoft
                                    isOwn -> IndigoSoft
                                    else -> MaterialTheme.colorScheme.surfaceVariant
                                }
                                val fg = when {
                                    msg.pinned -> AmberOnSoft
                                    isOwn -> IndigoOnSoft
                                    else -> MaterialTheme.colorScheme.onSurface
                                }
                                Surface(
                                    shape = RoundedCornerShape(14.dp),
                                    color = bg,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(
                                        modifier = Modifier.padding(10.dp),
                                        verticalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                                            ) {
                                                Text(
                                                    text = if (isOwn) "${msg.senderName} (You)" else msg.senderName,
                                                    color = fg,
                                                    style = MaterialTheme.typography.labelMedium,
                                                    fontWeight = FontWeight.Bold
                                                )
                                                if (senderRole == ChatSenderRole.TEACHER) {
                                                    Surface(color = MintSoft, shape = RoundedCornerShape(6.dp)) {
                                                        Text(
                                                            text = "Tutor",
                                                            color = MintOnSoft,
                                                            style = MaterialTheme.typography.labelSmall,
                                                            fontWeight = FontWeight.Bold,
                                                            modifier = Modifier.padding(horizontal = 5.dp, vertical = 1.dp)
                                                        )
                                                    }
                                                }
                                                if (msg.pinned) {
                                                    Icon(
                                                        Icons.Filled.PushPin,
                                                        contentDescription = "Pinned",
                                                        tint = fg,
                                                        modifier = Modifier.size(14.dp)
                                                    )
                                                }
                                            }
                                            IconButton(
                                                onClick = { tts.speak(msg.text) },
                                                modifier = Modifier.size(28.dp)
                                            ) {
                                                Icon(
                                                    Icons.AutoMirrored.Filled.VolumeUp,
                                                    contentDescription = "Read aloud",
                                                    tint = fg,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }
                                        }
                                        Text(
                                            text = msg.text,
                                            color = fg,
                                            style = MaterialTheme.typography.bodyMedium
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        if (!suggestedShoutout.isNullOrBlank()) {
                            AssistChip(
                                onClick = { onSendMessage(activeTeam, suggestedShoutout) },
                                leadingIcon = {
                                    Icon(Icons.Filled.EmojiEvents, contentDescription = null, modifier = Modifier.size(16.dp))
                                },
                                label = { Text("Share Current Score") }
                            )
                        }
                        SQUAD_QUICK_SHOUTOUTS.forEach { shout ->
                            AssistChip(
                                onClick = { onSendMessage(activeTeam, shout) },
                                label = { Text(shout) }
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = draft,
                            onValueChange = { draft = it.take(450) },
                            placeholder = { Text("Message ${activeTeam.name}...") },
                            singleLine = true,
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("squad_sheet_input")
                        )
                        IconButton(
                            onClick = {
                                val trimmed = draft.trim()
                                if (trimmed.isNotEmpty()) {
                                    onSendMessage(activeTeam, trimmed)
                                    draft = ""
                                }
                            },
                            enabled = draft.trim().isNotEmpty(),
                            colors = IconButtonDefaults.filledIconButtonColors(
                                containerColor = MaterialTheme.colorScheme.primary
                            ),
                            modifier = Modifier
                                .size(50.dp)
                                .testTag("squad_sheet_send")
                        ) {
                            Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send message")
                        }
                    }
                }
            }
        }
    }
}
