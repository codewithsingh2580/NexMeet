import { getRoom } from "../sockets/roomStore.js";
import Message from "../models/Message.js";
import Session from "../models/Session.js";

// GET /rooms/:roomId — live info about a currently active room
export const getRoomInfo = (req, res) => {
  try {
    const room = getRoom(req.params.roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    res.json({
      id: room.id,
      name: room.name,
      peerCount: room.peers.size,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch room info" });
  }
};

// GET /rooms/:roomId/messages — chat history for a room, from MongoDB
export const getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const messages = await Message.find({ roomId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json({ roomId, messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
};

// GET /rooms/:roomId/sessions — join/leave history for a room
export const getRoomSessions = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const sessions = await Session.find({ roomId })
      .sort({ joinedAt: -1 })
      .limit(100)
      .lean();

    res.json({ roomId, sessions });
  } catch (err) {
    next(err);
  }
};
