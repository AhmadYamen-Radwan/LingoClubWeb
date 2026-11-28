// Gemini REST AI Generator + Deterministic Offline Curriculum, Arabic & General Facts Engine
// Replicates LingoAiGenerator.kt and extends it with up to 60 questions, custom free prompts, difficulties, and Arabic quizzes.

import {
  ARABIC_ARCADE_WORDS,
  ARABIC_CRIME_SCIENCE_HISTORY_ROUNDS,
  ARABIC_QUIZ_PACKS,
  OfflineRoleplayGenerator,
  QUIZ_PACKS
} from '../data/curated-content.js';
import { WEEKLY_CURRICULUM } from '../data/weekly-curriculum.js';
import { CURATED_DICTIONARY, getLoadedDictionarySync } from '../data/dictionary.js';
import { CefrLevel, DIFFICULTY_CONFIG, shuffleArray } from '../models.js';
import { getSavedGeminiKey } from './offline-store.js';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const GENERAL_FACTS_BANK = [
  // Science & Space
  { topic: 'science space', prompt: 'Which planet in our solar system has the most prominent ring system?', options: ['Saturn', 'Mars', 'Venus', 'Mercury'], correctIndex: 0, tip: 'Saturn’s iconic rings are made mostly of ice particles and rocky debris.' },
  { topic: 'science', prompt: 'What gas do plants primarily absorb from the atmosphere for photosynthesis?', options: ['Carbon dioxide', 'Nitrogen', 'Helium', 'Hydrogen'], correctIndex: 0, tip: 'Plants take in carbon dioxide (CO₂) and release oxygen.' },
  { topic: 'science', prompt: 'How long does light from the Sun take to reach Earth?', options: ['About 8 minutes', 'About 8 seconds', 'About 2 hours', 'About 1 day'], correctIndex: 0, tip: 'Sunlight takes roughly 8 minutes and 20 seconds to travel 150 million km.' },
  { topic: 'science', prompt: 'What is the chemical symbol for gold on the periodic table?', options: ['Au', 'Ag', 'Gd', 'Go'], correctIndex: 0, tip: 'Au comes from the Latin word for gold, "aurum".' },
  { topic: 'science', prompt: 'Which human organ is responsible for pumping blood throughout the body?', options: ['Heart', 'Liver', 'Kidney', 'Spleen'], correctIndex: 0, tip: 'The heart beats roughly 100,000 times every day.' },
  { topic: 'science space', prompt: 'Which is the largest planet in our solar system?', options: ['Jupiter', 'Uranus', 'Neptune', 'Earth'], correctIndex: 0, tip: 'Jupiter is a gas giant more than 11 times wider than Earth.' },
  { topic: 'science', prompt: 'At what temperature Celsius does pure water freeze at standard pressure?', options: ['0°C', '10°C', '-10°C', '100°C'], correctIndex: 0, tip: 'Water freezes at 0°C (32°F) and boils at 100°C.' },
  { topic: 'science', prompt: 'Which metal is liquid at normal room temperature?', options: ['Mercury', 'Iron', 'Aluminum', 'Copper'], correctIndex: 0, tip: 'Mercury stays liquid at room temperature and was historically used in thermometers.' },
  { topic: 'science space', prompt: 'What is the name of the galaxy that contains our solar system?', options: ['Milky Way', 'Andromeda', 'Triangulum', 'Whirlpool'], correctIndex: 0, tip: 'The Milky Way is a barred spiral galaxy holding billions of stars.' },
  { topic: 'science', prompt: 'Which vitamin is mainly produced in human skin when exposed to sunlight?', options: ['Vitamin D', 'Vitamin C', 'Vitamin B12', 'Vitamin K'], correctIndex: 0, tip: 'Sunlight triggers Vitamin D synthesis, supporting strong bones.' },

  // World History & Geography
  { topic: 'history geography', prompt: 'Which river is widely recognized as the longest river in Africa?', options: ['The Nile', 'The Congo', 'The Zambezi', 'The Niger'], correctIndex: 0, tip: 'The Nile flows northward for about 6,650 km into the Mediterranean Sea.' },
  { topic: 'geography', prompt: 'What is the capital city of Japan?', options: ['Tokyo', 'Kyoto', 'Osaka', 'Sapporo'], correctIndex: 0, tip: 'Tokyo has been Japan’s capital since 1868.' },
  { topic: 'history', prompt: 'In which ancient civilization were the Great Pyramids of Giza built?', options: ['Ancient Egypt', 'Ancient Greece', 'Mesopotamia', 'Roman Empire'], correctIndex: 0, tip: 'The Great Pyramid was built around 2560 BCE during Egypt’s Fourth Dynasty.' },
  { topic: 'geography', prompt: 'Which is the largest ocean on Earth?', options: ['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean'], correctIndex: 0, tip: 'The Pacific Ocean covers more than 30% of Earth’s surface.' },
  { topic: 'geography', prompt: 'On which continent is the Sahara Desert located?', options: ['Africa', 'Asia', 'Australia', 'South America'], correctIndex: 0, tip: 'The Sahara stretches across 11 countries in North Africa.' },
  { topic: 'history', prompt: 'Who was the first human to walk on the Moon in 1969?', options: ['Neil Armstrong', 'Buzz Aldrin', 'Yuri Gagarin', 'Michael Collins'], correctIndex: 0, tip: 'Neil Armstrong stepped onto the lunar surface during Apollo 11.' },
  { topic: 'geography', prompt: 'Which mountain is the tallest above sea level on Earth?', options: ['Mount Everest', 'K2', 'Kilimanjaro', 'Mont Blanc'], correctIndex: 0, tip: 'Mount Everest rises 8,848.86 meters in the Himalayas.' },
  { topic: 'history', prompt: 'Who painted the Mona Lisa?', options: ['Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Pablo Picasso'], correctIndex: 0, tip: 'Leonardo da Vinci painted the Mona Lisa in the early 1500s.' },
  { topic: 'geography', prompt: 'Which country is home to both Istanbul and Ankara?', options: ['Turkey', 'Greece', 'Jordan', 'Spain'], correctIndex: 0, tip: 'Ankara is Turkey’s capital, while Istanbul bridges Europe and Asia.' },
  { topic: 'geography', prompt: 'Which continent has no permanent human population and is mostly covered in ice?', options: ['Antarctica', 'Europe', 'Oceania', 'South America'], correctIndex: 0, tip: 'Only rotating teams of scientists live temporarily at Antarctic research stations.' },

  // Technology & AI
  { topic: 'technology ai', prompt: 'What does "CPU" stand for in computing?', options: ['Central Processing Unit', 'Computer Power Utility', 'Core Program Upload', 'Central Pixel User'], correctIndex: 0, tip: 'The CPU executes instructions and coordinates computer operations.' },
  { topic: 'technology ai', prompt: 'What does "HTTP" stand for at the start of web addresses?', options: ['HyperText Transfer Protocol', 'High Tech Text Page', 'Host Transfer Tool Path', 'Hyper Terminal Text Port'], correctIndex: 0, tip: 'HTTP is the foundational protocol for loading web pages.' },
  { topic: 'technology ai', prompt: 'How many bits make up one byte?', options: ['8 bits', '4 bits', '16 bits', '32 bits'], correctIndex: 0, tip: 'One byte equals 8 binary digits (bits).' },
  { topic: 'technology ai', prompt: 'Who is widely credited as writing the first algorithm for a computing machine?', options: ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Tim Berners-Lee'], correctIndex: 0, tip: 'Ada Lovelace wrote notes and an algorithm for Babbage’s Analytical Engine in 1843.' },
  { topic: 'technology ai', prompt: 'Which language runs natively inside every modern web browser alongside HTML and CSS?', options: ['JavaScript', 'Python', 'C++', 'Swift'], correctIndex: 0, tip: 'JavaScript powers interactivity across Chrome, Safari, Firefox, and Edge.' },

  // Animals & Nature
  { topic: 'animals nature', prompt: 'Which mammal is capable of true sustained flight?', options: ['Bat', 'Flying squirrel', 'Ostrich', 'Penguin'], correctIndex: 0, tip: 'Bats are the only mammals that fly with powered wings.' },
  { topic: 'animals nature', prompt: 'How many hearts does an octopus have?', options: ['Three', 'One', 'Two', 'Four'], correctIndex: 0, tip: 'An octopus has two hearts for its gills and one for the rest of its body.' },
  { topic: 'animals nature', prompt: 'Which is the fastest land animal over short distances?', options: ['Cheetah', 'Lion', 'Gazelle', 'Greyhound'], correctIndex: 0, tip: 'Cheetahs can sprint up to around 100–110 km/h in short bursts.' },
  { topic: 'animals nature', prompt: 'Which bird is famous for being unable to fly yet is the fastest running bird?', options: ['Ostrich', 'Eagle', 'Flamingo', 'Albatross'], correctIndex: 0, tip: 'Ostriches can run up to 70 km/h on land.' },
  { topic: 'animals nature', prompt: 'What is the largest living animal on Earth today?', options: ['Blue whale', 'African elephant', 'Giraffe', 'Whale shark'], correctIndex: 0, tip: 'Blue whales can grow nearly 30 meters long.' },

  // General Facts & Culture
  { topic: 'general facts culture sports', prompt: 'How many minutes are in a standard professional football (soccer) match excluding stoppage time?', options: ['90 minutes', '60 minutes', '80 minutes', '100 minutes'], correctIndex: 0, tip: 'A football match consists of two 45-minute halves.' },
  { topic: 'general facts culture', prompt: 'How many colors are traditionally listed in a rainbow?', options: ['7', '5', '9', '12'], correctIndex: 0, tip: 'Red, orange, yellow, green, blue, indigo, and violet.' },
  { topic: 'general facts culture', prompt: 'Which musical instrument has 88 black and white keys on a standard modern model?', options: ['Piano', 'Violin', 'Flute', 'Trumpet'], correctIndex: 0, tip: 'A standard piano has 52 white keys and 36 black keys.' },
  { topic: 'general facts culture', prompt: 'In which city are the Olympic Games said to have originated in ancient times?', options: ['Olympia, Greece', 'Rome, Italy', 'Cairo, Egypt', 'London, UK'], correctIndex: 0, tip: 'The ancient Olympic Games began in Olympia around 776 BCE.' },
  { topic: 'general facts culture', prompt: 'Which language has the most total native + non-native speakers worldwide?', options: ['English', 'French', 'Portuguese', 'German'], correctIndex: 0, tip: 'Over 1.4 billion people speak English globally as a first or second language.' }
];

function wordEnglish(w) {
  return String(w?.word || w?.english || '').trim();
}

function wordArabic(w) {
  return String(w?.arabic || w?.translation || '').trim();
}

function wordExample(w) {
  return String(w?.storyLine || w?.exampleSentence || w?.example || w?.meaning || '').trim();
}

function timeLimitFor(cefrLevel, difficulty) {
  const diffCfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.MEDIUM;
  if (difficulty === 'EASY') return cefrLevel === 'A1' ? 35 : diffCfg.timeLimitSec;
  if (difficulty === 'HARD') return cefrLevel === 'B2' ? 10 : diffCfg.timeLimitSec;
  return cefrLevel === 'A1' || cefrLevel === 'A2' ? 22 : diffCfg.timeLimitSec;
}

function normalizeQuizQuestion(q, cefrLevel, difficulty = 'MEDIUM') {
  const opts = (Array.isArray(q?.options) ? q.options : [])
    .map((s) => String(s ?? '').trim())
    .filter(Boolean)
    .slice(0, 4);
  while (opts.length < 4) opts.push('None of the above');
  const prompt = String(q?.prompt || '').trim();
  return {
    prompt,
    options: opts,
    correctIndex: Math.min(Math.max(Number(q?.correctIndex) || 0, 0), 3),
    timeLimitSec: timeLimitFor(cefrLevel, difficulty),
    tip: String(q?.tip || '').trim()
  };
}

async function callGeminiJson(prompt, maxOutputTokens = 4096) {
  const apiKey = getSavedGeminiKey();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
          maxOutputTokens
        }
      })
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      throw new Error(`Gemini API HTTP ${res.status}: ${msg.slice(0, 140)}`);
    }
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty Gemini response');
    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}

