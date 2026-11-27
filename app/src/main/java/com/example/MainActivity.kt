package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Extension
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Leaderboard
import androidx.compose.material.icons.filled.RecordVoiceOver
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.SportsEsports
import androidx.compose.material.icons.filled.Style
import androidx.compose.material.icons.filled.TheaterComedy
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material.icons.outlined.AccountCircle
import androidx.compose.material.icons.outlined.Bolt
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Extension
import androidx.compose.material.icons.outlined.Forum
import androidx.compose.material.icons.outlined.Headphones
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Leaderboard
import androidx.compose.material.icons.outlined.RecordVoiceOver
import androidx.compose.material.icons.outlined.School
import androidx.compose.material.icons.outlined.SportsEsports
import androidx.compose.material.icons.outlined.Style
import androidx.compose.material.icons.outlined.TheaterComedy
import androidx.compose.material.icons.outlined.Translate
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.credentials.CredentialManager
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.auth.AuthScreen
import com.example.auth.signOutWithCleanup
import com.example.data.firebase.LingoRepository
import com.example.data.model.CefrLevel
import com.example.data.offline.OfflineLocalStore
import com.example.data.offline.TetheringHubManager
import com.example.ui.GameViewModel
import com.example.ui.LingoViewModel
import com.example.ui.UiState
import com.example.ui.screens.ArcadeMode
import com.example.ui.screens.AudiobooksScreen
import com.example.ui.screens.CardsScreen
import com.example.ui.screens.DictionaryScreen
import com.example.ui.screens.GamesArcadeScreen
import com.example.ui.screens.GlobalLeaderboardScreen
import com.example.ui.screens.GuessingScreen
import com.example.ui.screens.HomeScreen
import com.example.ui.screens.ProfileScreen
import com.example.ui.screens.PuzzlesScreen
import com.example.ui.screens.QuizArenaScreen
import com.example.ui.screens.RoleplaysScreen
import com.example.ui.screens.TeamChatScreen
import com.example.ui.screens.TutorDashboardScreen
import com.example.ui.screens.WeeklyCurriculumScreen
import com.example.ui.theme.LingoClubTheme
import com.example.util.configureAppCheck
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.auth
import com.google.firebase.firestore.FirebaseFirestore

const val ROUTE_HOME = "home"
const val ROUTE_QUIZ = "quiz"
const val ROUTE_ARCADE = "arcade"
const val ROUTE_LEADERBOARD = "leaderboard"
const val ROUTE_CURRICULUM = "curriculum"
const val ROUTE_AUDIOBOOKS = "audiobooks"
const val ROUTE_CHAT = "chat"
const val ROUTE_TUTOR = "tutor"
const val ROUTE_PROFILE = "profile"
const val ROUTE_PUZZLES = "puzzles"
const val ROUTE_CARDS = "cards"
const val ROUTE_GUESSING = "guessing"
const val ROUTE_ROLEPLAY = "roleplay"
const val ROUTE_DICTIONARY = "dictionary"

private data class NavDestination(
    val route: String,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
)

private val BottomDestinations = listOf(
    NavDestination(ROUTE_HOME, "Club", Icons.Filled.Home, Icons.Outlined.Home),
    NavDestination(ROUTE_QUIZ, "Quiz", Icons.Filled.Bolt, Icons.Outlined.Bolt),
    NavDestination(ROUTE_CURRICULUM, "Words", Icons.Filled.CalendarMonth, Icons.Outlined.CalendarMonth),
    NavDestination(ROUTE_CHAT, "Chat", Icons.Filled.Forum, Icons.Outlined.Forum),
    NavDestination(ROUTE_PROFILE, "Profile", Icons.Filled.AccountCircle, Icons.Outlined.AccountCircle)
)

