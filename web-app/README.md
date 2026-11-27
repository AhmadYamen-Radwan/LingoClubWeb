# LingoClub Web App (Vanilla HTML5 + CSS3 + ES6 Modules)

LingoClub is the complete zero-build static web conversion of the native Android **LingoClub** bilingual (English–Arabic) social learning studio. Every screen, vocabulary curriculum, dictionary entry, game mode, audio reader, roleplay stage, and Firebase Firestore integration is replicated cleanly for desktop and mobile browsers (including iOS Safari and Chrome).

---

## 1. Quick Start — Running Locally

Because the app uses standard ES6 modules (`<script type="module" src="./app.js">`) and loads `./assets/lingoclub_dictionary.tsv`, serve the `/web-app` folder over a local HTTP server rather than opening `index.html` via `file://`:

```bash
cd web-app
python3 -m http.server 8080
```

Then open **http://localhost:8080** in Chrome, Firefox, or Safari.

*(Alternative using Node.js)*:
```bash
npx --yes serve web-app -l 8080
```

---

## 2. Hosting as a Static Site (GitHub Pages / Netlify / Vercel)

No build step (`npm run build`) is required — deploy the `/web-app` directory directly as your publish root:

- **GitHub Pages**: Push `/web-app` or set GitHub Pages source to the `/web-app` folder.
- **Netlify / Vercel / Cloudflare Pages**: Set **Publish directory** to `web-app` and leave **Build command** empty.

### Firebase Google Sign-In Setup for Custom Domains
When hosting on a custom domain (`*.github.io`, `*.netlify.app`, `*.vercel.app`, etc.), add your hosted domain to **Firebase Console → Authentication → Settings → Authorized domains** for project `gen-lang-client-0553529172`. Until added, Offline Explorer mode still works immediately with zero setup.

---

## 3. Feature Parity & Android → Web Equivalents

| Feature | Android Implementation | Web SPA Implementation |
|---|---|---|
| **Auth & Cloud Sync** | Jetpack CredentialManager + Firebase Auth/Firestore | Firebase Web SDK v11.4.0 ESM CDN (`signInWithPopup` + `signInWithRedirect` fallback for iOS Safari) + named Firestore DB + `localStorage` Offline Explorer |
| **Live Kahoot Quiz Clash** | Firestore `quiz_rooms` + Solo Blitz | Cloud Firestore `quiz_rooms` **plus** Cross-Tab `BroadcastChannel` local rooms (`#/quiz`) + Solo Blitz |
| **Weekly 200-Word Club** | Week 1 (200) & Week 2 (200) + 3 Sessions + Games | Identical 400 words across 5 domains, 3 sessions, Story Chains, Meaning Blitz & Speed Match (`#/curriculum`) |
| **Interactive Arcade (8 Games)** | Compose Canvas & GameViewModel | All 8 games (`#/arcade`): Word Dash Blitz, Word Detective, Crime Mystery (8 cases), Evidence Board (pin sync), Vault Codebreaker, Mystery Speed Duel, 3D Memory Flip, Canvas Spin Wheel |
| **Bilingual Dictionary** | `lingoclub_dictionary.tsv` (18,600+ words) + Room/Memory | Background fetch + **IndexedDB** (`lingoclub_dict_db`) cache + morphological suffix lookup (`#/dictionary` + tap-to-translate popover everywhere) |
| **3D Visuals & Cards** | Compose 3D Cube, Trophy, Flip Card | HTML5 2D Canvas 3D shaded Cube, Trophy, Daily Goal Ring, Spin Wheel + CSS `perspective` 3D Flip Flashcards (`#/cards`) |
| **Roleplay Stage & Voice** | `TextToSpeech` + `SpeechRecognizer` + Gemini AI | Web Speech API (`speechSynthesis` + `SpeechRecognition`/`webkitSpeechRecognition`) + WebAudio `AnalyserNode` mic meter + editable transcript fallback (`#/roleplay`) |
| **AI Quiz / Roleplay / Coach** | Firebase AI Logic (`Firebase.ai`) | Optional user-supplied Gemini API key (`✨ AI Key` modal, stored in browser `localStorage`) + automatic deterministic curriculum/NLP fallbacks offline |
| **Nearby Wi-Fi Hotspot Chat** | Android `ServerSocket` / `Socket` LAN tethering (`TetheringHubManager`) | **Closest Browser Equivalent**: `BroadcastChannel` + `localStorage` cross-tab Nearby Squad discovery & live room sync (browsers cannot open raw TCP sockets) |
| **Tutor Portal** | Tutor Roster + Student Linking | Full Tutor Roster, Copyable UID Code, Student Detail Inspection, and Student Link/Sync (`#/tutor`) |

---

## 4. Data Model Field Mapping (`Kotlin -> JavaScript`)

All JS objects preserve exact Android Kotlin/Firestore field names for 1:1 compatibility with `firestore.rules`:
- `UserProfile`: `userId`, `displayName`, `learningLevel`, `xp`, `streak`, `quizzesHosted`, `quizzesPlayed`, `cardsMastered`, `sessionsCompleted`, `audiobooksFinished`, `weeklyWordsMastered`, `bestLiveQuizScore`, `earnedBadges`, `pinnedEvidenceIds`, `teamId`, `teamName`, `accountRole`, `tutorUid`, `tutorName`, `lastActiveEpochDay`
- `QuizRoom` & `RoomPlayer`: `hostUid`, `hostName`, `quizTitle`, `cefrLevel`, `status`, `currentQuestionIndex`, `questionStartedAtMs`, `questions`, `leaderboard`, `playerUid`, `roomCode`, `nickname`, `avatarColor`, `score`, `streak`, `lastAnswerIndex`, `lastAnsweredQuestion`, `lastAnswerCorrect`, `lastPointsEarned`
- `SessionRecord`: `activityType`, `title`, `cefrLevel`, `score`, `accuracyPct`, `wordsPracticed`, `durationMinutes`

---

## 5. Wrapping as a Native iOS App with Capacitor

Because `/web-app` is pure static HTML/CSS/JS with zero build dependencies, you can package it for the iOS App Store using **Capacitor**:

```bash
# 1. Inside a wrapper directory (outside /app Android files):
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/ios

# 2. Initialize Capacitor pointing to the web-app directory
npx cap init LingoClub com.lingoclub.ios --web-dir ../web-app

# 3. Add iOS platform and sync assets
npx cap add ios
npx cap sync ios

# 4. Open in Xcode on macOS
npx cap open ios
```

In Xcode (`ios/App/App/Info.plist`), add usage descriptions before submitting to TestFlight/App Store:
- `NSMicrophoneUsageDescription`: *"Used for practicing English speaking on the Roleplay Stage."*
- `NSSpeechRecognitionUsageDescription`: *"Used to transcribe spoken roleplay responses for feedback."*
