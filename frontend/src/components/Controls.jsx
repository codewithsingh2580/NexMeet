export default function Controls({
  videoEnabled,
  audioEnabled,
  isScreenSharing,
  handRaised,
  chatOpen,
  participantsOpen,
  unreadCount,
  onToggleVideo,
  onToggleAudio,
  onToggleScreen,
  onToggleHand,
  onToggleChat,
  onToggleParticipants,
  onLeave,
  roomId,
}) {
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      // Brief visual feedback handled via CSS
    });
  };

  return (
    <footer className="controls">
      <div className="controls-left">
        <button
          className={`ctrl-btn ${audioEnabled ? "on" : "off"}`}
          onClick={onToggleAudio}
          title={audioEnabled ? "Mute" : "Unmute"}
        >
          <span className="ctrl-icon">{audioEnabled ? "🎤" : "🔇"}</span>
          <span className="ctrl-label">{audioEnabled ? "Mute" : "Unmute"}</span>
        </button>

        <button
          className={`ctrl-btn ${videoEnabled ? "on" : "off"}`}
          onClick={onToggleVideo}
          title={videoEnabled ? "Stop Video" : "Start Video"}
        >
          <span className="ctrl-icon">{videoEnabled ? "📷" : "🚫"}</span>
          <span className="ctrl-label">{videoEnabled ? "Stop Video" : "Start Video"}</span>
        </button>
      </div>

      <div className="controls-center">
        <button
          className={`ctrl-btn ${isScreenSharing ? "active" : ""}`}
          onClick={onToggleScreen}
          title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        >
          <span className="ctrl-icon">🖥️</span>
          <span className="ctrl-label">{isScreenSharing ? "Stop Share" : "Share Screen"}</span>
        </button>

        <button
          className={`ctrl-btn ${handRaised ? "active" : ""}`}
          onClick={onToggleHand}
          title={handRaised ? "Lower Hand" : "Raise Hand"}
        >
          <span className="ctrl-icon">✋</span>
          <span className="ctrl-label">{handRaised ? "Lower Hand" : "Raise Hand"}</span>
        </button>

        <button
          className={`ctrl-btn ${chatOpen ? "active" : ""}`}
          onClick={onToggleChat}
          title="Chat"
        >
          <span className="ctrl-icon">
            💬{unreadCount > 0 && !chatOpen && (
              <span className="badge">{unreadCount}</span>
            )}
          </span>
          <span className="ctrl-label">Chat</span>
        </button>

        <button
          className={`ctrl-btn ${participantsOpen ? "active" : ""}`}
          onClick={onToggleParticipants}
          title="Participants"
        >
          <span className="ctrl-icon">👥</span>
          <span className="ctrl-label">Participants</span>
        </button>

        <button
          className="ctrl-btn"
          onClick={copyRoomId}
          title="Copy Room ID"
        >
          <span className="ctrl-icon">🔗</span>
          <span className="ctrl-label">Copy Link</span>
        </button>
      </div>

      <div className="controls-right">
        <button className="ctrl-btn leave" onClick={onLeave} title="Leave meeting">
          <span className="ctrl-icon">📞</span>
          <span className="ctrl-label">Leave</span>
        </button>
      </div>
    </footer>
  );
}
