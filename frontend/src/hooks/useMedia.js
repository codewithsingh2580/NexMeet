import { useState, useRef, useCallback, useEffect } from "react";

// Optimal video constraints - balanced quality vs performance
const VIDEO_CONSTRAINTS = {
  width: { ideal: 1280, max: 1920 },
  height: { ideal: 720, max: 1080 },
  frameRate: { ideal: 30, max: 60 },
  facingMode: "user",
};

const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000,
};

const SCREEN_CONSTRAINTS = {
  video: {
    displaySurface: "monitor",
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
  },
};

export function useMedia() {
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // ── Init media ──────────────────────────────────────────────────────────────
  const initMedia = useCallback(async ({ video = true, audio = true } = {}) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? VIDEO_CONSTRAINTS : false,
        audio: audio ? AUDIO_CONSTRAINTS : false,
      });
      streamRef.current = stream;
      setLocalStream(stream);
      setVideoEnabled(video);
      setAudioEnabled(audio);
      setMediaError(null);
      return stream;
    } catch (err) {
      const msg =
        err.name === "NotAllowedError"
          ? "Camera/mic permission denied. Please allow access."
          : err.name === "NotFoundError"
          ? "No camera or microphone found."
          : `Media error: ${err.message}`;
      setMediaError(msg);
      console.error("[media]", err);
      return null;
    }
  }, []);

  // ── Toggle video ─────────────────────────────────────────────────────────────
  const toggleVideo = useCallback(() => {
    if (!streamRef.current) return;
    const tracks = streamRef.current.getVideoTracks();
    const next = !videoEnabled;
    tracks.forEach((t) => (t.enabled = next));
    setVideoEnabled(next);
    return next;
  }, [videoEnabled]);

  // ── Toggle audio ─────────────────────────────────────────────────────────────
  const toggleAudio = useCallback(() => {
    if (!streamRef.current) return;
    const tracks = streamRef.current.getAudioTracks();
    const next = !audioEnabled;
    tracks.forEach((t) => (t.enabled = next));
    setAudioEnabled(next);
    return next;
  }, [audioEnabled]);

  // ── Start screen share ────────────────────────────────────────────────────────
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(SCREEN_CONSTRAINTS);
      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);

      // Auto-stop when user clicks browser's "Stop sharing" button
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      return stream;
    } catch (err) {
      if (err.name !== "NotAllowedError") {
        console.error("[screen]", err);
      }
      return null;
    }
  }, []);

  // ── Stop screen share ─────────────────────────────────────────────────────────
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
    }
    setIsScreenSharing(false);
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    screenStreamRef.current = null;
    setLocalStream(null);
    setScreenStream(null);
    setIsScreenSharing(false);
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  return {
    localStream,
    screenStream,
    videoEnabled,
    audioEnabled,
    isScreenSharing,
    mediaError,
    initMedia,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    stopAll,
  };
}
