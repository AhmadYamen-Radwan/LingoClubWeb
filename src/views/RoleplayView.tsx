import React, { useMemo, useRef, useState } from 'react';
import { ActivityType, CefrLevel, RoleplayScenario, SpeechEvaluationResult } from '../types';
import { useApp } from '../context/AppContext';
import { ROLEPLAY_SCENARIOS } from '../data/curatedContent';
import { aiService } from '../services/aiService';
import { SpeechInputController, ttsSpeaker } from '../services/speechMedia';
import { CEFR_LEVELS } from '../utils/constants';
import { CefrBadge } from '../components/CefrBadge';
import { TranslatableText } from '../components/TranslatableText';

export const RoleplayView: React.FC = () => {
  const {
    profile,
    customRoleplays,
    saveCustomRoleplay,
    deleteCustomRoleplay,
    awardActivity,
    sfx,
    toast,
    triggerConfetti,
    navigate,
  } = useApp();

  const allScenarios = useMemo(
    () => [...customRoleplays, ...ROLEPLAY_SCENARIOS],
    [customRoleplays]
  );

  const [selectedId, setSelectedId] = useState(allScenarios[0]?.id || '');
  const [userRole, setUserRole] = useState<'A' | 'B'>('A');
  const [twistIdx, setTwistIdx] = useState(-1);

  // Generator form
  const [genTopic, setGenTopic] = useState('');
  const [genTone, setGenTone] = useState('Friendly');
  const [genLevel, setGenLevel] = useState<string>(profile.learningLevel || CefrLevel.B1);
  const [generating, setGenerating] = useState(false);

  // Voice Coach state
  const speechCtrlRef = useRef<SpeechInputController | null>(null);
  const [targetLine, setTargetLine] = useState('');
  const [spokenText, setSpokenText] = useState('');
  const [listening, setListening] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [evalResult, setEvalResult] = useState<SpeechEvaluationResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const scenario: RoleplayScenario | undefined =
    allScenarios.find((s) => s.id === selectedId) || allScenarios[0];
  const isCustom = customRoleplays.some((r) => r.id === scenario?.id);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTopic.trim()) {
      toast('Enter a roleplay scene topic first.', 'info');
      return;
    }
    setGenerating(true);
    try {
      const created = await aiService.generateRoleplay({
        topic: genTopic,
        cefrLevel: genLevel,
        tone: genTone,
      });
      await saveCustomRoleplay(created);
      sfx.playSuccess();
      setGenTopic('');
    } finally {
      setGenerating(false);
    }
  };

  const toggleMic = async () => {
    if (!speechCtrlRef.current) {
      speechCtrlRef.current = new SpeechInputController();
    }
    if (listening) {
      speechCtrlRef.current.stop();
      setListening(false);
      setMicLevel(0);
      return;
    }
    setListening(true);
    await speechCtrlRef.current.start({
      lang: 'en-US',
      existingText: spokenText,
      onTranscript: setSpokenText,
      onMicLevel: setMicLevel,
      onError: (msg) => toast(msg, 'error'),
      onEnd: () => {
        setListening(false);
        setMicLevel(0);
      },
    });
  };

  const handleEvaluateSpeech = async () => {
    const expected = targetLine || scenario?.lines[0]?.text || '';
    if (!expected) return;
    setEvaluating(true);
    try {
      const res = await aiService.evaluateSpeech({
        expected,
        spoken: spokenText,
        cefrLevel: scenario?.cefrLevel || profile.learningLevel,
      });
      setEvalResult(res);
      sfx.playReveal();
      if (res.score >= 70) {
        triggerConfetti();
      }
      await awardActivity({
        activityType: ActivityType.ROLEPLAY,
        title: `Roleplay Stage · ${scenario?.title || 'Speaking Practice'}`,
        cefrLevel: scenario?.cefrLevel || profile.learningLevel,
        score: Math.max(40, res.score),
        xpDelta: 35,
        accuracyPct: res.score,
        wordsPracticed: expected.split(/\s+/).length,
        roleplayCompleted: true,
      });
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="stack-lg" data-testid="roleplay-view">
      <div className="row-between row-wrap">
        <div className="stack-xs" style={{ gap: 2 }}>
          <h1 className="display-title" style={{ margin: 0 }}>
            🎙️ Roleplay Stage
          </h1>
          <span className="small muted">
            Perform A/B dialogues, trigger plot twists & practice with Speech Coach
          </span>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('home')}>
          ← Home
        </button>
      </div>

      {/* Scene Generator */}
      <form onSubmit={handleGenerate} className="card card-soft-primary stack-sm">
        <h2 className="card-title" style={{ margin: 0 }}>
          Generate Custom Roleplay Scene
        </h2>
        <div className="grid-2">
          <input
            type="text"
            className="field"
            value={genTopic}
            onChange={(e) => setGenTopic(e.target.value)}
            placeholder="Scene idea (e.g. Returning a hotel keycard)"
            aria-label="Roleplay scene topic"
          />
          <div className="row">
            <select
              className="field"
              value={genLevel}
              onChange={(e) => setGenLevel(e.target.value)}
              aria-label="Roleplay CEFR level"
            >
              {CEFR_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              className="field"
              value={genTone}
              onChange={(e) => setGenTone(e.target.value)}
              aria-label="Roleplay tone"
            >
              <option value="Friendly">Friendly</option>
              <option value="Funny">Funny</option>
              <option value="Detective">Mystery</option>
              <option value="Professional">Work</option>
            </select>
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={generating}>
          {generating ? 'Drafting Dialogue...' : '✨ Create Scene'}
        </button>
      </form>

      {/* Scenario Selector */}
      <div className="scroll-x">
        {allScenarios.map((sc) => (
          <button
            key={sc.id}
            type="button"
            className={`chip ${scenario?.id === sc.id ? 'selected' : ''}`}
            onClick={() => {
              sfx.playClick();
              setSelectedId(sc.id);
              setTwistIdx(-1);
              setTargetLine(sc.lines[0]?.text || '');
              setEvalResult(null);
            }}
          >
            {sc.title}
          </button>
        ))}
      </div>

      {scenario ? (
        <div className="stack-md">
          <section className="card stack-sm">
            <div className="row-between row-wrap">
              <div>
                <h2 className="card-title" style={{ margin: 0 }}>
                  {scenario.title}
                </h2>
                <span className="xs muted">{scenario.setting}</span>
              </div>
              <div className="row">
                <CefrBadge level={scenario.cefrLevel} />
                {isCustom ? (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => void deleteCustomRoleplay(scenario.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              Goal: {scenario.goal}
            </p>
            <div className="row-between row-wrap">
              <div className="row-wrap">
                <button
                  type="button"
                  className={`chip ${userRole === 'A' ? 'selected' : ''}`}
                  onClick={() => setUserRole('A')}
                >
                  Play Role A: {scenario.roleAName}
                </button>
                <button
                  type="button"
                  className={`chip ${userRole === 'B' ? 'selected' : ''}`}
                  onClick={() => setUserRole('B')}
                >
                  Play Role B: {scenario.roleBName}
                </button>
              </div>
              {scenario.plotTwists.length > 0 ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    sfx.playReveal();
                    setTwistIdx((i) => (i + 1) % scenario.plotTwists.length);
                  }}
                >
                  🎭 Plot Twist!
                </button>
              ) : null}
            </div>

            {twistIdx >= 0 && scenario.plotTwists[twistIdx] ? (
              <div className="card card-soft-amber small" style={{ fontWeight: 700 }}>
                {scenario.plotTwists[twistIdx]}
              </div>
            ) : null}
          </section>

          {/* Script Lines */}
          <div className="stack-sm">
            {scenario.lines.map((ln, idx) => {
              const isMine = ln.speakerRole === userRole;
              const speakerName = ln.speakerRole === 'A' ? scenario.roleAName : scenario.roleBName;
              return (
                <div
                  key={idx}
                  className={`card stack-xs ${isMine ? 'card-soft-primary' : ''}`}
                >
                  <div className="row-between">
                    <span className="xs muted" style={{ fontWeight: 800 }}>
                      {speakerName} {isMine ? '(Your Turn)' : ''}
                    </span>
                    <div className="row">
                      <button
                        type="button"
                        className="btn-icon"
                        aria-label={`Listen to ${speakerName} line`}
                        onClick={() => ttsSpeaker.speak(ln.text)}
                      >
                        🔊
                      </button>
                      <button
                        type="button"
                        className="chip"
                        onClick={() => {
                          setTargetLine(ln.text);
                          setEvalResult(null);
                          sfx.playClick();
                        }}
                      >
                        🎤 Practice Line
                      </button>
                    </div>
                  </div>
                  <TranslatableText text={ln.text} />
                  {ln.keyHint ? <span className="xs muted">Hint: {ln.keyHint}</span> : null}
                </div>
              );
            })}
          </div>

          {/* Speech Coaching Studio */}
          <section className="card stack-sm">
            <h3 className="card-title" style={{ margin: 0 }}>
              Speaking & Pronunciation Coach
            </h3>
            <p className="small muted" style={{ margin: 0 }}>
              Target line: &ldquo;{targetLine || scenario.lines[0]?.text}&rdquo;
            </p>
            <div className="mic-meter" aria-hidden="true">
              <div
                className="mic-meter-bar"
                style={{ width: `${Math.round(micLevel * 100)}%` }}
              />
            </div>
            <textarea
              className="field"
              value={spokenText}
              onChange={(e) => setSpokenText(e.target.value)}
              placeholder="Tap Start Microphone or type what you spoke to get accuracy coaching..."
              aria-label="Spoken transcript"
            />
            <div className="row-between row-wrap">
              <button
                type="button"
                className={`btn ${listening ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => void toggleMic()}
              >
                {listening ? '⏹ Stop Microphone' : '🎤 Start Microphone'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={evaluating}
                onClick={() => void handleEvaluateSpeech()}
              >
                {evaluating ? 'Scoring...' : 'Check Delivery (+35 XP)'}
              </button>
            </div>

            {evalResult ? (
              <div className="card card-soft-mint stack-xs">
                <div className="row-between">
                  <strong>Score: {evalResult.score}%</strong>
                  <span>{evalResult.summary}</span>
                </div>
                <span className="xs muted">{evalResult.clarityFeedback}</span>
                <span className="xs muted">Tip: {evalResult.practiceTip}</span>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
};
