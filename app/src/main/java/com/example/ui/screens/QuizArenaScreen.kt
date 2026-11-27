package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Leaderboard
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.TipsAndUpdates
import androidx.compose.material3.AlertDialog
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
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.data.ai.GeneratedQuizDraft
import com.example.data.content.CuratedContent
import com.example.data.model.CefrLevel
import com.example.data.model.ClubContentItem
import com.example.data.model.ClubContentType
import com.example.data.model.CustomQuiz
import com.example.data.model.LeaderboardEntry
import com.example.data.model.QuizQuestionItem
import com.example.data.model.RoomMessageType
import com.example.data.model.RoomStatus
import com.example.ui.ActiveRoomSession
import com.example.ui.AiGenState
import com.example.ui.UiState
import com.example.ui.components.AsyncDrawableImage
import com.example.ui.components.CelebrationConfettiBurst
import com.example.ui.components.CefrBadge
import com.example.ui.components.CefrFilterRow
import com.example.ui.components.KahootShapeGlyph
import com.example.ui.components.LiveRoomChatSheet
import com.example.ui.components.LiveRoomChatTickerBar
import com.example.ui.components.TranslatableEnglishText
import com.example.ui.components.Trophy3DFigure
import com.example.ui.components.avatarColorForTag
import com.example.ui.components.kahootTileColor
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.JetBrainsMonoFontFamily
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft
import com.example.ui.theme.MintTertiary
import kotlinx.coroutines.delay

private data class LocalQuizSession(
    val title: String,
    val cefrLevel: CefrLevel,
    val questions: List<QuizQuestionItem>,
    val currentIndex: Int = 0,
    val score: Int = 0,
    val correctCount: Int = 0,
    val streak: Int = 0,
    val selectedOption: Int? = null,
    val showSummary: Boolean = false
)

