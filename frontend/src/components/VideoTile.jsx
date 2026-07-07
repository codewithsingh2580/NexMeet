import { useEffect, useRef } from "react";

export default function VideoTile({
  stream,
  name,
  isLocal = false,
  videoEnabled = true,
  audioEnabled = true,
  isScreenShare = false,
  isSpeaking = false,
  handRaised = false,
  pinned = false,
  onPin,
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div
      className={[
        "video-tile",
        isSpeaking ? "speaking" : "",
        pinned ? "pinned" : "",
        isScreenShare ? "screen-share-tile" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onPin}
      title={pinned ? "Unpin" : "Pin"}
    >
      {/* Video element */}
      {stream && videoEnabled && !isScreenShare ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="tile-video"
        />
      ) : stream && isScreenShare ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="tile-video"
        />
      ) : (
        <div className="tile-avatar">
          <span className="avatar-initials">{initials}</span>
        </div>
      )}

      {/* Overlay info bar */}
      <div className="tile-bar">
        <span className="tile-name">
          {name} {isLocal && "(You)"}
        </span>
        <div className="tile-icons">
          {!audioEnabled && <span className="icon-badge muted" title="Muted">🔇</span>}
          {handRaised && <span className="icon-badge hand" title="Hand raised">✋</span>}
          {pinned && <span className="icon-badge pin-badge">📌</span>}
        </div>
      </div>

      {/* Speaking ring animation */}
      {isSpeaking && <div className="speaking-ring" />}
    </div>
  );
}
