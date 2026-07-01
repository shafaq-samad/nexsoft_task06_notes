import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { User } from "../src/types";
import { loadUsers } from "../db/jsonStore";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-local-development";

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
    if (!decoded.userId) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const database = await db.connect();
    if (database) {
      const user = await database.collection<User>("users").findOne({ id: decoded.userId });
      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }
      req.user = { id: user.id };
      next();
      return;
    }

    const users = loadUsers();
    const user = users.find((entry) => entry.id === decoded.userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    req.user = { id: user.id };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
