import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Lobby({ onJoin, mediaError, user, onLogout }) {
  const [roomId, setRoomId] = useState("");
  const [video, setVideo]   = useState(true);
  const [audio, setAudio]   = useState(true);
  const [error, setError]   = useState("");
  const videoPreviewRef     = useRef(null);
  const previewStreamRef    = useRef(null);

  useEffect(() => {
    if (!video) {
      previewStreamRef.current?.getTracks().forEach((t) => t.stop());
      previewStreamRef.current = null;
      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { width: 320, height: 240 }, audio: false })
      .then((stream) => {
        previewStreamRef.current = stream;
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = stream;
      })
      .catch(() => {});
    return () => previewStreamRef.current?.getTracks().forEach((t) => t.stop());
  }, [video]);

  const handleJoin = (e) => {
    e.preventDefault();
    const id = roomId.trim() || uuidv4().slice(0, 8);
    onJoin({ roomId: id, video, audio });
  };

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="lobby">
      <div className="lobby-card">
        {/* Brand + user info */}
        <div className="lobby-brand">
          <span className="brand-icon">◈</span>
          <h1>NexMeet</h1>
          <p className="brand-sub">Crystal-clear video. Zero compromise.</p>
        </div>

        {/* Logged-in user strip */}
        <div className="user-strip">
          <div className="user-strip-avatar">{initials}</div>
          <div className="user-strip-info">
            <span className="user-strip-name">{user?.name}</span>
            <span className="user-strip-email">{user?.email}</span>
          </div>
          <button className="user-strip-logout" onClick={onLogout} title="Sign out">
            Sign out
          </button>
        </div>

        {/* Camera preview */}
        <div className="lobby-preview-wrap">
          {video ? (
            <video ref={videoPreviewRef} autoPlay muted playsInline className="lobby-preview" />
          ) : (
            <div className="lobby-preview lobby-preview--off">
              <span className="avatar-lg">{initials}</span>
              <p>Camera off</p>
            </div>
          )}
          <div className="lobby-media-btns">
            <button type="button" className={`media-btn ${audio ? "active" : "off"}`}
              onClick={() => setAudio((a) => !a)} title={audio ? "Mute" : "Unmute"}>
              {audio ? "🎤" : "🔇"}
            </button>
            <button type="button" className={`media-btn ${video ? "active" : "off"}`}
              onClick={() => setVideo((v) => !v)} title={video ? "Stop camera" : "Start camera"}>
              {video ? "📷" : "🚫"}
            </button>
          </div>
        </div>

        {/* Room form */}
        <form onSubmit={handleJoin} className="lobby-form">
          <div className="field">
            <label>Room ID <span className="opt">(leave blank to create a new room)</span></label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => { setRoomId(e.target.value); setError(""); }}
              placeholder="Enter a room ID or leave blank"
              maxLength={32}
            />
          </div>
          {(error || mediaError) && <p className="error-msg">{error || mediaError}</p>}
          <button type="submit" className="btn-join">Join Meeting →</button>
        </form>
      </div>
    </div>
  );
}
