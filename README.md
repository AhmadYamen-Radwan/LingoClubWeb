# LingoClub Studio

Bilingual English–Arabic entertainment and language party club built with **React 19 + TypeScript + Vite 6 + Express 5 + Firebase Auth & Firestore**.

## Core Features
- **Live Quiz Clash**: Host or join 6-character PIN quiz rooms (Cloud Firestore or cross-tab BroadcastChannel local rooms), Solo Blitz mode, Kahoot CSV import/export, post-question revealed leaderboards, and host-only floating player departure alerts.
- **Interactive Arcade (18 EN & AR Games)**: Balloon Pop, Meteor Word Defense (EN & AR), Rocket Fuel Race, Word Dash Blitz, Word Detective (EN & AR), Crime Mystery, Evidence Board, Vault Codebreaker (EN & AR), Speed Duel (EN & AR), 3D Memory Flip, Daily Spin Wheel, Galaxy Space Runner, and Arabic Treasure Maze—playable Solo or 2–4 Squad Pass-and-Play with a 5-second Team Buzzer.
- **Web Audio API Sound Effects (`useSoundEffects`)**: Procedural SFX chimes, buzzers, countdown ticks, and persistent mute toggle.
- **Squad Chat & WhatsApp Stickers**: Categorized searchable animated sticker drawer (`RECENTS`, `MASCOT`, `REACTIONS`, `VICTORY`, `ARABIC`, `ARCADE`) across Squad Chat, In-Game Chat, and Live Quiz Rooms, plus tap-to-translate tokens.
- **200-Word Weekly Quests, Bilingual Stories, 3D Flashcard Studio, Word Forge Puzzles, Taboo & Charades, Roleplay Stage with Speech Coach, and 18.6K Bilingual Dictionary.**

## Development & Build
- `npm run dev` — starts Express 5 + Vite middleware on port 3000
- `npm run build` — compiles the Vite production bundle into `dist/`
- `npm run start` — serves the production Express + static bundle on port 3000
- `npx tsx --test src/utils/*.test.ts` — runs pure unit tests
