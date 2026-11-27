// Roleplay Stage View — AI/Offline Scene Generator, Script/Hints/Improv Modes, Speech-to-Text & Coach
// (1:1 port of RoleplaysScreen.kt)

import { ActivityType, CEFR_LEVELS, el } from '../models.js';
import { ROLEPLAY_SCENARIOS } from '../data/curated-content.js';
import { aiService } from '../services/ai-service.js';
import { SpeechInputController, ttsSpeaker } from '../services/speech-media.js';
import { store } from '../store/app-store.js';
import { closeModal, createCefrBadge, openModal, renderTranslatableText } from '../components/ui-shared.js';

let activeScenario = null;
let scriptMode = 'FULL'; // 'FULL' | 'HINTS' | 'IMPROV'
let myRole = 'A'; // 'A' | 'B'
let activeTwistIdx = -1;
let spokenText = '';
let isRecording = false;
let micError = '';
let feedbackResult = null;
let isEvaluating = false;
let speechCtrl = new SpeechInputController();

function openGenerateRoleplayModal() {
  const settingInput = el('input', { type: 'text', className: 'field', placeholder: 'e.g., Airport Customs, Job Interview, Tech Demo', value: 'Hotel Check-In Problem' });
  const levelSel = el('select', { className: 'field' }, ...CEFR_LEVELS.map((l) => el('option', { value: l, selected: l === (store.profile?.learningLevel || 'B1') }, l)));
  const toneSel = el('select', { className: 'field' }, ...['Friendly', 'Formal', 'Urgent', 'Humorous'].map((t) => el('option', { value: t }, t)));
  const btn = el(
    'button',
    {
      type: 'button',
      className: 'btn btn-primary btn-full',
      onClick: async () => {
        btn.disabled = true;
        btn.textContent = '✨ Writing Scene...';
        try {
          const scene = await aiService.generateRoleplay({
            setting: settingInput.value,
            cefrLevel: levelSel.value,
            tone: toneSel.value
          });
          await store.saveCustomRoleplay(scene);
          activeScenario = scene;
          spokenText = '';
          feedbackResult = null;
          activeTwistIdx = -1;
          closeModal();
          store.emit('change');
        } catch (err) {
          store.toast(err.message, 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = '✨ Create & Open Stage';
        }
      }
    },
    '✨ Create & Open Stage'
  );

  openModal({
    title: '🎭 Generate Roleplay Scene',
    subtitle: 'Creates a 6-turn dialogue with key phrases & plot twists',
    content: el(
      'div',
      { className: 'stack-md' },
      el('div', { className: 'stack-xs' }, el('label', { className: 'field-label' }, 'Setting / Situation'), settingInput),
      el('div', { className: 'grid-2' },
        el('div', { className: 'stack-xs' }, el('label', { className: 'field-label' }, 'CEFR Level'), levelSel),
        el('div', { className: 'stack-xs' }, el('label', { className: 'field-label' }, 'Tone'), toneSel)
      ),
      btn
    )
  });
}

export function renderRoleplayView({ navigate }) {
  const cefrFilter = store.selectedCefrFilter;

  if (activeScenario) {
    const sc = activeScenario;
    const myLines = (sc.lines || []).filter((l) => l.speakerRole === myRole);
    const targetScript = myLines.map((l) => l.text).join(' ');
    const targetPhrases = myLines.flatMap((l) => (l.highlights || []).map((h) => h.phrase));

    const transcriptInput = el('textarea', {
      className: 'field',
      placeholder: 'Tap Start Mic to speak your lines, or type/edit your spoken response here...',
      value: spokenText,
      onInput: (e) => { spokenText = e.target.value; }
    });

    const meterBar = el('div', { className: 'mic-meter-bar', id: 'rp-mic-bar' });

    const toggleMic = () => {
      if (isRecording) {
        speechCtrl.stop();
        isRecording = false;
        store.emit('change');
        return;
      }
      micError = '';
      isRecording = true;
      store.emit('change');
      speechCtrl.start({
        lang: 'en-US',
        existingText: spokenText,
        onTranscript: (txt) => {
          spokenText = txt;
          const area = document.getElementById('rp-transcript-area');
          if (area) area.value = txt;
        },
        onMicLevel: (lvl) => {
          const bar = document.getElementById('rp-mic-bar');
          if (bar) bar.style.width = `${Math.round(lvl * 100)}%`;
        },
        onError: (msg) => {
          micError = msg;
          isRecording = false;
          store.emit('change');
        },
        onEnd: () => {
          isRecording = false;
          store.emit('change');
        }
      });
    };
    transcriptInput.id = 'rp-transcript-area';

    return el(
      'div',
      { className: 'stack-lg' },
      el(
        'div',
        { className: 'row-between' },
        el('button', { type: 'button', className: 'btn btn-outline', onClick: () => { speechCtrl.stop(); isRecording = false; activeScenario = null; store.emit('change'); } }, '← Scenarios'),
        createCefrBadge(sc.cefrLevel || 'B1')
      ),

      el(
        'div',
        { className: 'card card-soft-primary stack-xs' },
        el('h2', { className: 'section-title' }, sc.title),
        el('div', { className: 'small' }, `📍 ${sc.setting}`),
        el('div', { className: 'small' }, `🎯 Goal: ${sc.goal}`)
      ),

      // Stage Controls
      el(
        'div',
        { className: 'card stack-sm' },
        el('div', { className: 'row-between', style: { flexWrap: 'wrap' } },
          el('div', { className: 'row-wrap' },
            ...[
              { id: 'FULL', label: 'Full Script' },
              { id: 'HINTS', label: 'Key Hints' },
              { id: 'IMPROV', label: 'Improv' }
            ].map((m) =>
              el('button', { type: 'button', className: `chip ${scriptMode === m.id ? 'selected' : ''}`, onClick: () => { scriptMode = m.id; store.emit('change'); } }, m.label)
            )
          ),
          el('div', { className: 'row-wrap' },
            el('button', { type: 'button', className: `chip ${myRole === 'A' ? 'selected' : ''}`, onClick: () => { myRole = 'A'; store.emit('change'); } }, `Role A: ${sc.roleAName}`),
            el('button', { type: 'button', className: `chip ${myRole === 'B' ? 'selected' : ''}`, onClick: () => { myRole = 'B'; store.emit('change'); } }, `Role B: ${sc.roleBName}`)
          )
        ),
        (sc.plotTwists || []).length
          ? el(
              'div',
              { className: 'stack-xs' },
              el('button', {
                type: 'button',
                className: 'btn btn-soft',
                onClick: () => {
                  activeTwistIdx = (activeTwistIdx + 1) % sc.plotTwists.length;
                  store.toast('Surprise Plot Twist dropped!');
                  store.emit('change');
                }
              }, '🎲 Drop Surprise Plot Twist'),
              activeTwistIdx >= 0
                ? el('div', { className: 'card card-soft-amber small' }, `⚡ ${sc.plotTwists[activeTwistIdx]}`)
                : null
            )
          : null
      ),

      // Dialogue Turns
      el(
        'div',
        { className: 'stack-sm' },
        ...(sc.lines || []).map((line) => {
          const isMine = line.speakerRole === myRole;
          const speakerLabel = line.speakerRole === 'A' ? sc.roleAName : sc.roleBName;
          return el(
            'div',
            { className: `card stack-xs ${isMine ? 'card-soft-primary' : ''}` },
            el(
              'div',
              { className: 'row-between' },
              el('strong', {}, `${speakerLabel}${isMine ? ' (You)' : ''}`),
              el('button', { type: 'button', className: 'btn-icon', ariaLabel: 'Listen to line', onClick: () => ttsSpeaker.speak(line.text) }, '🔊')
            ),
            scriptMode === 'FULL'
              ? el('p', { style: { margin: 0, lineHeight: 1.6 } }, renderTranslatableText(line.text, { cefrLevel: sc.cefrLevel }))
              : scriptMode === 'HINTS'
                ? el('p', { className: 'small', style: { margin: 0, fontStyle: 'italic' } }, `💡 Cue: ${line.keyHint || 'Respond in character'}`)
                : el('p', { className: 'small muted', style: { margin: 0 } }, '🎭 Improvise freely based on the scene goal!'),
            (line.highlights || []).length
              ? el(
                  'div',
                  { className: 'row-wrap' },
                  ...line.highlights.map((h) =>
                    el(
                      'button',
                      {
                        type: 'button',
                        className: 'chip',
                        onClick: () => openModal({
                          title: `✨ "${h.phrase}"`,
                          subtitle: 'Key Roleplay Expression',
                          content: el('div', { className: 'stack-sm' },
                            el('p', { style: { margin: 0 } }, h.meaning),
                            h.example ? el('div', { className: 'card card-soft-primary small' }, `Example: "${h.example}"`) : null,
                            el('button', { type: 'button', className: 'btn btn-primary', onClick: () => ttsSpeaker.speak(h.phrase) }, '🔊 Hear Phrase')
                          )
                        })
                      },
                      `✨ ${h.phrase}`
                    )
                  )
                )
              : null
          );
        })
      ),

      // Voice Practice & Speech Coach
      el(
        'div',
        { className: 'card stack-md' },
        el('div', { className: 'row-between' }, el('h3', { className: 'section-title' }, '🎙️ Voice Coach'), el('span', { className: 'xs muted' }, `Practicing Role ${myRole}`)),
        el('div', { className: 'mic-meter' }, meterBar),
        micError ? el('div', { className: 'card card-soft-secondary small' }, micError) : null,
        transcriptInput,
        el(
          'div',
          { className: 'row-wrap' },
          el(
            'button',
            {
              type: 'button',
              className: `btn flex-1 ${isRecording ? 'btn-secondary' : 'btn-primary'}`,
              onClick: toggleMic
            },
            isRecording ? '⏹ Stop Mic' : '🎙️ Start Mic'
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'btn btn-mint flex-1',
              disabled: isEvaluating,
              onClick: async () => {
                isEvaluating = true;
                store.emit('change');
                try {
                  feedbackResult = await aiService.evaluateRoleplaySpeech({
                    scenarioTitle: sc.title,
                    cefrLevel: sc.cefrLevel,
                    speakerRoleName: myRole === 'A' ? sc.roleAName : sc.roleBName,
                    targetScript,
                    spokenTranscript: spokenText,
                    targetPhrases
                  });
                  await store.awardActivityProgress({
                    xpDelta: 35,
                    activityType: ActivityType.ROLEPLAY,
                    title: `Roleplay: ${sc.title}`,
                    cefrLevel: sc.cefrLevel,
                    score: feedbackResult.score,
                    accuracyPct: feedbackResult.score,
                    wordsPracticed: targetScript.split(/\s+/).length,
                    durationMinutes: 4,
                    roleplayCompleted: true
                  });
                  store.confetti();
                } catch (err) {
                  store.toast(err.message, 'error');
                } finally {
                  isEvaluating = false;
                  store.emit('change');
                }
              }
            },
            isEvaluating ? 'Analyzing...' : '✨ Evaluate Speech'
          )
        ),
        feedbackResult
          ? el(
              'div',
              { className: 'card card-soft-mint stack-xs' },
              el('div', { className: 'row-between' }, el('strong', {}, 'Coach Score'), el('span', { className: 'display-title mono', style: { fontSize: '1.35rem' } }, `${feedbackResult.score}/100`)),
              el('p', { className: 'small', style: { margin: 0, fontWeight: '700' } }, feedbackResult.summary),
              el('p', { className: 'small', style: { margin: 0 } }, `Clarity: ${feedbackResult.clarityFeedback}`),
              el('p', { className: 'small', style: { margin: 0 } }, `Naturalness: ${feedbackResult.naturalnessFeedback}`),
              el('div', { className: 'small' }, el('strong', {}, 'Practice Tip: '), feedbackResult.practiceTip)
            )
          : null,
        el(
          'button',
          {
            type: 'button',
            className: 'btn btn-outline btn-full',
            onClick: async () => {
              await store.awardActivityProgress({
                xpDelta: 30,
                activityType: ActivityType.ROLEPLAY,
                title: `Roleplay Stage: ${sc.title}`,
                cefrLevel: sc.cefrLevel,
                score: 100,
                accuracyPct: 100,
                wordsPracticed: (sc.lines || []).length * 6,
                durationMinutes: 4,
                roleplayCompleted: true
              });
              store.confetti();
              store.toast('Roleplay complete! +30 XP');
            }
          },
          '✅ Complete Scene (+30 XP)'
        )
      )
    );
  }

  const clubRps = (store.clubContent || []).filter((c) => c.contentType === 'ROLEPLAY' && (!cefrFilter || c.cefrLevel === cefrFilter));
  const customRps = (store.customRoleplays || []).filter((r) => !cefrFilter || r.cefrLevel === cefrFilter);
  const curated = ROLEPLAY_SCENARIOS.filter((r) => !cefrFilter || r.cefrLevel === cefrFilter);

  const renderCard = (sc, { isCustom = false } = {}) =>
    el(
      'div',
      { className: 'card stack-sm' },
      el('div', { className: 'row-between' }, el('div', { className: 'card-title' }, sc.title), createCefrBadge(sc.cefrLevel || 'B1')),
      el('div', { className: 'small muted' }, `${sc.setting} · ${sc.roleAName} & ${sc.roleBName}`),
      el(
        'div',
        { className: 'row' },
        el('button', {
          type: 'button',
          className: 'btn btn-primary flex-1',
          onClick: () => {
            activeScenario = sc;
            spokenText = '';
            feedbackResult = null;
            activeTwistIdx = -1;
            store.emit('change');
          }
        }, 'Enter Stage →'),
        isCustom ? el('button', { type: 'button', className: 'btn btn-danger-soft', onClick: () => store.deleteCustomRoleplay(sc.id) }, '🗑') : null
      )
    );

  return el(
    'div',
    { className: 'stack-lg' },
    el('div', { className: 'row-between' }, el('h1', { className: 'display-title' }, '🎭 Roleplay Stage'), el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home')),
    el(
      'div',
      { className: 'hero-banner' },
      el('div', { className: 'hero-banner-media', style: { height: '132px' } },
        el('img', { src: './assets/img_roleplay_stage.jpg', alt: 'Roleplay Stage' }),
        el('div', { className: 'hero-banner-overlay' }),
        el('div', { style: { position: 'absolute', bottom: '12px', left: '16px' } },
          el('h2', { className: 'section-title', style: { color: '#FFFFFF' } }, 'Live Dialogue & Voice Coach'),
          el('p', { className: 'small', style: { margin: 0, color: 'rgba(255,255,255,0.9)' } }, 'Speak lines aloud, drop plot twists, and get instant feedback.')
        )
      )
    ),
    el('button', { type: 'button', className: 'btn btn-primary btn-full', onClick: openGenerateRoleplayModal }, '✨ Generate Custom Roleplay Scene'),
    customRps.length ? el('div', { className: 'stack-sm' }, el('h2', { className: 'section-title' }, '📁 My Generated Scenes'), el('div', { className: 'grid-2' }, ...customRps.map((r) => renderCard(r, { isCustom: true })))) : null,
    clubRps.length ? el('div', { className: 'stack-sm' }, el('h2', { className: 'section-title' }, '🎓 Official Club Scenes'), el('div', { className: 'grid-2' }, ...clubRps.map((r) => renderCard(r)))) : null,
    el('div', { className: 'stack-sm' }, el('h2', { className: 'section-title' }, `🎬 Curated Scenarios (${curated.length})`), el('div', { className: 'grid-2' }, ...curated.map((r) => renderCard(r))))
  );
}
