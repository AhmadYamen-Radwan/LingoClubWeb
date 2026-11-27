// Team Chat, Teacher Hub & Cross-Tab Nearby Squad View
// (1:1 port of TeamChatScreen.kt with BroadcastChannel cross-tab sync replacing LAN TCP sockets)

import { CEFR_LEVELS, el } from '../models.js';
import { ttsSpeaker } from '../services/speech-media.js';
import { store } from '../store/app-store.js';
import { closeModal, createCefrBadge, openModal } from '../components/ui-shared.js';

function openCreateTeamModal() {
  const nameInput = el('input', { type: 'text', className: 'field', placeholder: 'Squad Name (e.g., B2 Night Owls)' });
  const mottoInput = el('input', { type: 'text', className: 'field', placeholder: 'Motto (e.g., Speak English every day!)' });
  const levelSel = el('select', { className: 'field' }, ...CEFR_LEVELS.map((l) => el('option', { value: l, selected: l === 'B1' }, l)));
  const colorSel = el('select', { className: 'field' }, ...['INDIGO', 'CORAL', 'AMBER', 'MINT', 'PURPLE'].map((c) => el('option', { value: c }, c)));
  const hubCheck = el('input', { type: 'checkbox' });

  openModal({
    title: '💬 Create New Team Squad',
    content: el(
      'div',
      { className: 'stack-md' },
      nameInput,
      mottoInput,
      el('div', { className: 'grid-2' }, levelSel, colorSel),
      store.isBootstrappedTutor || store.isOfflineMode
        ? el('label', { className: 'row small' }, hubCheck, 'Make this a Teacher Announcement Hub')
        : null,
      el(
        'button',
        {
          type: 'button',
          className: 'btn btn-primary btn-full',
          onClick: async () => {
            try {
              await store.createTeam({
                name: nameInput.value,
                cefrLevel: levelSel.value,
                motto: mottoInput.value,
                accentColor: colorSel.value,
                isTeacherHub: hubCheck.checked
              });
              closeModal();
            } catch (err) {
              store.toast(err.message, 'error');
            }
          }
        },
        'Create & Join Team'
      )
    )
  });
}

