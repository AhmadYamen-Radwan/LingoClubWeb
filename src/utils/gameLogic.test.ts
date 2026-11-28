import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WHATSAPP_STICKERS,
  encodeStickerMessage,
  evaluateVaultGuess,
  filterPlayablePool,
  filterStickers,
  isSystemControlMessage,
  parseKahootCsv,
  parseStickerMessage,
  quizToKahootCsv,
} from './gameLogic';
import { CefrLevel } from '../types';

test('evaluateVaultGuess handles duplicate letters accurately in English', () => {
  // Target: ALIBI, Guess: LILAC -> L(present), I(present), L(absent because only 1 L), A(present), C(absent)
  assert.deepEqual(evaluateVaultGuess('ALIBI', 'LILAC', false), [
    'present',
    'present',
    'absent',
    'present',
    'absent',
  ]);
  assert.deepEqual(evaluateVaultGuess('VAULT', 'vault', false), [
    'exact',
    'exact',
    'exact',
    'exact',
    'exact',
  ]);
});

test('evaluateVaultGuess supports Arabic words cleanly', () => {
  assert.deepEqual(evaluateVaultGuess('بصمة', 'بصمة', true), [
    'exact',
    'exact',
    'exact',
    'exact',
  ]);
});

test('filterPlayablePool returns matching CEFR items and falls back cleanly', () => {
  const items = [
    { id: '1', level: 'A1' },
    { id: '2', level: 'B2' },
  ];
  assert.equal(filterPlayablePool(items, 'B2', (x) => x.level).length, 1);
  assert.equal(filterPlayablePool(items, 'ALL', (x) => x.level).length, 2);
  // Falls back to full list if none match
  assert.equal(filterPlayablePool(items, 'A2', (x) => x.level).length, 2);
});

test('isSystemControlMessage suppresses [LEAVE|...] and [BUZZ|...] from public chat', () => {
  assert.equal(isSystemControlMessage('[LEAVE|p1|Maya]'), true);
  assert.equal(isSystemControlMessage('[BUZZ|team_falcon|Falcon Squad]'), true);
  assert.equal(isSystemControlMessage('Great answer everyone!'), false);
  assert.equal(isSystemControlMessage(encodeStickerMessage(WHATSAPP_STICKERS[0])), false);
});

test('WhatsApp stickers encode, parse, categorize, and filter correctly', () => {
  const trophy = WHATSAPP_STICKERS.find((s) => s.id === 'victory_trophy');
  assert.ok(trophy);
  const encoded = encodeStickerMessage(trophy);
  const parsed = parseStickerMessage(encoded);
  assert.ok(parsed);
  assert.equal(parsed.id, 'victory_trophy');
  assert.equal(parsed.label, trophy.label);
  assert.equal(parsed.emoji, trophy.emoji);

  assert.equal(parseStickerMessage('Just normal text'), null);

  const arabicStickers = filterStickers('ARABIC', '', []);
  assert.ok(arabicStickers.length >= 4);
  const searched = filterStickers('MASCOT', 'vault', []);
  assert.equal(searched.length, 1);
  assert.equal(searched[0].id, 'arcade_vault');

  const recents = filterStickers('RECENTS', '', ['arcade_buzzer', 'victory_crown']);
  assert.equal(recents[0].id, 'arcade_buzzer');
  assert.equal(recents[1].id, 'victory_crown');
});

test('Kahoot CSV export and parse round-trips English and Arabic quizzes', () => {
  const sample = {
    title: 'Club Trivia',
    topic: 'Mixed',
    cefrLevel: CefrLevel.B1,
    questions: [
      {
        prompt: 'What does "break the ice" mean?',
        options: ['Start a friendly chat', 'Freeze water', 'Leave early', 'Drop ice'],
        correctIndex: 0,
        timeLimitSec: 20,
        tip: 'Friendly opener!',
      },
      {
        prompt: 'ما هو الكوكب الأكبر؟',
        options: ['المشتري', 'المريخ', 'عطارد', 'زحل'],
        correctIndex: 0,
        timeLimitSec: 25,
        tip: 'المشتري عملاق غازي',
      },
    ],
  };

  const csv = quizToKahootCsv(sample);
  const parsed = parseKahootCsv(csv, { title: sample.title, cefrLevel: CefrLevel.B1 });
  assert.equal(parsed.questions.length, 2);
  assert.equal(parsed.questions[0].correctIndex, 0);
  assert.equal(parsed.questions[0].tip, 'Friendly opener!');
  assert.equal(parsed.language, 'AR');
});
