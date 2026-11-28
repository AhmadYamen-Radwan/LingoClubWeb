import { QuizPack } from '../types';
import { parseCsvRows, parseKahootCsv, quizToKahootCsv } from '../utils/gameLogic';

export { parseCsvRows, parseKahootCsv, quizToKahootCsv };

export function downloadQuizCsv(quiz: Partial<QuizPack>): void {
  const csv = quizToKahootCsv(quiz);
  const rawTitle = String(quiz?.title || 'lingoclub_quiz').trim();
  const safeSlug =
    rawTitle
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
