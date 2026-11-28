import React, { useMemo, useState } from 'react';
import { WeeklyWord } from '../types';
import { useApp } from '../context/AppContext';
import { WEEKLY_CURRICULUM } from '../data/weeklyCurriculum';
import { VOCAB_DOMAIN_LABELS } from '../utils/constants';
import { ttsSpeaker } from '../services/speechMedia';
import { CefrBadge } from '../components/CefrBadge';
import { TranslatableText } from '../components/TranslatableText';

export const CurriculumView: React.FC = () => {
  const {
    weeklyProgress,
    toggleWeeklyWordMastered,
    completeWeeklySession,
    recordWeeklyGamePlayed,
    awardActivity,
    sfx,
    toast,
    navigate,
  } = useApp();

  const [weekIdx, setWeekIdx] = useState(0);
  const [sessionNum, setSessionNum] = useState(1);
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [quickQuizIdx, setQuickQuizIdx] = useState<number | null>(null);
  const [quickScore, setQuickScore] = useState(0);

  const week = WEEKLY_CURRICULUM[weekIdx] || WEEKLY_CURRICULUM[0];
  const progress = weeklyProgress[String(week.weekNumber)] || {
    weekNumber: week.weekNumber,
    masteredWordIds: [],
    completedSessions: [],
    gamesPlayed: 0,
  };
  const masteredSet = useMemo(() => new Set(progress.masteredWordIds), [progress.masteredWordIds]);

  const activeSessionInfo =
    week.sessions.find((s) => s.sessionNumber === sessionNum) || week.sessions[0];

  const sessionWords = useMemo(
    () => week.words.filter((w) => w.sessionNumber === sessionNum),
    [sessionNum, week.words]
  );

  const domainsInSession = useMemo(() => {
    const set = new Set(sessionWords.map((w) => String(w.domain || 'EVERYDAY')));
    return ['ALL', ...Array.from(set)];
  }, [sessionWords]);

  const filteredWords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessionWords.filter((w) => {
      const domOk = domainFilter === 'ALL' || String(w.domain) === domainFilter;
      if (!domOk) return false;
      if (!q) return true;
      const wordText = String(w.word || w.english || '').toLowerCase();
      return (
        wordText.includes(q) ||
        w.arabic.includes(search.trim()) ||
        String(w.meaning || '').toLowerCase().includes(q)
      );
    });
  }, [domainFilter, search, sessionWords]);

  const weekMasteredCount = progress.masteredWordIds.length;
  const weekPct = Math.min(100, Math.round((weekMasteredCount / Math.max(1, week.words.length)) * 100));

  // Quick 5-word practice quiz derived from current session
  const practiceQuestions = useMemo(() => {
    const sample = sessionWords.slice(0, 8);
    return sample.slice(0, 5).map((w, idx) => {
      const label = String(w.word || w.english || '');
      const others = week.words
        .filter((x) => x.id !== w.id)
        .slice(idx * 2, idx * 2 + 3)
        .map((x) => x.arabic);
      const opts = [w.arabic, ...others].sort((a, b) => a.localeCompare(b));
      return { word: label, answer: w.arabic, opts };
    });
  }, [sessionWords, week.words]);

  return (
    <div className="stack-lg" data-testid="curriculum-view">
      <div className="row-between row-wrap">
        <div className="stack-xs" style={{ gap: 2 }}>
          <h1 className="display-title" style={{ margin: 0 }}>
            📅 200-Word Weekly Quest
          </h1>
          <span className="small muted">
            2 themed weeks · 400 English & Arabic words across 3 story rounds each
          </span>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('home')}>
          ← Home
        </button>
      </div>

      {/* Week selector + Progress bar */}
      <section className="card stack-sm">
        <div className="row-between row-wrap">
          <div className="row-wrap">
            {WEEKLY_CURRICULUM.map((wk, idx) => (
              <button
                key={wk.weekNumber}
                type="button"
                className={`chip ${idx === weekIdx ? 'selected' : ''}`}
                onClick={() => {
                  sfx.playClick();
                  setWeekIdx(idx);
                  setSessionNum(1);
                  setDomainFilter('ALL');
                  setQuickQuizIdx(null);
                }}
              >
                Week {wk.weekNumber}: {wk.title}
              </button>
            ))}
          </div>
          <span className="badge-pill card-soft-mint mono">
            {weekMasteredCount}/{week.words.length} Mastered ({weekPct}%)
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${weekPct}%` }} />
        </div>
      </section>

      {/* Session Tabs */}
      <div className="scroll-x">
        {week.sessions.map((sess) => {
          const done = progress.completedSessions.includes(sess.sessionNumber);
          return (
            <button
              key={sess.sessionNumber}
              type="button"
              className={`chip ${sessionNum === sess.sessionNumber ? 'selected' : ''}`}
              onClick={() => {
                sfx.playClick();
                setSessionNum(sess.sessionNumber);
                setDomainFilter('ALL');
                setQuickQuizIdx(null);
              }}
            >
              {done ? '✅ ' : ''}Session {sess.sessionNumber}: {sess.title}
            </button>
          );
        })}
      </div>

      {/* Session Story & Quick Practice Card */}
      {activeSessionInfo ? (
        <section className="card card-soft-primary stack-sm">
          <div className="row-between row-wrap">
            <div>
              <span className="xs muted">{activeSessionInfo.dayLabel || `Session ${sessionNum}`}</span>
              <h2 className="card-title" style={{ margin: 0 }}>
                {activeSessionInfo.storyTitle || activeSessionInfo.title}
              </h2>
            </div>
            <div className="row-wrap">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  sfx.playClick();
                  setQuickQuizIdx(0);
                  setQuickScore(0);
                }}
              >
                ⚡ Quick 5-Word Check
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  void completeWeeklySession(
                    week.weekNumber,
                    sessionNum,
                    sessionWords.map((w) => w.id)
                  )
                }
              >
                {progress.completedSessions.includes(sessionNum)
                  ? '✅ Session Completed'
                  : 'Complete Session (+80 XP)'}
              </button>
            </div>
          </div>

          {activeSessionInfo.storyOpening ? (
            <TranslatableText text={activeSessionInfo.storyOpening} />
          ) : null}
          {activeSessionInfo.storyParagraphs?.map((para, i) => (
            <TranslatableText key={i} text={para} />
          ))}
          {activeSessionInfo.teachingTip ? (
            <div className="card" style={{ padding: 10 }}>
              <span className="xs muted">PRO TIP · </span>
              <span className="small">{activeSessionInfo.teachingTip}</span>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Inline Quick 5-Word Check */}
      {quickQuizIdx !== null && practiceQuestions[quickQuizIdx] ? (
        <section className="card card-soft-amber stack-sm">
          <div className="row-between">
            <span className="badge-pill card-soft-primary">
              Quick Check {quickQuizIdx + 1}/{practiceQuestions.length}
            </span>
            <button type="button" className="chip" onClick={() => setQuickQuizIdx(null)}>
              Close
            </button>
          </div>
          <div className="display-title" style={{ fontSize: '1.35rem' }}>
            What does &ldquo;{practiceQuestions[quickQuizIdx].word}&rdquo; mean in Arabic?
          </div>
          <div className="grid-2" dir="rtl">
            {practiceQuestions[quickQuizIdx].opts.map((opt) => (
              <button
                key={opt}
                type="button"
                className="btn btn-outline arabic-text"
                onClick={() => {
                  const isRight = opt === practiceQuestions[quickQuizIdx].answer;
                  const nextScore = quickScore + (isRight ? 25 : 0);
                  if (isRight) {
                    sfx.playSuccess();
                    setQuickScore(nextScore);
                  } else {
                    sfx.playError();
                    toast(`Answer: ${practiceQuestions[quickQuizIdx].answer}`, 'error');
                  }
                  if (quickQuizIdx + 1 >= practiceQuestions.length) {
                    setQuickQuizIdx(null);
                    void recordWeeklyGamePlayed(week.weekNumber);
                    void awardActivity({
                      activityType: 'WEEKLY_SESSION',
                      title: `Week ${week.weekNumber} Quick Check`,
                      cefrLevel: week.cefrLevel || 'B1',
                      score: nextScore,
                      xpDelta: 35,
                      wordsPracticed: practiceQuestions.length,
                    });
                    sfx.playFanfare();
                    toast(`Quick check done! ${nextScore} pts`, 'info');
                  } else {
                    setQuickQuizIdx(quickQuizIdx + 1);
                  }
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Domain Filter & Word Search */}
      <div className="row-between row-wrap">
        <div className="scroll-x" style={{ flex: 1, minWidth: 0 }}>
          {domainsInSession.map((dom) => (
            <button
              key={dom}
              type="button"
              className={`chip ${domainFilter === dom ? 'selected' : ''}`}
              onClick={() => setDomainFilter(dom)}
            >
              {dom === 'ALL' ? `All (${sessionWords.length})` : VOCAB_DOMAIN_LABELS[dom] || dom}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="field"
          style={{ maxWidth: 260 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter session words..."
          aria-label="Filter session words"
        />
      </div>

      {/* Words Grid */}
      <div className="grid-2">
        {filteredWords.map((w: WeeklyWord) => {
          const term = String(w.word || w.english || '');
          const mastered = masteredSet.has(w.id);
          return (
            <div
              key={w.id}
              className={`card stack-xs ${mastered ? 'card-soft-mint' : ''}`}
            >
              <div className="row-between">
                <div className="row" style={{ gap: 6, minWidth: 0 }}>
                  <strong className="card-title" style={{ margin: 0 }}>
                    {term}
                  </strong>
                  {w.phonetic ? <span className="xs muted mono">{w.phonetic}</span> : null}
                </div>
                <div className="row" style={{ gap: 4 }}>
                  <CefrBadge level={w.cefrLevel || 'B1'} />
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label={`Pronounce ${term}`}
                    onClick={() => ttsSpeaker.speak(term)}
                  >
                    🔊
                  </button>
                  <button
                    type="button"
                    className={`chip ${mastered ? 'selected' : ''}`}
                    onClick={() => void toggleWeeklyWordMastered(week.weekNumber, w.id)}
                  >
                    {mastered ? '✓ Mastered' : 'Master'}
                  </button>
                </div>
              </div>
              <div className="small arabic-text" style={{ fontWeight: 700 }} dir="rtl">
                {w.arabic}
              </div>
              {w.storyLine || w.exampleSentence ? (
                <div className="xs muted">{w.storyLine || w.exampleSentence}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