private val RailDestinations = listOf(
    NavDestination(ROUTE_HOME, "Club", Icons.Filled.Home, Icons.Outlined.Home),
    NavDestination(ROUTE_QUIZ, "Quiz", Icons.Filled.Bolt, Icons.Outlined.Bolt),
    NavDestination(ROUTE_LEADERBOARD, "Ranks", Icons.Filled.Leaderboard, Icons.Outlined.Leaderboard),
    NavDestination(ROUTE_ARCADE, "Arcade", Icons.Filled.SportsEsports, Icons.Outlined.SportsEsports),
    NavDestination(ROUTE_CURRICULUM, "200 Words", Icons.Filled.CalendarMonth, Icons.Outlined.CalendarMonth),
    NavDestination(ROUTE_AUDIOBOOKS, "Listen", Icons.Filled.Headphones, Icons.Outlined.Headphones),
    NavDestination(ROUTE_CHAT, "Teams", Icons.Filled.Forum, Icons.Outlined.Forum),
    NavDestination(ROUTE_PUZZLES, "Puzzles", Icons.Filled.Extension, Icons.Outlined.Extension),
    NavDestination(ROUTE_CARDS, "Cards", Icons.Filled.Style, Icons.Outlined.Style),
    NavDestination(ROUTE_GUESSING, "Guess", Icons.Filled.RecordVoiceOver, Icons.Outlined.RecordVoiceOver),
    NavDestination(ROUTE_ROLEPLAY, "Stage", Icons.Filled.TheaterComedy, Icons.Outlined.TheaterComedy),
    NavDestination(ROUTE_DICTIONARY, "Dict", Icons.Filled.Translate, Icons.Outlined.Translate),
    NavDestination(ROUTE_TUTOR, "Students", Icons.Filled.School, Icons.Outlined.School),
    NavDestination(ROUTE_PROFILE, "Profile", Icons.Filled.AccountCircle, Icons.Outlined.AccountCircle)
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        configureAppCheck(this, intent)
        enableEdgeToEdge()
        setContent {
            LingoClubTheme {
                LingoAppRoot()
            }
        }
    }
}

@Composable
fun LingoAppRoot() {
    var currentUser by remember { mutableStateOf(Firebase.auth.currentUser) }
    var offlineDisplayName by rememberSaveable { mutableStateOf<String?>(null) }

    DisposableEffect(Unit) {
        val listener = FirebaseAuth.AuthStateListener { auth ->
            currentUser = auth.currentUser
            if (auth.currentUser != null) {
                offlineDisplayName = null
            }
        }
        Firebase.auth.addAuthStateListener(listener)
        onDispose { Firebase.auth.removeAuthStateListener(listener) }
    }

    val user = currentUser
    val activeOfflineName = offlineDisplayName
    when {
        user != null -> {
            key(user.uid) {
                AuthenticatedStudioShell(
                    currentUserId = user.uid,
                    currentUserName = user.displayName ?: "Lingo Member",
                    isOfflineMode = false,
                    onExitOfflineMode = {}
                )
            }
        }
        activeOfflineName != null -> {
            key("offline_$activeOfflineName") {
                AuthenticatedStudioShell(
                    currentUserId = "offline_local_player",
                    currentUserName = activeOfflineName,
                    isOfflineMode = true,
                    onExitOfflineMode = { offlineDisplayName = null }
                )
            }
        }
        else -> {
            AuthScreen(
                onAuthSuccess = { currentUser = Firebase.auth.currentUser },
                onContinueOffline = { chosenName -> offlineDisplayName = chosenName }
            )
        }
    }
}

