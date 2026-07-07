export default function ParticipantsPanel({ peers, localName, isHost, onKick, onClose }) {
  const all = [
    { socketId: "local", name: localName, video: true, audio: true, isLocal: true },
    ...peers,
  ];

  return (
    <aside className="chat-panel">
      <div className="chat-header">
        <h3>Participants ({all.length})</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="participants-list">
        {all.map((p) => (
          <div key={p.socketId} className="participant-row">
            <div className="participant-avatar">
              {(p.name || "?")[0].toUpperCase()}
            </div>
            <span className="participant-name">
              {p.name} {p.isLocal && <em>(You)</em>}
            </span>
            <div className="participant-icons">
              {!p.audio && <span title="Muted">🔇</span>}
              {!p.video && <span title="Camera off">🚫</span>}
              {p.handRaised && <span title="Hand raised">✋</span>}
            </div>
            {isHost && !p.isLocal && (
              <button
                className="kick-btn"
                onClick={() => onKick(p.socketId)}
                title="Remove participant"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
