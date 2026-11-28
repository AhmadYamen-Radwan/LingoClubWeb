import React, { useState } from 'react';
import { CefrLevel, QuizPack } from '../types';
import { CEFR_LEVELS } from '../utils/constants';
import { aiService } from '../services/aiService';
import { useApp } from '../context/AppContext';

export const QuizGeneratorCard: React.FC<{
  onGenerated?: (quiz: QuizPack) => void;
  onStartNow?: (quiz: QuizPack) => void;
}> = ({ onGenerated, onStartNow }) => {
  const { profile, saveCustomQuiz, toast, sfx } = useApp();
  const [prompt, setPrompt] = useState('');
  const [cefr, setCefr] = useState<string>(profile.learningLevel || CefrLevel.B1);
  const [count, setCount] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<QuizPack | null>(null);

  const presets = [
    'Coffee shop phrasal verbs & polite ordering',
    'Airport emergencies & travel idioms',
    'Detective mystery clues & crime vocabulary',
    'ألغاز ذكاء وعلوم الفضاء الممتعة',
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast('Describe a quiz topic first!', 'error');
      return;
    }
    setLoading(true);
    sfx.playClick();
    try {
      const quiz = await aiService.generateQuiz({
        prompt,
        cefrLevel: cefr,
        questionCount: count,
      });
      setDraft(quiz);
      onGenerated?.(quiz);
      sfx.playSuccess();
      toast(`Generated "${quiz.title}" (${quiz.questions.length} questions)!`, 'info');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not generate quiz.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card stack-md" aria-label="Prompt Quiz Studio">
      <div className="row-between row-wrap">
        <div className="stack-xs">
          <h3 className="card-title" style={{ margin: 0 }}>
            Live Quiz Prompt Studio
          </h3>
          <span className="small muted">
            Create an English or Arabic quiz round instantly (cloud AI when configured, offline fallback always ready).
          </span>
        </div>
      </div>

      <div className="row-wrap">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            className="chip"
            onClick={() => {
              sfx.playClick();
              setPrompt(p);
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <form onSubmit={handleGenerate} className="stack-sm">
        <div className="stack-xs">
          <label htmlFor="quiz-gen-prompt" className="field-label">
            Topic or Scenario Prompt
          </label>
          <input
            id="quiz-gen-prompt"
            type="text"
            className="field"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Job interview idioms, Medical café scenarios, ألغاز علمية..."
          />
        </div>

        <div className="grid-2">
          <div className="stack-xs">
            <label htmlFor="quiz-gen-cefr" className="field-label">
              CEFR Level
            </label>
            <select
              id="quiz-gen-cefr"
              className="field"
              value={cefr}
              onChange={(e) => setCefr(e.target.value)}
            >
              {CEFR_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
          <div className="stack-xs">
            <label htmlFor="quiz-gen-count" className="field-label">
              Questions
            </label>
            <select
              id="quiz-gen-count"
              className="field"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[4, 5, 6, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n} questions
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Building Quiz...' : '⚡ Generate Quiz Round'}
        </button>
      </form>

      {draft ? (
        <div className="card card-soft-primary stack-sm" style={{ padding: 14 }}>
          <div className="row-between row-wrap">
            <div>
              <strong>{draft.title}</strong>
              <div className="xs muted">
                {draft.questions.length} questions · {draft.cefrLevel} · {draft.source || 'OFFLINE'}
              </div>
            </div>
            <div className="row-wrap">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => void saveCustomQuiz(draft)}
              >
                Save to Library
              </button>
              {onStartNow ? (
                <button
                  type="button"
                  className="btn btn-mint btn-sm"
                  onClick={() => onStartNow(draft)}
                >
                  ▶ Play Now
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
