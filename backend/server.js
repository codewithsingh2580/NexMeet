import "dotenv/config";
import { createServer } from "http";

import { connectDB } from "./config/db.js";
import { createApp, CLIENT_URL } from "./app.js";
import { initSocket } from "./sockets/index.js";

const PORT = process.env.PORT || 4000;

const start = async () => {
  await connectDB();

  const app = createApp();
  const httpServer = createServer(app);

  initSocket(httpServer, CLIENT_URL);

  httpServer.listen(PORT, () => {
    console.log(`🚀 NexMeet server → http://localhost:${PORT}`);
  });
};

start();
