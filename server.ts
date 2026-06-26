/**
 * Sentience Ledger - Secure Notes Management System Backend Server
 * Technology Stack: Node.js, Express, Local JSON DB (MongoDB compatible layout), JWT, bcrypt
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { MongoClient, Db } from "mongodb";
import { createServer as createViteServer } from "vite";
import { User, Note } from "./src/types.js"; // Standard relative TS imports in ESM

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-local-development";
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sentience-ledger";
const DIRECT_MONGODB_URI = process.env.DIRECT_MONGODB_URI || "";

let mongoDb: Db | null = null;

async function connectToDatabase(): Promise<Db | null> {
  if (mongoDb) return mongoDb;

  try {
    const client = new MongoClient(DIRECT_MONGODB_URI || MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
    });
    await client.connect();
    mongoDb = client.db();

    await mongoDb.collection("users").createIndex({ email: 1 }, { unique: true });
    await mongoDb.collection("users").createIndex({ username: 1 }, { unique: true });
    await mongoDb.collection("notes").createIndex({ userId: 1 });
    await mongoDb.collection("notes").createIndex({ updatedAt: -1 });

    console.log("Connected to MongoDB");
    return mongoDb;
  } catch (error) {
    console.warn("MongoDB unavailable, falling back to local JSON storage:", error);
    return null;
  }
}

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, "users.json");
const NOTES_FILE = path.join(DATA_DIR, "notes.json");

// Helper to load/save JSON stores
function loadUsers(): User[] {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (e) {
    console.error("Error reading users file", e);
    return [];
  }
}

function saveUsers(users: User[]): void {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function loadNotes(): Note[] {
  if (!fs.existsSync(NOTES_FILE)) {
    fs.writeFileSync(NOTES_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const data = fs.readFileSync(NOTES_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (e) {
    console.error("Error reading notes file", e);
    return [];
  }
}

function saveNotes(notes: Note[]): void {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}

// Middleware to parse JSON body
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Authentication Middleware
interface AuthenticatedRequest extends Request {
  user?: Omit<User, "passwordHash">;
}

async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded: any) => {
    if (err || !decoded) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }

    try {
      const db = await connectToDatabase();
      let user: User | null = null;

      if (db) {
        user = await db.collection<User>("users").findOne({ id: decoded.userId });
      } else {
        const users = loadUsers();
        user = users.find((u) => u.id === decoded.userId) || null;
      }

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { passwordHash, ...safeUser } = user;
      req.user = safeUser;
      next();
    } catch (error) {
      console.error("Authentication failed:", error);
      res.status(500).json({ error: "Server error during authentication" });
    }
  });
}

/**
 * MongoDB / Mongoose Reference Schemas (For production deployment migration):
 *
 * const UserSchema = new mongoose.Schema({
 *   username: { type: String, required: true },
 *   email: { type: String, required: true, unique: true, index: true },
 *   passwordHash: { type: String, required: true },
 *   createdAt: { type: Date, default: Date.now }
 * });
 *
 * const NoteSchema = new mongoose.Schema({
 *   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
 *   title: { type: String, required: true },
 *   content: { type: String, required: true },
 *   tags: [{ type: String }],
 *   isFavorite: { type: Boolean, default: false },
 *   isArchived: { type: Boolean, default: false },
 *   isTrashed: { type: Boolean, default: false },
 *   createdAt: { type: Date, default: Date.now },
 *   updatedAt: { type: Date, default: Date.now }
 * });
 */

// --- Authentication Endpoints ---

