import Session from "../../models/Session.js";
import Room from "../../models/Room.js";;
import { rooms, getRoom, createRoom, deleteRoom } from "../roomStore.js";

const MAX_PEERS_PER_ROOM = 50;

export const registerRoomHandlers = (io, socket) => {
  const { user } = socket.data;

  socket.on("join-room", async ({ roomId, video, audio }) => {
    if (!roomId || typeof roomId !== "string") return;
    const safeRoomId = roomId.slice(0, 64);

    let room = getRoom(safeRoomId);
    if (!room) {
      room = createRoom(safeRoomId, socket.id);

      // persist room metadata (fire-and-forget, don't block the join)
      Room.findOneAndUpdate(
        { roomId: safeRoomId },
        { roomId: safeRoomId, createdBy: user.id, isActive: true },
        { upsert: true }
      ).catch((err) => console.error("Room upsert failed:", err.message));
    }

    if (room.peers.size >= MAX_PEERS_PER_ROOM) {
      socket.emit("error", { message: `Room is full (max ${MAX_PEERS_PER_ROOM}).` });
      return;
    }

    // Use the authenticated user's name — not whatever the client sends
    const peer = {
      name: user.name,
      userId: user.id,
      video: !!video,
      audio: !!audio,
      screen: false,
    };

    room.peers.set(socket.id, peer);
    socket.join(safeRoomId);
    socket.data.roomId = safeRoomId;

    const existingPeers = [...room.peers.entries()]
      .filter(([id]) => id !== socket.id)
      .map(([id, info]) => ({ socketId: id, ...info }));

    socket.emit("room-joined", {
      roomId: safeRoomId,
      peers: existingPeers,
      isHost: room.host === socket.id,
      user,
    });

    socket.to(safeRoomId).emit("peer-joined", {
      socketId: socket.id,
      name: user.name,
      userId: user.id,
      video: !!video,
      audio: !!audio,
    });

    // log join to DB
    try {
      await Session.create({
        roomId: safeRoomId,
        userId: user.id,
        userName: user.name,
        socketId: socket.id,
        joinedAt: new Date(),
      });
    } catch (err) {
      console.error("Failed to log session join:", err.message);
    }

    console.log(`[join] ${user.name} → ${safeRoomId} (${room.peers.size} peers)`);
  });

  socket.on("kick-peer", ({ targetId }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = getRoom(roomId);
    if (!room || room.host !== socket.id) return;
    if (!room.peers.has(targetId)) return;
    io.to(targetId).emit("kicked");
  });

  socket.on("disconnecting", async () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = getRoom(roomId);
    if (!room) return;

    room.peers.delete(socket.id);
    socket.to(roomId).emit("peer-left", { socketId: socket.id });

    if (room.peers.size === 0) {
      deleteRoom(roomId);
      Room.findOneAndUpdate({ roomId }, { isActive: false }).catch((err) =>
        console.error("Room deactivate failed:", err.message)
      );
    } else if (room.host === socket.id) {
      room.host = [...room.peers.keys()][0];
      io.to(room.host).emit("host-assigned");
    }

    // log leave to DB
    try {
      await Session.findOneAndUpdate(
        { roomId, socketId: socket.id, leftAt: null },
        { leftAt: new Date() },
        { sort: { joinedAt: -1 } }
      );
    } catch (err) {
      console.error("Failed to log session leave:", err.message);
    }

    console.log(`[leave] ${user.name} ← ${roomId} (${room?.peers.size ?? 0} remaining)`);
  });

  socket.on("disconnect", () => console.log(`[disconnect] ${socket.id}`));
};
