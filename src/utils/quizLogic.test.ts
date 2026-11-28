import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRevealLeaderboardStandings,
  buildSoloBlitzStandings,
  computeAdaptiveDifficulty,
  computeQuizPointsEarned,
  detectDepartedPlayers,
  prepareDynamicQuizQuestions,
  resolveQuestionLimitSec,
} from './quizLogic';
import { DifficultyLevel, RoomPlayer } from '../types';

test('computeQuizPointsEarned calculates base, speed bonus, and capped streak bonus', () => {
  assert.equal(computeQuizPointsEarned(false, 20, 20, 5), 0);
  // Full speed + 0 streak => 500 + 500 + 0 = 1000
  assert.equal(computeQuizPointsEarned(true, 20, 20, 0), 1000);
  // Half time + streak 3 => 500 + 250 + 150 = 900
  assert.equal(computeQuizPointsEarned(true, 10, 20, 3), 900);
  // Streak capped at 5 => 500 + 0 + 250 = 750
  assert.equal(computeQuizPointsEarned(true, 0, 20, 12), 750);
});

test('computeAdaptiveDifficulty scales smoothly across Easy/Medium/Hard', () => {
  assert.equal(computeAdaptiveDifficulty(3, 85), DifficultyLevel.HARD);
  assert.equal(computeAdaptiveDifficulty(0, 40), DifficultyLevel.EASY);
  assert.equal(computeAdaptiveDifficulty(2, 70), DifficultyLevel.MEDIUM);
});

test('prepareDynamicQuizQuestions preserves correct option text after shuffling', () => {
  const input = [
    {
      prompt: 'Pick the idiom meaning very easy:',
      options: ['Piece of cake', 'Under the weather', 'Cold feet', 'Spill the beans'],
      correctIndex: 0,
      timeLimitSec: 20,
    },
  ];
  const prepared = prepareDynamicQuizQuestions(input);
  assert.equal(prepared.length, 1);
  assert.equal(prepared[0].options[prepared[0].correctIndex], 'Piece of cake');
});

test('resolveQuestionLimitSec respects difficulty presets', () => {
  assert.equal(resolveQuestionLimitSec({ prompt: 'Q', options: ['a', 'b'], correctIndex: 0, timeLimitSec: 20 }, DifficultyLevel.HARD), 14);
  assert.equal(resolveQuestionLimitSec({ prompt: 'Q', options: ['a', 'b'], correctIndex: 0, timeLimitSec: 18 }, DifficultyLevel.EASY), 25);
});

test('buildRevealLeaderboardStandings ranks players and tracks round delta & current user', () => {
  const players: RoomPlayer[] = [
    {
      uid: 'p2',
      playerUid: 'p2',
      nickname: 'Nadia',
      avatarColor: 'CORAL',
      score: 1850,
      streak: 2,
      lastAnswerIndex: 1,
      lastAnsweredQuestion: 1,
      lastAnswerCorrect: true,
      lastPointsEarned: 950,
    },
    {
      uid: 'p1',
      playerUid: 'p1',
      nickname: 'Omar',
      avatarColor: 'INDIGO',
      score: 900,
      streak: 0,
      lastAnswerIndex: 2,
      lastAnsweredQuestion: 1,
      lastAnswerCorrect: false,
      lastPointsEarned: 0,
    },
  ];

  const standings = buildRevealLeaderboardStandings(players, [], 1, 'p1');
  assert.equal(standings.length, 2);
  assert.equal(standings[0].nickname, 'Nadia');
  assert.equal(standings[0].rank, 1);
  assert.equal(standings[0].lastPointsEarned, 950);
  assert.equal(standings[0].isCurrentUser, false);
  assert.equal(standings[1].nickname, 'Omar');
  assert.equal(standings[1].rank, 2);
  assert.equal(standings[1].isCurrentUser, true);
});

test('buildSoloBlitzStandings places live solo run accurately among club best records', () => {
  const standings = buildSoloBlitzStandings({
    currentUid: 'me',
    playerName: 'Zaid',
    avatarColor: 'MINT',
    liveScore: 1450,
    lastPointsEarned: 850,
    streak: 2,
    isCorrect: true,
    recentRecords: [
      {
        userId: 'other1',
        playerName: 'Lina',
        avatarColor: 'INDIGO',
        quizTitle: 'Idioms',
        cefrLevel: 'B2',
        score: 2100,
        accuracyPct: 90,
        streak: 3,
        gameMode: 'SOLO_BLITZ',
      },
      {
        userId: 'other2',
        playerName: 'Tariq',
        avatarColor: 'AMBER',
        quizTitle: 'Idioms',
        cefrLevel: 'B1',
        score: 900,
        accuracyPct: 70,
        streak: 1,
        gameMode: 'SOLO_BLITZ',
      },
    ],
  });

  assert.equal(standings[0].nickname, 'Lina (Club Best)');
  assert.equal(standings[1].isCurrentUser, true);
  assert.equal(standings[1].rank, 2);
  assert.equal(standings[1].lastPointsEarned, 850);
  assert.equal(standings[2].nickname, 'Tariq (Club Best)');
});

test('detectDepartedPlayers notifies host ONLY and ignores non-host viewers', () => {
  const prev: RoomPlayer[] = [
    { uid: 'host1', playerUid: 'host1', nickname: 'Host', avatarColor: 'INDIGO', score: 0, streak: 0, lastAnswerIndex: -1, lastAnsweredQuestion: -1, lastAnswerCorrect: false, lastPointsEarned: 0 },
    { uid: 'p1', playerUid: 'p1', nickname: 'Maya', avatarColor: 'MINT', score: 500, streak: 1, lastAnswerIndex: 0, lastAnsweredQuestion: 0, lastAnswerCorrect: true, lastPointsEarned: 500 },
    { uid: 'p2', playerUid: 'p2', nickname: 'Sam', avatarColor: 'CORAL', score: 400, streak: 1, lastAnswerIndex: 0, lastAnsweredQuestion: 0, lastAnswerCorrect: true, lastPointsEarned: 400 },
  ];
  const next: RoomPlayer[] = [prev[0], prev[1]];

  // Non-host should receive zero departure alerts
  assert.deepEqual(detectDepartedPlayers(prev, next, false, 'host1'), []);

  // Host receives exact departed player Sam
  const departed = detectDepartedPlayers(prev, next, true, 'host1');
  assert.equal(departed.length, 1);
  assert.equal(departed[0].nickname, 'Sam');
});
