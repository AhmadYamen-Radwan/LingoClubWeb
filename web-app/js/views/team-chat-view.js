// Clubs & Squad Chat View (Clubs, Teams, Cross-Tab Nearby Squad, Stickers & Desktop Split Pane)

import { CEFR_LABELS, CEFR_LEVELS, clearEl, el } from '../models.js';
import { ttsSpeaker } from '../services/speech-media.js';
import { store } from '../store/app-store.js';
import { closeModal, createCefrBadge, openModal } from '../components/ui-shared.js';
import { createStickerBubbleNode, createStickerTray, parseStickerMessage } from '../components/stickers.js';

let chatDraft = '';
let stickerDrawerOpen = false;

function openCreateTeamModal() {
  const nameInput = el('input', { type: 'text', className: 'field', placeholder: 'Name (e.g., B2 Night Owls or Debate Club)' });
  const mottoInput = el('input', { type: 'text', className: 'field', placeholder: 'Motto (e.g., Speak English every day!)' });
  const levelSel = el(
    'select',
    { className: 'field' },
    ...CEFR_LEVELS.map((l) => el('option', { value: l, selected: l === (store.profile?.learningLevel || 'B1') }, CEFR_LABELS[l] || l))
  );
  const colorSel = el('select', { className: 'field' }, ...['INDIGO', 'CORAL', 'AMBER', 'MINT', 'PURPLE'].map((c) => el('option', { value: c }, c)));
  const kindSel = el(
    'select',
    { className: 'field' },
    el('option', { value: 'TEAM' }, '🛡️ Team Squad (Battle & Chat)'),
    el('option', { value: 'CLUB' }, '🏛️ Open Club (Topic Lounge)')
  );

  openModal({
    title: '💬 Create Team or Club',
    content: el(
      'div',
      { className: 'stack-md' },
      nameInput,
      mottoInput,
      el('div', { className: 'grid-2' }, levelSel, colorSel),
      el('div', { className: 'stack-xs' }, el('label', { className: 'field-label' }, 'Channel Type'), kindSel),
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
                kind: kindSel.value
              });
              closeModal();
            } catch (err) {
              store.toast(err.message, 'error');
            }
          }
        },
        'Create & Join Channel'
      )
    )
  });
}

