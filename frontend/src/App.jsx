import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./context/AuthContext";
import { useMedia } from "./hooks/useMedia";
import AuthScreen from "./components/AuthScreen";
import Lobby from "./components/Lobby";
import Meeting from "./components/Meeting";

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

const STATE = { AUTH: "auth", LOBBY: "lobby", MEETING: "meeting" };

export default function App() {
  const { user, token, loading, logout } = useAuth();

  const [appState, setAppState]   = useState(STATE.AUTH);
  const [roomId, setRoomId]       = useState(null);
  const [handRaised, setHandRaised] = useState(false);

  const socketRef = useRef(null);

  const {
    localStream, screenStream,
    videoEnabled, audioEnabled, isScreenSharing, mediaError,
    initMedia, toggleVideo, toggleAudio,
    startScreenShare, stopScreenShare, stopAll,
  } = useMedia();

  // When auth state resolves, move to correct screen
  useEffect(() => {
    if (loading) return;
    setAppState(user ? STATE.LOBBY : STATE.AUTH);
  }, [user, loading]);

  // Connect/reconnect socket when token changes
  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    // Pass token in handshake auth — server verifies it
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token },
      autoConnect: true,
      reconnectionAttempts: 5,
    });

    socket.on("connect_error", (err) => {
      if (err.message === "AUTH_REQUIRED" || err.message === "AUTH_INVALID") {
        // Token rejected — log the user out
        logout();
      }
    });

    socketRef.current = socket;
    return () => socket.disconnect();
  }, [token, logout]);

  const handleJoin = async ({ roomId: id, video, audio }) => {
    setRoomId(id);
    const stream = await initMedia({ video, audio });
    socketRef.current.emit("join-room", {
      roomId: id,
      video: video && !!stream,
      audio: audio && !!stream,
      // No userName sent — server uses the authenticated user's name
    });
    setAppState(STATE.MEETING);
  };

  const handleToggleVideo = () => {
    const next = toggleVideo();
    socketRef.current?.emit("media-state", { video: next, audio: audioEnabled });
  };

  const handleToggleAudio = () => {
    const next = toggleAudio();
    socketRef.current?.emit("media-state", { video: videoEnabled, audio: next });
  };

  const handleToggleScreen = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      socketRef.current?.emit("screen-share", { sharing: false });
    } else {
      const stream = await startScreenShare();
      if (stream) socketRef.current?.emit("screen-share", { sharing: true });
    }
  };

  const handleToggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    socketRef.current?.emit("raise-hand", { raised: next });
  };

  const handleLeave = () => {
    stopAll();
    socketRef.current?.disconnect();
    socketRef.current?.connect();
    setHandRaised(false);
    setAppState(STATE.LOBBY);
  };

  const handleLogout = () => {
    stopAll();
    socketRef.current?.disconnect();
    socketRef.current = null;
    logout();
  };

  if (loading) {
    return (
      <div className="splash">
        <span className="brand-icon splash-icon">◈</span>
      </div>
    );
  }

  return (
    <div className="app">
      {appState === STATE.AUTH && <AuthScreen />}

      {appState === STATE.LOBBY && (
        <Lobby
          onJoin={handleJoin}
          mediaError={mediaError}
          user={user}
          onLogout={handleLogout}
        />
      )}

      {appState === STATE.MEETING && (
        <Meeting
          socket={socketRef.current}
          localStream={localStream}
          screenStream={screenStream}
          roomId={roomId}
          userName={user?.name}
          videoEnabled={videoEnabled}
          audioEnabled={audioEnabled}
          isScreenSharing={isScreenSharing}
          handRaised={handRaised}
          onToggleVideo={handleToggleVideo}
          onToggleAudio={handleToggleAudio}
          onToggleScreen={handleToggleScreen}
          onToggleHand={handleToggleHand}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}
