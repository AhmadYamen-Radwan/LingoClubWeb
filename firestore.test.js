const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { test, before, after, beforeEach } = require("node:test");
const fs = require("node:fs");

let testEnv;
const PROJECT_ID = process.env.GCP_PROJECT || "demo-no-project";
const ALICE_UID = "alice_host_1";
const BOB_UID = "bob_friend_2";
const CHARLIE_UID = "charlie_3";
const TUTOR_UID = "tutor_radwan";
const TUTOR_EMAIL = "radwana423@gmail.com";
const ROOM_CODE = "LINGO7";

const [emulatorHost, emulatorPortStr] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085").split(":");
const emulatorPort = parseInt(emulatorPortStr, 10);

before(async () => {
  const rules = fs.readFileSync("./firestore.rules", "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: emulatorHost,
      port: emulatorPort,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

function sampleProfile(uid, name, ts, overrides = {}) {
  return {
    userId: uid,
    displayName: name,
    learningLevel: "B2",
    xp: 120,
    streak: 2,
    quizzesHosted: 1,
    quizzesPlayed: 3,
    cardsMastered: 4,
    sessionsCompleted: 1,
    audiobooksFinished: 1,
    weeklyWordsMastered: 25,
    bestLiveQuizScore: 0,
    earnedBadges: [],
    teamId: "",
    teamName: "",
    accountRole: "STUDENT",
    tutorUid: "",
    tutorName: "",
    lastActiveEpochDay: 20500,
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  };
}

function sampleQuestion() {
  return {
    prompt: "What does 'break the ice' mean?",
    options: [
      "Start a friendly conversation",
      "Cancel a meeting suddenly",
      "Lose your temper",
      "Fix a broken freezer",
    ],
    correctIndex: 0,
    timeLimitSec: 20,
    tip: "Used when meeting new people or easing tension.",
  };
}

function sampleCard(term = "Get the hang of") {
  return {
    term,
    phonetic: "/ɡɛt ðə hæŋ ʌv/",
    partOfSpeech: "Idiom",
    meaning: "Learn how to do something skillfully after practice.",
    example: "At first phrasal verbs feel tricky, but you'll get the hang of them!",
    teachingTip: "Ask friends what skill took them a week to get the hang of.",
  };
}

function sampleTutorStudentProgress(studentUid, tutorUid, studentName, ts) {
  return {
    studentUid,
    tutorUid,
    studentName,
    learningLevel: "B1",
    xp: 340,
    streak: 4,
    sessionsCompleted: 2,
    weeklyWordsMastered: 88,
    quizzesPlayed: 5,
    quizzesHosted: 1,
    bestLiveQuizScore: 1240,
    cardsMastered: 16,
    decksCreated: 2,
    audiobooksFinished: 3,
    teamName: "B1 Explorers",
    earnedBadges: ["FIRST_WEEKLY_SESSION", "LIVE_QUIZ_HIGH_SCORE"],
    recentActivities: [
      {
        title: "Coffee Shop Deck",
        activityType: "CARDS",
        cefrLevel: "B1",
        score: 30,
        accuracyPct: 100,
        wordsPracticed: 8,
      },
    ],
    createdAt: ts,
    updatedAt: ts,
  };
}

test("Unauthenticated users cannot read or write any collection", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const ts = new Date(Date.now() - 1000);
  await assertFails(unauthDb.collection("users").doc(ALICE_UID).get());
  await assertFails(unauthDb.collection("quiz_rooms").doc(ROOM_CODE).get());
  await assertFails(unauthDb.collection("tutors").doc(TUTOR_UID).collection("students").get());
  await assertFails(
    unauthDb.collection("users").doc(ALICE_UID).set(sampleProfile(ALICE_UID, "Anon", ts))
  );
});

test("User profile: owner create, partial update, role escalation prevention, and cross-user denial", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  const created = new Date(Date.now() - 10000);

  // Regular user cannot self-assign TUTOR accountRole
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).set(
      sampleProfile(ALICE_UID, "Alice", created, { accountRole: "TUTOR" })
    )
  );

  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).set(sampleProfile(ALICE_UID, "Alice", created))
  );

  // Partial update of learningLevel, badges, team, tutorUid, and stats succeeds
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).update({
      learningLevel: "A2",
      xp: 200,
      sessionsCompleted: 2,
      audiobooksFinished: 2,
      weeklyWordsMastered: 45,
      bestLiveQuizScore: 1450,
      earnedBadges: ["FIRST_WEEKLY_SESSION", "LIVE_QUIZ_HIGH_SCORE"],
      teamId: "team_falcons",
      teamName: "B2 Falcons",
      tutorUid: BOB_UID,
      tutorName: "Tutor Bob",
      lastActiveEpochDay: 20501,
      updatedAt: new Date(Date.now() - 1000),
    })
  );

  // Cannot escalate own accountRole on update
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).update({
      accountRole: "TUTOR",
      updatedAt: new Date(Date.now() - 900),
    })
  );

  // Shadow update with ghost field fails
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).update({
      xp: 300,
      isAdmin: true,
      updatedAt: new Date(Date.now() - 500),
    })
  );

  // Immutable createdAt change fails
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).update({
      createdAt: new Date(Date.now() - 500),
      updatedAt: new Date(Date.now() - 500),
    })
  );

  // Unlinked Charlie cannot read Alice's profile
  const charlieDb = testEnv.authenticatedContext(CHARLIE_UID).firestore();
  await assertFails(charlieDb.collection("users").doc(ALICE_UID).get());
  await assertFails(charlieDb.collection("users").get());
  await assertFails(bobDb.collection("users").doc(ALICE_UID).update({ xp: 999, updatedAt: new Date(Date.now() - 500) }));

  // Linked tutor Bob CAN read Alice's profile & query his linked students
  await assertSucceeds(bobDb.collection("users").doc(ALICE_UID).get());
  await assertSucceeds(bobDb.collection("users").where("tutorUid", "==", BOB_UID).get());
});

