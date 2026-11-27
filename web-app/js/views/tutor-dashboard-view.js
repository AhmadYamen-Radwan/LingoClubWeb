// Tutor Dashboard & Student Progress Portal View (1:1 port of TutorDashboardScreen.kt)

import { CEFR_LEVELS, el } from '../models.js';
import { store } from '../store/app-store.js';
import { createCefrBadge } from '../components/ui-shared.js';

let portalTab = null; // 'ROSTER' | 'LINK'
let searchFilter = '';
let cefrFilter = 'ALL';
let selectedStudentUid = null;

export function renderTutorDashboardView({ navigate }) {
  const p = store.profile || {};
  if (!portalTab) {
    portalTab = store.isBootstrappedTutor ? 'ROSTER' : 'LINK';
  }

  const tutorInput = el('input', { type: 'text', className: 'field mono', placeholder: 'Paste Tutor UID Code...', value: p.tutorUid || '' });
  const tutorLabelInput = el('input', { type: 'text', className: 'field', placeholder: 'Tutor Display Name (e.g., Ms. Radwa)', value: p.tutorName || '' });

  const students = (store.studentsProgress || [])
    .filter((s) => (cefrFilter === 'ALL' ? true : s.learningLevel === cefrFilter))
    .filter((s) => !searchFilter.trim() || (s.studentName || '').toLowerCase().includes(searchFilter.trim().toLowerCase()));

  const selectedStudent = students.find((s) => s.studentUid === selectedStudentUid) || students[0] || null;
  const detailBundle = store.selectedStudentDetail?.studentUid === selectedStudent?.studentUid ? store.selectedStudentDetail : null;

  const avgXp = students.length ? Math.round(students.reduce((acc, s) => acc + (s.xp || 0), 0) / students.length) : 0;
  const totalWords = students.reduce((acc, s) => acc + (s.weeklyWordsMastered || 0), 0);

  return el(
    'div',
    { className: 'stack-lg' },
    el('div', { className: 'row-between' }, el('h1', { className: 'display-title' }, '🎓 Tutor Portal'), el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home')),

    el(
      'div',
      { className: 'row-wrap' },
      el('button', { type: 'button', className: `chip ${portalTab === 'ROSTER' ? 'selected' : ''}`, onClick: () => { portalTab = 'ROSTER'; store.emit('change'); } }, `📊 My Students (${students.length})`),
      el('button', { type: 'button', className: `chip ${portalTab === 'LINK' ? 'selected' : ''}`, onClick: () => { portalTab = 'LINK'; store.emit('change'); } }, '🔗 Link to My Tutor')
    ),

    portalTab === 'LINK'
      ? el(
          'div',
          { className: 'card stack-md' },
          el('h2', { className: 'section-title' }, 'Connect Your Progress to a Tutor'),
          el('p', { className: 'small muted', style: { margin: 0 } }, 'Enter your Tutor’s UID code so they can view your XP, mastered weekly words, streaks, and recent practice sessions.'),
          store.isOfflineMode
            ? el('div', { className: 'card card-soft-amber small' }, 'Sign in with Google from your Profile first to sync progress to an online Tutor.')
            : null,
          el('label', { className: 'field-label' }, 'Tutor UID Code'),
          tutorInput,
          el('label', { className: 'field-label' }, 'Tutor Label'),
          tutorLabelInput,
          el(
            'div',
            { className: 'row-wrap' },
            el('button', {
              type: 'button',
              className: 'btn btn-primary flex-1',
              onClick: async () => {
                try {
                  await store.connectToTutor(tutorInput.value, tutorLabelInput.value);
                } catch (err) {
                  store.toast(err.message, 'error');
                }
              }
            }, p.tutorUid ? 'Update & Sync Now' : '🔗 Connect to Tutor'),
            p.tutorUid
              ? el('button', { type: 'button', className: 'btn btn-mint', onClick: () => store.syncTutorNow() }, '↻ Sync Now')
              : null,
            p.tutorUid
              ? el('button', { type: 'button', className: 'btn btn-danger-soft', onClick: () => store.disconnectFromTutor() }, 'Disconnect')
              : null
          )
        )
      : el(
          'div',
          { className: 'stack-md' },
          // Tutor Share Code Card
          el(
            'div',
            { className: 'card card-soft-primary row-between', style: { flexWrap: 'wrap' } },
            el('div', { className: 'stack-xs' }, el('strong', {}, 'Your Tutor Code (share with students)'), el('div', { className: 'mono small' }, store.currentUserId)),
            el(
              'button',
              {
                type: 'button',
                className: 'btn btn-primary',
                onClick: () => {
                  navigator.clipboard?.writeText(store.currentUserId);
                  store.toast('Tutor Code copied!');
                }
              },
              '📋 Copy Code'
            )
          ),

          // 4 KPI Tiles
          el(
            'div',
            { className: 'grid-modes', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))' } },
            el('div', { className: 'card card-soft-mint', style: { textAlign: 'center', padding: '12px' } }, el('div', { className: 'card-title mono' }, String(students.length)), el('div', { className: 'xs' }, 'Students')),
            el('div', { className: 'card card-soft-primary', style: { textAlign: 'center', padding: '12px' } }, el('div', { className: 'card-title mono' }, String(avgXp)), el('div', { className: 'xs' }, 'Avg XP')),
            el('div', { className: 'card card-soft-amber', style: { textAlign: 'center', padding: '12px' } }, el('div', { className: 'card-title mono' }, String(totalWords)), el('div', { className: 'xs' }, 'Weekly Words')),
            el('div', { className: 'card card-soft-secondary', style: { textAlign: 'center', padding: '12px' } }, el('div', { className: 'card-title mono' }, String(students.filter((s) => (s.streak || 0) >= 2).length)), el('div', { className: 'xs' }, 'Active Streaks'))
          ),

          // Search + CEFR Filter
          el('input', { type: 'search', className: 'field', placeholder: 'Search student name...', value: searchFilter, onInput: (e) => { searchFilter = e.target.value; store.emit('change'); } }),
          el(
            'div',
            { className: 'scroll-x' },
            el('button', { type: 'button', className: `chip ${cefrFilter === 'ALL' ? 'selected' : ''}`, onClick: () => { cefrFilter = 'ALL'; store.emit('change'); } }, 'All'),
            ...CEFR_LEVELS.map((l) => el('button', { type: 'button', className: `chip ${cefrFilter === l ? 'selected' : ''}`, onClick: () => { cefrFilter = l; store.emit('change'); } }, l))
          ),

          students.length === 0
            ? el('div', { className: 'card small muted' }, store.isOfflineMode ? 'Sign in with Google to view live cloud student rosters.' : 'No students linked yet. Share your Tutor Code above!')
            : el(
                'div',
                { className: 'split-pane' },
                el(
                  'div',
                  { className: 'stack-sm' },
                  ...students.map((st) =>
                    el(
                      'div',
                      {
                        className: `card stack-xs ${selectedStudent?.studentUid === st.studentUid ? 'card-soft-primary' : ''}`,
                        style: { cursor: 'pointer', padding: '12px' },
                        onClick: () => {
                          selectedStudentUid = st.studentUid;
                          store.inspectStudentDetail(st.studentUid);
                          store.emit('change');
                        }
                      },
                      el('div', { className: 'row-between' }, el('strong', {}, st.studentName), createCefrBadge(st.learningLevel)),
                      el('div', { className: 'xs mono muted' }, `${st.xp} XP · ${st.weeklyWordsMastered} words · 🔥${st.streak}d`)
                    )
                  )
                ),
                selectedStudent
                  ? el(
                      'div',
                      { className: 'card stack-md' },
                      el('div', { className: 'row-between' }, el('h2', { className: 'section-title' }, selectedStudent.studentName), createCefrBadge(selectedStudent.learningLevel)),
                      el(
                        'div',
                        { className: 'grid-stats' },
                        el('div', { className: 'card card-soft-primary', style: { padding: '10px', textAlign: 'center' } }, el('strong', { className: 'mono' }, String(selectedStudent.xp || 0)), el('div', { className: 'xs' }, 'XP')),
                        el('div', { className: 'card card-soft-mint', style: { padding: '10px', textAlign: 'center' } }, el('strong', { className: 'mono' }, String(selectedStudent.weeklyWordsMastered || 0)), el('div', { className: 'xs' }, 'Words')),
                        el('div', { className: 'card card-soft-amber', style: { padding: '10px', textAlign: 'center' } }, el('strong', { className: 'mono' }, String(selectedStudent.bestLiveQuizScore || 0)), el('div', { className: 'xs' }, 'Best Quiz'))
                      ),
                      el('strong', {}, 'Recent Practice'),
                      ...(selectedStudent.recentActivities?.length
                        ? selectedStudent.recentActivities.map((act) =>
                            el('div', { className: 'row-between small' }, el('span', {}, act.title), el('span', { className: 'mono' }, `${act.score} pts`))
                          )
                        : [el('div', { className: 'small muted' }, 'No recent activities reported yet.')]),
                      detailBundle?.customDecks?.length
                        ? el('div', { className: 'small' }, el('strong', {}, `Custom Decks (${detailBundle.customDecks.length}): `), detailBundle.customDecks.map((d) => d.title).join(', '))
                        : null
                    )
                  : null
              )
        )
  );
}
