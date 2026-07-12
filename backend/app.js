import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import healthRoutes from "./routes/healthRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";

const CLIENT_URL = process.env.CLIENT_URL || "https://nexmeetfrontend-tgz8.onrender.com";

export const createApp = () => {
  const app = express();

  app.use(cors({ origin: CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: "16kb" }));
  app.disable("x-powered-by");

  app.use("/api/auth", authRoutes);
  app.use("/health", healthRoutes);
  app.use("/rooms", roomRoutes);

  // 404 fallback
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // centralized error handler
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({ error: err.message || "Internal server error" });
  });

  return app;
};

export { CLIENT_URL };