function buildSidebarNodes(activeTeam) {
  const teams = store.teams || [];
  const nearby = store.nearbySnapshot || { squads: [], hostingSquadId: null };
  const isHostingNearby = Boolean(nearby.hostingSquadId && activeTeam && nearby.hostingSquadId === activeTeam.id);

  return [
    el('div', { className: 'row-between' }, el('strong', {}, `Clubs & Teams (${teams.length})`), el('button', { type: 'button', className: 'btn btn-soft', onClick: openCreateTeamModal }, '+ New')),
    ...teams.map((t) => {
      const selected = activeTeam?.id === t.id;
      const isMember = store.profile?.teamId === t.id;
      const isClub = t.channelKind === 'CLUB';
      return el(
        'div',
        {
          className: `card stack-xs ${selected ? 'card-soft-primary' : ''}`,
          style: { padding: '12px', cursor: 'pointer' },
          onClick: () => store.selectTeam(t.id)
        },
        el(
          'div',
          { className: 'row-between', style: { gap: '8px' } },
          el('strong', { style: { overflowWrap: 'anywhere' } }, `${isClub ? '🏛️ ' : '💬 '}${t.name}`),
          createCefrBadge(t.cefrLevel || 'B1')
        ),
        t.motto ? el('div', { className: 'xs muted' }, t.motto) : null,
        el(
          'div',
          { className: 'row-between xs', style: { gap: '6px' } },
          el('span', {}, `${t.memberCount || 1} members · ${isClub ? 'Club' : 'Team'}`),
          !isMember
            ? el(
                'button',
                {
                  type: 'button',
                  className: 'btn btn-outline',
                  style: { minHeight: '34px', padding: '4px 10px', fontSize: '0.75rem' },
                  onClick: (e) => {
                    e.stopPropagation();
                    store.joinTeam(t);
                  }
                },
                'Join'
              )
            : el(
                'div',
                { className: 'row', style: { gap: '4px' } },
                el('span', { className: 'badge-pill card-soft-mint' }, 'Joined'),
                el(
                  'button',
                  {
                    type: 'button',
                    className: 'btn btn-danger-soft',
                    style: { minHeight: '32px', padding: '4px 8px', fontSize: '0.72rem' },
                    title: isClub ? 'Leave this club' : 'Leave this team',
                    onClick: (e) => {
                      e.stopPropagation();
                      store.leaveTeam(t);
                    }
                  },
                  '🚪 Leave'
                )
              )
        )
      );
    }),

    el(
      'div',
      { className: 'card card-soft-amber stack-sm' },
      el('strong', {}, '📡 Nearby Cross-Tab Squad'),
      el('p', { className: 'xs', style: { margin: 0 } }, 'Broadcast your active team or club to other open browser tabs in this browser without internet!'),
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
  ];
}

function buildHeaderNode(activeTeam) {
  if (!activeTeam) {
    return el('div', { className: 'card-title' }, 'Select a Channel');
  }
  const isMember = store.profile?.teamId === activeTeam.id;
  const isClub = activeTeam.channelKind === 'CLUB';
  return el(
    'div',
    { className: 'row-between', style: { flexWrap: 'wrap', gap: '8px' } },
    el(
      'div',
      { className: 'stack-xs' },
      el('h2', { className: 'section-title' }, `${isClub ? '🏛️ ' : '🛡️ '}${activeTeam.name}`),
      el('span', { className: 'xs muted' }, activeTeam.motto || 'Practice together in English & Arabic')
    ),
    el(
      'div',
      { className: 'row', style: { gap: '6px' } },
      createCefrBadge(activeTeam.cefrLevel || 'B1'),
      isMember
        ? el(
            'button',
            {
              type: 'button',
              className: 'btn btn-danger-soft',
              style: { minHeight: '36px', padding: '4px 12px', fontSize: '0.8rem' },
              onClick: () => store.leaveTeam(activeTeam)
            },
            isClub ? '🚪 Leave Club' : '🚪 Leave Team'
          )
        : el(
            'button',
            {
              type: 'button',
              className: 'btn btn-outline',
              style: { minHeight: '36px', padding: '4px 12px', fontSize: '0.8rem' },
              onClick: () => store.joinTeam(activeTeam)
            },
            isClub ? 'Join Club' : 'Join Team'
          )
    )
  );
}

function buildPinnedNode(pinnedMsgs) {
  if (!pinnedMsgs.length) return null;
  const parsed = parseStickerMessage(pinnedMsgs[0].text);
  return el(
    'div',
    { className: 'card card-soft-amber stack-xs', style: { padding: '10px 14px' } },
    el('div', { className: 'xs', style: { fontWeight: '800' } }, '📌 PINNED NOTICE'),
    el('div', { className: 'small' }, parsed ? `${parsed.emoji} ${parsed.label}` : pinnedMsgs[0].text)
  );
}

function buildMessagesNodes(msgs, canModerate) {
  if (!msgs.length) {
    return [el('p', { className: 'small muted', style: { textAlign: 'center', margin: '24px 0' } }, 'No messages yet. Tap a starter or send an animated sticker below!')];
  }
  return msgs.map((m) => {
    const mine = m.senderUid === store.currentUserId;
    const sticker = parseStickerMessage(m.text);
    const isRtl = !sticker && /[\u0600-\u06FF]/.test(m.text || '');
    return el(
      'div',
      { className: `chat-bubble ${mine ? 'mine' : ''} ${m.pinned ? 'pinned' : ''}` },
      el(
        'div',
        { className: 'row-between', style: { gap: '12px' } },
        el('span', { className: 'xs', style: { fontWeight: '800' } }, `${m.senderName}${m.senderTeamName ? ` · ${m.senderTeamName}` : ''}`),
        el(
          'div',
          { className: 'row', style: { gap: '2px' } },
          el(
            'button',
            {
              type: 'button',
              style: { background: 'none', border: 'none', cursor: 'pointer', minWidth: '32px', minHeight: '32px' },
              title: 'Speak aloud',
              onClick: () => ttsSpeaker.speak(sticker ? sticker.label : m.text)
            },
            '🔊'
          ),
          canModerate
            ? el('button', { type: 'button', style: { background: 'none', border: 'none', cursor: 'pointer', minWidth: '32px', minHeight: '32px' }, title: m.pinned ? 'Unpin' : 'Pin', onClick: () => store.toggleTeamMessagePin(m.id, !m.pinned) }, m.pinned ? '📍' : '📌')
            : null,
          mine
            ? el('button', { type: 'button', style: { background: 'none', border: 'none', cursor: 'pointer', minWidth: '32px', minHeight: '32px' }, title: 'Delete', onClick: () => store.deleteTeamMessage(m.id) }, '🗑')
            : null
        )
      ),
      sticker
        ? createStickerBubbleNode(sticker)
        : el('div', { className: `small ${isRtl ? 'arabic-text' : ''}`, style: { marginTop: '3px' } }, m.text)
    );
  });
}

export function patchTeamChatView() {
  const shell = document.getElementById('team-chat-shell');
  if (!shell) return false;

  const teams = store.teams || [];
  const activeTeam = teams.find((t) => t.id === store.selectedTeamId) || teams[0];
  const msgs = store.chatMessages || [];
  const pinnedMsgs = msgs.filter((m) => m.pinned);
  const canModerate = activeTeam?.leaderUid === store.currentUserId;

  const sidebar = document.getElementById('team-chat-sidebar');
  if (sidebar) {
    clearEl(sidebar);
    buildSidebarNodes(activeTeam).forEach((n) => n && sidebar.appendChild(n));
  }

  const header = document.getElementById('team-chat-header');
  if (header) {
    clearEl(header);
    const h = buildHeaderNode(activeTeam);
    if (h) header.appendChild(h);
  }

  const pinned = document.getElementById('team-chat-pinned');
  if (pinned) {
    clearEl(pinned);
    const pNode = buildPinnedNode(pinnedMsgs);
    if (pNode) pinned.appendChild(pNode);
  }

  const msgsBox = document.getElementById('team-chat-messages-box');
  if (msgsBox) {
    const prevCount = Number(msgsBox.dataset.count || '0');
    clearEl(msgsBox);
    buildMessagesNodes(msgs, canModerate).forEach((n) => n && msgsBox.appendChild(n));
    msgsBox.dataset.count = String(msgs.length);
    if (msgs.length !== prevCount) {
      msgsBox.scrollTop = msgsBox.scrollHeight;
    }
  }

  const input = document.getElementById('team-chat-msg-input');
  if (input && input.value !== chatDraft) {
    input.value = chatDraft;
  }

  return true;
}

export function renderTeamChatView({ navigate }) {
  const teams = store.teams || [];
  const activeTeam = teams.find((t) => t.id === store.selectedTeamId) || teams[0];
  const msgs = store.chatMessages || [];
  const pinnedMsgs = msgs.filter((m) => m.pinned);
  const canModerate = activeTeam?.leaderUid === store.currentUserId;

  const msgInput = el('input', {
    id: 'team-chat-msg-input',
    type: 'text',
    className: 'field flex-1',
    placeholder: 'Write an English or Arabic message to the squad...',
    maxLength: 500,
    value: chatDraft,
    autocomplete: 'off',
    onInput: (e) => {
      chatDraft = e.target.value;
    }
  });

  const starters = ['Good morning team! ☀️', 'Anyone ready for a Quiz Clash?', 'مرحباً بالفريق! هل أنتم مستعدون؟', "Let's practice roleplay!"];

  const teamsSidebar = el('div', { id: 'team-chat-sidebar', className: 'stack-sm' }, ...buildSidebarNodes(activeTeam));
  const headerContainer = el('div', { id: 'team-chat-header' }, buildHeaderNode(activeTeam));
  const pinnedContainer = el('div', { id: 'team-chat-pinned' }, buildPinnedNode(pinnedMsgs));
  const messagesBox = el(
    'div',
    {
      id: 'team-chat-messages-box',
      className: 'chat-scroll',
      dataset: { count: String(msgs.length) },
      style: { background: 'var(--surface-variant)', borderRadius: 'var(--r-md)' }
    },
    ...buildMessagesNodes(msgs, canModerate)
  );

  const stickerDrawerHost = el('div', { className: stickerDrawerOpen ? '' : 'hidden' });
  const renderStickerDrawer = () => {
    clearEl(stickerDrawerHost);
    if (!stickerDrawerOpen) {
      stickerDrawerHost.classList.add('hidden');
      return;
    }
    stickerDrawerHost.classList.remove('hidden');
    stickerDrawerHost.appendChild(
      createStickerTray({
        onSelect: async (encoded) => {
          await store.sendTeamMessage(encoded);
        }
      })
    );
  };
  renderStickerDrawer();

  setTimeout(() => {
    const box = document.getElementById('team-chat-messages-box');
    if (box) box.scrollTop = box.scrollHeight;
  }, 0);

  const sendMessage = async () => {
    const text = (msgInput.value || '').trim();
    if (!text) return;
    msgInput.value = '';
    chatDraft = '';
    try {
      await store.sendTeamMessage(text);
    } catch (err) {
      chatDraft = text;
      msgInput.value = text;
      store.toast(err.message, 'error');
    }
    msgInput.focus({ preventScroll: true });
  };

  const chatPane = el(
    'div',
    { id: 'team-chat-pane', className: 'card stack-md' },
    headerContainer,
    pinnedContainer,
    messagesBox,
    el(
      'div',
      { id: 'team-chat-starters', className: 'scroll-x' },
      ...starters.map((st) =>
        el('button', { type: 'button', className: 'chip', onClick: () => store.sendTeamMessage(st) }, st)
      )
    ),
    stickerDrawerHost,
    el(
      'form',
      {
        id: 'team-chat-input-form',
        className: 'row',
        onSubmit: async (e) => {
          e.preventDefault();
          await sendMessage();
        }
      },
      el(
        'button',
        {
          type: 'button',
          className: `btn ${stickerDrawerOpen ? 'btn-primary' : 'btn-soft'}`,
          style: { minWidth: '48px', padding: '0 12px' },
          title: 'Toggle animated stickers',
          ariaLabel: 'Toggle stickers',
          onMouseDown: (e) => e.preventDefault(),
          onClick: () => {
            stickerDrawerOpen = !stickerDrawerOpen;
            renderStickerDrawer();
          }
        },
        '🎭'
      ),
      msgInput,
      el(
        'button',
        {
          type: 'submit',
          className: 'btn btn-primary',
          onMouseDown: (e) => e.preventDefault() // Keep input focus/keyboard open when tapping Send
        },
        'Send'
      )
    )
  );

  return el(
    'div',
    { id: 'team-chat-shell', className: 'stack-lg' },
    el('div', { className: 'row-between' }, el('h1', { className: 'display-title' }, '💬 Clubs & Squad Chat'), el('button', { type: 'button', className: 'btn btn-outline', onClick: () => navigate('home') }, '← Home')),
    el('div', { className: 'split-pane' }, teamsSidebar, chatPane)
  );
}