@Composable
private fun AuthenticatedStudioShell(
    currentUserId: String,
    currentUserName: String,
    isOfflineMode: Boolean = false,
    onExitOfflineMode: () -> Unit = {}
) {
    val context = LocalContext.current
    val offlineStore = remember(context, currentUserId, currentUserName) {
        OfflineLocalStore(
            context = context.applicationContext,
            userId = currentUserId,
            defaultDisplayName = currentUserName
        )
    }
    val tetheringHub = remember(context) { TetheringHubManager(context.applicationContext) }

    val viewModel: LingoViewModel = viewModel(
        key = "${currentUserId}_$isOfflineMode",
        factory = viewModelFactory {
            initializer {
                val app = checkNotNull(this[APPLICATION_KEY]) {
                    "APPLICATION_KEY missing from CreationExtras"
                }
                val databaseId = app.getString(R.string.firestore_database_id)
                val db = FirebaseFirestore.getInstance(databaseId)
                LingoViewModel(
                    repository = LingoRepository(db),
                    currentUserId = currentUserId,
                    currentUserName = currentUserName,
                    isOfflineMode = isOfflineMode,
                    offlineStore = offlineStore
                )
            }
        }
    )

    val gameViewModel: GameViewModel = viewModel(
        key = "game_${currentUserId}_$isOfflineMode",
        factory = viewModelFactory {
            initializer {
                val app = checkNotNull(this[APPLICATION_KEY]) {
                    "APPLICATION_KEY missing from CreationExtras"
                }
                val databaseId = app.getString(R.string.firestore_database_id)
                val db = FirebaseFirestore.getInstance(databaseId)
                GameViewModel(
                    repository = LingoRepository(db),
                    offlineStore = offlineStore,
                    tetheringHub = tetheringHub,
                    currentUserId = currentUserId,
                    currentUserName = currentUserName,
                    isOfflineMode = isOfflineMode
                )
            }
        }
    )

    val scope = rememberCoroutineScope()
    val credentialManager = remember(context) { CredentialManager.create(context) }

    val profileState by viewModel.userProfileState.collectAsStateWithLifecycle()
    val sessionHistoryState by viewModel.sessionHistoryState.collectAsStateWithLifecycle()
    val weeklyProgressMap by viewModel.weeklyProgressState.collectAsStateWithLifecycle()
    val customRoleplaysState by viewModel.customRoleplaysState.collectAsStateWithLifecycle()
    val customQuizzesState by viewModel.customQuizzesState.collectAsStateWithLifecycle()
    val customDecksState by viewModel.customDecksState.collectAsStateWithLifecycle()
    val cardMasteryMap by viewModel.cardMasteryState.collectAsStateWithLifecycle()
    val gameRoomSession by gameViewModel.roomSession.collectAsStateWithLifecycle()
    val puzzleStats by gameViewModel.puzzleProgressState.collectAsStateWithLifecycle()
    val globalScoresState by gameViewModel.globalScoresState.collectAsStateWithLifecycle()
    val tetheringState by gameViewModel.tetheringState.collectAsStateWithLifecycle()
    val gameBanner by gameViewModel.gameBanner.collectAsStateWithLifecycle()
    val gameBusy by gameViewModel.isBusy.collectAsStateWithLifecycle()
    val statusBanner by viewModel.statusBanner.collectAsStateWithLifecycle()
    val isBusy by viewModel.isBusy.collectAsStateWithLifecycle()
    val aiQuizGenState by viewModel.aiQuizGenState.collectAsStateWithLifecycle()
    val aiRoleplayGenState by viewModel.aiRoleplayGenState.collectAsStateWithLifecycle()
    val roleplayFeedbackState by viewModel.roleplayFeedbackState.collectAsStateWithLifecycle()
    val studentsProgressState by viewModel.studentsProgressState.collectAsStateWithLifecycle()
    val selectedStudentDetailState by viewModel.selectedStudentDetailState.collectAsStateWithLifecycle()
    val teamsState by viewModel.teamsState.collectAsStateWithLifecycle()
    val selectedTeamId by viewModel.selectedTeamId.collectAsStateWithLifecycle()
    val chatMessagesState by viewModel.chatMessagesState.collectAsStateWithLifecycle()
    val clubContentState by viewModel.clubContentState.collectAsStateWithLifecycle()
    val currentUserProfile = (profileState as? UiState.Success)?.data
    val currentUserTeamId = currentUserProfile?.teamId.orEmpty()
    val pinnedEvidenceIds = remember(currentUserProfile?.pinnedEvidenceIds) {
        currentUserProfile?.pinnedEvidenceIds?.toSet().orEmpty()
    }

    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(statusBanner) {
        val msg = statusBanner
        if (msg != null) {
            snackbarHostState.showSnackbar(msg)
            viewModel.clearBanner()
        }
    }
    LaunchedEffect(gameBanner) {
        val msg = gameBanner
        if (msg != null) {
            snackbarHostState.showSnackbar(msg)
            gameViewModel.clearBanner()
        }
    }

    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route ?: ROUTE_HOME
    var prefilledPin by remember { mutableStateOf("") }
    var prefilledAiTopic by remember { mutableStateOf<String?>(null) }
    var prefilledAiLevel by remember { mutableStateOf<CefrLevel?>(null) }
    var prefilledAiFocusWords by remember { mutableStateOf<List<String>>(emptyList()) }
    var selectedLevel by rememberSaveable { mutableStateOf<CefrLevel?>(null) }
    var arcadeInitialMode by rememberSaveable { mutableStateOf(ArcadeMode.WORD_DASH) }

    fun navigateTop(route: String) {
        navController.navigate(route) {
            popUpTo(ROUTE_HOME) { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val useRail = maxWidth >= 600.dp

        Scaffold(
            contentWindowInsets = WindowInsets.safeDrawing,
            snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
            bottomBar = {
                if (!useRail) {
                    NavigationBar(
                        containerColor = MaterialTheme.colorScheme.surface
                    ) {
                        BottomDestinations.forEach { dest ->
                            val selected = currentRoute == dest.route
                            NavigationBarItem(
                                selected = selected,
                                onClick = { navigateTop(dest.route) },
                                icon = {
                                    Icon(
                                        imageVector = if (selected) dest.selectedIcon else dest.unselectedIcon,
                                        contentDescription = dest.label
                                    )
                                },
                                label = { Text(dest.label, maxLines = 1) },
                                modifier = Modifier.testTag("nav_${dest.route}")
                            )
                        }
                    }
                }
            }
        ) { innerPadding ->
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                if (useRail) {
                    NavigationRail(
                        containerColor = MaterialTheme.colorScheme.surface,
                        modifier = Modifier.verticalScroll(rememberScrollState())
                    ) {
                        RailDestinations.forEach { dest ->
                            val selected = currentRoute == dest.route
                            NavigationRailItem(
                                selected = selected,
                                onClick = { navigateTop(dest.route) },
                                icon = {
                                    Icon(
                                        imageVector = if (selected) dest.selectedIcon else dest.unselectedIcon,
                                        contentDescription = dest.label
                                    )
                                },
                                label = { Text(dest.label) },
                                modifier = Modifier.testTag("rail_${dest.route}")
                            )
                        }
                    }
                }

                Box(modifier = Modifier.weight(1f)) {
                    NavHost(
                        navController = navController,
                        startDestination = ROUTE_HOME,
                        enterTransition = {
                            fadeIn(animationSpec = tween(220)) +
                                slideInVertically(animationSpec = tween(240)) { it / 18 } +
                                scaleIn(initialScale = 0.98f, animationSpec = tween(220))
                        },
                        exitTransition = { fadeOut(animationSpec = tween(160)) },
                        popEnterTransition = {
                            fadeIn(animationSpec = tween(200)) +
                                scaleIn(initialScale = 0.98f, animationSpec = tween(200))
                        },
                        popExitTransition = { fadeOut(animationSpec = tween(160)) }
                    ) {
                        composable(ROUTE_HOME) {
                            HomeScreen(
                                profileState = profileState,
                                clubContentState = clubContentState,
                                isTutor = viewModel.isBootstrappedTutor,
                                studentsCount = (studentsProgressState as? UiState.Success)?.data?.size ?: 0,
                                fallbackName = currentUserName,
                                isOfflineMode = isOfflineMode,
                                selectedLevel = selectedLevel,
                                onSelectLevel = { selectedLevel = it },
                                onNavigateQuiz = { navigateTop(ROUTE_QUIZ) },
                                onNavigateLeaderboard = { navigateTop(ROUTE_LEADERBOARD) },
                                onNavigateArcade = {
                                    arcadeInitialMode = ArcadeMode.WORD_DASH
                                    navigateTop(ROUTE_ARCADE)
                                },
                                onNavigateSpinWheel = {
                                    arcadeInitialMode = ArcadeMode.SPIN_WHEEL
                                    navigateTop(ROUTE_ARCADE)
                                },
                                onNavigateCurriculum = { navigateTop(ROUTE_CURRICULUM) },
                                onNavigateAudiobooks = { navigateTop(ROUTE_AUDIOBOOKS) },
                                onNavigatePuzzles = { navigateTop(ROUTE_PUZZLES) },
                                onNavigateCards = { navigateTop(ROUTE_CARDS) },
                                onNavigateGuessing = { navigateTop(ROUTE_GUESSING) },
                                onNavigateRoleplay = { navigateTop(ROUTE_ROLEPLAY) },
                                onNavigateDictionary = { navigateTop(ROUTE_DICTIONARY) },
                                onNavigateChat = { navigateTop(ROUTE_CHAT) },
                                onNavigateTutor = { navigateTop(ROUTE_TUTOR) },
                                onNavigateProfile = { navigateTop(ROUTE_PROFILE) },
                                onQuickJoinRoom = { pin ->
                                    prefilledPin = pin
                                    navigateTop(ROUTE_QUIZ)
                                },
                                onSignOut = {
                                    gameViewModel.cleanupListeners()
                                    viewModel.cleanupListenersBeforeSignOut()
                                    if (isOfflineMode) {
                                        onExitOfflineMode()
                                    } else {
                                        signOutWithCleanup(credentialManager, scope)
                                    }
                                }
                            )
                        }
                        composable(ROUTE_LEADERBOARD) {
                            GlobalLeaderboardScreen(
                                scoresState = globalScoresState,
                                currentUserId = currentUserId,
                                selectedLevel = selectedLevel,
                                onSelectLevel = { selectedLevel = it },
                                onBack = if (useRail) null else { { navController.popBackStack() } }
                            )
                        }
                        composable(ROUTE_QUIZ) {
                            QuizArenaScreen(
                                customQuizzesState = customQuizzesState,
                                clubContentState = clubContentState,
                                roomSession = gameRoomSession,
                                aiQuizGenState = aiQuizGenState,
                                defaultNickname = currentUserName,
                                isBusy = isBusy || gameBusy,
                                initialJoinPin = prefilledPin,
                                prefilledAiTopic = prefilledAiTopic,
                                prefilledAiLevel = prefilledAiLevel,
                                prefilledAiFocusWords = prefilledAiFocusWords,
                                onClearPrefilledAi = {
                                    prefilledAiTopic = null
                                    prefilledAiLevel = null
                                    prefilledAiFocusWords = emptyList()
                                },
                                selectedLevel = selectedLevel,
                                onSelectLevel = { selectedLevel = it },
                                onHostLiveRoom = { title, level, qs ->
                                    gameViewModel.hostLiveRoom(title, level, qs)
                                },
                                onJoinLiveRoom = { pin, nick, avatar ->
                                    prefilledPin = ""
                                    gameViewModel.joinLiveRoom(pin, nick, avatar)
                                },
                                onHostNextPhase = { gameViewModel.hostStartOrNextQuestion() },
                                onSubmitLiveAnswer = { idx -> gameViewModel.submitLiveAnswer(idx) },
                                onLeaveLiveRoom = { gameViewModel.leaveLiveRoom() },
                                onSaveCustomQuiz = { title, topic, level, qs, onDone ->
                                    viewModel.saveCustomQuiz(title, topic, level, qs, onDone)
                                },
                                onDeleteCustomQuiz = { id -> viewModel.deleteCustomQuiz(id) },
                                onGenerateAiQuiz = { topic, lvl, count, words ->
                                    viewModel.generateAiQuiz(topic, lvl, count, words)
                                },
                                onClearAiQuizGen = { viewModel.clearAiQuizGen() },
                                onRecordQuizCompletion = { title, lvl, score, acc ->
                                    gameViewModel.recordQuizCompletion(
                                        title = title,
                                        level = lvl,
                                        score = score,
                                        accuracyPct = acc,
                                        profileSnapshot = currentUserProfile
                                    )
                                },
                                onAwardXp = { xp -> gameViewModel.awardXp(xp) },
                                currentUserId = currentUserId,
                                onSendRoomMessage = { text, type ->
                                    gameViewModel.sendRoomChatMessage(text, type)
                                },
                                onDeleteRoomMessage = { messageId ->
                                    gameViewModel.deleteRoomChatMessage(messageId)
                                },
                                onNavigateLeaderboard = { navigateTop(ROUTE_LEADERBOARD) }
                            )
                        }
                        composable(ROUTE_ARCADE) {
                            GamesArcadeScreen(
                                selectedLevel = selectedLevel,
                                onSelectLevel = { selectedLevel = it },
                                initialMode = arcadeInitialMode,
                                teamsState = teamsState,
                                selectedTeamId = selectedTeamId,
                                messagesState = chatMessagesState,
                                currentUserId = currentUserId,
                                onSelectChannel = { viewModel.selectTeamChannel(it) },
                                onSendTeamMessage = { team, text ->
                                    viewModel.sendChatMessage(team, text, false)
                                },
                                onOpenChatTab = { navigateTop(ROUTE_CHAT) },
                                onRecordArcadeResult = { title, lvl, xp, acc, count, combo ->
                                    gameViewModel.recordArcadeGameResult(
                                        gameTitle = title,
                                        cefrLevel = lvl,
                                        scoreXp = xp,
                                        accuracyPct = acc,
                                        wordsPracticed = count,
                                        maxCombo = combo,
                                        profileSnapshot = currentUserProfile
                                    )
                                },
                                onNavigateQuiz = { navigateTop(ROUTE_QUIZ) },
                                onNavigateRoleplay = { navigateTop(ROUTE_ROLEPLAY) },
                                onNavigatePuzzles = { navigateTop(ROUTE_PUZZLES) },
                                pinnedEvidenceIds = pinnedEvidenceIds,
                                onTogglePinEvidence = { cardId, pin ->
                                    viewModel.togglePinEvidence(cardId, pin)
                                },
                                onAwardXp = { xp -> gameViewModel.awardXp(xp) },
                                onBack = if (useRail) null else { { navController.popBackStack() } }
                            )
                        }
                        composable(ROUTE_CURRICULUM) {
                            WeeklyCurriculumScreen(
                                weeklyProgressMap = weeklyProgressMap,
                                clubContentState = clubContentState,
                                onToggleWord = { weekNum, wordId ->
                                    viewModel.toggleWeeklyWord(weekNum, wordId)
                                },
                                onCompleteSession = { weekNum, sessionNum, lvl, title, count ->
                                    viewModel.completeWeeklySession(weekNum, sessionNum, lvl, title, count)
                                },
                                onRecordGameResult = { weekNum, title, lvl, xp, acc, count ->
                                    viewModel.recordWeeklyGameResult(weekNum, title, lvl, xp, acc, count)
                                },
                                onGenerateAiQuizFromSession = { topic, lvl, focusWords ->
                                    prefilledAiTopic = topic
                                    prefilledAiLevel = lvl
                                    prefilledAiFocusWords = focusWords
                                    navigateTop(ROUTE_QUIZ)
                                },
                                onBack = if (useRail) null else { { navController.popBackStack() } }
                            )
                        }
                        composable(ROUTE_AUDIOBOOKS) {
                            AudiobooksScreen(
                                selectedLevel = selectedLevel,
                                onSelectLevel = { selectedLevel = it },
                                onCompleteChapter = { title, lvl, durationMin ->
                                    viewModel.completeAudiobookChapter(title, lvl, durationMin)
                                },
                                onBack = if (useRail) null else { { navController.popBackStack() } }
                            )
                        }
                        composable(ROUTE_CHAT) {
                            TeamChatScreen(
                                teamsState = teamsState,
                                selectedTeamId = selectedTeamId,
                                messagesState = chatMessagesState,
                                currentUserId = currentUserId,
                                currentUserTeamId = currentUserTeamId,
                                isTutor = viewModel.isBootstrappedTutor,
                                isBusy = isBusy,
                                onSelectChannel = { viewModel.selectTeamChannel(it) },
                                onCreateTeam = { name, level, motto, color, isTeacherHub, onDone ->
                                    viewModel.createTeam(name, level, motto, color, isTeacherHub, onDone)
                                },
                                onJoinTeam = { viewModel.joinTeam(it) },
                                onSendMessage = { team, text, pinned ->
                                    viewModel.sendChatMessage(team, text, pinned)
                                },
                                onTogglePin = { teamId, messageId, pinned ->
                                    viewModel.togglePinMessage(teamId, messageId, pinned)
                                },
                                onDeleteMessage = { teamId, messageId ->
                                    viewModel.deleteChatMessage(teamId, messageId)
                                },
                                tetheringState = tetheringState,
                                onHostTetheringTeam = { teamName, level, motto ->
                                    gameViewModel.hostTetheringTeam(teamName, level, motto)
                                },
                                onScanTetheringTeams = { gameViewModel.scanTetheringTeams() },
                                onJoinTetheringTeam = { hostIp, port, teamCode ->
                                    gameViewModel.joinTetheringTeam(hostIp, port, teamCode)
                                },
                                onSendTetheringMessage = { text, pinned ->
                                    gameViewModel.sendTetheringChatMessage(text, pinned)
                                },
                                onDisconnectTethering = { gameViewModel.disconnectTethering() },
                                onBack = if (useRail) null else { { navController.popBackStack() } }
                            )
                        }
                        composable(ROUTE_TUTOR) {
                            TutorDashboardScreen(
                                currentUserId = currentUserId,
                                profileState = profileState,
                                studentsProgressState = studentsProgressState,
                                selectedStudentDetailState = selectedStudentDetailState,
                                isBootstrappedTutor = viewModel.isBootstrappedTutor,
                                isBusy = isBusy,
                                onLoadStudentDetails = { studentUid ->
                                    viewModel.loadStudentDetails(studentUid)
                                },
                                onClearStudentDetails = {
                                    viewModel.clearSelectedStudentDetails()
                                },
                                onConnectToTutor = { tutorCode, tutorLabel, onDone ->
                                    viewModel.connectToTutor(tutorCode, tutorLabel, onDone)
                                },
                                onDisconnectFromTutor = {
                                    viewModel.disconnectFromTutor()
                                },
                                onSyncProgressNow = {
                                    viewModel.syncMyProgressToTutor()
                                },
                                onBack = if (useRail) null else { { navController.popBackStack() } }
                            )
                        }
                        composable(ROUTE_PROFILE) {
                            ProfileScreen(
                                profileState = profileState,
                                sessionHistoryState = sessionHistoryState,
                                fallbackName = currentUserName,
                                isOfflineMode = isOfflineMode,
                                onSelectLearningLevel = { lvl ->
                                    viewModel.updateLearningLevel(lvl)
                                    selectedLevel = lvl
                                },
                                onSignOut = {
                                    gameViewModel.cleanupListeners()
                                    viewModel.cleanupListenersBeforeSignOut()
                                    if (isOfflineMode) {
                                        onExitOfflineMode()
                                    } else {
                                        signOutWithCleanup(credentialManager, scope)
                                    }
                                },
                                onBack = if (useRail) null else { { navController.popBackStack() } }
                            )
                        }
                        composable(ROUTE_PUZZLES) {
                            PuzzlesScreen(
                                clubContentState = clubContentState,
                                puzzleStats = puzzleStats,
                                onAwardXp = { xp -> gameViewModel.awardXp(xp) },
                                onRecordPuzzleSolved = { title, lvl, xp ->
                                    gameViewModel.recordPuzzleSolved(title, lvl, xp)
                                },
                                selectedLevel = selectedLevel,
                                onSelectLevel = { selectedLevel = it },
                                teamsState = teamsState,
                                selectedTeamId = selectedTeamId,
                                messagesState = chatMessagesState,
                                currentUserId = currentUserId,
                                onSelectChannel = { viewModel.selectTeamChannel(it) },
                                onSendTeamMessage = { team, text ->
                                    viewModel.sendChatMessage(team, text, false)
                                },
                                onOpenChatTab = { navigateTop(ROUTE_CHAT) },
                                onBack = if (useRail) null else { { navController.popBackStack() } }
                            )
                        }
                        composable(ROUTE_CARDS) {
                            CardsScreen(
                                customDecksState = customDecksState,
                                clubContentState = clubContentState,
                                cardMasteryMap = cardMasteryMap,
                                isBusy = isBusy,
                                selectedLevel = selectedLevel,
                                onSelectLevel = { selectedLevel = it },
                                onToggleMastery = { deckId, idx, mastered ->
                                    viewModel.toggleCardMastery(deckId, idx, mastered)
                                },
                                onSaveCustomDeck = { title, level, cards, onDone ->
                                    viewModel.saveCustomDeck(title, level, cards, onDone)
                                },
                                onUpdateCustomDeck = { deckId, title, level, cards, onDone ->
                                    viewModel.updateCustomDeck(deckId, title, level, cards, onDone)
                                },
                                onDeleteCustomDeck = { deckId ->
                                    viewModel.deleteCustomDeck(deckId)
                                },
                                onRecordStudySession = { deckTitle, level, reviewedCount, masteredCount, totalCards ->
                                    viewModel.recordFlashcardStudySession(
                                        deckTitle = deckTitle,
                                        cefrLevel = level,
                                        reviewedCount = reviewedCount,
                                        masteredCount = masteredCount,
                                        totalCards = totalCards
                                    )
                                },
                                onBack = if (useRail) null else { { navController.popBackStack() } }
                            )
                        }
                        composable(ROUTE_GUESSING) {
                            GuessingScreen(
                                onAwardXp = { xp -> viewModel.awardXp(xp) },
                                selectedLevel = selectedLevel,
                                onSelectLevel = { selectedLevel = it },
                                teamsState = teamsState,
                                selectedTeamId = selectedTeamId,
                                messagesState = chatMessagesState,
                                currentUserId = currentUserId,
                                onSelectChannel = { viewModel.selectTeamChannel(it) },
                                onSendTeamMessage = { team, text ->
                                    viewModel.sendChatMessage(team, text, false)
                                },
                                onOpenChatTab = { navigateTop(ROUTE_CHAT) },
                                onBack = if (!useRail) { { navController.popBackStack() } } else null
                            )
                        }
                        composable(ROUTE_ROLEPLAY) {
                            RoleplaysScreen(
                                customRoleplaysState = customRoleplaysState,
                                clubContentState = clubContentState,
                                aiRoleplayGenState = aiRoleplayGenState,
                                roleplayFeedbackState = roleplayFeedbackState,
                                isBusy = isBusy,
                                onGenerateRoleplay = { setting, lvl, tone, useAi ->
                                    viewModel.generateRoleplay(setting, lvl, tone, useAi)
                                },
                                onClearAiRoleplayGen = { viewModel.clearAiRoleplayGen() },
                                onSaveGeneratedRoleplay = { scene, source, onDone ->
                                    viewModel.saveGeneratedRoleplay(scene, source, onDone)
                                },
                                onDeleteCustomRoleplay = { id -> viewModel.deleteCustomRoleplay(id) },
                                onRecordRoleplayCompletion = { title, lvl ->
                                    viewModel.recordRoleplayCompletion(title, lvl)
                                },
                                onEvaluateSpeech = { title, lvl, roleName, targetScript, spoken ->
                                    viewModel.evaluateRoleplaySpeech(title, lvl, roleName, targetScript, spoken)
                                },
                                onClearSpeechFeedback = { viewModel.clearRoleplayFeedback() },
                                selectedLevel = selectedLevel,
                                onSelectLevel = { selectedLevel = it },
                                onBack = if (!useRail) { { navController.popBackStack() } } else null
                            )
                        }
                        composable(ROUTE_DICTIONARY) {
                            DictionaryScreen(
                                selectedLevel = selectedLevel,
                                onSelectLevel = { selectedLevel = it },
                                onSaveWordAsDeck = { title, lvl, cards ->
                                    viewModel.saveCustomDeck(title, lvl, cards) {}
                                },
                                onBack = if (useRail) null else { { navController.popBackStack() } }
                            )
                        }
                    }
                }
            }
        }
    }
}