function isGeneralTopic(topic, quizMode, customPrompt = '') {
  if (quizMode === 'GENERAL') return true;
  if (quizMode === 'VOCAB' || quizMode === 'ARABIC') return false;
  const t = `${topic || ''} ${customPrompt || ''}`.toLowerCase();
  return /(general|fact|trivia|science|space|planet|history|geography|tech|computer|ai|animal|nature|sport|culture|movie|music|world|math|food)/.test(t);
}

function isArabicTopic(topic, quizMode, customPrompt = '') {
  if (quizMode === 'ARABIC') return true;
  const combined = `${topic || ''} ${customPrompt || ''}`;
  return /[\u0600-\u06FF]/.test(combined) || /\b(arabic|عربي|عربية|جرائم|تحقيق|علوم|فضاء|تاريخ)\b/i.test(combined);
}

const PROMPT_HISTORY_KEY = 'lingoclub_v1_prompt_history';

function buildPromptHistoryKey({ topic = '', customPrompt = '', quizMode = 'AUTO', cefrLevel = 'B1' }) {
  const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `${norm(topic)}::${norm(customPrompt)}::${norm(quizMode)}::${norm(cefrLevel)}`;
}

function readAllPromptHistory() {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(PROMPT_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}

function readPromptHistory(historyKey) {
  const all = readAllPromptHistory();
  return Array.isArray(all[historyKey]) ? all[historyKey] : [];
}

function recordPromptHistory(historyKey, prompts = []) {
  try {
    if (typeof localStorage === 'undefined' || !historyKey) return;
    const clean = (Array.isArray(prompts) ? prompts : [])
      .map((p) => String(p || '').trim())
      .filter(Boolean);
    if (!clean.length) return;
    const all = readAllPromptHistory();
    const prev = Array.isArray(all[historyKey]) ? all[historyKey] : [];
    const seen = new Set(prev.map((p) => p.toLowerCase()));
    const merged = [...prev];
    for (const p of clean) {
      const k = p.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        merged.push(p);
      }
    }
    all[historyKey] = merged.slice(-120);
    // Cap total stored prompt keys to 60 oldest-evicted
    const keys = Object.keys(all);
    if (keys.length > 60) {
      keys.slice(0, keys.length - 60).forEach((k) => delete all[k]);
    }
    localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(all));
  } catch (_) {}
}