// User Registration
app.post("/api/auth/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: "Username, email, and password are required" });
      return;
    }

    const emailLower = email.toLowerCase().trim();
    const usernameTrim = username.trim();
    const db = await connectToDatabase();

    if (db) {
      const usersCollection = db.collection<User>("users");
      const existingUser = await usersCollection.findOne({ $or: [{ email: emailLower }, { username: usernameTrim }] });
      if (existingUser) {
        const message = existingUser.email === emailLower ? "An account with this email already exists" : "Username is already taken";
        res.status(409).json({ error: message });
        return;
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 15),
        username: usernameTrim,
        email: emailLower,
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      await usersCollection.insertOne(newUser);

      const notesCollection = db.collection<Note>("notes");
      const seedNotes: Note[] = [
        {
          id: Math.random().toString(36).substring(2, 15),
          userId: newUser.id,
          title: "Q3 Strategic Planning",
          content: "Discussion points for the upcoming quarterly board meeting. Key focuses include operational efficiency and expansion into new high-trust market verticals.",
          tags: ["Strategy", "Business"],
          isFavorite: true,
          isArchived: false,
          isTrashed: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: Math.random().toString(36).substring(2, 15),
          userId: newUser.id,
          title: "System Credentials",
          content: "Admin access keys and secondary validation tokens for the staging environment. Rotate them regularly.",
          tags: ["Secure", "DevOps"],
          isFavorite: false,
          isArchived: false,
          isTrashed: false,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ];
      await notesCollection.insertMany(seedNotes);

      const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "30d" });
      const { passwordHash: _, ...safeUser } = newUser;
      res.status(201).json({ token, user: safeUser });
      return;
    }

    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === emailLower)) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    if (users.some((u) => u.username.toLowerCase() === usernameTrim.toLowerCase())) {
      res.status(409).json({ error: "Username is already taken" });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const newUser: User = {
      id: Math.random().toString(36).substring(2, 15),
      username: usernameTrim,
      email: emailLower,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    const currentNotesList = loadNotes();
    currentNotesList.push({
      id: Math.random().toString(36).substring(2, 15),
      userId: newUser.id,
      title: "Welcome Note",
      content: "Your first note in the secure workspace.",
      tags: ["Getting Started"],
      isFavorite: false,
      isArchived: false,
      isTrashed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    saveNotes(currentNotesList);

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "30d" });
    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({ token, user: safeUser });
  } catch (error) {
    console.error("Error in registration:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// User Login
app.post("/api/auth/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const db = await connectToDatabase();
    let user: User | null = null;

    if (db) {
      user = await db.collection<User>("users").findOne({ email: email.toLowerCase().trim() });
    } else {
      const users = loadUsers();
      user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
    }

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const passwordMatch = bcrypt.compareSync(password, user.passwordHash || "");
    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
    const { passwordHash: _, ...safeUser } = user;
    res.status(200).json({ token, user: safeUser });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Verify Session / Get Current User
app.get("/api/auth/me", authenticateToken as any, (req: AuthenticatedRequest, res: Response): void => {
  res.status(200).json({ user: req.user });
});

// --- Notes API Endpoints (CRUD) ---

// Get all notes for user (with search and tag filters)
app.get("/api/notes", authenticateToken as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const query = (req.query.q as string || "").toLowerCase().trim();
    const tag = (req.query.tag as string || "").toLowerCase().trim();
    const view = (req.query.view as string || "all"); // all, favorites, archived, trashed

    const db = await connectToDatabase();
    if (db) {
      const notesCollection = db.collection<Note>("notes");
      const filter: Record<string, any> = { userId };

      if (view === "favorites") {
        filter.isFavorite = true;
        filter.isTrashed = false;
      } else if (view === "archived") {
        filter.isArchived = true;
        filter.isTrashed = false;
      } else if (view === "trashed") {
        filter.isTrashed = true;
      } else {
        filter.isArchived = false;
        filter.isTrashed = false;
      }

      if (query) {
        filter.$or = [
          { title: { $regex: query, $options: "i" } },
          { content: { $regex: query, $options: "i" } },
        ];
      }

      if (tag) {
        filter.tags = { $in: [tag] };
      }

      const notes = await notesCollection.find(filter).sort({ updatedAt: -1 }).toArray();
      res.status(200).json(notes);
      return;
    }

    let notes = loadNotes().filter((n) => n.userId === userId);

    if (view === "favorites") {
      notes = notes.filter((n) => n.isFavorite && !n.isTrashed);
    } else if (view === "archived") {
      notes = notes.filter((n) => n.isArchived && !n.isTrashed);
    } else if (view === "trashed") {
      notes = notes.filter((n) => n.isTrashed);
    } else {
      notes = notes.filter((n) => !n.isArchived && !n.isTrashed);
    }

    if (query) {
      notes = notes.filter((n) => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query));
    }

    if (tag) {
      notes = notes.filter((n) => n.tags.some((t) => t.toLowerCase() === tag));
    }

    notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.status(200).json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Server error fetching notes" });
  }
});

// Get dashboard statistics
app.get("/api/notes/stats", authenticateToken as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const db = await connectToDatabase();

    if (db) {
      const notes = await db.collection<Note>("notes").find({ userId }).toArray();
      const stats = {
        totalNotes: notes.filter((n) => !n.isArchived && !n.isTrashed).length,
        favoritesCount: notes.filter((n) => n.isFavorite && !n.isTrashed).length,
        archivedCount: notes.filter((n) => n.isArchived && !n.isTrashed).length,
        trashedCount: notes.filter((n) => n.isTrashed).length,
      };
      res.status(200).json(stats);
      return;
    }

    const notes = loadNotes().filter((n) => n.userId === userId);
    const stats = {
      totalNotes: notes.filter((n) => !n.isArchived && !n.isTrashed).length,
      favoritesCount: notes.filter((n) => n.isFavorite && !n.isTrashed).length,
      archivedCount: notes.filter((n) => n.isArchived && !n.isTrashed).length,
      trashedCount: notes.filter((n) => n.isTrashed).length,
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Server error fetching statistics" });
  }
});

