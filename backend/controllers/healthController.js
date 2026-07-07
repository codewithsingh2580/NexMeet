import { getRoomCount } from "../sockets/roomStore.js";

export const getHealth = (_req, res) => {
  res.json({ ok: true, rooms: getRoomCount() });
};