internal fun prepareDynamicQuizQuestions(questions: List<QuizQuestionItem>): List<QuizQuestionItem> {
    return questions.shuffled().map { q ->
        if (q.options.size <= 1) {
            q
        } else {
            val indexed = q.options.mapIndexed { idx, opt -> idx to opt }.shuffled()
            val newCorrect = indexed.indexOfFirst { it.first.toLong() == q.correctIndex }.coerceAtLeast(0)
            q.copy(
                options = indexed.map { it.second },
                correctIndex = newCorrect.toLong()
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun QuizArenaScreen(
    customQuizzesState: UiState<List<CustomQuiz>>,
    clubContentState: UiState<List<ClubContentItem>> = UiState.Success(emptyList()),
    roomSession: ActiveRoomSession?,
    aiQuizGenState: AiGenState<GeneratedQuizDraft>,
    defaultNickname: String,
    isBusy: Boolean,
    initialJoinPin: String = "",
    prefilledAiTopic: String? = null,
    prefilledAiLevel: CefrLevel? = null,
    prefilledAiFocusWords: List<String> = emptyList(),
    onClearPrefilledAi: () -> Unit = {},
    selectedLevel: CefrLevel? = null,
    onSelectLevel: (CefrLevel?) -> Unit = {},
    onHostLiveRoom: (title: String, level: CefrLevel, questions: List<QuizQuestionItem>) -> Unit,
    onJoinLiveRoom: (pin: String, nickname: String, avatarColor: String) -> Unit,
    onHostNextPhase: () -> Unit,
    onSubmitLiveAnswer: (Int) -> Unit,
    onLeaveLiveRoom: () -> Unit,
    onSaveCustomQuiz: (title: String, topic: String, level: CefrLevel, questions: List<QuizQuestionItem>, onDone: () -> Unit) -> Unit,
    onDeleteCustomQuiz: (String) -> Unit,
    onGenerateAiQuiz: (topic: String, level: CefrLevel, count: Int, focusWords: List<String>) -> Unit,
    onClearAiQuizGen: () -> Unit,
    onRecordQuizCompletion: (title: String, level: CefrLevel, score: Long, accuracyPct: Long) -> Unit,
    onAwardXp: (Long) -> Unit,
    currentUserId: String = "",
    onSendRoomMessage: (text: String, type: RoomMessageType) -> Unit = { _, _ -> },
    onDeleteRoomMessage: (messageId: String) -> Unit = {},
    onNavigateLeaderboard: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var localQuiz by remember { mutableStateOf<LocalQuizSession?>(null) }
    var showCreateDialog by remember { mutableStateOf(false) }
    var showAiDialog by remember { mutableStateOf(false) }
    var joinPin by remember(initialJoinPin) { mutableStateOf(initialJoinPin) }
    var joinNick by remember(defaultNickname) {
        mutableStateOf(defaultNickname.substringBefore(" ").ifBlank { "Friend" }.take(20))
    }
    var selectedAvatarColor by remember { mutableStateOf("CORAL") }

    LaunchedEffect(prefilledAiTopic) {
        if (!prefilledAiTopic.isNullOrBlank()) {
            onClearAiQuizGen()
            showAiDialog = true
        }
    }

    val activeLocalQuiz = localQuiz
    if (activeLocalQuiz != null) {
        BackHandler { localQuiz = null }
        LocalKahootArena(
            session = activeLocalQuiz,
            onSelectOption = { idx ->
                val cur = localQuiz ?: return@LocalKahootArena
                if (cur.selectedOption != null) return@LocalKahootArena
                val q = cur.questions[cur.currentIndex]
                val correct = idx.toLong() == q.correctIndex
                val newStreak = if (correct) cur.streak + 1 else 0
                val gained = if (correct) 800 + (newStreak.coerceAtMost(4) * 100) else 0
                if (correct) onAwardXp(15L)
                localQuiz = cur.copy(
                    score = cur.score + gained,
                    correctCount = cur.correctCount + if (correct) 1 else 0,
                    streak = newStreak,
                    selectedOption = idx
                )
            },
            onNext = {
                val cur = localQuiz ?: return@LocalKahootArena
                if (cur.currentIndex + 1 >= cur.questions.size) {
                    val acc = if (cur.questions.isNotEmpty()) {
                        ((cur.correctCount * 100f) / cur.questions.size).toLong().coerceIn(0L, 100L)
                    } else 100L
                    onRecordQuizCompletion(cur.title, cur.cefrLevel, cur.score.toLong(), acc)
                    localQuiz = cur.copy(showSummary = true)
                } else {
                    localQuiz = cur.copy(
                        currentIndex = cur.currentIndex + 1,
                        selectedOption = null
                    )
                }
            },
            onExit = { localQuiz = null },
            modifier = modifier
        )
        return
    }

    if (roomSession != null) {
        BackHandler { onLeaveLiveRoom() }
        LiveMultiplayerRoomView(
            session = roomSession,
            currentUserId = currentUserId,
            onHostNext = onHostNextPhase,
            onSubmitAnswer = onSubmitLiveAnswer,
            onSendRoomMessage = onSendRoomMessage,
            onDeleteRoomMessage = onDeleteRoomMessage,
            onLeave = onLeaveLiveRoom,
            modifier = modifier
        )
        return
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
                    Column(modifier = Modifier.widthIn(min = 180.dp, max = 420.dp)) {
                        Text(
                            text = "Quiz Clash",
                            style = MaterialTheme.typography.displaySmall
                        )
                        Text(
                            text = "Host live Kahoot rooms or play solo blitz",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = onNavigateLeaderboard,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .heightIn(min = 48.dp)
                                .testTag("quiz_leaderboard_button")
                        ) {
                            Icon(Icons.Filled.Leaderboard, contentDescription = "Global Leaderboard", modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Ranks", maxLines = 1)
                        }
                        Button(
                            onClick = {
                                onClearAiQuizGen()
                                showAiDialog = true
                            },
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                            modifier = Modifier
                                .heightIn(min = 48.dp)
                                .testTag("ai_quiz_button")
                        ) {
                            Icon(Icons.Filled.AutoAwesome, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("AI Quiz", maxLines = 1)
                        }
                        OutlinedButton(
                            onClick = { showCreateDialog = true },
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .heightIn(min = 48.dp)
                                .testTag("create_quiz_button")
                        ) {
                            Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Create", maxLines = 1)
                        }
                    }
                }
            }

            item {
                AsyncDrawableImage(
                    resId = R.drawable.img_quiz_arena,
                    contentDescription = stringResource(R.string.cd_quiz_arena),
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(155.dp)
                        .clip(RoundedCornerShape(22.dp))
                )
            }

            // Join Room Card
            item {
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
                        Text(
                            text = "Join a Live Kahoot Room",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedTextField(
                                value = joinPin,
                                onValueChange = { s ->
                                    joinPin = s.uppercase().filter { it.isLetterOrDigit() }.take(6)
                                },
                                label = { Text("Room PIN") },
                                singleLine = true,
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("quiz_join_pin_field")
                            )
                            OutlinedTextField(
                                value = joinNick,
                                onValueChange = { joinNick = it.take(20) },
                                label = { Text("Nickname") },
                                singleLine = true,
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("quiz_join_nick_field")
                            )
                        }
                        FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                                listOf("CORAL", "BLUE", "AMBER", "MINT").forEach { tag ->
                                    Box(
                                        contentAlignment = Alignment.Center,
                                        modifier = Modifier
                                            .size(48.dp)
                                            .clip(CircleShape)
                                            .clickable { selectedAvatarColor = tag }
                                    ) {
                                        Surface(
                                            shape = CircleShape,
                                            color = avatarColorForTag(tag),
                                            border = if (selectedAvatarColor == tag) {
                                                androidx.compose.foundation.BorderStroke(3.dp, MaterialTheme.colorScheme.onSurface)
                                            } else null,
                                            modifier = Modifier.size(34.dp)
                                        ) {}
                                    }
                                }
                            }
                            Button(
                                onClick = { onJoinLiveRoom(joinPin, joinNick, selectedAvatarColor) },
                                enabled = !isBusy && joinPin.length == 6 && joinNick.isNotBlank(),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                                modifier = Modifier
                                    .heightIn(min = 48.dp)
                                    .testTag("quiz_join_room_button")
                            ) {
                                Text("Join Room")
                            }
                        }
                    }
                }
            }

            item {
                CefrFilterRow(
                    selectedLevel = selectedLevel,
                    onSelectLevel = onSelectLevel,
                    tagPrefix = "quiz"
                )
            }

            // Official Club Quizzes published by Teacher/Admin
            val clubQuizzes = (clubContentState as? UiState.Success)?.data.orEmpty()
                .filter {
                    ClubContentType.fromRaw(it.contentType) == ClubContentType.QUIZ &&
                        it.questions.isNotEmpty() &&
                        (selectedLevel == null || CefrLevel.fromRaw(it.cefrLevel) == selectedLevel)
                }
            if (clubQuizzes.isNotEmpty()) {
                item {
                    Text(
                        text = "Official Club Quizzes",
                        style = MaterialTheme.typography.titleLarge
                    )
                }
                items(clubQuizzes, key = { "club_${it.id}" }) { item ->
                    val level = CefrLevel.fromRaw(item.cefrLevel)
                    QuizPackCard(
                        title = item.title,
                        subtitle = "Teacher ${item.authorName.ifBlank { "Admin" }} • ${item.topic} • ${item.questions.size} Qs",
                        level = level,
                        onHostLive = { onHostLiveRoom(item.title, level, item.questions) },
                        onPlaySolo = {
                            localQuiz = LocalQuizSession(item.title, level, prepareDynamicQuizQuestions(item.questions))
                        },
                        onDelete = null
                    )
                }
            }

            // Custom Quizzes Section
            val customList = (customQuizzesState as? UiState.Success)?.data.orEmpty()
                .filter { selectedLevel == null || CefrLevel.fromRaw(it.cefrLevel) == selectedLevel }
            if (customList.isNotEmpty()) {
                item {
                    Text(
                        text = "Your Custom Quizzes",
                        style = MaterialTheme.typography.titleLarge
                    )
                }
                items(customList, key = { it.id }) { quiz ->
                    val level = CefrLevel.fromRaw(quiz.cefrLevel)
                    QuizPackCard(
                        title = quiz.title,
                        subtitle = "${quiz.topic} • ${quiz.questions.size} questions",
                        level = level,
                        onHostLive = { onHostLiveRoom(quiz.title, level, quiz.questions) },
                        onPlaySolo = {
                            localQuiz = LocalQuizSession(quiz.title, level, prepareDynamicQuizQuestions(quiz.questions))
                        },
                        onDelete = { onDeleteCustomQuiz(quiz.id) }
                    )
                }
            }

            // Curated Quizzes Section
            val curatedPacks = CuratedContent.quizPacks.filter {
                selectedLevel == null || it.cefrLevel == selectedLevel
            }
            item {
                Text(
                    text = "Curated Teaching Quizzes",
                    style = MaterialTheme.typography.titleLarge
                )
            }
            if (curatedPacks.isEmpty() && customList.isEmpty() && clubQuizzes.isEmpty()) {
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
                            Text("No quizzes for ${selectedLevel?.label ?: "this"} level yet", fontWeight = FontWeight.Bold)
                            OutlinedButton(onClick = { onSelectLevel(null) }) {
                                Text("Show All Levels")
                            }
                        }
                    }
                }
            } else {
                items(curatedPacks, key = { it.id }) { pack ->
                    QuizPackCard(
                        title = pack.title,
                        subtitle = "${pack.description} (${pack.questions.size} Qs)",
                        level = pack.cefrLevel,
                        onHostLive = { onHostLiveRoom(pack.title, pack.cefrLevel, pack.questions) },
                        onPlaySolo = {
                            localQuiz = LocalQuizSession(pack.title, pack.cefrLevel, prepareDynamicQuizQuestions(pack.questions))
                        },
                        onDelete = null
                    )
                }
            }

            item { Spacer(Modifier.height(16.dp)) }
        }
    }

    if (showCreateDialog) {
        CreateQuizDialog(
            isBusy = isBusy,
            onDismiss = { showCreateDialog = false },
            onSave = { title, topic, level, questions ->
                onSaveCustomQuiz(title, topic, level, questions) {
                    showCreateDialog = false
                }
            }
        )
    }

    if (showAiDialog) {
        AiQuizGeneratorDialog(
            aiQuizGenState = aiQuizGenState,
            initialTopic = prefilledAiTopic.orEmpty(),
            initialLevel = prefilledAiLevel ?: selectedLevel ?: CefrLevel.B2,
            focusWords = prefilledAiFocusWords,
            isBusy = isBusy,
            onGenerate = { topic, lvl, count, words ->
                onGenerateAiQuiz(topic, lvl, count, words)
            },
            onSaveAndClose = { draft ->
                onSaveCustomQuiz(draft.title, draft.topic, draft.cefrLevel, draft.questions) {
                    showAiDialog = false
                    onClearAiQuizGen()
                    onClearPrefilledAi()
                }
            },
            onHostImmediately = { draft ->
                showAiDialog = false
                onClearAiQuizGen()
                onClearPrefilledAi()
                onHostLiveRoom(draft.title, draft.cefrLevel, draft.questions)
            },
            onDismiss = {
                showAiDialog = false
                onClearAiQuizGen()
                onClearPrefilledAi()
            }
        )
    }
}

