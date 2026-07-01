import { Router } from "express";
import { notesController } from "../controllers/notes";
import { authenticateToken } from "../middleware/auth";

export const notesRouter = Router();

notesRouter.get("", authenticateToken, notesController.list);
notesRouter.get("/stats", authenticateToken, notesController.stats);
notesRouter.post("", authenticateToken, notesController.create);
notesRouter.put("/:id", authenticateToken, notesController.update);
notesRouter.delete("/:id", authenticateToken, notesController.delete);