export function renderTeamChatView({ navigate }) {
  const teams = store.teams || [];
  const activeTeam = teams.find((t) => t.id === store.selectedTeamId) || teams[0];
  const msgs = store.chatMessages || [];
  const pinnedMsgs = msgs.filter((m) => m.pinned);
  const canModerate = store.isBootstrappedTutor || activeTeam?.leaderUid === store.currentUserId;
  const msgInput = el('input', { type: 'text', className: 'field flex-1', placeholder: 'Write an English message to the squad...', maxLength: 500 });
  const nearby = store.nearbySnapshot || { squads: [], hostingSquadId: null };
  const isHostingNearby = Boolean(nearby.hostingSquadId && activeTeam && nearby.hostingSquadId === activeTeam.id);

  const starters = ['Good morning team! ☀️', 'Anyone ready for a Quiz Clash?', 'How do you say this in Arabic?', 'Let\'s practice roleplay!'];

  const teamsSidebar = el(
    'div',
    { className: 'stack-sm' },
    el('div', { className: 'row-between' }, el('strong', {}, `Channels (${teams.length})`), el('button', { type: 'button', className: 'btn btn-soft', onClick: openCreateTeamModal }, '+ New')),
    ...teams.map((t) => {
      const selected = activeTeam?.id === t.id;
      const isMember = store.profile?.teamId === t.id;
      return el(
        'div',
        {
          className: `card stack-xs ${selected ? 'card-soft-primary' : ''}`,
          style: { padding: '12px', cursor: 'pointer' },
          onClick: () => store.selectTeam(t.id)
        },
        el('div', { className: 'row-between' }, el('strong', {}, `${t.channelKind === 'TEACHER_HUB' ? '🎓 ' : '💬 '}${t.name}`), createCefrBadge(t.cefrLevel || 'B1')),
        t.motto ? el('div', { className: 'xs muted' }, t.motto) : null,
        el('div', { className: 'row-between xs' },
          el('span', {}, `${t.memberCount || 1} members`),
          !isMember && t.channelKind !== 'TEACHER_HUB'
            ? el('button', { type: 'button', className: 'btn btn-outline', style: { minHeight: '34px', padding: '4px 10px', fontSize: '0.75rem' }, onClick: (e) => { e.stopPropagation(); store.joinTeam(t); } }, 'Join')
            : isMember ? el('span', { className: 'badge-pill card-soft-mint' }, 'Joined') : null
        )
      );
    }),

    // Nearby Cross-Tab Squad Panel
    el(
      'div',
      { className: 'card card-soft-amber stack-sm' },
      el('strong', {}, '📡 Nearby Cross-Tab Squad'),
      el('p', { className: 'xs', style: { margin: 0 } }, 'Broadcast your active team to other open browser tabs in this browser without internet!'),
      el(
        'button',
        {
          type: 'button',
          className: `btn ${isHostingNearby ? 'btn-danger-soft' : 'btn-primary'} btn-full`,
          onClick: () => (isHostingNearby ? store.stopNearbySquad() : store.hostNearbySquad())
        },
        isHostingNearby ? '⏹ Stop Broadcasting' : '📡 Host Nearby Squad'
      ),
      nearby.squads.length
        ? el(
            'div',
            { className: 'stack-xs' },
            el('div', { className: 'xs', style: { fontWeight: '700' } }, `Discovered Squads (${nearby.squads.length}):`),
            ...nearby.squads.map((sq) =>
              el(
                'div',
                { className: 'row-between small' },
                el('span', {}, `📶 ${sq.name} (${sq.leaderName})`),
                el('button', { type: 'button', className: 'btn btn-soft', style: { minHeight: '34px', padding: '4px 10px' }, onClick: () => store.joinNearbySquad(sq) }, 'Connect')
              )
            )
          )
        : null
    )
  );

  const chatPane = el(
    'div',
    { className: 'card stack-md' },
    activeTeam
      ? el(
          'div',
          { className: 'row-between' },
          el('div', { className: 'stack-xs' }, el('h2', { className: 'section-title' }, activeTeam.name), el('span', { className: 'xs muted' }, activeTeam.motto || 'Practice together in English')),
          createCefrBadge(activeTeam.cefrLevel || 'B1')
        )
      : el('div', { className: 'card-title' }, 'Select a Channel'),

    pinnedMsgs.length
      ? el(
          'div',
          { className: 'card card-soft-amber stack-xs', style: { padding: '10px 14px' } },
          el('div', { className: 'xs', style: { fontWeight: '800' } }, '📌 PINNED NOTICE'),
          el('div', { className: 'small' }, pinnedMsgs[0].text)
        )
      : null,

    el(
      'div',
      { className: 'chat-scroll', style: { background: 'var(--surface-variant)', borderRadius: 'var(--r-md)' } },
      msgs.length === 0
        ? el('p', { className: 'small muted', style: { textAlign: 'center', margin: '24px 0' } }, 'No messages yet. Tap a quick English starter below!')
        : msgs.map((m) => {
            const mine = m.senderUid === store.currentUserId;
            return el(
              'div',
              { className: `chat-bubble ${mine ? 'mine' : ''} ${m.pinned ? 'pinned' : ''}` },
              el(
                'div',
                { className: 'row-between', style: { gap: '12px' } },
                el('span', { className: 'xs', style: { fontWeight: '800' } }, `${m.senderRole === 'TEACHER' ? '🎓 ' : ''}${m.senderName}${m.senderTeamName ? ` · ${m.senderTeamName}` : ''}`),
                el(
                  'div',
                  { className: 'row', style: { gap: '2px' } },
                  el('button', { type: 'button', style: { background: 'none', border: 'none', cursor: 'pointer' }, title: 'Speak aloud', onClick: () => ttsSpeaker.speak(m.text) }, '🔊'),
                  canModerate ? el('button', { type: 'button', style: { background: 'none', border: 'none', cursor: 'pointer' }, title: m.pinned ? 'Unpin' : 'Pin', onClick: () => store.toggleTeamMessagePin(m.id, !m.pinned) }, m.pinned ? '📍' : '📌') : null,
                  (mine || store.isBootstrappedTutor) ? el('button', { type: 'button', style: { background: 'none', border: 'none', cursor: 'pointer' }, title: 'Delete', onClick: () => store.deleteTeamMessage(m.id) }, '🗑') : null
                )
              ),
              el('div', { className: 'small', style: { marginTop: '3px' } }, m.text)
            );
          })
    ),

    el(
      'div',
      { className: 'scroll-x' },
      ...starters.map((st) =>
        el('button', { type: 'button', className: 'chip', onClick: () => store.sendTeamMessage(st) }, st)
      )
    ),

    el(
      'form',
      {
        className: 'row',
        onSubmit: async (e) => {
          e.preventDefault();
          if (!msgInput.value.trim()) return;
          try {
            await store.sendTeamMessage(msgInput.value);
            msgInput.value = '';
          } catch (err) {
            store.toast(err.message, 'error');
          }
        }
      },
      msgInput,
      el('button', { type: 'submit', className: 'btn btn-primary' }, 'Send')
    )
  );

  return el(
    'div',
    { className: 'stack-lg' },
    el('div', { className: 'row-between' }, el('h1', { className: 'display-title' }, '💬 Team Chat & Squad'), el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home')),
    el('div', { className: 'split-pane' }, teamsSidebar, chatPane)
  );
}