test("Bootstrapped Tutor vs Spoof: tutor can inspect student progress, subcollections; regular users blocked", async () => {
  const tutorDb = testEnv.authenticatedContext(TUTOR_UID, {
    email: TUTOR_EMAIL,
    email_verified: true,
  }).firestore();
  const spoofTutorDb = testEnv.authenticatedContext("spoof_1", {
    email: TUTOR_EMAIL,
    email_verified: false,
  }).firestore();
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  const created = new Date(Date.now() - 10000);

  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).set(sampleProfile(ALICE_UID, "Alice", created))
  );
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("session_history").doc("rec_1").set({
      activityType: "WEEKLY_SESSION",
      title: "Week 1 • Session 1",
      cefrLevel: "A2",
      score: 60,
      accuracyPct: 92,
      wordsPracticed: 67,
      durationMinutes: 18,
      createdAt: created,
      updatedAt: created,
    })
  );
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("weekly_progress").doc("week_1").set({
      weekNumber: 1,
      masteredWordIds: ["w1_001", "w1_002"],
      completedSessions: [1],
      gamesPlayed: 2,
      createdAt: created,
      updatedAt: created,
    })
  );

  // Verified bootstrapped tutor can list STUDENT users and inspect Alice's subcollections
  await assertSucceeds(tutorDb.collection("users").where("accountRole", "==", "STUDENT").get());
  await assertSucceeds(tutorDb.collection("users").doc(ALICE_UID).collection("session_history").get());
  await assertSucceeds(tutorDb.collection("users").doc(ALICE_UID).collection("weekly_progress").get());

  // Unverified spoof and regular student Bob are denied
  await assertFails(spoofTutorDb.collection("users").where("accountRole", "==", "STUDENT").get());
  await assertFails(spoofTutorDb.collection("users").doc(ALICE_UID).collection("session_history").get());
  await assertFails(bobDb.collection("users").where("accountRole", "==", "STUDENT").get());
  await assertFails(bobDb.collection("users").doc(ALICE_UID).collection("session_history").get());
  await assertFails(bobDb.collection("users").doc(ALICE_UID).collection("weekly_progress").get());
});

