/**
 * Sentience Ledger - Secure Notes Management System Backend Server
 * Technology Stack: Node.js, Express, Local JSON DB (MongoDB compatible layout), JWT, bcrypt
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { authRouter } from "./routes/auth";
import { notesRouter } from "./routes/notes";
import { authenticateToken } from "./middleware/auth";
import cors from "cors";
import { initializeMongo } from "./db";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://north-star-notes.vercel.app",
  "https://sentience-ledger.onrender.com",
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : []),
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/notes", authenticateToken, notesRouter);

async function startServer() {
  await initializeMongo();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
