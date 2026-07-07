import { useRef, useCallback, useEffect } from "react";

// Optimized ICE servers - STUN + free TURN fallback
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

// Bandwidth constraints to prevent lag
const SENDER_OPTS = {
  video: {
    maxBitrate: 1_500_000, // 1.5 Mbps cap
    maxFramerate: 30,
    scaleResolutionDownBy: 1,
  },
  audio: {
    maxBitrate: 128_000,
  },
};

export function useWebRTC({ socket, localStream, onRemoteStream, onStreamRemoved }) {
  // peerId → RTCPeerConnection
  const peerConns = useRef(new Map());
  const pendingCandidates = useRef(new Map()); // buffer ICE before remote desc

  // ── Create a peer connection ────────────────────────────────────────────────
  const createPeerConnection = useCallback(
    (peerId) => {
      if (peerConns.current.has(peerId)) return peerConns.current.get(peerId);

      const pc = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 10,
        bundlePolicy: "max-bundle",   // bundle all media → single ICE pair
        rtcpMuxPolicy: "require",     // mux RTCP → halves ports
      });

      // Add local tracks
      if (localStream) {
        for (const track of localStream.getTracks()) {
          const sender = pc.addTrack(track, localStream);
          // Apply bandwidth limits
          const kind = track.kind;
          if (SENDER_OPTS[kind]) {
            const params = sender.getParameters();
            if (!params.encodings) params.encodings = [{}];
            Object.assign(params.encodings[0], SENDER_OPTS[kind]);
            sender.setParameters(params).catch(() => {});
          }
        }
      }

      // Remote track handler
      pc.ontrack = ({ streams: [stream] }) => {
        if (stream) onRemoteStream(peerId, stream);
      };

      // ICE candidate
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          socket.emit("ice-candidate", { to: peerId, candidate });
        }
      };

      // Connection state monitoring
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "failed") {
          // Attempt ICE restart on failure
          pc.restartIce();
        }
        if (state === "closed" || state === "disconnected") {
          onStreamRemoved(peerId);
          peerConns.current.delete(peerId);
        }
      };

      peerConns.current.set(peerId, pc);
      return pc;
    },
    [localStream, socket, onRemoteStream, onStreamRemoved]
  );

  // ── Initiate call (caller side) ─────────────────────────────────────────────
  const callPeer = useCallback(
    async (peerId) => {
      const pc = createPeerConnection(peerId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      socket.emit("offer", { to: peerId, offer });
    },
    [createPeerConnection, socket]
  );

  // ── Handle incoming offer (callee side) ─────────────────────────────────────
  const handleOffer = useCallback(
    async ({ from, offer }) => {
      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Flush buffered ICE candidates
      const buffered = pendingCandidates.current.get(from) ?? [];
      for (const c of buffered) await pc.addIceCandidate(new RTCIceCandidate(c));
      pendingCandidates.current.delete(from);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer });
    },
    [createPeerConnection, socket]
  );

  // ── Handle incoming answer ───────────────────────────────────────────────────
  const handleAnswer = useCallback(async ({ from, answer }) => {
    const pc = peerConns.current.get(from);
    if (!pc) return;
    if (pc.signalingState === "stable") return; // already set
    await pc.setRemoteDescription(new RTCSessionDescription(answer));

    const buffered = pendingCandidates.current.get(from) ?? [];
    for (const c of buffered) await pc.addIceCandidate(new RTCIceCandidate(c));
    pendingCandidates.current.delete(from);
  }, []);

  // ── Handle ICE candidate ─────────────────────────────────────────────────────
  const handleIceCandidate = useCallback(async ({ from, candidate }) => {
    const pc = peerConns.current.get(from);
    if (!pc || !pc.remoteDescription) {
      // Buffer until remote desc is set
      if (!pendingCandidates.current.has(from)) {
        pendingCandidates.current.set(from, []);
      }
      pendingCandidates.current.get(from).push(candidate);
      return;
    }
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }, []);

  // ── Remove a peer ─────────────────────────────────────────────────────────────
  const removePeer = useCallback((peerId) => {
    const pc = peerConns.current.get(peerId);
    if (pc) {
      pc.close();
      peerConns.current.delete(peerId);
    }
    onStreamRemoved(peerId);
  }, [onStreamRemoved]);

  // ── Replace local tracks (e.g. when toggling camera) ─────────────────────────
  const replaceTrack = useCallback(async (kind, newTrack) => {
    for (const pc of peerConns.current.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === kind);
      if (sender && newTrack) {
        await sender.replaceTrack(newTrack);
      }
    }
  }, []);

  // ── Close all connections ─────────────────────────────────────────────────────
  const closeAll = useCallback(() => {
    for (const pc of peerConns.current.values()) pc.close();
    peerConns.current.clear();
    pendingCandidates.current.clear();
  }, []);

  return {
    callPeer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    removePeer,
    replaceTrack,
    closeAll,
  };
}
