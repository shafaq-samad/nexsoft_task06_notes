import { Request, Response } from "express";
import { db } from "../db";
import { Note } from "../src/types";
import { loadNotes, saveNotes } from "../db/jsonStore";

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export const notesController = {
  list: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Access token required" });
        return;
      }

      const query = (req.query.q as string | undefined || "").toLowerCase().trim();
      const tag = (req.query.tag as string | undefined || "").toLowerCase().trim();
      const view = (req.query.view as string | undefined || "all");

      const database = await db.connect();
      if (database) {
        const notesCollection = database.collection<Note>("notes");
        const filter: Record<string, unknown> = { userId };
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

      let notes = loadNotes().filter((note) => note.userId === userId);
      if (view === "favorites") {
        notes = notes.filter((note) => note.isFavorite && !note.isTrashed);
      } else if (view === "archived") {
        notes = notes.filter((note) => note.isArchived && !note.isTrashed);
      } else if (view === "trashed") {
        notes = notes.filter((note) => note.isTrashed);
      } else {
        notes = notes.filter((note) => !note.isArchived && !note.isTrashed);
      }

      if (query) {
        notes = notes.filter((note) => note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query));
      }
      if (tag) {
        notes = notes.filter((note) => note.tags.some((item) => item.toLowerCase() === tag));
      }

      notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      res.status(200).json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ error: "Server error fetching notes" });
    }
  },

  stats: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Access token required" });
        return;
      }

      const database = await db.connect();
      if (database) {
        const notes = await database.collection<Note>("notes").find({ userId }).toArray();
        res.status(200).json({
          totalNotes: notes.filter((note) => !note.isArchived && !note.isTrashed).length,
          favoritesCount: notes.filter((note) => note.isFavorite && !note.isTrashed).length,
          archivedCount: notes.filter((note) => note.isArchived && !note.isTrashed).length,
          trashedCount: notes.filter((note) => note.isTrashed).length,
        });
        return;
      }

      const notes = loadNotes().filter((note) => note.userId === userId);
      res.status(200).json({
        totalNotes: notes.filter((note) => !note.isArchived && !note.isTrashed).length,
        favoritesCount: notes.filter((note) => note.isFavorite && !note.isTrashed).length,
        archivedCount: notes.filter((note) => note.isArchived && !note.isTrashed).length,
        trashedCount: notes.filter((note) => note.isTrashed).length,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ error: "Server error fetching statistics" });
    }
  },

  create: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Access token required" });
        return;
      }
      const { title, content, tags, isFavorite } = req.body;
      if (!title && !content) {
        res.status(400).json({ error: "Note must have either a title or content" });
        return;
      }

      const newNote: Note = {
        id: Math.random().toString(36).substring(2, 15),
        userId,
        title: (title || "").trim() || "Untitled Note",
        content: content || "",
        tags: Array.isArray(tags) ? tags.map((tag) => tag.trim()).filter(Boolean) : [],
        isFavorite: !!isFavorite,
        isArchived: false,
        isTrashed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const database = await db.connect();
      if (database) {
        await database.collection<Note>("notes").insertOne(newNote);
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
  },

  update: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Access token required" });
        return;
      }
      const noteId = req.params.id;
      const { title, content, tags, isFavorite, isArchived, isTrashed } = req.body;

      const database = await db.connect();
      if (database) {
        const notesCollection = database.collection<Note>("notes");
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
        if (tags !== undefined) update.tags = Array.isArray(tags) ? tags.map((tag) => tag.trim()).filter(Boolean) : [];
        if (isFavorite !== undefined) update.isFavorite = !!isFavorite;
        if (isArchived !== undefined) update.isArchived = !!isArchived;
        if (isTrashed !== undefined) update.isTrashed = !!isTrashed;

        await notesCollection.updateOne({ id: noteId }, { $set: update });
        const updatedNote = await notesCollection.findOne({ id: noteId });
        res.status(200).json(updatedNote);
        return;
      }

      const notes = loadNotes();
      const noteIndex = notes.findIndex((note) => note.id === noteId);
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
      if (tags !== undefined) note.tags = Array.isArray(tags) ? tags.map((tag) => tag.trim()).filter(Boolean) : [];
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
  },

  delete: async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Access token required" });
        return;
      }
      const noteId = req.params.id;

      const database = await db.connect();
      if (database) {
        const notesCollection = database.collection<Note>("notes");
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
      const noteIndex = notes.findIndex((note) => note.id === noteId);
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
  },
};
