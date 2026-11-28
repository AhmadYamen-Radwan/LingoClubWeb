import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { encodeStickerMessage, parseStickerMessage } from '../utils/gameLogic';
import { formatRelTime } from '../utils/constants';
import { CefrBadge } from '../components/CefrBadge';
import { StickerBubble, StickerPickerDrawer } from '../components/Stickers';
import { TranslatableText } from '../components/TranslatableText';

export const TeamChatView: React.FC = () => {
  const {
    teams,
    activeTeamId,
    setActiveTeamId,
    messagesByTeam,
    sendTeamMessage,
    toggleTeamMessagePin,
    deleteTeamMessage,
    currentUid,
    hostedSquad,
    hostLocalSquad,
    stopHostingLocalSquad,
    navigate,
    sfx,
  } = useApp();

  const [text, setText] = useState('');
  const [showStickers, setShowStickers] = useState(false);

  const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0];
  const msgs = (activeTeam ? messagesByTeam[activeTeam.id] : []) || [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam || !text.trim()) return;
    sfx.playClick();
    await sendTeamMessage(activeTeam.id, text.trim());
    setText('');
  };

  return (
    <div className="split-pane">
      {/* Channels Sidebar */}
      <aside className="card stack-sm" aria-label="Squad chat channels">
        <div className="row-between">
          <h2 className="card-title" style={{ margin: 0 }}>
            Channels
          </h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('teams')}>
            + Squad
          </button>
        </div>

        <div className="stack-xs">
          {teams.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`team-hud-pill ${activeTeam?.id === t.id ? 'active' : ''}`}
              onClick={() => {
                sfx.playClick();
                setActiveTeamId(t.id);
              }}
            >
              <div className="stack-xs" style={{ gap: 2, minWidth: 0 }}>
                <strong
                  style={{
                    fontSize: '0.88rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {t.channelKind === 'CLUB' ? '📣 ' : '🛡️ '}
                  {t.name}
                </strong>
                <span className="xs muted">{t.memberCount} member(s)</span>
              </div>
              <CefrBadge level={t.cefrLevel} />
            </button>
          ))}
        </div>

        {activeTeam ? (
          <div className="card card-soft-primary stack-xs" style={{ padding: 12 }}>
            <span className="xs" style={{ fontWeight: 700 }}>
              Local Tab Radar
            </span>
            {hostedSquad?.id === activeTeam.id ? (
              <button
                type="button"
                className="btn btn-danger-soft btn-sm"
                onClick={stopHostingLocalSquad}
              >
                Stop Hosting Squad
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-soft btn-sm"
                onClick={() => hostLocalSquad(activeTeam)}
              >
                📡 Broadcast Squad Nearby
              </button>
            )}
          </div>
        ) : null}
      </aside>

      {/* Main Message Feed & WhatsApp Stickers Drawer */}
      <section className="card stack-sm" aria-label="Active squad messages">
        {activeTeam ? (
          <>
            <div className="row-between row-wrap">
              <div className="stack-xs" style={{ gap: 2 }}>
                <h1 className="section-title" style={{ margin: 0 }}>
                  {activeTeam.name}
                </h1>
                <span className="xs muted">{activeTeam.motto}</span>
              </div>
              <CefrBadge level={activeTeam.cefrLevel} />
            </div>

            <div className="chat-scroll card" style={{ padding: 12, minHeight: 280 }}>
              {msgs.length === 0 ? (
                <p className="small muted" style={{ textAlign: 'center', margin: '36px 0' }}>
                  Start the conversation or open the WhatsApp Sticker drawer below!
                </p>
              ) : (
                msgs.map((m) => {
                  const mine = m.senderUid === currentUid;
                  const sticker = parseStickerMessage(m.text);
                  return (
                    <div
                      key={m.id}
                      className={`chat-bubble ${mine ? 'mine' : ''} ${m.pinned ? 'pinned' : ''}`}
                    >
                      <div className="row-between" style={{ gap: 10, marginBottom: 4 }}>
                        <span className="xs muted" style={{ fontWeight: 700 }}>
                          {m.senderName} {m.senderRole === 'LEADER' ? '· Lead' : ''} · {formatRelTime(m.createdAtMs)}
                        </span>
                        <div className="row" style={{ gap: 4 }}>
                          {(mine || activeTeam.leaderUid === currentUid) ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ minHeight: 24, padding: '0 6px', fontSize: '0.72rem' }}
                                aria-label={m.pinned ? 'Unpin message' : 'Pin message'}
                                onClick={() => void toggleTeamMessagePin(activeTeam.id, m.id, !m.pinned)}
                              >
                                {m.pinned ? '📌' : '📍'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ minHeight: 24, padding: '0 6px', fontSize: '0.72rem' }}
                                aria-label={`Delete message from ${m.senderName}`}
                                onClick={() => void deleteTeamMessage(activeTeam.id, m.id)}
                              >
                                ✕
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                      {sticker ? (
                        <StickerBubble
                          stickerId={sticker.id}
                          label={sticker.label}
                          emoji={sticker.emoji}
                        />
                      ) : (
                        <TranslatableText text={m.text} />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {showStickers ? (
              <StickerPickerDrawer
                onClose={() => setShowStickers(false)}
                onSelect={(st) => {
                  void sendTeamMessage(activeTeam.id, encodeStickerMessage(st));
                  setShowStickers(false);
                }}
              />
            ) : null}

            <form onSubmit={handleSend} className="row">
              <button
                type="button"
                className="btn-icon"
                data-testid="chat-sticker-toggle"
                aria-label="Open WhatsApp stickers"
                aria-expanded={showStickers}
                onClick={() => {
                  sfx.playClick();
                  setShowStickers((v) => !v);
                }}
              >
                😊
              </button>
              <input
                type="text"
                className="field flex-1"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Write to ${activeTeam.name}... (tap any English word in chat to translate)`}
                aria-label="Squad chat input"
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Send
              </button>
            </form>
          </>
        ) : (
          <p className="muted">Select or create a squad first.</p>
        )}
      </section>
    </div>
  );
};
