import { getRoom } from "../roomStore.js";

export const registerSignalingHandlers = (io, socket) => {
  socket.on("offer", ({ to, offer }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = getRoom(roomId);
    if (!room?.peers.has(to)) return;
    io.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ to, answer }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = getRoom(roomId);
    if (!room?.peers.has(to)) return;
    io.to(to).emit("answer", { from: socket.id, answer });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = getRoom(roomId);
    if (!room?.peers.has(to)) return;
    io.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });

  socket.on("media-state", ({ video, audio }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = getRoom(roomId);
    if (!room) return;
    const peer = room.peers.get(socket.id);
    if (peer) {
      peer.video = !!video;
      peer.audio = !!audio;
    }
    socket.to(roomId).emit("peer-media-state", {
      socketId: socket.id,
      video: !!video,
      audio: !!audio,
    });
  });

  socket.on("screen-share", ({ sharing }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = getRoom(roomId);
    if (room?.peers.has(socket.id)) room.peers.get(socket.id).screen = !!sharing;
    socket.to(roomId).emit("peer-screen-share", { socketId: socket.id, sharing: !!sharing });
  });

  socket.on("raise-hand", ({ raised }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    io.to(roomId).emit("peer-raise-hand", { socketId: socket.id, raised: !!raised });
  });
};