function buildOfflineQuizDraft({
  topic,
  cefrLevel,
  questionCount,
  focusWords = [],
  quizMode = 'AUTO',
  difficulty = 'MEDIUM',
  customPrompt = '',
  avoidPrompts = []
}) {
  const cleanTopic = String(topic || 'General Knowledge & English').trim() || 'General Knowledge & English';
  const cleanCustom = String(customPrompt || '').trim();
  const searchBasis = `${cleanTopic} ${cleanCustom}`.toLowerCase();
  const count = Math.min(Math.max(Number(questionCount) || 10, 3), 60);
  const preferGeneral = isGeneralTopic(cleanTopic, quizMode, cleanCustom);
  const preferArabic = isArabicTopic(cleanTopic, quizMode, cleanCustom);

  const weeklyNormalized = WEEKLY_CURRICULUM.flatMap((w) => w.words || [])
    .map((w) => ({
      english: wordEnglish(w),
      arabic: wordArabic(w),
      example: wordExample(w),
      meaning: String(w?.meaning || '').trim(),
      cefrLevel: String(w?.cefrLevel || 'B1')
    }))
    .filter((w) => w.english && w.arabic);

  const loadedDict = getLoadedDictionarySync();
  const dictSource = loadedDict?.length ? loadedDict : CURATED_DICTIONARY;
  const dictNormalized = (dictSource || [])
    .map((d) => ({
      english: wordEnglish(d),
      arabic: wordArabic(d),
      example: wordExample(d),
      meaning: String(d?.meaning || d?.category || '').trim(),
      cefrLevel: String(d?.cefrLevel || 'B1')
    }))
    .filter((d) => d.english && d.arabic);

  const focusSet = new Set(
    (Array.isArray(focusWords) ? focusWords : [])
      .map((w) => String(w || '').toLowerCase().trim())
      .filter(Boolean)
  );

  const blockedPrompts = new Set(
    (Array.isArray(avoidPrompts) ? avoidPrompts : [])
      .map((p) => String(p || '').trim().toLowerCase())
      .filter(Boolean)
  );

  const questions = [];
  const usedPrompts = new Set();
  const fallbackPool = [];
  const pushUnique = (q, allowBlocked = false) => {
    const normalized = normalizeQuizQuestion(q, cefrLevel, difficulty);
    if (!normalized.prompt) return false;
    const pKey = normalized.prompt.toLowerCase();
    if (usedPrompts.has(pKey)) return false;
    if (!allowBlocked && blockedPrompts.has(pKey)) {
      if (fallbackPool.length < count * 2) fallbackPool.push(normalized);
      return false;
    }
    usedPrompts.add(pKey);
    questions.push(normalized);
    return true;
  };

  const topicTokens = searchBasis.split(/[^a-z0-9\u0600-\u06FF]+/).filter((t) => t.length >= 2);
  const scoreKeywordHits = (text) => {
    const low = String(text || '').toLowerCase();
    let hits = 0;
    for (const tok of topicTokens) {
      if (low.includes(tok)) hits += 1;
    }
    return hits;
  };

  // Arabic-first offline bank when quizMode is ARABIC or topic is Arabic
  if (preferArabic) {
    const arPackQs = ARABIC_QUIZ_PACKS.flatMap((p) =>
      (p.questions || []).map((q) => ({
        ...q,
        _score: scoreKeywordHits(`${p.title || ''} ${p.topic || ''} ${q.prompt || ''} ${q.tip || ''}`)
      }))
    );
    const arDuelQs = ARABIC_CRIME_SCIENCE_HISTORY_ROUNDS.map((r) => ({
      prompt: r.scenarioPrompt,
      options: r.options,
      correctIndex: r.oddIndex,
      tip: r.explanation,
      _score: scoreKeywordHits(`${r.category || ''} ${r.scenarioPrompt || ''} ${r.explanation || ''}`)
    }));
    const sortedArQs = shuffleArray([...arPackQs, ...arDuelQs]).sort((a, b) => (b._score || 0) - (a._score || 0));
    for (const q of sortedArQs) {
      if (questions.length >= count) break;
      pushUnique(q);
    }
    // Synthesize additional Arabic Synonym / Antonym / Clue questions from ARABIC_ARCADE_WORDS
    const sortedArWords = shuffleArray(ARABIC_ARCADE_WORDS).sort(
      (a, b) => scoreKeywordHits(`${b.word} ${b.clue} ${b.category || ''}`) - scoreKeywordHits(`${a.word} ${a.clue} ${a.category || ''}`)
    );
    for (const item of sortedArWords) {
      if (questions.length >= count) break;
      const others = shuffleArray(ARABIC_ARCADE_WORDS.filter((x) => x.word !== item.word)).slice(0, 3);
      if (others.length < 3) continue;
      const optsSyn = shuffleArray([item.synonym, ...others.map((o) => o.synonym)]);
      pushUnique({
        prompt: `ما مرادف كلمة "${item.word}"؟`,
        options: optsSyn,
        correctIndex: Math.max(0, optsSyn.indexOf(item.synonym)),
        tip: `${item.word} معناها (${item.synonym}) وضدها (${item.antonym}).`
      });
      if (questions.length >= count) break;
      const optsAnt = shuffleArray([item.antonym, ...others.map((o) => o.antonym)]);
      pushUnique({
        prompt: `ما ضد (عكس) كلمة "${item.word}"؟`,
        options: optsAnt,
        correctIndex: Math.max(0, optsAnt.indexOf(item.antonym)),
        tip: `عكس ${item.word} هو ${item.antonym}.`
      });
      if (questions.length >= count) break;
      const optsWord = shuffleArray([item.word, ...others.map((o) => o.word)]);
      pushUnique({
        prompt: `أي كلمة عربية تناسب الوصف: "${item.clue}"؟`,
        options: optsWord,
        correctIndex: Math.max(0, optsWord.indexOf(item.word)),
        tip: `${item.word}: ${item.clue} — مرادف: ${item.synonym}`
      });
    }
  }

  // General Knowledge & Curated Trivia Packs (boosted by customPrompt + topic keywords)
  const scoredFacts = GENERAL_FACTS_BANK.map((f) => ({
    ...f,
    _score: scoreKeywordHits(`${f.topic} ${f.prompt} ${f.tip || ''}`)
  }));
  const matchedFacts = shuffleArray(scoredFacts.filter((f) => f._score > 0)).sort((a, b) => b._score - a._score);
  const otherFacts = scoredFacts.filter((f) => f._score === 0);

  const curatedPackQs = QUIZ_PACKS.flatMap((pack) =>
    (pack.questions || []).map((q) => ({
      ...q,
      _score: scoreKeywordHits(`${pack.title || ''} ${pack.topic || ''} ${q.prompt || ''} ${q.tip || ''}`)
    }))
  );
  const matchedPackQs = shuffleArray(curatedPackQs.filter((q) => q._score > 0)).sort((a, b) => b._score - a._score);
  const otherPackQs = curatedPackQs.filter((q) => q._score === 0);

  if (preferGeneral) {
    for (const q of [...matchedFacts, ...matchedPackQs, ...shuffleArray(otherFacts), ...shuffleArray(otherPackQs)]) {
      if (questions.length >= count) break;
      pushUnique(q);
    }
  } else if (!preferArabic && (matchedPackQs.length || matchedFacts.length)) {
    for (const q of [...shuffleArray(matchedPackQs), ...shuffleArray(matchedFacts)]) {
      if (questions.length >= count) break;
      pushUnique(q);
    }
  }

  // Bilingual & Definition Vocabulary Pool (fills up to 60 unique questions cleanly)
  const allWords = [...weeklyNormalized, ...dictNormalized];
  const matchedWords = allWords.filter((w) => {
    const engLow = w.english.toLowerCase();
    const meanLow = w.meaning.toLowerCase();
    const exLow = w.example.toLowerCase();
    if (focusSet.has(engLow)) return true;
    return topicTokens.some((tok) => engLow.includes(tok) || meanLow.includes(tok) || exLow.includes(tok) || w.arabic.includes(tok));
  });

  const levelWords = weeklyNormalized.filter((w) => w.cefrLevel === cefrLevel || cefrLevel === CefrLevel.B2);
  const candidatePool = [
    ...matchedWords,
    ...shuffleArray(levelWords),
    ...shuffleArray(weeklyNormalized),
    ...shuffleArray(dictNormalized).slice(0, 350)
  ];

  const uniqueWords = [];
  const seenWords = new Set();
  for (const w of candidatePool) {
    const key = w.english.toLowerCase();
    if (!seenWords.has(key)) {
      seenWords.add(key);
      uniqueWords.push(w);
    }
    if (uniqueWords.length >= count * 2 + 50) break;
  }

  let cursor = 0;
  while (questions.length < count && cursor < uniqueWords.length) {
    const target = uniqueWords[cursor++];
    const distractors = [];
    for (let attempt = 0; attempt < 25 && distractors.length < 3; attempt++) {
      const candidate = uniqueWords[Math.floor(Math.random() * uniqueWords.length)];
      if (
        candidate &&
        candidate.english !== target.english &&
        candidate.arabic !== target.arabic &&
        !distractors.some((d) => d.english === candidate.english || d.arabic === candidate.arabic)
      ) {
        distractors.push(candidate);
      }
    }
    if (distractors.length < 3) continue;

    const variant = questions.length % 3;
    let candidateQ;
    if (preferArabic || variant === 1) {
      const opts = shuffleArray([target.english, ...distractors.map((d) => d.english)]);
      candidateQ = {
        prompt: preferArabic
          ? `ما الترجمة الإنجليزية الصحيحة لكلمة "${target.arabic}"؟`
          : `[${cleanTopic}] Which English word matches "${target.arabic}"?`,
        options: opts,
        correctIndex: Math.max(0, opts.indexOf(target.english)),
        tip: target.example || `${target.arabic} = ${target.english}`
      };
    } else if (variant === 0) {
      const opts = shuffleArray([target.arabic, ...distractors.map((d) => d.arabic)]);
      candidateQ = {
        prompt: `[${cleanTopic}] What is the Arabic meaning of "${target.english}"?`,
        options: opts,
        correctIndex: Math.max(0, opts.indexOf(target.arabic)),
        tip: target.example || `${target.english} = ${target.arabic}`
      };
    } else if (target.meaning && distractors.every((d) => d.meaning)) {
      const opts = shuffleArray([target.english, ...distractors.map((d) => d.english)]);
      candidateQ = {
        prompt: `[${cleanTopic}] Which word means: "${target.meaning}"?`,
        options: opts,
        correctIndex: Math.max(0, opts.indexOf(target.english)),
        tip: `${target.english} (${target.arabic}): ${target.example || target.meaning}`
      };
    } else {
      const opts = shuffleArray([target.arabic, ...distractors.map((d) => d.arabic)]);
      candidateQ = {
        prompt: `[${cleanTopic}] Translate into Arabic: "${target.english}"`,
        options: opts,
        correctIndex: Math.max(0, opts.indexOf(target.arabic)),
        tip: target.example || `${target.english} = ${target.arabic}`
      };
    }
    pushUnique(candidateQ);
  }

  if (questions.length < count) {
    for (const q of [...shuffleArray(otherFacts), ...shuffleArray(otherPackQs)]) {
      if (questions.length >= count) break;
      pushUnique(q);
    }
  }

  // Graceful fallback only after exhausting unseen questions
  if (questions.length < count && fallbackPool.length) {
    for (const q of shuffleArray(fallbackPool)) {
      if (questions.length >= count) break;
      pushUnique(q, true);
    }
  }

  return {
    title: `${cleanTopic} (${cefrLevel})`.slice(0, 80),
    topic: cleanTopic.slice(0, 40),
    cefrLevel,
    difficulty,
    customPrompt: cleanCustom,
    language: preferArabic ? 'AR' : 'EN',
    questions: questions.slice(0, count),
    source: 'OFFLINE'
  };
}

