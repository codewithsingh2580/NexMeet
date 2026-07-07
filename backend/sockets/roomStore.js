// Live, in-memory state for active video rooms.
// This is intentionally NOT persisted to MongoDB — signaling state
// (who's connected right now, current peers) is ephemeral and only
// matters while sockets are live. Persisted history (messages, join
// logs, room metadata) lives in MongoDB via the models/ folder.

export const rooms = new Map();

export const getRoom = (roomId) => rooms.get(roomId);

export const createRoom = (roomId, hostSocketId) => {
  const room = {
    id: roomId,
    name: `Room ${roomId.slice(0, 6)}`,
    host: hostSocketId,
    peers: new Map(),
  };
  rooms.set(roomId, room);
  return room;
};

export const deleteRoom = (roomId) => rooms.delete(roomId);

export const getRoomCount = () => rooms.size;
