/**
 * Shared Type Definitions for Sentience Ledger
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
