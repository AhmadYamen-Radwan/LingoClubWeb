// Gemini Live Quiz Generator UI Component
// Allows inputting a topic + comma-separated keywords, generating questions & distractors via Gemini API (or smart fallback),
// previewing the questions, exporting CSV, saving, or launching straight into a Live PIN Session.

import { CEFR_LABELS, CEFR_LEVELS, DIFFICULTY_CONFIG, DIFFICULTY_LEVELS, clearEl, el } from '../models.js';
import { aiService } from '../services/ai-service.js';
import { audioService } from '../services/audio-service.js';
import { downloadQuizCsv } from '../services/csv-quiz.js';
import { store } from '../store/app-store.js';
import { createCefrBadge, openAiKeyModal } from './ui-shared.js';

const KEYWORD_SUGGESTIONS = [
  { topic: 'Space Exploration', keywords: 'orbit, black hole, Mars rover, supernova, gravity' },
  { topic: 'Crime Scene Forensics', keywords: 'alibi, DNA fingerprint, suspect, detective, motive' },
  { topic: 'حقائق الفضاء والعلوم', keywords: 'مجرة، كوكب، جاذبية، ثقب أسود، نيازك' },
  { topic: 'ألغاز الجرائم والتحقيق', keywords: 'بصمات، شاهد، متهم، دليل جنائي، مسرح الجريمة' },
  { topic: 'Everyday English Idioms', keywords: 'break the ice, piece of cake, hit the sack, under the weather' }
];

let localGenState = {
  topic: '',
  keywords: '',
  cefrLevel: 'B1',
  difficulty: 'MEDIUM',
  questionCount: 8,
  quizMode: 'AUTO',
  generating: false,
  statusText: '',
  draft: null,
  expanded: true
};

