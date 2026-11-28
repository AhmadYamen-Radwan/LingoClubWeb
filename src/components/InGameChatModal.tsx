import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { encodeStickerMessage, parseStickerMessage } from '../utils/gameLogic';
import { StickerBubble, StickerPickerDrawer } from './Stickers';
import { TranslatableText } from './TranslatableText';

export const InGameChatModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const {
    teams,
    activeTeamId,
    setActiveTeamId,
    messagesByTeam,
    sendTeamMessage,
    currentUid,
    sfx,
  } = useApp();

  const [text, setText] = useState('');
  const [showStickers, setShowStickers] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, open]);

  if (!open) return null;

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
    <div
      className="modal-root"
      role="dialog"
      aria-modal="true"
      aria-label="In-game Squad Chat"
      onClick={onClose}
    >
      <div className="modal-card stack-sm" onClick={(e) => e.stopPropagation()}>
        <div className="row-between">
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>
              Squad Chat & Stickers
            </h3>
            <span className="xs muted">{activeTeam?.name || 'Club Channel'}</span>
          </div>
          <button
            type="button"
            className="btn-icon"
            aria-label="Close in-game chat"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="scroll-x">
          {teams.slice(0, 6).map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${activeTeam?.id === t.id ? 'selected' : ''}`}
              onClick={() => setActiveTeamId(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="chat-scroll card" style={{ padding: 10, minHeight: 180 }}>
          {msgs.length === 0 ? (
            <p className="small muted" style={{ textAlign: 'center', margin: '24px 0' }}>
              No messages here yet. Send a clue or sticker!
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
                  <div className="xs muted" style={{ fontWeight: 700, marginBottom: 4 }}>
                    {m.senderName}
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

        {showStickers && activeTeam ? (
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
            aria-label="Toggle WhatsApp sticker drawer"
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
            placeholder="Message your squad..."
            aria-label="Squad chat message"
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
