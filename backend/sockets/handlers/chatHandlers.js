import { v4 as uuidv4 } from "uuid";
import Message from "../../models/Message.js";

export const registerChatHandlers = (io, socket) => {
  const { user } = socket.data;

  socket.on("chat-message", async ({ message }) => {
    const roomId = socket.data.roomId;
    if (!roomId || typeof message !== "string") return;

    const safe = message.replace(/[<>]/g, "").trim().slice(0, 500);
    if (!safe) return;

    const payload = {
      id: uuidv4(),
      senderId: socket.id,
      senderName: user.name,
      message: safe,
      timestamp: Date.now(),
    };

    // emit immediately — don't make the live chat wait on the DB write
    io.to(roomId).emit("chat-message", payload);

    try {
      await Message.create({
        roomId,
        senderId: user.id, // store the durable user id, not the ephemeral socket id
        senderName: user.name,
        message: safe,
        timestamp: payload.timestamp,
      });
    } catch (err) {
      console.error("Failed to save chat message:", err.message);
    }
  });
};