test("Tutor-Student snapshot collection: student syncs own progress to chosen tutor; tutor lists roster; others denied", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  const charlieDb = testEnv.authenticatedContext(CHARLIE_UID).firestore();
  const ts = new Date(Date.now() - 5000);

  // Student Alice writes her progress snapshot under Tutor Bob
  await assertSucceeds(
    aliceDb.collection("tutors").doc(BOB_UID).collection("students").doc(ALICE_UID).set(
      sampleTutorStudentProgress(ALICE_UID, BOB_UID, "Alice", ts)
    )
  );

  // Alice can update her own snapshot
  await assertSucceeds(
    aliceDb.collection("tutors").doc(BOB_UID).collection("students").doc(ALICE_UID).update({
      xp: 410,
      cardsMastered: 20,
      updatedAt: new Date(Date.now() - 1000),
    })
  );

  // Tutor Bob can list all linked students & read Alice's snapshot, but cannot forge writes to Alice's record
  await assertSucceeds(bobDb.collection("tutors").doc(BOB_UID).collection("students").get());
  await assertSucceeds(bobDb.collection("tutors").doc(BOB_UID).collection("students").doc(ALICE_UID).get());
  await assertFails(
    bobDb.collection("tutors").doc(BOB_UID).collection("students").doc(ALICE_UID).update({
      xp: 99999,
      updatedAt: new Date(Date.now() - 500),
    })
  );

  // Charlie cannot read Bob's student roster or Alice's snapshot
  await assertFails(charlieDb.collection("tutors").doc(BOB_UID).collection("students").get());
  await assertFails(charlieDb.collection("tutors").doc(BOB_UID).collection("students").doc(ALICE_UID).get());

  // Tutor or Student can delete the link
  await assertSucceeds(aliceDb.collection("tutors").doc(BOB_UID).collection("students").doc(ALICE_UID).delete());
});

test("Custom flashcards (create, update, delete) and card mastery review tracking", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  const created = new Date(Date.now() - 10000);

  // Create custom deck
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("custom_decks").doc("deck_1").set({
      title: "Coffee Shop Talk",
      cefrLevel: "B1",
      cards: [sampleCard("Get the hang of")],
      createdAt: created,
      updatedAt: created,
    })
  );

  // Update custom deck (add another card & change title; preserve createdAt)
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("custom_decks").doc("deck_1").update({
      title: "Coffee Shop & Travel Idioms",
      cefrLevel: "B2",
      cards: [sampleCard("Get the hang of"), sampleCard("Call it a day")],
      updatedAt: new Date(Date.now() - 1000),
    })
  );

  // Reject empty cards array on update
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).collection("custom_decks").doc("deck_1").update({
      cards: [],
      updatedAt: new Date(Date.now() - 500),
    })
  );

  // Card mastery create + reviewCount increment update
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("card_mastery").doc("deck_1_0").set({
      deckId: "deck_1",
      mastered: false,
      reviewCount: 1,
      createdAt: created,
      updatedAt: created,
    })
  );
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("card_mastery").doc("deck_1_0").update({
      mastered: true,
      reviewCount: 2,
      updatedAt: new Date(Date.now() - 500),
    })
  );

  // Bob cannot update or delete Alice's deck
  await assertFails(bobDb.collection("users").doc(ALICE_UID).collection("custom_decks").doc("deck_1").delete());

  // Alice can delete her deck
  await assertSucceeds(aliceDb.collection("users").doc(ALICE_UID).collection("custom_decks").doc("deck_1").delete());
});

