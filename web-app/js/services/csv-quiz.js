// Kahoot-Compatible CSV Export & Import for Quizzes (RFC-4180 + UTF-8 BOM for Excel & Arabic support)

import { CefrLevel } from '../models.js';

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function quizToKahootCsv(quiz) {
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
  const rows = [
    ['Question', 'Answer 1', 'Answer 2', 'Answer 3', 'Answer 4', 'Time limit (sec)', 'Correct answer(s)', 'Tip']
  ];

  for (const q of questions) {
    const opts = Array.isArray(q?.options) ? q.options : [];
    const ans1 = opts[0] ?? '';
    const ans2 = opts[1] ?? '';
    const ans3 = opts[2] ?? '';
    const ans4 = opts[3] ?? '';
    const timeLimit = Math.max(5, Math.min(240, Number(q?.timeLimitSec) || 20));
    const correct1Based = Math.min(Math.max((Number(q?.correctIndex) || 0) + 1, 1), 4);
    const tip = q?.tip ?? '';
    rows.push([
      String(q?.prompt || '').trim(),
      String(ans1).trim(),
      String(ans2).trim(),
      String(ans3).trim(),
      String(ans4).trim(),
      String(timeLimit),
      String(correct1Based),
      String(tip).trim()
    ]);
  }

  return '\uFEFF' + rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
}

export function downloadQuizCsv(quiz) {
  const csv = quizToKahootCsv(quiz);
  const rawTitle = String(quiz?.title || 'lingoclub_quiz').trim();
  const safeSlug = rawTitle
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'lingoclub_quiz';

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeSlug}_kahoot.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 150);
}

export function parseCsvRows(csvText) {
  const clean = String(csvText || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\r') {
      if (clean[i + 1] === '\n') i += 1;
      row.push(cell);
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

export function parseKahootCsv(csvText, { title = 'Imported Kahoot Quiz', topic = 'CSV Import', cefrLevel = CefrLevel.B1 } = {}) {
  const rows = parseCsvRows(csvText);
  if (!rows.length) {
    throw new Error('The CSV file is empty.');
  }

  const firstLower = rows[0].map((c) => c.trim().toLowerCase());
  const looksLikeHeader =
    firstLower[0]?.includes('question') ||
    firstLower[1]?.includes('answer') ||
    firstLower[0]?.includes('prompt');

  const dataRows = looksLikeHeader ? rows.slice(1) : rows;
  const questions = [];

  for (const r of dataRows) {
    if (questions.length >= 60) break;
    const prompt = String(r[0] || '').trim();
    const rawOpts = [r[1], r[2], r[3], r[4]].map((v) => String(v || '').trim());
    const validOpts = rawOpts.filter(Boolean);
    if (!prompt || validOpts.length < 2) continue;
    while (validOpts.length < 4) validOpts.push('None of the above');

    const timeLimit = Math.max(5, Math.min(120, Number(r[5]) || 20));
    const rawCorrect = String(r[6] || '1').split(/[,;|/\s]+/)[0];
    const parsedNum = Number(rawCorrect);
    // Kahoot uses 1-based answer indices (1..4); support 0 if someone authored 0-based
    let correctIndex = 0;
    if (Number.isFinite(parsedNum)) {
      correctIndex = parsedNum === 0 ? 0 : Math.min(Math.max(parsedNum - 1, 0), 3);
    }
    const tip = String(r[7] || '').trim();
    questions.push({
      prompt,
      options: validOpts.slice(0, 4),
      correctIndex,
      timeLimitSec: timeLimit,
      tip
    });
  }

  if (!questions.length) {
    throw new Error('No valid questions found. Use columns: Question, Answer 1, Answer 2, Answer 3, Answer 4, Time limit (sec), Correct answer(s).');
  }

  const hasArabic = questions.some((q) => /[\u0600-\u06FF]/.test(`${q.prompt} ${q.options.join(' ')}`));
  return {
    title: String(title || 'Imported Quiz').trim().slice(0, 80),
    topic: String(topic || 'CSV Import').trim().slice(0, 40),
    cefrLevel,
    language: hasArabic ? 'AR' : 'EN',
    questions,
    source: 'CSV'
  };
}
