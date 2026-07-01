/**
 * Shared Type Definitions for the notes application
 */

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, "passwordHash">;
}

export interface DashboardStats {
  totalNotes: number;
  favoritesCount: number;
  archivedCount: number;
  trashedCount: number;
}

export interface ApiErrorResponse {
  error: string;
}

export interface ApiError extends Error {
  status?: number;
  message: string;
}

export interface AuthRequestPayload {
  email: string;
  password: string;
  username?: string;
}

export interface AuthMeResponse {
  user: Omit<User, "passwordHash">;
}

export interface NotePayload {
  title: string;
  content: string;
  tags: string[];
  isFavorite: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
}

export interface DeleteNoteResponse {
  message: string;
  note?: Note;
  id?: string;
}

export interface NoteQueryParams {
  view?: string;
  q?: string;
  tag?: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
}

export type AppView = "login" | "register" | "dashboard";