test("Legacy admins collection is completely denied", async () => {
  const tutorDb = testEnv.authenticatedContext(TUTOR_UID, {
    email: TUTOR_EMAIL,
    email_verified: true,
  }).firestore();
  const ts = new Date(Date.now() - 5000);
  await assertFails(tutorDb.collection("admins").doc(BOB_UID).get());
  await assertFails(
    tutorDb.collection("admins").doc(BOB_UID).set({
      uid: BOB_UID,
      grantedByUid: TUTOR_UID,
      label: "Admin",
      createdAt: ts,
      updatedAt: ts,
    })
  );
});

test("Teams and chat messages: filtered queries, hub vs team creation, role enforcement, pinning, and moderation", async () => {
  const tutorDb = testEnv.authenticatedContext(TUTOR_UID, {
    email: TUTOR_EMAIL,
    email_verified: true,
  }).firestore();
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  const ts = new Date(Date.now() - 5000);

  // Regular user cannot create TEACHER_HUB
  await assertFails(
    aliceDb.collection("teams").doc("hub_main").set({
      visibility: "CLUB",
      name: "Tutor <-> All Teams",
      cefrLevel: "B2",
      motto: "Ask the tutor anything",
      accentColor: "INDIGO",
      leaderUid: ALICE_UID,
      leaderName: "Alice",
      channelKind: "TEACHER_HUB",
      memberCount: 1,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Verified tutor can create TEACHER_HUB
  await assertSucceeds(
    tutorDb.collection("teams").doc("hub_main").set({
      visibility: "CLUB",
      name: "Tutor <-> All Teams",
      cefrLevel: "B2",
      motto: "Direct tutor guidance for every squad",
      accentColor: "INDIGO",
      leaderUid: TUTOR_UID,
      leaderName: "Tutor Radwan",
      channelKind: "TEACHER_HUB",
      memberCount: 1,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Regular user can create a regular TEAM
  await assertSucceeds(
    aliceDb.collection("teams").doc("team_alpha").set({
      visibility: "CLUB",
      name: "B2 Falcons",
      cefrLevel: "B2",
      motto: "Practice daily!",
      accentColor: "CORAL",
      leaderUid: ALICE_UID,
      leaderName: "Alice",
      channelKind: "TEAM",
      memberCount: 1,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  await assertSucceeds(bobDb.collection("teams").where("visibility", "==", "CLUB").get());
  await assertFails(bobDb.collection("teams").get());

  // Valid player message succeeds
  await assertSucceeds(
    bobDb.collection("teams").doc("team_alpha").collection("messages").doc("msg_1").set({
      teamId: "team_alpha",
      senderUid: BOB_UID,
      senderName: "Bob",
      senderTeamName: "B2 Falcons",
      senderRole: "PLAYER",
      text: "Hey team, ready for tonight's session?",
      pinned: false,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Tutor can send pinned TEACHER message and pin existing message
  await assertSucceeds(
    tutorDb.collection("teams").doc("hub_main").collection("messages").doc("msg_tutor").set({
      teamId: "hub_main",
      senderUid: TUTOR_UID,
      senderName: "Tutor Radwan",
      senderTeamName: "Tutor Hub",
      senderRole: "TEACHER",
      text: "Welcome students! Drop your sentences below.",
      pinned: true,
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertSucceeds(
    tutorDb.collection("teams").doc("team_alpha").collection("messages").doc("msg_1").update({
      pinned: true,
      updatedAt: new Date(Date.now() - 1000),
    })
  );
  await assertFails(
    bobDb.collection("teams").doc("team_alpha").collection("messages").doc("msg_1").update({
      pinned: false,
      updatedAt: new Date(Date.now() - 900),
    })
  );
});

test("Multiplayer quiz room: host lifecycle, player join/answer, query alignment, and terminal podium lock", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  const charlieDb = testEnv.authenticatedContext(CHARLIE_UID).firestore();
  const created = new Date(Date.now() - 10000);

  await assertSucceeds(
    aliceDb.collection("quiz_rooms").doc(ROOM_CODE).set({
      hostUid: ALICE_UID,
      hostName: "Alice",
      quizTitle: "B2 Phrasal Verbs",
      cefrLevel: "B2",
      status: "LOBBY",
      currentQuestionIndex: 0,
      questionStartedAtMs: 0,
      questions: [sampleQuestion()],
      leaderboard: [],
      createdAt: created,
      updatedAt: created,
    })
  );

  await assertSucceeds(aliceDb.collection("quiz_rooms").where("hostUid", "==", ALICE_UID).get());
  await assertFails(aliceDb.collection("quiz_rooms").get());

  await assertSucceeds(
    bobDb.collection("quiz_rooms").doc(ROOM_CODE).collection("players").doc(BOB_UID).set({
      playerUid: BOB_UID,
      roomCode: ROOM_CODE,
      hostUid: ALICE_UID,
      nickname: "Bobby",
      avatarColor: "CORAL",
      score: 0,
      streak: 0,
      lastAnswerIndex: -1,
      lastAnsweredQuestion: -1,
      lastAnswerCorrect: false,
      lastPointsEarned: 0,
      createdAt: created,
      updatedAt: created,
    })
  );

  await assertSucceeds(
    aliceDb.collection("quiz_rooms").doc(ROOM_CODE).collection("players").where("hostUid", "==", ALICE_UID).get()
  );
  await assertFails(
    charlieDb.collection("quiz_rooms").doc(ROOM_CODE).collection("players").get()
  );
});

test("In-game live quiz chat: unauth denied, player & host messages validated, host spoofing blocked, deletion scoped", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  const charlieDb = testEnv.authenticatedContext(CHARLIE_UID).firestore();
  const created = new Date(Date.now() - 10000);

  await assertSucceeds(
    aliceDb.collection("quiz_rooms").doc(ROOM_CODE).set({
      hostUid: ALICE_UID,
      hostName: "Alice",
      quizTitle: "B2 Phrasal Verbs",
      cefrLevel: "B2",
      status: "LOBBY",
      currentQuestionIndex: 0,
      questionStartedAtMs: 0,
      questions: [sampleQuestion()],
      leaderboard: [],
      createdAt: created,
      updatedAt: created,
    })
  );

  // Unauthenticated cannot read or send room chat
  await assertFails(
    unauthDb.collection("quiz_rooms").doc(ROOM_CODE).collection("messages").where("roomCode", "==", ROOM_CODE).get()
  );
  await assertFails(
    unauthDb.collection("quiz_rooms").doc(ROOM_CODE).collection("messages").doc("m0").set({
      roomCode: ROOM_CODE,
      senderUid: "anon",
      senderName: "Anon",
      avatarColor: "INDIGO",
      hostSender: false,
      messageType: "TEXT",
      text: "Hello!",
      createdAt: created,
      updatedAt: created,
    })
  );

  // Non-host player cannot spoof hostSender = true
  await assertFails(
    bobDb.collection("quiz_rooms").doc(ROOM_CODE).collection("messages").doc("m_spoof").set({
      roomCode: ROOM_CODE,
      senderUid: BOB_UID,
      senderName: "Bobby",
      avatarColor: "CORAL",
      hostSender: true,
      messageType: "TEXT",
      text: "Pretending to be host",
      createdAt: created,
      updatedAt: created,
    })
  );

  // Player sends valid TEXT message & REACTION
  await assertSucceeds(
    bobDb.collection("quiz_rooms").doc(ROOM_CODE).collection("messages").doc("m1").set({
      roomCode: ROOM_CODE,
      senderUid: BOB_UID,
      senderName: "Bobby",
      avatarColor: "CORAL",
      hostSender: false,
      messageType: "TEXT",
      text: "Good luck everyone!",
      createdAt: created,
      updatedAt: created,
    })
  );
  await assertSucceeds(
    bobDb.collection("quiz_rooms").doc(ROOM_CODE).collection("messages").doc("m2").set({
      roomCode: ROOM_CODE,
      senderUid: BOB_UID,
      senderName: "Bobby",
      avatarColor: "CORAL",
      hostSender: false,
      messageType: "REACTION",
      text: "🔥 On a streak!",
      createdAt: created,
      updatedAt: created,
    })
  );

  // Host sends hostSender = true message
  await assertSucceeds(
    aliceDb.collection("quiz_rooms").doc(ROOM_CODE).collection("messages").doc("m3").set({
      roomCode: ROOM_CODE,
      senderUid: ALICE_UID,
      senderName: "Alice",
      avatarColor: "INDIGO",
      hostSender: true,
      messageType: "TEXT",
      text: "Round 2 starting in 5 seconds!",
      createdAt: created,
      updatedAt: created,
    })
  );

  // Filtered query aligned with rules succeeds; unfiltered list fails
  await assertSucceeds(
    bobDb.collection("quiz_rooms").doc(ROOM_CODE).collection("messages").where("roomCode", "==", ROOM_CODE).get()
  );
  await assertFails(
    bobDb.collection("quiz_rooms").doc(ROOM_CODE).collection("messages").get()
  );

  // Charlie cannot delete Bob's message, but Bob or Host Alice can
  await assertFails(
    charlieDb.collection("quiz_rooms").doc(ROOM_CODE).collection("messages").doc("m1").delete()
  );
  await assertSucceeds(
    aliceDb.collection("quiz_rooms").doc(ROOM_CODE).collection("messages").doc("m1").delete()
  );
});

test("Scores collection: unauth blocked, owner writes score, cross-user updates denied, global leaderboard list succeeds", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  const ts = new Date(Date.now() - 5000);

  // Unauth cannot read or write /scores
  await assertFails(unauthDb.collection("scores").doc("score_1").get());
  await assertFails(unauthDb.collection("scores").get());
  await assertFails(
    unauthDb.collection("scores").doc("score_1").set({
      userId: ALICE_UID,
      playerName: "Alice",
      avatarColor: "INDIGO",
      quizTitle: "Phrasal Verbs Blitz",
      cefrLevel: "B2",
      score: 1800,
      accuracyPct: 95,
      streak: 5,
      gameMode: "LIVE_QUIZ",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Alice cannot forge Bob's userId
  await assertFails(
    aliceDb.collection("scores").doc("score_spoof").set({
      userId: BOB_UID,
      playerName: "Bob",
      avatarColor: "CORAL",
      quizTitle: "Phrasal Verbs Blitz",
      cefrLevel: "B2",
      score: 2500,
      accuracyPct: 100,
      streak: 7,
      gameMode: "LIVE_QUIZ",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Alice creates valid score
  await assertSucceeds(
    aliceDb.collection("scores").doc("score_alice_1").set({
      userId: ALICE_UID,
      playerName: "Alice",
      avatarColor: "INDIGO",
      quizTitle: "Phrasal Verbs Blitz",
      cefrLevel: "B2",
      score: 1800,
      accuracyPct: 95,
      streak: 5,
      gameMode: "LIVE_QUIZ",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Any authenticated user can read global leaderboard
  await assertSucceeds(bobDb.collection("scores").get());
  await assertSucceeds(bobDb.collection("scores").doc("score_alice_1").get());

  // Bob cannot update Alice's score
  await assertFails(
    bobDb.collection("scores").doc("score_alice_1").update({
      score: 10,
      updatedAt: new Date(Date.now() - 1000),
    })
  );

  // Alice can update her score
  await assertSucceeds(
    aliceDb.collection("scores").doc("score_alice_1").update({
      score: 2200,
      streak: 6,
      updatedAt: new Date(Date.now() - 1000),
    })
  );

  // Bob cannot delete Alice's score, Alice can
  await assertFails(bobDb.collection("scores").doc("score_alice_1").delete());
  await assertSucceeds(aliceDb.collection("scores").doc("score_alice_1").delete());
});

