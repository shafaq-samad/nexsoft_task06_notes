import fs from "fs";
import path from "path";
import { Note, User } from "../src/types";

const dataDir = path.join(process.cwd(), "data");
const usersFile = path.join(dataDir, "users.json");
const notesFile = path.join(dataDir, "notes.json");

export const loadUsers = (): User[] => {
  if (!fs.existsSync(usersFile)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(usersFile, "utf8")) as User[];
};

export const saveUsers = (users: User[]): void => {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

export const loadNotes = (): Note[] => {
  if (!fs.existsSync(notesFile)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(notesFile, "utf8")) as Note[];
};

export const saveNotes = (notes: Note[]): void => {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2));
};
