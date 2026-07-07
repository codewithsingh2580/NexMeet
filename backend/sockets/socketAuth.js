import { verifyToken } from "../jwt.js";
import { getUserById } from "../userStore.js";

export const socketAuthMiddleware = async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;

  if (!token) {
    return next(new Error("AUTH_REQUIRED"));
  }

  try {
    const payload = verifyToken(token);
    const user    = await getUserById(payload.id);

    if (!user) return next(new Error("AUTH_REQUIRED"));

    socket.data.user = user;
    next();
  } catch {
    next(new Error("AUTH_INVALID"));
  }
};
