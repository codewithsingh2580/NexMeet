import { useEffect, useRef, useState, useCallback } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import VideoTile from "./VideoTile";
import Controls from "./Controls";
import ChatPanel from "./ChatPanel";
import ParticipantsPanel from "./ParticipantsPanel";

export default function Meeting({
  socket,
  localStream,
  screenStream,
  roomId,
  userName,
  videoEnabled,
  audioEnabled,
  isScreenSharing,
  handRaised,
  onToggleVideo,
  onToggleAudio,
  onToggleScreen,
  onToggleHand,
  onLeave,
}) {
  // Peers: Map<socketId, { name, video, audio, stream, handRaised }>
  const [peers, setPeers] = useState(new Map());
  const [pinnedId, setPinnedId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [notification, setNotification] = useState("");
  const notifTimer = useRef(null);

  const showNotif = useCallback((msg) => {
    setNotification(msg);
    clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(""), 3500);
  }, []);

  // Remote stream handlers
  const onRemoteStream = useCallback((peerId, stream) => {
    setPeers((prev) => {
      const next = new Map(prev);
      const existing = next.get(peerId) ?? {};
      next.set(peerId, { ...existing, stream });
      return next;
    });
  }, []);

  const onStreamRemoved = useCallback((peerId) => {
    setPeers((prev) => {
      const next = new Map(prev);
      const p = next.get(peerId);
      if (p) next.set(peerId, { ...p, stream: null });
      return next;
    });
  }, []);

  const {
    callPeer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    removePeer,
    closeAll,
  } = useWebRTC({ socket, localStream, onRemoteStream, onStreamRemoved });

  // ── Socket events ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // We successfully joined
    socket.on("room-joined", ({ peers: existingPeers, isHost: h }) => {
      setIsHost(h);
      // Add existing peers then call each of them
      existingPeers.forEach((p) => {
        setPeers((prev) => {
          const next = new Map(prev);
          next.set(p.socketId, { name: p.name, video: p.video, audio: p.audio });
          return next;
        });
        callPeer(p.socketId);
      });
    });

    // New peer joined — they will call us
    socket.on("peer-joined", ({ socketId, name, video, audio }) => {
      setPeers((prev) => {
        const next = new Map(prev);
        next.set(socketId, { name, video, audio });
        return next;
      });
      showNotif(`${name} joined the meeting`);
    });

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    socket.on("peer-left", ({ socketId }) => {
      setPeers((prev) => {
        const name = prev.get(socketId)?.name ?? "Someone";
        const next = new Map(prev);
        next.delete(socketId);
        showNotif(`${name} left the meeting`);
        return next;
      });
      removePeer(socketId);
      if (pinnedId === socketId) setPinnedId(null);
    });

    socket.on("peer-media-state", ({ socketId, video, audio }) => {
      setPeers((prev) => {
        const next = new Map(prev);
        const p = next.get(socketId);
        if (p) next.set(socketId, { ...p, video, audio });
        return next;
      });
    });

    socket.on("peer-screen-share", ({ socketId, sharing }) => {
      setPeers((prev) => {
        const next = new Map(prev);
        const p = next.get(socketId);
        if (p) next.set(socketId, { ...p, isScreenSharing: sharing });
        return next;
      });
    });

    socket.on("peer-raise-hand", ({ socketId, raised }) => {
      setPeers((prev) => {
        const next = new Map(prev);
        const p = next.get(socketId);
        if (p) {
          next.set(socketId, { ...p, handRaised: raised });
          if (raised) showNotif(`${p.name} raised their hand ✋`);
        }
        return next;
      });
    });

    socket.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (!chatOpen) setUnreadCount((n) => n + 1);
    });

    socket.on("host-assigned", () => {
      setIsHost(true);
      showNotif("You are now the host");
    });

    socket.on("kicked", () => {
      showNotif("You were removed by the host");
      setTimeout(onLeave, 1500);
    });

    return () => {
      socket.off("room-joined");
      socket.off("peer-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("peer-left");
      socket.off("peer-media-state");
      socket.off("peer-screen-share");
      socket.off("peer-raise-hand");
      socket.off("chat-message");
      socket.off("host-assigned");
      socket.off("kicked");
    };
  }, [socket, callPeer, handleOffer, handleAnswer, handleIceCandidate, removePeer, chatOpen, pinnedId, onLeave, showNotif]);

  // Reset unread when chat opens
  useEffect(() => {
    if (chatOpen) setUnreadCount(0);
  }, [chatOpen]);

  // Cleanup on unmount
  useEffect(() => () => closeAll(), [closeAll]);

  // ── Tile layout ───────────────────────────────────────────────────────────────
  const peerList = [...peers.entries()];
  const totalTiles = 1 + peerList.length + (isScreenSharing ? 1 : 0);

  const gridClass =
    pinnedId
      ? "grid-pinned"
      : totalTiles === 1
      ? "grid-1"
      : totalTiles === 2
      ? "grid-2"
      : totalTiles <= 4
      ? "grid-4"
      : totalTiles <= 9
      ? "grid-9"
      : "grid-many";

  const handleKick = (targetId) => {
    socket.emit("kick-peer", { targetId });
  };

  const handleSendMessage = (message) => {
    socket.emit("chat-message", { message });
  };

  return (
    <div className="meeting">
      {/* Header */}
      <header className="meeting-header">
        <div className="header-brand">
          <span className="brand-icon-sm">◈</span>
          <span className="header-title">NexMeet</span>
        </div>
        <div className="header-room">
          <span className="room-label">Room:</span>
          <code className="room-id">{roomId}</code>
        </div>
        {isHost && <span className="host-badge">Host</span>}
      </header>

      {/* Notification toast */}
      {notification && (
        <div className="notification-toast">{notification}</div>
      )}

      {/* Main area */}
      <div className={`meeting-main ${chatOpen || participantsOpen ? "with-panel" : ""}`}>
        <div className={`video-grid ${gridClass}`}>
          {/* Screen share tile (if active) */}
          {isScreenSharing && screenStream && (
            <VideoTile
              stream={screenStream}
              name={`${userName}'s Screen`}
              isLocal
              videoEnabled
              audioEnabled
              isScreenShare
              pinned={pinnedId === "screen-local"}
              onPin={() => setPinnedId(pinnedId === "screen-local" ? null : "screen-local")}
            />
          )}

          {/* Local tile */}
          <VideoTile
            stream={localStream}
            name={userName}
            isLocal
            videoEnabled={videoEnabled}
            audioEnabled={audioEnabled}
            handRaised={handRaised}
            pinned={pinnedId === "local"}
            onPin={() => setPinnedId(pinnedId === "local" ? null : "local")}
          />

          {/* Remote peers */}
          {peerList.map(([socketId, peer]) => (
            <VideoTile
              key={socketId}
              stream={peer.stream}
              name={peer.name}
              videoEnabled={peer.video}
              audioEnabled={peer.audio}
              handRaised={peer.handRaised}
              isScreenShare={peer.isScreenSharing}
              pinned={pinnedId === socketId}
              onPin={() => setPinnedId(pinnedId === socketId ? null : socketId)}
            />
          ))}
        </div>

        {/* Side panel */}
        {chatOpen && (
          <ChatPanel
            messages={messages}
            onSend={handleSendMessage}
            onClose={() => setChatOpen(false)}
            mySocketId={socket?.id}
          />
        )}
        {participantsOpen && !chatOpen && (
          <ParticipantsPanel
            peers={peerList.map(([socketId, p]) => ({ socketId, ...p }))}
            localName={userName}
            isHost={isHost}
            onKick={handleKick}
            onClose={() => setParticipantsOpen(false)}
          />
        )}
      </div>

      {/* Controls bar */}
      <Controls
        videoEnabled={videoEnabled}
        audioEnabled={audioEnabled}
        isScreenSharing={isScreenSharing}
        handRaised={handRaised}
        chatOpen={chatOpen}
        participantsOpen={participantsOpen}
        unreadCount={unreadCount}
        onToggleVideo={onToggleVideo}
        onToggleAudio={onToggleAudio}
        onToggleScreen={onToggleScreen}
        onToggleHand={onToggleHand}
        onToggleChat={() => {
          setChatOpen((v) => !v);
          setParticipantsOpen(false);
        }}
        onToggleParticipants={() => {
          setParticipantsOpen((v) => !v);
          setChatOpen(false);
        }}
        onLeave={onLeave}
        roomId={roomId}
      />
    </div>
  );
}
