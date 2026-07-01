import { useCallback, useEffect, useState } from "react";
import { notesApi } from "../services/api";
import { DashboardStats, Note, NotePayload, NoteQueryParams } from "../types";

interface UseNotesResult {
  notes: Note[];
  stats: DashboardStats;
  activeView: string;
  searchQuery: string;
  setActiveView: (view: string) => void;
  setSearchQuery: (query: string) => void;
  refreshWorkspace: () => void;
  saveNote: (payload: NotePayload) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function useNotes(token: string | null, currentView: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalNotes: 0, favoritesCount: 0, archivedCount: 0, trashedCount: 0 });
  const [activeView, setActiveView] = useState<string>(currentView || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const params: NoteQueryParams = { view: activeView, q: searchQuery };
      const data = await notesApi.list(token, params);
      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeView, searchQuery, token]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const data = await notesApi.stats(token);
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats", error);
    }
  }, [token]);

  const refreshWorkspace = useCallback(() => {
    void fetchNotes();
    void fetchStats();
  }, [fetchNotes, fetchStats]);

  useEffect(() => {
    if (token) {
      refreshWorkspace();
    }
  }, [token, activeView, searchQuery, refreshWorkspace]);

  const saveNote = useCallback(async (payload: NotePayload) => {
    if (!token) return;
    setIsLoading(true);
    try {
      await notesApi.create(token, payload);
      refreshWorkspace();
    } finally {
      setIsLoading(false);
    }
  }, [refreshWorkspace, token]);

  const toggleFavorite = useCallback(async (id: string) => {
    if (!token) return;
    const targetNote = notes.find((note) => note.id === id);
    if (!targetNote) return;
    await notesApi.update(token, id, { isFavorite: !targetNote.isFavorite });
    refreshWorkspace();
  }, [notes, refreshWorkspace, token]);

  const toggleArchive = useCallback(async (id: string) => {
    if (!token) return;
    const targetNote = notes.find((note) => note.id === id);
    if (!targetNote) return;
    await notesApi.update(token, id, targetNote.isTrashed ? { isTrashed: false } : { isArchived: !targetNote.isArchived });
    refreshWorkspace();
  }, [notes, refreshWorkspace, token]);

  const deleteNote = useCallback(async (id: string) => {
    if (!token) return;
    await notesApi.delete(token, id);
    refreshWorkspace();
  }, [refreshWorkspace, token]);

  return {
    notes,
    stats,
    activeView,
    searchQuery,
    setActiveView,
    setSearchQuery,
    refreshWorkspace,
    saveNote,
    toggleFavorite,
    toggleArchive,
    deleteNote,
    isLoading,
  };
}
