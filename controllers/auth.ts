import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { User } from "../src/types";
import { loadUsers, saveUsers, loadNotes, saveNotes } from "../db/jsonStore";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-local-development";

interface AuthenticatedRequest extends Request {
  user?: Omit<User, "passwordHash">;
}

export const authController = {
  register: async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        res.status(400).json({ error: "Username, email, and password are required" });
        return;
      }

      const emailLower = email.toLowerCase().trim();
      const usernameTrim = username.trim();
      const database = await db.connect();

      if (database) {
        const usersCollection = database.collection<User>("users");
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
        const notesCollection = database.collection("notes");
        await notesCollection.insertMany([
          {
            id: Math.random().toString(36).substring(2, 15),
            userId: newUser.id,
            title: "Q3 Planning",
            content: "Central note for the next quarter.",
            tags: ["Strategy"],
            isFavorite: true,
            isArchived: false,
            isTrashed: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ]);

        const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "30d" });
        const { passwordHash: _, ...safeUser } = newUser;
        res.status(201).json({ token, user: safeUser });
        return;
      }

      const users = loadUsers();
      if (users.some((user) => user.email.toLowerCase() === emailLower)) {
        res.status(409).json({ error: "An account with this email already exists" });
        return;
      }

      if (users.some((user) => user.username.toLowerCase() === usernameTrim.toLowerCase())) {
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
        content: "Your first note in the workspace.",
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
  },

  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const database = await db.connect();
      let user: User | null = null;

      if (database) {
        user = await database.collection<User>("users").findOne({ email: email.toLowerCase().trim() });
      } else {
        const users = loadUsers();
        user = users.find((entry) => entry.email.toLowerCase() === email.toLowerCase().trim()) || null;
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
  },

  me: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.status(200).json({ user: req.user });
  },
};