// Create Note
app.post("/api/notes", authenticateToken as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { title, content, tags, isFavorite } = req.body;

    if (!title && !content) {
      res.status(400).json({ error: "Note must have either a title or content" });
      return;
    }

    const db = await connectToDatabase();
    const newNote: Note = {
      id: Math.random().toString(36).substring(2, 15),
      userId,
      title: (title || "").trim() || "Untitled Note",
      content: content || "",
      tags: Array.isArray(tags) ? tags.map((t) => t.trim()).filter(Boolean) : [],
      isFavorite: !!isFavorite,
      isArchived: false,
      isTrashed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (db) {
      await db.collection<Note>("notes").insertOne(newNote);
      res.status(201).json(newNote);
      return;
    }

    const notes = loadNotes();
    notes.push(newNote);
    saveNotes(notes);
    res.status(201).json(newNote);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Server error creating note" });
  }
});

// Update Note
app.put("/api/notes/:id", authenticateToken as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const noteId = req.params.id;
    const { title, content, tags, isFavorite, isArchived, isTrashed } = req.body;

    const db = await connectToDatabase();
    if (db) {
      const notesCollection = db.collection<Note>("notes");
      const note = await notesCollection.findOne({ id: noteId });

      if (!note) {
        res.status(404).json({ error: "Note not found" });
        return;
      }

      if (note.userId !== userId) {
        res.status(403).json({ error: "Unauthorized to update this note" });
        return;
      }

      const update: Partial<Note> = { updatedAt: new Date().toISOString() };
      if (title !== undefined) update.title = title.trim();
      if (content !== undefined) update.content = content;
      if (tags !== undefined) update.tags = Array.isArray(tags) ? tags.map((t) => t.trim()).filter(Boolean) : [];
      if (isFavorite !== undefined) update.isFavorite = !!isFavorite;
      if (isArchived !== undefined) update.isArchived = !!isArchived;
      if (isTrashed !== undefined) update.isTrashed = !!isTrashed;

      await notesCollection.updateOne({ id: noteId }, { $set: update });
      const updatedNote = await notesCollection.findOne({ id: noteId });
      res.status(200).json(updatedNote);
      return;
    }

    const notes = loadNotes();
    const noteIndex = notes.findIndex((n) => n.id === noteId);

    if (noteIndex === -1) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    const note = notes[noteIndex];
    if (note.userId !== userId) {
      res.status(403).json({ error: "Unauthorized to update this note" });
      return;
    }

    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = Array.isArray(tags) ? tags.map((t) => t.trim()).filter(Boolean) : [];
    if (isFavorite !== undefined) note.isFavorite = !!isFavorite;
    if (isArchived !== undefined) note.isArchived = !!isArchived;
    if (isTrashed !== undefined) note.isTrashed = !!isTrashed;

    note.updatedAt = new Date().toISOString();
    notes[noteIndex] = note;
    saveNotes(notes);
    res.status(200).json(note);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ error: "Server error updating note" });
  }
});

// Delete Note (Soft Delete to Trash or Hard Permanent Delete)
app.delete("/api/notes/:id", authenticateToken as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const noteId = req.params.id;

    const db = await connectToDatabase();
    if (db) {
      const notesCollection = db.collection<Note>("notes");
      const note = await notesCollection.findOne({ id: noteId });

      if (!note) {
        res.status(404).json({ error: "Note not found" });
        return;
      }

      if (note.userId !== userId) {
        res.status(403).json({ error: "Unauthorized to delete this note" });
        return;
      }

      if (note.isTrashed) {
        await notesCollection.deleteOne({ id: noteId });
        res.status(200).json({ message: "Note permanently deleted", id: noteId });
        return;
      }

      await notesCollection.updateOne({ id: noteId }, { $set: { isTrashed: true, updatedAt: new Date().toISOString() } });
      const updatedNote = await notesCollection.findOne({ id: noteId });
      res.status(200).json({ message: "Note moved to trash", note: updatedNote });
      return;
    }

    const notes = loadNotes();
    const noteIndex = notes.findIndex((n) => n.id === noteId);

    if (noteIndex === -1) {
      res.status(404).json({ error: "Note not found" });
      return;
    }

    const note = notes[noteIndex];
    if (note.userId !== userId) {
      res.status(403).json({ error: "Unauthorized to delete this note" });
      return;
    }

    if (note.isTrashed) {
      notes.splice(noteIndex, 1);
      saveNotes(notes);
      res.status(200).json({ message: "Note permanently deleted", id: noteId });
    } else {
      note.isTrashed = true;
      note.updatedAt = new Date().toISOString();
      notes[noteIndex] = note;
      saveNotes(notes);
      res.status(200).json({ message: "Note moved to trash", note });
    }
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Server error deleting note" });
  }
});

// Start integration with Vite or production file serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