function evaluateSpeechDeterministically({ targetScript, spokenTranscript, cefrLevel, targetPhrases = [] }) {
  const normalize = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9'\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

  const targetTokens = normalize(targetScript);
  const spokenTokens = normalize(spokenTranscript);
  const spokenSet = new Set(spokenTokens);

  const matched = targetTokens.filter((t) => spokenSet.has(t));
  const missed = targetTokens.filter((t) => !spokenSet.has(t));
  const overlapRatio = targetTokens.length ? matched.length / targetTokens.length : 0;

  let phraseHits = 0;
  const spokenLow = String(spokenTranscript || '').toLowerCase();
  for (const ph of targetPhrases) {
    const cleanPh = String(ph || '').toLowerCase().trim();
    if (cleanPh && spokenLow.includes(cleanPh)) {
      phraseHits++;
    }
  }
  const phraseBonus = targetPhrases.length ? (phraseHits / targetPhrases.length) * 15 : 10;
  const rawScore = Math.round(Math.min(100, Math.max(25, overlapRatio * 85 + phraseBonus)));

  const summary =
    rawScore >= 85
      ? 'Strong, natural delivery — your spoken words match the scene smoothly!'
      : rawScore >= 65
        ? 'Good progress! Most key ideas came across clearly.'
        : 'Keep practicing! Speak slowly and focus on the key phrases.';

  const clarityFeedback =
    missed.length === 0
      ? `You covered all ${targetTokens.length} target words accurately.`
      : `Matched ${matched.length}/${targetTokens.length} target words. Focus next on: ${[...new Set(missed)].slice(0, 5).join(', ')}.`;

  const naturalnessFeedback =
    phraseHits > 0
      ? `Great job using ${phraseHits} target expression${phraseHits > 1 ? 's' : ''} naturally for ${cefrLevel}.`
      : `Try including the highlighted scene expression to sound more fluent at ${cefrLevel}.`;

  return {
    score: rawScore,
    summary,
    clarityFeedback,
    naturalnessFeedback,
    suggestedLine: targetScript,
    practiceTip: 'Pause briefly at punctuation marks and stress the main content words.',
    source: 'LOCAL_COACH'
  };
}