@Composable
private fun QuizPackCard(
    title: String,
    subtitle: String,
    level: CefrLevel,
    onHostLive: () -> Unit,
    onPlaySolo: () -> Unit,
    onDelete: (() -> Unit)?
) {
    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
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
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    CefrBadge(level = level)
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
                if (onDelete != null) {
                    IconButton(onClick = onDelete, modifier = Modifier.size(48.dp)) {
                        Icon(
                            imageVector = Icons.Filled.Delete,
                            contentDescription = "Delete custom quiz",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Button(
                    onClick = onHostLive,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                ) {
                    Icon(Icons.Filled.Groups, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Host Live PIN")
                }
                OutlinedButton(
                    onClick = onPlaySolo,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                ) {
                    Icon(Icons.Filled.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Quick Blitz")
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun LiveMultiplayerRoomView(
    session: ActiveRoomSession,
    currentUserId: String,
    onHostNext: () -> Unit,
    onSubmitAnswer: (Int) -> Unit,
    onSendRoomMessage: (String, RoomMessageType) -> Unit,
    onDeleteRoomMessage: (String) -> Unit,
    onLeave: () -> Unit,
    modifier: Modifier = Modifier
) {
    val room = session.room
    val status = RoomStatus.fromRaw(room?.status)
    val qIndex = (room?.currentQuestionIndex ?: 0L).toInt()
    val question = room?.questions?.getOrNull(qIndex)
    var showRoomChat by remember { mutableStateOf(false) }

    var secondsLeft by remember(qIndex, status, room?.questionStartedAtMs) {
        mutableIntStateOf((question?.timeLimitSec ?: 20L).toInt())
    }
    LaunchedEffect(qIndex, status, room?.questionStartedAtMs) {
        if (status == RoomStatus.QUESTION && question != null && room.questionStartedAtMs > 0L) {
            val limit = question.timeLimitSec.toInt().coerceAtLeast(5)
            while (true) {
                val elapsed = ((System.currentTimeMillis() - room.questionStartedAtMs) / 1000L).toInt().coerceAtLeast(0)
                secondsLeft = (limit - elapsed).coerceAtLeast(0)
                if (secondsLeft <= 0) break
                delay(500)
            }
        }
    }

    if (showRoomChat) {
        LiveRoomChatSheet(
            roomCode = session.roomCode,
            messages = session.roomMessages,
            currentUserId = currentUserId,
            isHost = session.isHost,
            onSendMessage = onSendRoomMessage,
            onDeleteMessage = onDeleteRoomMessage,
            onDismiss = { showRoomChat = false }
        )
    }

    Box(modifier = modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Column(
                modifier = Modifier.widthIn(max = 680.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header bar
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onLeave, modifier = Modifier.size(48.dp)) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Leave room")
                    }
                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text(
                            text = "PIN: ${session.roomCode}",
                            fontFamily = JetBrainsMonoFontFamily,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                        )
                    }
                    if (!session.isHost) {
                        Surface(
                            color = AmberSoft,
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Text(
                                text = "${session.localScore} pts",
                                color = AmberOnSoft,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                            )
                        }
                    } else {
                        Spacer(Modifier.width(48.dp))
                    }
                }

                LiveRoomChatTickerBar(
                    messages = session.roomMessages,
                    onOpenChat = { showRoomChat = true },
                    onQuickReaction = { reaction ->
                        onSendRoomMessage(reaction, RoomMessageType.REACTION)
                    }
                )

                if (room == null) {
                Text("Connecting to room ${session.roomCode}...", style = MaterialTheme.typography.titleMedium)
            } else {
                when (status) {
                    RoomStatus.LOBBY -> {
                        Card(
                            shape = RoundedCornerShape(24.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Text(
                                    text = room.quizTitle,
                                    style = MaterialTheme.typography.headlineSmall,
                                    color = MaterialTheme.colorScheme.onPrimary,
                                    textAlign = TextAlign.Center
                                )
                                Text(
                                    text = "Share this Game PIN with friends:",
                                    color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.85f)
                                )
                                Surface(
                                    color = Color.White,
                                    shape = RoundedCornerShape(18.dp)
                                ) {
                                    Text(
                                        text = session.roomCode,
                                        fontFamily = JetBrainsMonoFontFamily,
                                        fontSize = 32.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.padding(horizontal = 24.dp, vertical = 12.dp)
                                    )
                                }
                            }
                        }

                        if (session.isHost) {
                            Text(
                                text = "Players in Lobby (${session.players.size})",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            if (session.players.isEmpty()) {
                                Text(
                                    text = "Waiting for friends to join with PIN ${session.roomCode}...",
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            } else {
                                FlowRow(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    session.players.forEach { player ->
                                        Surface(
                                            shape = RoundedCornerShape(99.dp),
                                            color = avatarColorForTag(player.avatarColor)
                                        ) {
                                            Text(
                                                text = player.nickname,
                                                color = Color.White,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                                            )
                                        }
                                    }
                                }
                            }
                            Button(
                                onClick = onHostNext,
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(54.dp)
                            ) {
                                Text("Start Game Now!", style = MaterialTheme.typography.titleMedium)
                            }
                        } else {
                            Card(
                                shape = RoundedCornerShape(20.dp),
                                colors = CardDefaults.cardColors(containerColor = MintSoft),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = "You're in! Watch ${room.hostName}'s screen or wait for Question 1 to begin.",
                                    color = MintOnSoft,
                                    style = MaterialTheme.typography.titleMedium,
                                    modifier = Modifier.padding(20.dp),
                                    textAlign = TextAlign.Center
                                )
                            }
                        }
                    }

                    RoomStatus.QUESTION -> {
                        if (question != null) {
                            val totalLimit = question.timeLimitSec.toFloat().coerceAtLeast(5f)
                            val animatedTimeProgress by animateFloatAsState(
                                targetValue = (secondsLeft / totalLimit).coerceIn(0f, 1f),
                                animationSpec = tween(durationMillis = 360),
                                label = "live_quiz_timer"
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "Question ${qIndex + 1} of ${room.questions.size}",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "${secondsLeft}s",
                                    fontWeight = FontWeight.Bold,
                                    color = if (secondsLeft <= 5) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                                )
                            }
                            LinearProgressIndicator(
                                progress = { animatedTimeProgress },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(8.dp)
                                    .clip(RoundedCornerShape(99.dp))
                            )
                            Card(
                                shape = RoundedCornerShape(22.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                TranslatableEnglishText(
                                    text = question.prompt,
                                    style = MaterialTheme.typography.headlineSmall,
                                    modifier = Modifier.padding(22.dp)
                                )
                            }

                            val hasAnswered = session.answeredQuestionIndex == qIndex
                            KahootTilesGrid(
                                options = question.options,
                                selectedIndex = if (hasAnswered) session.selectedOptionIndex else null,
                                correctIndex = null,
                                enabled = !session.isHost && !hasAnswered,
                                onSelect = onSubmitAnswer
                            )

                            if (session.isHost) {
                                val answeredCount = session.players.count { it.lastAnsweredQuestion.toInt() == qIndex }
                                Text(
                                    text = "$answeredCount / ${session.players.size} players answered",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Button(
                                    onClick = onHostNext,
                                    shape = RoundedCornerShape(16.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(52.dp)
                                ) {
                                    Text("Reveal Answer & Standings")
                                }
                            } else if (hasAnswered) {
                                Surface(
                                    color = MaterialTheme.colorScheme.primaryContainer,
                                    shape = RoundedCornerShape(14.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = "Answer locked in! Waiting for host to reveal...",
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier.padding(14.dp),
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }
                    }

                    RoomStatus.REVEAL -> {
                        if (question != null) {
                            Card(
                                shape = RoundedCornerShape(20.dp),
                                colors = CardDefaults.cardColors(containerColor = MintSoft),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(18.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text(
                                        text = "Correct Answer:",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = MintTertiary
                                    )
                                    Text(
                                        text = question.options.getOrNull(question.correctIndex.toInt()).orEmpty(),
                                        color = MintOnSoft,
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    if (question.tip.isNotBlank()) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Icon(Icons.Filled.TipsAndUpdates, contentDescription = null, tint = MintTertiary)
                                            TranslatableEnglishText(
                                                text = question.tip,
                                                color = MintOnSoft,
                                                underlineColor = MintTertiary,
                                                style = MaterialTheme.typography.bodyMedium
                                            )
                                        }
                                    }
                                }
                            }

                            LeaderboardCard(entries = room.leaderboard)

                            if (session.isHost) {
                                Button(
                                    onClick = onHostNext,
                                    shape = RoundedCornerShape(16.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(52.dp)
                                ) {
                                    Text(
                                        if (qIndex + 1 >= room.questions.size) "Show Final Podium"
                                        else "Next Question"
                                    )
                                }
                            }
                        }
                    }

                    RoomStatus.PODIUM -> {
                        PodiumBanner(entries = room.leaderboard)
                        Button(
                            onClick = onLeave,
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp)
                        ) {
                            Text("Back to Quiz Clash")
                        }
                    }
                }
            }
        }
        }
        if (status == RoomStatus.PODIUM) {
            CelebrationConfettiBurst(triggerKey = session.roomCode)
        }
    }
}

@Composable
private fun LocalKahootArena(
    session: LocalQuizSession,
    onSelectOption: (Int) -> Unit,
    onNext: () -> Unit,
    onExit: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Column(
            modifier = Modifier.widthIn(max = 680.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onExit, modifier = Modifier.size(48.dp)) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Exit quiz")
                }
                Text(
                    text = session.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Surface(color = AmberSoft, shape = RoundedCornerShape(99.dp)) {
                    Text(
                        text = "${session.score} pts",
                        color = AmberOnSoft,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }

            if (session.showSummary) {
                Box(modifier = Modifier.fillMaxWidth()) {
                    Card(
                        shape = RoundedCornerShape(26.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(28.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Trophy3DFigure(size = 96.dp)
                            Text(
                                text = "Quiz Complete!",
                                style = MaterialTheme.typography.displaySmall,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                            Text(
                                text = "Final Score: ${session.score} pts",
                                style = MaterialTheme.typography.headlineSmall,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                            Button(
                                onClick = onExit,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color.White,
                                    contentColor = MaterialTheme.colorScheme.primary
                                ),
                                shape = RoundedCornerShape(14.dp)
                            ) {
                                Text("Back to Quiz Hub")
                            }
                        }
                    }
                    CelebrationConfettiBurst(triggerKey = "${session.title}_${session.score}")
                }
            } else {
                val q = session.questions.getOrNull(session.currentIndex)
                if (q == null) {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(20.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text("No quiz questions found.", fontWeight = FontWeight.Bold)
                            Button(onClick = onExit) { Text("Back to Quiz Hub") }
                        }
                    }
                } else {
                    val totalLimit = q.timeLimitSec.toInt().coerceAtLeast(15)
                    var soloSecondsLeft by remember(session.currentIndex, session.title) { mutableIntStateOf(totalLimit) }
                    LaunchedEffect(session.currentIndex, session.selectedOption, session.title) {
                        if (session.selectedOption == null) {
                            while (soloSecondsLeft > 0) {
                                delay(1000)
                                soloSecondsLeft--
                            }
                            if (soloSecondsLeft == 0 && session.selectedOption == null) {
                                onSelectOption(-1)
                            }
                        }
                    }
                    val timerBarProgress by animateFloatAsState(
                        targetValue = (soloSecondsLeft.toFloat() / totalLimit.toFloat()).coerceIn(0f, 1f),
                        animationSpec = tween(320),
                        label = "solo_quiz_timer"
                    )
                    LinearProgressIndicator(
                        progress = { timerBarProgress },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(99.dp))
                    )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Question ${session.currentIndex + 1} of ${session.questions.size} • Streak ${session.streak}",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${soloSecondsLeft}s",
                        fontWeight = FontWeight.Bold,
                        color = if (soloSecondsLeft <= 5) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                    )
                }

                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    TranslatableEnglishText(
                        text = q.prompt,
                        style = MaterialTheme.typography.headlineSmall,
                        modifier = Modifier.padding(22.dp)
                    )
                }

                KahootTilesGrid(
                    options = q.options,
                    selectedIndex = session.selectedOption,
                    correctIndex = if (session.selectedOption != null) q.correctIndex.toInt() else null,
                    enabled = session.selectedOption == null,
                    onSelect = onSelectOption
                )

                AnimatedVisibility(visible = session.selectedOption != null) {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        val isCorrect = session.selectedOption?.toLong() == q.correctIndex
                        val feedbackTextColor = if (isCorrect) MintOnSoft else MaterialTheme.colorScheme.onErrorContainer
                        Card(
                            shape = RoundedCornerShape(18.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (isCorrect) MintSoft else MaterialTheme.colorScheme.errorContainer
                            ),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = if (isCorrect) Icons.Filled.CheckCircle else Icons.Filled.Close,
                                        contentDescription = null,
                                        tint = feedbackTextColor
                                    )
                                    Text(
                                        text = if (isCorrect) "Spot on! +15 XP" else "Not quite — check the tip below!",
                                        color = feedbackTextColor,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                if (q.tip.isNotBlank()) {
                                    TranslatableEnglishText(
                                        text = q.tip,
                                        color = feedbackTextColor,
                                        underlineColor = feedbackTextColor,
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                }
                            }
                        }

                        Button(
                            onClick = onNext,
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp)
                        ) {
                            Text(
                                if (session.currentIndex + 1 >= session.questions.size) "Finish Quiz"
                                else "Next Question"
                            )
                        }
                    }
                }
                }
            }
        }
    }
}

@Composable
private fun KahootTilesGrid(
    options: List<String>,
    selectedIndex: Int?,
    correctIndex: Int?,
    enabled: Boolean,
    onSelect: (Int) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        options.chunked(2).forEachIndexed { rowIndex, rowItems ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(IntrinsicSize.Min),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                rowItems.forEachIndexed { colIndex, label ->
                    val idx = rowIndex * 2 + colIndex
                    val baseColor = kahootTileColor(idx)
                    val alpha = when {
                        correctIndex == null && selectedIndex == null -> 1f
                        correctIndex != null && idx == correctIndex -> 1f
                        selectedIndex == idx -> 0.92f
                        else -> 0.42f
                    }
                    val interactionSource = remember { MutableInteractionSource() }
                    val isPressed by interactionSource.collectIsPressedAsState()
                    val tileScale by animateFloatAsState(
                        targetValue = if (isPressed && enabled) 0.96f else 1f,
                        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
                        label = "tile_press_scale"
                    )
                    Surface(
                        color = baseColor.copy(alpha = alpha),
                        shape = RoundedCornerShape(18.dp),
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .heightIn(min = 92.dp)
                            .graphicsLayer {
                                scaleX = tileScale
                                scaleY = tileScale
                            }
                            .clip(RoundedCornerShape(18.dp))
                            .clickable(
                                interactionSource = interactionSource,
                                indication = null,
                                enabled = enabled
                            ) { onSelect(idx) }
                            .testTag("kahoot_tile_$idx")
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            KahootShapeGlyph(index = idx)
                            Text(
                                text = label,
                                color = Color.White,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                maxLines = 4,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
                if (rowItems.size == 1) {
                    Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun LeaderboardCard(entries: List<LeaderboardEntry>) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(
                text = "Live Standings",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            if (entries.isEmpty()) {
                Text("No scores recorded yet.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            } else {
                entries.take(5).forEachIndexed { idx, entry ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = avatarColorForTag(entry.avatarColor),
                                modifier = Modifier.size(30.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text("${idx + 1}", color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }
                            Text(entry.nickname, fontWeight = FontWeight.SemiBold)
                        }
                        Text("${entry.score} pts", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun PodiumBanner(entries: List<LeaderboardEntry>) {
    Card(
        shape = RoundedCornerShape(26.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Trophy3DFigure(size = 96.dp)
            Text(
                text = "Final Podium",
                style = MaterialTheme.typography.displaySmall,
                color = MaterialTheme.colorScheme.onPrimary
            )
            entries.take(3).forEachIndexed { index, entry ->
                Surface(
                    color = Color.White.copy(alpha = 0.16f),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "#${index + 1}  ${entry.nickname}",
                            color = Color.White,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${entry.score} pts",
                            color = Color(0xFFFFD54F),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun CreateQuizDialog(
    isBusy: Boolean,
    onDismiss: () -> Unit,
    onSave: (title: String, topic: String, level: CefrLevel, questions: List<QuizQuestionItem>) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var topic by remember { mutableStateOf("Idioms") }
    var level by remember { mutableStateOf(CefrLevel.B2) }
    var prompt by remember { mutableStateOf("") }
    var optA by remember { mutableStateOf("") }
    var optB by remember { mutableStateOf("") }
    var optC by remember { mutableStateOf("") }
    var optD by remember { mutableStateOf("") }
    var correctIdx by remember { mutableIntStateOf(0) }
    var tip by remember { mutableStateOf("") }
    val addedQuestions = remember { mutableStateListOf<QuizQuestionItem>() }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create Custom Quiz (${addedQuestions.size} Qs)") },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it.take(80) },
                    label = { Text("Quiz Title") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = topic,
                    onValueChange = { topic = it.take(40) },
                    label = { Text("Topic") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
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
                OutlinedTextField(
                    value = prompt,
                    onValueChange = { prompt = it },
                    label = { Text("Question Prompt") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = optA,
                    onValueChange = { optA = it },
                    label = { Text("Option A") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = optB,
                    onValueChange = { optB = it },
                    label = { Text("Option B") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = optC,
                    onValueChange = { optC = it },
                    label = { Text("Option C") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = optD,
                    onValueChange = { optD = it },
                    label = { Text("Option D") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        "Correct:",
                        style = MaterialTheme.typography.labelMedium,
                        modifier = Modifier.align(Alignment.CenterVertically)
                    )
                    listOf("A", "B", "C", "D").forEachIndexed { idx, letter ->
                        FilterChip(
                            selected = correctIdx == idx,
                            onClick = { correctIdx = idx },
                            label = { Text(letter) }
                        )
                    }
                }
                OutlinedTextField(
                    value = tip,
                    onValueChange = { tip = it },
                    label = { Text("Teaching Tip (optional)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedButton(
                    onClick = {
                        if (prompt.isNotBlank() && optA.isNotBlank() && optB.isNotBlank()) {
                            addedQuestions.add(
                                QuizQuestionItem(
                                    prompt = prompt.trim(),
                                    options = listOf(
                                        optA.trim(),
                                        optB.trim(),
                                        optC.trim().ifBlank { "None of the above" },
                                        optD.trim().ifBlank { "All of the above" }
                                    ),
                                    correctIndex = correctIdx.toLong(),
                                    timeLimitSec = 20L,
                                    tip = tip.trim()
                                )
                            )
                            prompt = ""
                            optA = ""
                            optB = ""
                            optC = ""
                            optD = ""
                            correctIdx = 0
                            tip = ""
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("+ Add Question to Quiz")
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val finalQuestions = addedQuestions.toMutableList()
                    if (finalQuestions.isEmpty() && prompt.isNotBlank() && optA.isNotBlank() && optB.isNotBlank()) {
                        finalQuestions.add(
                            QuizQuestionItem(
                                prompt = prompt.trim(),
                                options = listOf(
                                    optA.trim(),
                                    optB.trim(),
                                    optC.trim().ifBlank { "None of the above" },
                                    optD.trim().ifBlank { "All of the above" }
                                ),
                                correctIndex = correctIdx.toLong(),
                                timeLimitSec = 20L,
                                tip = tip.trim()
                            )
                        )
                    }
                    if (title.isNotBlank() && finalQuestions.isNotEmpty()) {
                        onSave(title, topic, level, finalQuestions)
                    }
                },
                enabled = !isBusy && title.isNotBlank() && (addedQuestions.isNotEmpty() || (prompt.isNotBlank() && optA.isNotBlank() && optB.isNotBlank()))
            ) {
                Text("Save Quiz")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun AiQuizGeneratorDialog(
    aiQuizGenState: AiGenState<GeneratedQuizDraft>,
    initialTopic: String,
    initialLevel: CefrLevel,
    focusWords: List<String>,
    isBusy: Boolean,
    onGenerate: (topic: String, level: CefrLevel, count: Int, focusWords: List<String>) -> Unit,
    onSaveAndClose: (GeneratedQuizDraft) -> Unit,
    onHostImmediately: (GeneratedQuizDraft) -> Unit,
    onDismiss: () -> Unit
) {
    var topic by remember(initialTopic) {
        mutableStateOf(initialTopic.ifBlank { "Travel Idioms & Café English" })
    }
    var level by remember(initialLevel) { mutableStateOf(initialLevel) }
    var questionCount by remember { mutableIntStateOf(5) }
    val topicSuggestions = listOf("Travel & Airport", "Café & Ordering", "B2 Idioms", "Job Interviews", "Storytelling Verbs")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(Icons.Filled.AutoAwesome, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
                Text("AI Kahoot Quiz Studio")
            }
        },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = topic,
                    onValueChange = { topic = it.take(60) },
                    label = { Text("Quiz Topic") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("ai_quiz_topic_input")
                )
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    topicSuggestions.forEach { preset ->
                        FilterChip(
                            selected = topic == preset,
                            onClick = { topic = preset },
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
                Text("Questions", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    listOf(4, 5, 8).forEach { count ->
                        FilterChip(
                            selected = questionCount == count,
                            onClick = { questionCount = count },
                            label = { Text("$count Qs") }
                        )
                    }
                }
                if (focusWords.isNotEmpty()) {
                    Surface(color = IndigoSoft, shape = RoundedCornerShape(12.dp), modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "Focus words: ${focusWords.take(8).joinToString(", ")}",
                            color = IndigoOnSoft,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }

                when (aiQuizGenState) {
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
                            Text("Generating live Kahoot questions with Gemini...")
                        }
                    }
                    is AiGenState.Error -> {
                        Surface(
                            color = MaterialTheme.colorScheme.errorContainer,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = aiQuizGenState.message,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.padding(12.dp)
                            )
                        }
                    }
                    is AiGenState.Success -> {
                        val draft = aiQuizGenState.data
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
                                    text = "${draft.title} (${draft.questions.size} Qs)",
                                    color = MintOnSoft,
                                    fontWeight = FontWeight.Bold
                                )
                                draft.questions.take(3).forEachIndexed { idx, q ->
                                    Text(
                                        text = "${idx + 1}. ${q.prompt}",
                                        color = MintOnSoft,
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                                if (draft.questions.size > 3) {
                                    Text(
                                        text = "+ ${draft.questions.size - 3} more questions ready!",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MintTertiary
                                    )
                                }
                            }
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = { onSaveAndClose(draft) },
                                enabled = !isBusy,
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Save")
                            }
                            Button(
                                onClick = { onHostImmediately(draft) },
                                enabled = !isBusy,
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Host Live PIN")
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onGenerate(topic, level, questionCount, focusWords) },
                enabled = aiQuizGenState !is AiGenState.Loading && topic.isNotBlank(),
                modifier = Modifier.testTag("ai_quiz_generate_confirm")
            ) {
                Text(if (aiQuizGenState is AiGenState.Success) "Regenerate" else "Generate")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Close") }
        }
    )
}

