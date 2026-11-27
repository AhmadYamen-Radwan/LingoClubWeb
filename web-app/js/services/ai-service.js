// Gemini REST AI Generator + Deterministic Offline Curriculum Fallbacks
// Replicates LingoAiGenerator.kt with zero backend requirement when offline or no API key is configured.

import { OfflineRoleplayGenerator, QUIZ_PACKS } from '../data/curated-content.js';
import { WEEKLY_CURRICULUM } from '../data/weekly-curriculum.js';
import { CURATED_DICTIONARY } from '../data/dictionary.js';
import { CefrLevel, shuffleArray } from '../models.js';
import { getSavedGeminiKey } from './offline-store.js';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function callGeminiJson(prompt) {
  const apiKey = getSavedGeminiKey();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
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
          maxOutputTokens: 2048
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

function buildOfflineQuizDraft({ topic, cefrLevel, questionCount, focusWords }) {
  const cleanTopic = String(topic || 'Everyday English').trim() || 'Everyday English';
  const count = Math.min(Math.max(Number(questionCount) || 5, 3), 10);

  // Build rich word pool prioritizing focusWords + matching CEFR dictionary + weekly words
  const weeklyPool = WEEKLY_CURRICULUM.flatMap((w) => w.words || []);
  const dictPool = CURATED_DICTIONARY;
  const focusSet = new Set((focusWords || []).map((w) => String(w).toLowerCase().trim()));

  const matchedWeekly = weeklyPool.filter(
    (w) => focusSet.has(w.english.toLowerCase()) || w.english.toLowerCase().includes(cleanTopic.toLowerCase())
  );
  const pool = [...matchedWeekly, ...shuffleArray(weeklyPool.filter((w) => w.cefrLevel === cefrLevel || cefrLevel === CefrLevel.B2))];
  const uniqueWords = [];
  const seen = new Set();
  for (const w of pool) {
    if (!seen.has(w.english)) {
      seen.add(w.english);
      uniqueWords.push(w);
    }
    if (uniqueWords.length >= count * 4) break;
  }

  const questions = [];
  for (let i = 0; i < count; i++) {
    const target = uniqueWords[i];
    if (target) {
      const distractors = shuffleArray(
        uniqueWords.filter((d) => d.english !== target.english)
      ).slice(0, 3);
      while (distractors.length < 3 && dictPool.length > distractors.length) {
        const d = dictPool[Math.floor(Math.random() * dictPool.length)];
        if (d.english !== target.english && !distractors.some((x) => x.english === d.english)) {
          distractors.push({ english: d.english, arabic: d.arabic });
        }
      }
      const askArabicToEnglish = i % 2 === 1;
      const correctOption = askArabicToEnglish ? target.english : target.arabic;
      const wrongOptions = distractors.map((d) => (askArabicToEnglish ? d.english : d.arabic));
      const allOpts = shuffleArray([correctOption, ...wrongOptions]).slice(0, 4);
      const correctIndex = Math.max(0, allOpts.indexOf(correctOption));
      questions.push({
        prompt: askArabicToEnglish
          ? `[${cleanTopic}] Which English word means "${target.arabic}"?`
          : `[${cleanTopic}] What is the Arabic meaning of "${target.english}"?`,
        options: allOpts,
        correctIndex,
        timeLimitSec: cefrLevel === 'A1' || cefrLevel === 'A2' ? 20 : 18,
        tip: target.exampleSentence || `Remember: ${target.english} = ${target.arabic}`
      });
    } else {
      const pack = QUIZ_PACKS[i % QUIZ_PACKS.length];
      const q = pack.questions[i % pack.questions.length];
      questions.push({ ...q });
    }
  }

  return {
    title: `${cleanTopic} Clash (${cefrLevel})`.slice(0, 80),
    topic: cleanTopic.slice(0, 40),
    cefrLevel,
    questions,
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
  for (const ph of targetPhrases) {
    const cleanPh = String(ph || '').toLowerCase().trim();
    if (cleanPh && spokenTranscript.toLowerCase().includes(cleanPh)) {
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
  async generateQuizDraft({ topic, cefrLevel = CefrLevel.B1, questionCount = 5, focusWords = [] }) {
    const cleanTopic = String(topic || 'Everyday English').trim().slice(0, 60) || 'Everyday English';
    const count = Math.min(Math.max(Number(questionCount) || 5, 3), 10);
    const vocabHint = focusWords.length
      ? ` Incorporate several of these vocabulary words naturally: ${focusWords.slice(0, 12).join(', ')}.`
      : '';
    const prompt =
      `Create an interactive Kahoot-style English learning quiz for CEFR level ${cefrLevel} on the topic "${cleanTopic}" with exactly ${count} questions.${vocabHint} ` +
      `Return JSON: {"title":"...","topic":"...","questions":[{"prompt":"...","options":["...","...","...","..."],"correctIndex":0,"tip":"..."}]}. ` +
      `Each question must have exactly 4 concise options and correctIndex 0..3.`;

    try {
      const json = await callGeminiJson(prompt);
      if (json && Array.isArray(json.questions) && json.questions.length > 0) {
        const parsed = json.questions
          .map((q) => {
            const opts = (q.options || []).map((s) => String(s).trim()).filter(Boolean).slice(0, 4);
            while (opts.length < 4) opts.push('None of the above');
            return {
              prompt: String(q.prompt || '').trim(),
              options: opts,
              correctIndex: Math.min(Math.max(Number(q.correctIndex) || 0, 0), 3),
              timeLimitSec: cefrLevel === 'A1' || cefrLevel === 'A2' ? 20 : 18,
              tip: String(q.tip || '').trim()
            };
          })
          .filter((q) => q.prompt);
        if (parsed.length > 0) {
          return {
            title: String(json.title || `${cleanTopic} Clash`).slice(0, 80),
            topic: String(json.topic || cleanTopic).slice(0, 40),
            cefrLevel,
            questions: parsed,
            source: 'GEMINI'
          };
        }
      }
    } catch (err) {
      console.warn('[aiService] Gemini quiz fallback to offline builder:', err?.message);
    }

    return buildOfflineQuizDraft({ topic: cleanTopic, cefrLevel, questionCount: count, focusWords });
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
      const json = await callGeminiJson(prompt);
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
      const json = await callGeminiJson(prompt);
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