export function createLiveQuizGeneratorComponent({ onStartSoloBlitz } = {}) {
  const container = el('div', { id: 'live-quiz-generator-card', className: 'card card-soft-primary stack-md' });

  const topicInput = el('input', {
    id: 'lqg-topic-input',
    type: 'text',
    className: 'field',
    placeholder: 'Quiz Topic (e.g., Space Exploration, World Capitals, ألغاز الجرائم...)',
    value: localGenState.topic,
    onInput: (e) => {
      localGenState.topic = e.target.value;
    }
  });

  const keywordsInput = el('input', {
    id: 'lqg-keywords-input',
    type: 'text',
    className: 'field',
    placeholder: 'Keywords (comma-separated, e.g., supernova, rover, gravity, orbit)',
    value: localGenState.keywords,
    onInput: (e) => {
      localGenState.keywords = e.target.value;
    }
  });

  const countSelect = el(
    'select',
    {
      className: 'field',
      onChange: (e) => {
        localGenState.questionCount = Number(e.target.value) || 8;
      }
    },
    ...[5, 8, 10, 15, 20, 30].map((n) =>
      el('option', { value: String(n), selected: n === localGenState.questionCount }, `${n} Questions`)
    )
  );

  const cefrSelect = el(
    'select',
    {
      className: 'field',
      onChange: (e) => {
        localGenState.cefrLevel = e.target.value;
      }
    },
    ...CEFR_LEVELS.map((l) =>
      el('option', { value: l, selected: l === (localGenState.cefrLevel || store.profile?.learningLevel || 'B1') }, CEFR_LABELS[l] || l)
    )
  );

  const diffSelect = el(
    'select',
    {
      className: 'field',
      onChange: (e) => {
        localGenState.difficulty = e.target.value;
      }
    },
    ...DIFFICULTY_LEVELS.map((d) =>
      el('option', { value: d, selected: d === (localGenState.difficulty || store.selectedDifficulty || 'MEDIUM') }, DIFFICULTY_CONFIG[d].label)
    )
  );

  const modeSelect = el(
    'select',
    {
      className: 'field',
      onChange: (e) => {
        localGenState.quizMode = e.target.value;
      }
    },
    el('option', { value: 'AUTO', selected: localGenState.quizMode === 'AUTO' }, 'Auto (Match Topic)'),
    el('option', { value: 'GENERAL', selected: localGenState.quizMode === 'GENERAL' }, 'General Trivia & Facts'),
    el('option', { value: 'VOCAB', selected: localGenState.quizMode === 'VOCAB' }, 'Bilingual Vocab'),
    el('option', { value: 'ARABIC', selected: localGenState.quizMode === 'ARABIC' }, '🇸🇦 Arabic (العربية)')
  );

  const previewHost = el('div', { className: 'stack-sm' });
  const statusEl = el('div', { className: `xs ${localGenState.statusText ? '' : 'hidden'}`, style: { fontWeight: '700' } }, localGenState.statusText);

  const renderPreview = () => {
    clearEl(previewHost);
    const draft = localGenState.draft;
    if (!draft || !Array.isArray(draft.questions) || !draft.questions.length) return;
    const isAr = draft.language === 'AR' || /[\u0600-\u06FF]/.test(draft.title);

    previewHost.appendChild(
      el(
        'div',
        { className: 'card stack-sm', style: { background: 'var(--surface)' } },
        el(
          'div',
          { className: 'row-between', style: { flexWrap: 'wrap', gap: '8px' } },
          el(
            'div',
            { className: 'stack-xs flex-1' },
            el('div', { className: `card-title ${isAr ? 'arabic-text' : ''}`, dir: isAr ? 'rtl' : 'ltr' }, draft.title),
            el(
              'div',
              { className: 'row-wrap' },
              el('span', { className: `badge-pill ${draft.source === 'GEMINI' ? 'card-soft-mint' : 'card-soft-amber'}` }, draft.source === 'GEMINI' ? '✨ Gemini Live' : '⚡ Smart Engine'),
              createCefrBadge(draft.cefrLevel || 'B1'),
              el('span', { className: 'xs muted' }, `${draft.questions.length} Qs w/ 4 distractors each`)
            )
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn-ghost small',
              onClick: () => {
                localGenState.draft = null;
                renderPreview();
              }
            },
            '✕ Clear'
          )
        ),

        // Compact Question + Distractor Preview (first 3 shown, plus expandable badge)
        el(
          'div',
          { className: 'stack-xs', style: { maxHeight: '220px', overflowY: 'auto' } },
          ...draft.questions.map((q, idx) => {
            const qRtl = /[\u0600-\u06FF]/.test(q.prompt);
            return el(
              'div',
              { className: 'card stack-xs', style: { padding: '10px 12px', background: 'var(--surface-variant)' } },
              el('div', { className: `small ${qRtl ? 'arabic-text' : ''}`, style: { fontWeight: '700' }, dir: qRtl ? 'rtl' : 'ltr' }, `${idx + 1}. ${q.prompt}`),
              el(
                'div',
                { className: 'row-wrap' },
                ...(q.options || []).map((opt, oi) =>
                  el(
                    'span',
                    {
                      className: `badge-pill ${oi === Number(q.correctIndex) ? 'card-soft-mint' : ''}`,
                      style: oi === Number(q.correctIndex) ? {} : { background: 'var(--surface)', color: 'var(--muted)' }
                    },
                    `${oi === Number(q.correctIndex) ? '✓ ' : ''}${opt}`
                  )
                )
              )
            );
          })
        ),

        // Launch & Save Action Row
        el(
          'div',
          { className: 'row-wrap' },
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn-mint flex-1',
              onClick: async () => {
                try {
                  audioService.playTransition();
                  await store.hostQuizRoom({
                    quizTitle: draft.title,
                    cefrLevel: draft.cefrLevel || 'B1',
                    questions: draft.questions
                  });
                } catch (err) {
                  store.toast(err.message, 'error');
                }
              }
            },
            '🎙️ Launch Live PIN Session'
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn-primary flex-1',
              onClick: () => {
                audioService.playClick();
                onStartSoloBlitz?.({
                  title: draft.title,
                  cefrLevel: draft.cefrLevel,
                  questions: draft.questions,
                  difficulty: localGenState.difficulty
                });
              }
            },
            '⚡ Play Solo Blitz'
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn-outline',
              onClick: async () => {
                await store.saveCustomQuiz(draft);
              }
            },
            '💾 Save'
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn-outline',
              onClick: () => {
                downloadQuizCsv(draft);
                store.toast('Exported Kahoot CSV file!');
              }
            },
            '📥 CSV'
          )
        )
      )
    );
  };

  const genBtn = el(
    'button',
    {
      id: 'lqg-generate-btn',
      type: 'button',
      className: 'btn btn-primary btn-full',
      disabled: localGenState.generating,
      onClick: async () => {
        const topic = topicInput.value.trim();
        const keywords = keywordsInput.value.trim();
        if (!topic && !keywords) {
          store.toast('Enter a topic or keywords to generate questions.', 'error');
          topicInput.focus();
          return;
        }
        localGenState.generating = true;
        genBtn.disabled = true;
        genBtn.textContent = '⏳ Generating Questions & Distractors...';
        statusEl.classList.remove('hidden');
        statusEl.textContent = 'Asking Gemini / Smart Quiz Engine...';

        try {
          const keywordArr = keywords
            .split(/[,،;|]+/)
            .map((k) => k.trim())
            .filter(Boolean);

          const draft = await aiService.generateQuizDraft({
            topic: topic || keywordArr.slice(0, 3).join(', '),
            keywords,
            focusWords: keywordArr,
            cefrLevel: cefrSelect.value,
            difficulty: diffSelect.value,
            questionCount: Number(countSelect.value) || 8,
            quizMode: modeSelect.value,
            customPrompt: keywords ? `Focus tightly on these keywords and generate plausible distractors: ${keywords}` : '',
            freshSet: true,
            onProgress: (msg) => {
              statusEl.textContent = msg;
            }
          });
          localGenState.draft = draft;
          localGenState.statusText = `Ready! ${draft.questions.length} questions generated (${draft.source === 'GEMINI' ? 'Gemini AI' : 'Smart Offline Engine'}).`;
          statusEl.textContent = localGenState.statusText;
          audioService.playCorrect();
          renderPreview();
        } catch (err) {
          localGenState.statusText = err?.message || 'Generation failed.';
          statusEl.textContent = localGenState.statusText;
          store.toast(localGenState.statusText, 'error');
        } finally {
          localGenState.generating = false;
          genBtn.disabled = false;
          genBtn.textContent = '✨ Generate Questions & Distractors for Live Session';
        }
      }
    },
    '✨ Generate Questions & Distractors for Live Session'
  );

  const bodyWrap = el(
    'div',
    { className: `stack-sm ${localGenState.expanded ? '' : 'hidden'}` },
    el(
      'div',
      { className: 'scroll-x' },
      ...KEYWORD_SUGGESTIONS.map((s) =>
        el(
          'button',
          {
            type: 'button',
            className: 'chip',
            onClick: () => {
              topicInput.value = s.topic;
              keywordsInput.value = s.keywords;
              localGenState.topic = s.topic;
              localGenState.keywords = s.keywords;
              if (/[\u0600-\u06FF]/.test(s.topic)) {
                modeSelect.value = 'ARABIC';
                localGenState.quizMode = 'ARABIC';
              }
            }
          },
          `💡 ${s.topic}`
        )
      )
    ),
    el('div', { className: 'grid-2' }, topicInput, keywordsInput),
    el(
      'div',
      { className: 'grid-2' },
      el('div', { className: 'grid-2' }, countSelect, cefrSelect),
      el('div', { className: 'grid-2' }, diffSelect, modeSelect)
    ),
    genBtn,
    statusEl,
    previewHost
  );

  renderPreview();

  const toggleBtn = el(
    'button',
    {
      type: 'button',
      className: 'btn btn-outline small',
      onClick: () => {
        localGenState.expanded = !localGenState.expanded;
        bodyWrap.classList.toggle('hidden', !localGenState.expanded);
        toggleBtn.textContent = localGenState.expanded ? 'Hide ▲' : 'Open ▼';
      }
    },
    localGenState.expanded ? 'Hide ▲' : 'Open ▼'
  );

  container.append(
    el(
      'div',
      { className: 'row-between', style: { flexWrap: 'wrap', gap: '8px' } },
      el(
        'div',
        { className: 'stack-xs flex-1' },
        el('div', { className: 'section-title' }, '🤖 Gemini Live Quiz & Distractor Generator'),
        el('p', { className: 'xs muted', style: { margin: 0 } }, 'Input any topic + keywords to generate Kahoot-ready questions & distractors for a Live PIN room.')
      ),
      el(
        'div',
        { className: 'row', style: { gap: '6px' } },
        el('button', { type: 'button', className: 'btn btn-soft small', onClick: openAiKeyModal }, '🔑 Gemini Key'),
        toggleBtn
      )
    ),
    bodyWrap
  );

  return container;
}
