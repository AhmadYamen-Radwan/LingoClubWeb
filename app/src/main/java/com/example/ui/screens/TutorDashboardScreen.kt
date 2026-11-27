package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Headphones
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.LinkOff
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Style
import androidx.compose.material.icons.filled.Sync
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.data.model.ActivityType
import com.example.data.model.CefrLevel
import com.example.data.model.LingoBadge
import com.example.data.model.StudentDetailBundle
import com.example.data.model.TutorClassSummary
import com.example.data.model.TutorStudentProgress
import com.example.data.model.UserProfile
import com.example.ui.UiState
import com.example.ui.components.CefrBadge
import com.example.ui.components.CefrFilterRow
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.CoralOnSoft
import com.example.ui.theme.CoralSoft
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.JetBrainsMonoFontFamily
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft
import java.text.SimpleDateFormat
import java.util.Locale

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun TutorDashboardScreen(
    currentUserId: String,
    profileState: UiState<UserProfile?>,
    studentsProgressState: UiState<List<TutorStudentProgress>>,
    selectedStudentDetailState: UiState<StudentDetailBundle?>,
    isBootstrappedTutor: Boolean,
    isBusy: Boolean,
    onLoadStudentDetails: (studentUid: String) -> Unit,
    onClearStudentDetails: () -> Unit,
    onConnectToTutor: (tutorCode: String, tutorLabel: String, onDone: () -> Unit) -> Unit,
    onDisconnectFromTutor: () -> Unit,
    onSyncProgressNow: () -> Unit,
    onBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val profile = (profileState as? UiState.Success)?.data
    val students = (studentsProgressState as? UiState.Success)?.data.orEmpty()
    var selectedTab by rememberSaveable {
        mutableIntStateOf(if (!isBootstrappedTutor && profile?.tutorUid?.isNotBlank() == true) 1 else 0)
    }
    var selectedStudentId by rememberSaveable { mutableStateOf<String?>(null) }
    var searchQuery by rememberSaveable { mutableStateOf("") }
    var levelFilter by rememberSaveable { mutableStateOf<CefrLevel?>(null) }
    var copiedTutorCode by remember { mutableStateOf(false) }

    val activeStudent = remember(selectedStudentId, students) {
        val uid = selectedStudentId ?: return@remember null
        students.firstOrNull { it.studentUid == uid }
    }

    val filteredStudents = remember(students, searchQuery, levelFilter) {
        students.filter { student ->
            val matchesLevel = levelFilter == null || CefrLevel.fromRaw(student.learningLevel) == levelFilter
            val q = searchQuery.trim()
            val matchesQuery = q.isEmpty() ||
                student.studentName.contains(q, ignoreCase = true) ||
                student.teamName.contains(q, ignoreCase = true)
            matchesLevel && matchesQuery
        }
    }

    val clipboardManager = LocalClipboardManager.current

    BoxWithConstraints(modifier = modifier.fillMaxSize()) {
        val useListDetail = maxWidth >= 840.dp && selectedTab == 0

        // On compact/medium screens, show dedicated full-screen detail view when a student is selected
        if (!useListDetail && activeStudent != null && selectedTab == 0) {
            BackHandler {
                selectedStudentId = null
                onClearStudentDetails()
            }
            StudentDetailView(
                student = activeStudent,
                detailState = selectedStudentDetailState,
                onRefresh = { onLoadStudentDetails(activeStudent.studentUid) },
                onBack = {
                    selectedStudentId = null
                    onClearStudentDetails()
                },
                showBackButton = true,
                modifier = Modifier.fillMaxSize()
            )
            return@BoxWithConstraints
        }

        // Auto-select first student in wide List-Detail mode for instant inspection
        LaunchedEffect(useListDetail, filteredStudents) {
            if (useListDetail && activeStudent == null && filteredStudents.isNotEmpty()) {
                val first = filteredStudents.first()
                selectedStudentId = first.studentUid
                onLoadStudentDetails(first.studentUid)
            }
        }

        if (useListDetail) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                ) {
                    RosterListPane(
                        currentUserId = currentUserId,
                        profile = profile,
                        studentsProgressState = studentsProgressState,
                        students = students,
                        filteredStudents = filteredStudents,
                        selectedStudentUid = activeStudent?.studentUid,
                        selectedTab = selectedTab,
                        onSelectTab = { selectedTab = it },
                        searchQuery = searchQuery,
                        onSearchQueryChange = { searchQuery = it },
                        levelFilter = levelFilter,
                        onSelectLevel = { levelFilter = it },
                        copiedTutorCode = copiedTutorCode,
                        onCopyTutorCode = {
                            clipboardManager.setText(AnnotatedString(currentUserId))
                            copiedTutorCode = true
                        },
                        onSelectStudent = { student ->
                            selectedStudentId = student.studentUid
                            onLoadStudentDetails(student.studentUid)
                        },
                        isBusy = isBusy,
                        onConnectToTutor = onConnectToTutor,
                        onDisconnectFromTutor = onDisconnectFromTutor,
                        onSyncProgressNow = onSyncProgressNow,
                        onBack = onBack
                    )
                }

                Box(
                    modifier = Modifier
                        .weight(1.05f)
                        .fillMaxHeight()
                        .padding(vertical = 16.dp)
                ) {
                    val detailTarget = activeStudent ?: filteredStudents.firstOrNull()
                    if (detailTarget != null) {
                        StudentDetailView(
                            student = detailTarget,
                            detailState = selectedStudentDetailState,
                            onRefresh = { onLoadStudentDetails(detailTarget.studentUid) },
                            onBack = {
                                selectedStudentId = null
                                onClearStudentDetails()
                            },
                            showBackButton = false,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        Card(
                            shape = RoundedCornerShape(24.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(28.dp),
                                verticalArrangement = Arrangement.Center,
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Surface(
                                    shape = CircleShape,
                                    color = IndigoSoft,
                                    modifier = Modifier.size(64.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            imageVector = Icons.Filled.School,
                                            contentDescription = null,
                                            tint = IndigoOnSoft,
                                            modifier = Modifier.size(32.dp)
                                        )
                                    }
                                }
                                Spacer(Modifier.height(14.dp))
                                Text(
                                    text = "Select a Student",
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(Modifier.height(6.dp))
                                Text(
                                    text = "Choose any student from the roster on the left to inspect their Firestore progress, weekly word mastery, quizzes, and study decks.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        } else {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.TopCenter
            ) {
                RosterListPane(
                    currentUserId = currentUserId,
                    profile = profile,
                    studentsProgressState = studentsProgressState,
                    students = students,
                    filteredStudents = filteredStudents,
                    selectedStudentUid = activeStudent?.studentUid,
                    selectedTab = selectedTab,
                    onSelectTab = { selectedTab = it },
                    searchQuery = searchQuery,
                    onSearchQueryChange = { searchQuery = it },
                    levelFilter = levelFilter,
                    onSelectLevel = { levelFilter = it },
                    copiedTutorCode = copiedTutorCode,
                    onCopyTutorCode = {
                        clipboardManager.setText(AnnotatedString(currentUserId))
                        copiedTutorCode = true
                    },
                    onSelectStudent = { student ->
                        selectedStudentId = student.studentUid
                        onLoadStudentDetails(student.studentUid)
                    },
                    isBusy = isBusy,
                    onConnectToTutor = onConnectToTutor,
                    onDisconnectFromTutor = onDisconnectFromTutor,
                    onSyncProgressNow = onSyncProgressNow,
                    onBack = onBack,
                    modifier = Modifier.widthIn(max = 820.dp)
                )
            }
        }
    }
}

@Composable
private fun RosterListPane(
    currentUserId: String,
    profile: UserProfile?,
    studentsProgressState: UiState<List<TutorStudentProgress>>,
    students: List<TutorStudentProgress>,
    filteredStudents: List<TutorStudentProgress>,
    selectedStudentUid: String?,
    selectedTab: Int,
    onSelectTab: (Int) -> Unit,
    searchQuery: String,
    onSearchQueryChange: (String) -> Unit,
    levelFilter: CefrLevel?,
    onSelectLevel: (CefrLevel?) -> Unit,
    copiedTutorCode: Boolean,
    onCopyTutorCode: () -> Unit,
    onSelectStudent: (TutorStudentProgress) -> Unit,
    isBusy: Boolean,
    onConnectToTutor: (tutorCode: String, tutorLabel: String, onDone: () -> Unit) -> Unit,
    onDisconnectFromTutor: () -> Unit,
    onSyncProgressNow: () -> Unit,
    onBack: (() -> Unit)?,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (onBack != null) {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier
                            .size(48.dp)
                            .testTag("tutor_back_button")
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Student Progress",
                        style = MaterialTheme.typography.displaySmall
                    )
                    Text(
                        text = "View your students & track individual Firestore progress",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        // Role mode switcher
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                FilterChip(
                    selected = selectedTab == 0,
                    onClick = { onSelectTab(0) },
                    leadingIcon = {
                        Icon(Icons.Filled.School, contentDescription = null, modifier = Modifier.size(18.dp))
                    },
                    label = { Text("My Students (${students.size})") },
                    modifier = Modifier.testTag("tutor_tab_students")
                )
                FilterChip(
                    selected = selectedTab == 1,
                    onClick = { onSelectTab(1) },
                    leadingIcon = {
                        Icon(Icons.Filled.Link, contentDescription = null, modifier = Modifier.size(18.dp))
                    },
                    label = { Text("Link to Tutor") },
                    modifier = Modifier.testTag("tutor_tab_link")
                )
            }
        }

        if (selectedTab == 0) {
            // Shareable Tutor Code Card
            item {
                Card(
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = IndigoSoft),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Column {
                            Text(
                                text = "Your Tutor Code",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = IndigoOnSoft
                            )
                            Text(
                                text = "Share this code so students can link their account and sync progress with you in real time.",
                                style = MaterialTheme.typography.bodySmall,
                                color = IndigoOnSoft.copy(alpha = 0.85f)
                            )
                        }
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = MaterialTheme.colorScheme.surface,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = currentUserId,
                                    fontFamily = JetBrainsMonoFontFamily,
                                    style = MaterialTheme.typography.bodyMedium,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier
                                        .weight(1f)
                                        .testTag("tutor_share_code_text")
                                )
                                TextButton(
                                    onClick = onCopyTutorCode,
                                    modifier = Modifier
                                        .heightIn(min = 48.dp)
                                        .testTag("copy_tutor_code_button")
                                ) {
                                    Icon(
                                        imageVector = if (copiedTutorCode) Icons.Filled.CheckCircle else Icons.Filled.ContentCopy,
                                        contentDescription = "Copy Tutor Code",
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(Modifier.width(6.dp))
                                    Text(if (copiedTutorCode) "Copied" else "Copy")
                                }
                            }
                        }
                    }
                }
            }

            // Class Summary Metrics
            val summary = TutorClassSummary.fromStudents(students)
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        TutorOverviewTile(
                            title = "Students",
                            value = "${summary.totalStudents}",
                            icon = Icons.Filled.Groups,
                            bg = MintSoft,
                            fg = MintOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                        TutorOverviewTile(
                            title = "Weekly Words",
                            value = "${summary.totalWeeklyWords}",
                            icon = Icons.AutoMirrored.Filled.MenuBook,
                            bg = IndigoSoft,
                            fg = IndigoOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        TutorOverviewTile(
                            title = "Sessions Done",
                            value = "${summary.totalSessionsCompleted}",
                            icon = Icons.Filled.CalendarMonth,
                            bg = AmberSoft,
                            fg = AmberOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                        TutorOverviewTile(
                            title = "Avg Best Quiz",
                            value = "${summary.averageBestQuizScore}",
                            icon = Icons.Filled.EmojiEvents,
                            bg = CoralSoft,
                            fg = CoralOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // Search & Level Filters
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = onSearchQueryChange,
                        leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
                        placeholder = { Text("Search student by name or team...") },
                        singleLine = true,
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("tutor_student_search")
                    )
                    CefrFilterRow(
                        selectedLevel = levelFilter,
                        onSelectLevel = onSelectLevel,
                        tagPrefix = "tutor"
                    )
                }
            }

            when (studentsProgressState) {
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
                                text = studentsProgressState.message,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                modifier = Modifier.padding(16.dp)
                            )
                        }
                    }
                }
                is UiState.Success -> {
                    if (filteredStudents.isEmpty()) {
                        item {
                            Card(
                                shape = RoundedCornerShape(22.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Surface(
                                        shape = CircleShape,
                                        color = IndigoSoft,
                                        modifier = Modifier.size(56.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Icon(
                                                imageVector = Icons.Filled.Groups,
                                                contentDescription = null,
                                                tint = IndigoOnSoft,
                                                modifier = Modifier.size(28.dp)
                                            )
                                        }
                                    }
                                    Text(
                                        text = if (students.isEmpty()) "No students connected yet" else "No matching students",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = if (students.isEmpty()) {
                                            "Ask your students to open Student Progress -> Link to Tutor and enter your Tutor Code above. Their XP, weekly 200-word mastery, quizzes, flashcards, and badges will stream live from Firestore."
                                        } else {
                                            "Try clearing your search query or CEFR level filter."
                                        },
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    if (levelFilter != null || searchQuery.isNotBlank()) {
                                        OutlinedButton(onClick = {
                                            onSelectLevel(null)
                                            onSearchQueryChange("")
                                        }) {
                                            Text("Reset Filters")
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        items(filteredStudents, key = { it.studentUid }) { student ->
                            StudentProgressRowCard(
                                student = student,
                                selected = selectedStudentUid == student.studentUid,
                                onClick = { onSelectStudent(student) }
                            )
                        }
                    }
                }
            }
        } else {
            item {
                StudentTutorLinkSection(
                    profile = profile,
                    isBusy = isBusy,
                    onConnectToTutor = onConnectToTutor,
                    onDisconnectFromTutor = onDisconnectFromTutor,
                    onSyncProgressNow = onSyncProgressNow
                )
            }
        }

        item { Spacer(Modifier.height(16.dp)) }
    }
}

@Composable
private fun TutorOverviewTile(
    title: String,
    value: String,
    icon: ImageVector,
    bg: Color,
    fg: Color,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = bg),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    color = fg,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold
                )
                Icon(icon, contentDescription = null, tint = fg, modifier = Modifier.size(18.dp))
            }
            Text(
                text = value,
                color = fg,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun StudentProgressRowCard(
    student: TutorStudentProgress,
    selected: Boolean = false,
    onClick: () -> Unit
) {
    val lvl = CefrLevel.fromRaw(student.learningLevel)
    val initials = student.studentName.split(" ")
        .filter { it.isNotBlank() }
        .take(2)
        .joinToString("") { it.first().uppercase() }
        .ifBlank { "ST" }

    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (selected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f)
            else MaterialTheme.colorScheme.surface
        ),
        border = if (selected) BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary) else null,
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .testTag("student_progress_card_${student.studentUid}")
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = CircleShape,
                    color = IndigoSoft,
                    modifier = Modifier.size(46.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = initials,
                            color = IndigoOnSoft,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = student.studentName.ifBlank { "Student" },
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f, fill = false)
                        )
                        CefrBadge(level = lvl)
                    }
                    Text(
                        text = buildString {
                            append("${student.xp} XP • ${student.streak}d streak")
                            if (student.teamName.isNotBlank()) append(" • ${student.teamName}")
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Text(
                    text = "Track ->",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
            }

            val weeklyRatio = (student.weeklyWordsMastered.toFloat() / 200f).coerceIn(0f, 1f)
            LinearProgressIndicator(
                progress = { weeklyRatio },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(7.dp)
                    .clip(RoundedCornerShape(99.dp))
            )

            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                StudentStatChip("${student.weeklyWordsMastered}/200 words", MintSoft, MintOnSoft)
                StudentStatChip("${student.sessionsCompleted} sessions", IndigoSoft, IndigoOnSoft)
                StudentStatChip("Best quiz: ${student.bestLiveQuizScore}", AmberSoft, AmberOnSoft)
                StudentStatChip("${student.cardsMastered} cards", CoralSoft, CoralOnSoft)
                StudentStatChip("${student.earnedBadges.size} badges", MaterialTheme.colorScheme.surfaceVariant, MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun StudentStatChip(
    label: String,
    bg: Color,
    fg: Color
) {
    Surface(
        shape = RoundedCornerShape(99.dp),
        color = bg
    ) {
        Text(
            text = label,
            color = fg,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun StudentDetailView(
    student: TutorStudentProgress,
    detailState: UiState<StudentDetailBundle?>,
    onRefresh: () -> Unit,
    onBack: () -> Unit,
    showBackButton: Boolean = true,
    modifier: Modifier = Modifier
) {
    val lvl = CefrLevel.fromRaw(student.learningLevel)
    val detailBundle = (detailState as? UiState.Success)?.data
    val dateFormatter = remember { SimpleDateFormat("MMM d • HH:mm", Locale.getDefault()) }

    val fullSessions = detailBundle?.sessions.orEmpty()
    val avgAccuracyText = remember(fullSessions, student.recentActivities) {
        when {
            fullSessions.isNotEmpty() -> "${fullSessions.map { it.accuracyPct }.average().toInt()}%"
            student.recentActivities.isNotEmpty() -> "${student.recentActivities.map { it.accuracyPct }.average().toInt()}%"
            else -> "—"
        }
    }

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.TopCenter
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .widthIn(max = 820.dp),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (showBackButton) {
                        IconButton(
                            onClick = onBack,
                            modifier = Modifier
                                .size(48.dp)
                                .testTag("student_detail_back_button")
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back to student list")
                        }
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = student.studentName.ifBlank { "Student" },
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f, fill = false)
                            )
                            CefrBadge(level = lvl)
                        }
                        Text(
                            text = buildString {
                                append(if (student.teamName.isNotBlank()) "Team: ${student.teamName}" else "Individual Learner")
                                append(" • Avg Accuracy: $avgAccuracyText")
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    IconButton(
                        onClick = onRefresh,
                        modifier = Modifier
                            .size(48.dp)
                            .testTag("student_detail_refresh_button")
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Refresh,
                            contentDescription = "Refresh student progress",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            // KPI Metrics Grid
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        TutorOverviewTile(
                            title = "Total XP",
                            value = "${student.xp}",
                            icon = Icons.Filled.Bolt,
                            bg = AmberSoft,
                            fg = AmberOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                        TutorOverviewTile(
                            title = "Streak",
                            value = "${student.streak}d",
                            icon = Icons.Filled.LocalFireDepartment,
                            bg = CoralSoft,
                            fg = CoralOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        TutorOverviewTile(
                            title = "Weekly Words",
                            value = "${student.weeklyWordsMastered}/200",
                            icon = Icons.AutoMirrored.Filled.MenuBook,
                            bg = MintSoft,
                            fg = MintOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                        TutorOverviewTile(
                            title = "Sessions",
                            value = "${student.sessionsCompleted}",
                            icon = Icons.Filled.CalendarMonth,
                            bg = IndigoSoft,
                            fg = IndigoOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        TutorOverviewTile(
                            title = "Best Quiz",
                            value = "${student.bestLiveQuizScore}",
                            icon = Icons.Filled.EmojiEvents,
                            bg = AmberSoft,
                            fg = AmberOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                        TutorOverviewTile(
                            title = "Cards Mastered",
                            value = "${student.cardsMastered}",
                            icon = Icons.Filled.Style,
                            bg = MintSoft,
                            fg = MintOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        val deckCount = maxOf(
                            student.decksCreated.toInt(),
                            detailBundle?.customDecks?.size ?: 0
                        )
                        TutorOverviewTile(
                            title = "Custom Decks",
                            value = "$deckCount",
                            icon = Icons.Filled.Style,
                            bg = IndigoSoft,
                            fg = IndigoOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                        TutorOverviewTile(
                            title = "Audiobooks",
                            value = "${student.audiobooksFinished}",
                            icon = Icons.Filled.Headphones,
                            bg = CoralSoft,
                            fg = CoralOnSoft,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // Overall Weekly 200-Word Club Progress Bar
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
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
                                text = "200-Word Club Mastery",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "${student.weeklyWordsMastered} / 200 words",
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        LinearProgressIndicator(
                            progress = { (student.weeklyWordsMastered.toFloat() / 200f).coerceIn(0f, 1f) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(99.dp))
                        )
                        Text(
                            text = "Quizzes played: ${student.quizzesPlayed} • Quizzes hosted: ${student.quizzesHosted} • Avg accuracy: $avgAccuracyText",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            if (detailState is UiState.Loading) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().padding(12.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(modifier = Modifier.size(28.dp))
                    }
                }
            }

            // Weekly 200-Word Club Breakdown (per week)
            val weeklyList = detailBundle?.weeklyProgress.orEmpty()
            if (weeklyList.isNotEmpty()) {
                item {
                    Text(
                        text = "Weekly Sessions Breakdown",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
                items(weeklyList, key = { it.id }) { week ->
                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "Week ${week.weekNumber}",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "${week.masteredWordIds.size}/200 words • ${week.completedSessions.size}/3 sessions",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            LinearProgressIndicator(
                                progress = { (week.masteredWordIds.size / 200f).coerceIn(0f, 1f) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(7.dp)
                                    .clip(RoundedCornerShape(99.dp))
                            )
                        }
                    }
                }
            }

            // Student Custom Flashcard Decks
            val studentDecks = detailBundle?.customDecks.orEmpty()
            if (studentDecks.isNotEmpty()) {
                item {
                    Text(
                        text = "Student Flashcard Decks (${studentDecks.size})",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                }
                items(studentDecks, key = { it.id }) { deck ->
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = deck.title,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "${deck.cards.size} cards",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            CefrBadge(level = CefrLevel.fromRaw(deck.cefrLevel))
                        }
                    }
                }
            }

            // Earned Badges
            item {
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
                            text = "Earned Badges (${student.earnedBadges.size}/${LingoBadge.entries.size})",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        val badges = student.earnedBadges.mapNotNull { LingoBadge.fromRaw(it) }
                        if (badges.isEmpty()) {
                            Text(
                                text = "No badges unlocked yet.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else {
                            FlowRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                badges.forEach { badge ->
                                    StudentStatChip(badge.title, IndigoSoft, IndigoOnSoft)
                                }
                            }
                        }
                    }
                }
            }

            // Recent Activities
            item {
                Text(
                    text = "Recent Learning Activity",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            }
            if (fullSessions.isNotEmpty()) {
                items(fullSessions.take(20), key = { it.id }) { record ->
                    val type = ActivityType.fromRaw(record.activityType)
                    val timeText = record.createdAt?.toDate()?.let { dateFormatter.format(it) } ?: "Recent"
                    StudentActivityCard(
                        title = record.title,
                        subtitle = "${type.label} • $timeText",
                        metrics = "${record.accuracyPct}% accuracy • ${record.wordsPracticed} words • +${record.score} pts",
                        level = CefrLevel.fromRaw(record.cefrLevel)
                    )
                }
            } else if (student.recentActivities.isNotEmpty()) {
                items(student.recentActivities) { act ->
                    val type = ActivityType.fromRaw(act.activityType)
                    StudentActivityCard(
                        title = act.title,
                        subtitle = type.label,
                        metrics = "${act.accuracyPct}% accuracy • ${act.wordsPracticed} words • +${act.score} pts",
                        level = CefrLevel.fromRaw(act.cefrLevel)
                    )
                }
            } else {
                item {
                    Card(
                        shape = RoundedCornerShape(18.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "No completed activities synced yet.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
            }

            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}

@Composable
private fun StudentActivityCard(
    title: String,
    subtitle: String,
    metrics: String,
    level: CefrLevel
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = metrics,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            CefrBadge(level = level)
        }
    }
}

@Composable
private fun StudentTutorLinkSection(
    profile: UserProfile?,
    isBusy: Boolean,
    onConnectToTutor: (tutorCode: String, tutorLabel: String, onDone: () -> Unit) -> Unit,
    onDisconnectFromTutor: () -> Unit,
    onSyncProgressNow: () -> Unit
) {
    var tutorCodeInput by rememberSaveable { mutableStateOf("") }
    var tutorNameInput by rememberSaveable { mutableStateOf("") }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        if (profile != null && profile.tutorUid.isNotBlank()) {
            Card(
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = MintSoft),
                border = BorderStroke(1.dp, MintOnSoft.copy(alpha = 0.25f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Filled.CheckCircle, contentDescription = null, tint = MintOnSoft)
                        Text(
                            text = "Connected to ${profile.tutorName.ifBlank { "Your Tutor" }}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MintOnSoft
                        )
                    }
                    Text(
                        text = "Tutor Code: ${profile.tutorUid}",
                        fontFamily = JetBrainsMonoFontFamily,
                        style = MaterialTheme.typography.bodySmall,
                        color = MintOnSoft.copy(alpha = 0.9f)
                    )
                    Text(
                        text = "Your XP, weekly 200-word milestones, quiz scores, flashcards, and badges sync automatically.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MintOnSoft.copy(alpha = 0.9f)
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = onSyncProgressNow,
                            enabled = !isBusy,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(min = 48.dp)
                                .testTag("student_sync_progress_button")
                        ) {
                            Icon(Icons.Filled.Sync, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Sync Now")
                        }
                        OutlinedButton(
                            onClick = onDisconnectFromTutor,
                            enabled = !isBusy,
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(min = 48.dp)
                                .testTag("student_disconnect_tutor_button")
                        ) {
                            Icon(Icons.Filled.LinkOff, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Disconnect")
                        }
                    }
                }
            }
        } else {
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
                        text = "Connect to Your Tutor",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Ask your tutor for their Tutor Code (found in their 'My Students' tab) so they can track your learning progress.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    OutlinedTextField(
                        value = tutorCodeInput,
                        onValueChange = { tutorCodeInput = it.trim() },
                        label = { Text("Tutor Code") },
                        placeholder = { Text("Paste Tutor UID") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("student_tutor_code_input")
                    )
                    OutlinedTextField(
                        value = tutorNameInput,
                        onValueChange = { tutorNameInput = it.take(50) },
                        label = { Text("Tutor Name (optional)") },
                        placeholder = { Text("e.g. Coach Alex") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("student_tutor_label_input")
                    )
                    Button(
                        onClick = {
                            onConnectToTutor(tutorCodeInput, tutorNameInput) {
                                tutorCodeInput = ""
                                tutorNameInput = ""
                            }
                        },
                        enabled = !isBusy && tutorCodeInput.length >= 3,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 50.dp)
                            .testTag("student_connect_tutor_button")
                    ) {
                        Icon(Icons.Filled.Link, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Connect & Sync Progress")
                    }
                }
            }
        }

        // Student's own shared summary preview
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Your Shared Learning Snapshot",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Level ${CefrLevel.fromRaw(profile?.learningLevel).label} • ${profile?.xp ?: 0L} XP • ${profile?.streak ?: 1L}d streak",
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = "${profile?.weeklyWordsMastered ?: 0L} weekly words • ${profile?.sessionsCompleted ?: 0L} sessions • ${profile?.cardsMastered ?: 0L} cards mastered • Best quiz ${profile?.bestLiveQuizScore ?: 0L}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