export const aiService = {
  async generateQuizDraft({
    topic,
    cefrLevel = CefrLevel.B1,
    questionCount = 10,
    focusWords = [],
    quizMode = 'AUTO',
    difficulty = 'MEDIUM',
    customPrompt = '',
    avoidPrompts = [],
    freshSet = false,
    onProgress = null
  }) {
    const cleanTopic = String(topic || (quizMode === 'ARABIC' ? 'اللغة العربية والثقافة العامة' : 'General Knowledge & English')).trim().slice(0, 80) || 'General Knowledge & English';
    const cleanCustom = String(customPrompt || '').trim().slice(0, 800);
    const count = Math.min(Math.max(Number(questionCount) || 10, 3), 60);
    const historyKey = buildPromptHistoryKey({ topic: cleanTopic, customPrompt: cleanCustom, quizMode, cefrLevel });
    const storedHistory = freshSet ? readPromptHistory(historyKey) : [];
    const mergedAvoidPrompts = [
      ...storedHistory,
      ...(Array.isArray(avoidPrompts) ? avoidPrompts : [])
    ]
      .map((p) => String(p || '').trim())
      .filter(Boolean);

    const cleanFocus = (Array.isArray(focusWords) ? focusWords : [])
      .map((w) => String(w || '').trim())
      .filter(Boolean);
    const vocabHint = cleanFocus.length
      ? ` Incorporate several of these vocabulary words naturally: ${cleanFocus.slice(0, 12).join(', ')}.`
      : '';
    const diffInstruction =
      difficulty === 'HARD'
        ? 'Make the questions challenging with subtle, plausible distractors (Hard difficulty).'
        : difficulty === 'EASY'
          ? 'Keep the questions straightforward and beginner-friendly with clear options (Easy difficulty).'
          : 'Use balanced, engaging medium-difficulty questions.';
    const styleInstruction =
      quizMode === 'ARABIC'
        ? `Write ALL questions, all 4 options, and tips in clear Arabic (العربية الفصحى) suitable for level ${cefrLevel}, covering "${cleanTopic}". Focus on engaging crime mysteries, science, space, history, and general facts—do NOT include Arabic grammar parsing (إعراب) or school dictation drills.`
        : quizMode === 'VOCAB'
          ? `Focus on English vocabulary, definitions, usage in sentences, and Arabic translations where helpful for CEFR ${cefrLevel}.`
          : quizMode === 'GENERAL'
            ? `Create engaging general knowledge, trivia, and real-world fact multiple-choice questions on "${cleanTopic}", written in clear English appropriate for CEFR level ${cefrLevel}.`
            : `Create accurate, engaging multiple-choice questions directly about "${cleanTopic}" (real facts/trivia if it's a general/science/history/culture topic, Arabic if requested, or interactive language/grammar/usage questions if it's an English study topic), calibrated for CEFR level ${cefrLevel}.`;
    const customInstruction = cleanCustom ? ` User custom instructions (MUST FOLLOW): ${cleanCustom}` : '';

    const apiKey = getSavedGeminiKey();
    if (apiKey) {
      try {
        const collected = [];
        const seenPrompts = new Set(mergedAvoidPrompts.map((p) => p.toLowerCase()));
        let quizTitle = `${cleanTopic} (${cefrLevel})`;
        let resolvedTopic = cleanTopic;

        const maxPerBatch = 20;
        const totalBatches = Math.ceil(count / maxPerBatch);

        for (let batchIdx = 0; batchIdx < totalBatches && collected.length < count; batchIdx++) {
          const remaining = count - collected.length;
          const batchTarget = Math.min(maxPerBatch, remaining);
          onProgress?.(
            totalBatches > 1
              ? `Generating batch ${batchIdx + 1}/${totalBatches} (${collected.length}/${count} ready)...`
              : `Generating ${count} questions with Gemini...`
          );

          const avoidSamples = [
            ...mergedAvoidPrompts.slice(-20),
            ...collected.slice(-20).map((q) => q.prompt)
          ];
          const avoidList = avoidSamples.length
            ? ` Do NOT repeat these already-used questions: ${avoidSamples.join(' | ').slice(0, 1400)}.`
            : '';

          const prompt =
            `Create an interactive Kahoot-style quiz on the topic "${cleanTopic}" with exactly ${batchTarget} distinct multiple-choice questions.${vocabHint} ` +
            `${styleInstruction} ${diffInstruction}${customInstruction}${avoidList} ` +
            `Return strict JSON: {"title":"...","topic":"...","questions":[{"prompt":"...","options":["...","...","...","..."],"correctIndex":0,"tip":"..."}]}. ` +
            `Keep each question clear and concise with 4 distinct options and a short helpful explanation in "tip".`;

          const json = await callGeminiJson(prompt, 8192);
          if (json && Array.isArray(json.questions)) {
            if (batchIdx === 0 && json.title) quizTitle = String(json.title).trim();
            if (batchIdx === 0 && json.topic) resolvedTopic = String(json.topic).trim();
            for (const rawQ of json.questions) {
              const q = normalizeQuizQuestion(rawQ, cefrLevel, difficulty);
              const key = q.prompt.toLowerCase();
              if (q.prompt && !seenPrompts.has(key)) {
                seenPrompts.add(key);
                collected.push(q);
                if (collected.length >= count) break;
              }
            }
          }
        }

        if (collected.length > 0) {
          if (collected.length < count) {
            const topUp = buildOfflineQuizDraft({
              topic: cleanTopic,
              cefrLevel,
              questionCount: count,
              focusWords: cleanFocus,
              quizMode,
              difficulty,
              customPrompt: cleanCustom,
              avoidPrompts: [...mergedAvoidPrompts, ...collected.map((q) => q.prompt)]
            });
            for (const q of topUp.questions) {
              if (collected.length >= count) break;
              const key = q.prompt.toLowerCase();
              if (!seenPrompts.has(key)) {
                seenPrompts.add(key);
                collected.push(q);
              }
            }
          }

          const finalQuestions = collected.slice(0, count);
          recordPromptHistory(historyKey, finalQuestions.map((q) => q.prompt));
          return {
            title: quizTitle.slice(0, 80),
            topic: resolvedTopic.slice(0, 40),
            cefrLevel,
            difficulty,
            customPrompt: cleanCustom,
            language: quizMode === 'ARABIC' || isArabicTopic(cleanTopic, quizMode, cleanCustom) ? 'AR' : 'EN',
            questions: finalQuestions,
            source: 'GEMINI'
          };
        }
      } catch (err) {
        console.warn('[aiService] Gemini quiz fallback to offline builder:', err?.message);
      }
    }

    const offlineDraft = buildOfflineQuizDraft({
      topic: cleanTopic,
      cefrLevel,
      questionCount: count,
      focusWords: cleanFocus,
      quizMode,
      difficulty,
      customPrompt: cleanCustom,
      avoidPrompts: mergedAvoidPrompts
    });
    recordPromptHistory(historyKey, (offlineDraft.questions || []).map((q) => q.prompt));
    return offlineDraft;
  },

  async generateRoleplay({ setting, cefrLevel = CefrLevel.B1, tone = 'Friendly' }) {
    const cleanSetting = String(setting || 'Neighborhood Café').trim().slice(0, 80);
    const cleanTone = String(tone || 'Friendly').trim().slice(0, 30);
    const prompt =
      `Write a 6-turn English teaching roleplay for two speakers at CEFR level ${cefrLevel}. ` +
      `Setting: "${cleanSetting}". Tone: "${cleanTone}". ` +
      `Return JSON: {"title":"...","setting":"...","roleAName":"...","roleBName":"...","goal":"...",` +
      `"lines":[{"speakerRole":"A","text":"...","keyHint":"...","phrase":"...","phraseMeaning":"...","phraseExample":"..."}],` +
      `"plotTwists":["...","..."]}. Alternate speakerRole A and B.`;

    try {
      const json = await callGeminiJson(prompt, 4096);
      if (json && Array.isArray(json.lines) && json.lines.length > 0) {
        const lines = json.lines.slice(0, 12).map((l) => ({
          speakerRole: String(l.speakerRole || 'A').toUpperCase() === 'B' ? 'B' : 'A',
          text: String(l.text || '').trim(),
          keyHint: String(l.keyHint || 'Respond naturally').trim(),
          highlights: l.phrase
            ? [{
                phrase: String(l.phrase).trim(),
                meaning: String(l.phraseMeaning || 'Key expression').trim(),
                example: String(l.phraseExample || l.text || '').trim()
              }]
            : []
        })).filter((l) => l.text);

        if (lines.length > 0) {
          return {
            id: `ai_rp_${Date.now()}`,
            title: String(json.title || cleanSetting).slice(0, 80),
            setting: String(json.setting || cleanSetting).slice(0, 160),
            cefrLevel,
            roleAName: String(json.roleAName || 'Speaker A').slice(0, 40),
            roleBName: String(json.roleBName || 'Speaker B').slice(0, 40),
            goal: String(json.goal || 'Complete the scene smoothly.').slice(0, 200),
            lines,
            plotTwists: Array.isArray(json.plotTwists) && json.plotTwists.length
              ? json.plotTwists.slice(0, 5)
              : ['Plot Twist: A sudden announcement changes both speakers’ plans!'],
            source: 'AI'
          };
        }
      }
    } catch (err) {
      console.warn('[aiService] Gemini roleplay fallback to OfflineRoleplayGenerator:', err?.message);
    }

    return OfflineRoleplayGenerator.generate(cleanSetting, cefrLevel, cleanTone);
  },

  async evaluateRoleplaySpeech({ scenarioTitle, cefrLevel, speakerRoleName, targetScript, spokenTranscript, targetPhrases = [] }) {
    const cleanSpoken = String(spokenTranscript || '').trim();
    if (!cleanSpoken) {
      throw new Error('Speak or type your line before requesting feedback.');
    }
    const prompt =
      `You are an encouraging English speaking coach evaluating a ${cefrLevel} learner in "${scenarioTitle}" (Role: ${speakerRoleName}). ` +
      `Target script: "${targetScript}". Spoken transcript: "${cleanSpoken}". ` +
      `Return JSON: {"score":0,"summary":"...","clarityFeedback":"...","naturalnessFeedback":"...","suggestedLine":"...","practiceTip":"..."}.`;

    try {
      const json = await callGeminiJson(prompt, 2048);
      if (json && typeof json.score === 'number') {
        return {
          score: Math.min(Math.max(0, Math.round(json.score)), 100),
          summary: String(json.summary || 'Great speaking practice!'),
          clarityFeedback: String(json.clarityFeedback || 'Your spoken intent is clear.'),
          naturalnessFeedback: String(json.naturalnessFeedback || `Good fluency for ${cefrLevel}.`),
          suggestedLine: String(json.suggestedLine || targetScript),
          practiceTip: String(json.practiceTip || 'Pause slightly at commas and stress content words.'),
          source: 'GEMINI'
        };
      }
    } catch (err) {
      console.warn('[aiService] Gemini speech feedback fallback to local analyzer:', err?.message);
    }

    return evaluateSpeechDeterministically({ targetScript, spokenTranscript: cleanSpoken, cefrLevel, targetPhrases });
  }
};
