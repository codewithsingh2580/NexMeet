import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const keyPath  = join(__dirname, "../backend/certs/server.key");
const certPath = join(__dirname, "../backend/certs/server.crt");
const hasCerts = existsSync(keyPath) && existsSync(certPath);

const backendBase = hasCerts ? "https://localhost:4000" : "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: hasCerts
      ? { key: readFileSync(keyPath), cert: readFileSync(certPath) }
      : false,
    proxy: {
      "/socket.io": { target: backendBase, ws: true, changeOrigin: true, secure: false },
      "/rooms":     { target: backendBase, changeOrigin: true, secure: false },
      "/health":    { target: backendBase, changeOrigin: true, secure: false },
    },
  },
});
