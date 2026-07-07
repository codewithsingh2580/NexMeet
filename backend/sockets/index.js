import { Server } from "socket.io";
import { socketAuthMiddleware } from "./socketAuth.js";
import { registerRoomHandlers } from "./handlers/roomHandlers.js";
import { registerSignalingHandlers } from "./handlers/signalingHandlers.js";
import { registerChatHandlers } from "./handlers/chatHandlers.js";

export const initSocket = (httpServer, clientUrl) => {
  const io = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const { user } = socket.data;
    console.log(`[connect] ${socket.id} — ${user.name} (${user.email})`);

    registerRoomHandlers(io, socket);
    registerSignalingHandlers(io, socket);
    registerChatHandlers(io, socket);
  });

  return io;
};
