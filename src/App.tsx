import React, { useState, useEffect, useCallback } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import NoteModal from "./components/NoteModal";
import Sidebar from "./components/Sidebar";
import { User, Note, DashboardStats, AuthResponse } from "./types";
import { Shield } from "lucide-react";

const getApiUrl = (path: string) => {
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!base) return normalizedPath;
  if (base.endsWith("/api")) {
    return `${base}${normalizedPath.replace(/^\/api/, "")}`;
  }

  return `${base}${normalizedPath}`;
};

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState<Omit<User, "passwordHash"> | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalNotes: 0,
    favoritesCount: 0,
    archivedCount: 0,
    trashedCount: 0,
  });

  const [currentScreen, setCurrentScreen] = useState<"login" | "register" | "dashboard">(
    token ? "dashboard" : "login"
  );
  const [activeView, setActiveView] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [appInitializing, setAppInitializing] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>("");

  // Setup Authorization headers
  const getAuthHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  // Fetch stats helper
  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(getApiUrl("/api/notes/stats"), {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Error fetching notes stats:", e);
    }
  }, [token, getAuthHeaders]);

  // Fetch notes helper
  const fetchNotes = useCallback(async () => {
    if (!token) return;
    try {
      const url = getApiUrl(`/api/notes?view=${activeView}&q=${encodeURIComponent(searchQuery)}`);
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (e) {
      console.error("Error fetching notes list:", e);
    }
  }, [token, activeView, searchQuery, getAuthHeaders]);

  // Combined fetch data helper
  const refreshWorkspace = useCallback(() => {
    fetchNotes();
    fetchStats();
  }, [fetchNotes, fetchStats]);

  // Initial session verification
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem("token");
      if (!savedToken) {
        setAppInitializing(false);
        return;
      }

      try {
        const res = await fetch(getApiUrl("/api/auth/me"), {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setToken(savedToken);
          setCurrentScreen("dashboard");
        } else {
          // Token expired or invalid
          localStorage.removeItem("token");
          setToken(null);
          setCurrentScreen("login");
        }
      } catch (e) {
        console.error("Session verification failed:", e);
        // Fallback to local session state
      } finally {
        setAppInitializing(false);
      }
    };

    verifySession();
  }, []);

  // Trigger data reload on view or search query changes
  useEffect(() => {
    if (token && currentScreen === "dashboard") {
      refreshWorkspace();
    }
  }, [token, currentScreen, activeView, searchQuery, refreshWorkspace]);

  // Auth Handlers
  const handleLogin = async (email: string, password: string) => {
    setAuthError("");
    const res = await fetch(getApiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Authentication failed");
    }

    localStorage.setItem("token", data.token);
    setToken(data.token);
    setCurrentUser(data.user);
    setCurrentScreen("dashboard");
  };

  const handleRegister = async (username: string, email: string, password: string) => {
    setAuthError("");
    const res = await fetch(getApiUrl("/api/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Registration failed");
    }

    localStorage.setItem("token", data.token);
    setToken(data.token);
    setCurrentUser(data.user);
    setCurrentScreen("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setCurrentUser(null);
    setNotes([]);
    setSearchQuery("");
    setActiveView("all");
    setCurrentScreen("login");
  };

  // Notes CRUD Handlers
  const handleSaveNote = async (noteData: {
    title: string;
    content: string;
    tags: string[];
    isFavorite: boolean;
  }) => {
    try {
      if (editingNote) {
        // Update
        const res = await fetch(getApiUrl(`/api/notes/${editingNote.id}`), {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(noteData),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update note");
        }
      } else {
        // Create
        const res = await fetch(getApiUrl("/api/notes"), {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(noteData),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create note");
        }
      }

      refreshWorkspace();
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetNote = notes.find((n) => n.id === id);
    if (!targetNote) return;

    try {
      const res = await fetch(getApiUrl(`/api/notes/${id}`), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isFavorite: !targetNote.isFavorite }),
      });

      if (res.ok) {
        refreshWorkspace();
      }
    } catch (err) {
      console.error("Error toggling favorite flag:", err);
    }
  };

  const handleToggleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetNote = notes.find((n) => n.id === id);
    if (!targetNote) return;

    try {
      const payload: Record<string, boolean> = {};
      if (targetNote.isTrashed) {
        // If restoring a trashed note, un-trash it
        payload.isTrashed = false;
      } else {
        // Invert archive state
        payload.isArchived = !targetNote.isArchived;
      }

      const res = await fetch(getApiUrl(`/api/notes/${id}`), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        refreshWorkspace();
      }
    } catch (err) {
      console.error("Error toggling archive flag:", err);
    }
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetNote = notes.find((n) => n.id === id);
    if (!targetNote) return;

    const message = targetNote.isTrashed
      ? "Are you sure you want to permanently delete this secure note? This operation cannot be undone."
      : "Move this note to the trash container?";

    if (confirm(message)) {
      try {
        const res = await fetch(getApiUrl(`/api/notes/${id}`), {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (res.ok) {
          refreshWorkspace();
        }
      } catch (err) {
        console.error("Error deleting note:", err);
      }
    }
  };

  const handleNewNoteClick = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleEditNoteClick = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  // Screen Router / Loading
  if (appInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-primary gap-4">
        <Shield className="w-12 h-12 animate-pulse" fill="currentColor" />
        <div className="font-mono text-xs tracking-widest uppercase">Initializing Secure Vault...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col overflow-x-hidden">
      {currentScreen === "dashboard" && currentUser ? (
        <div className="flex w-full min-h-screen">
          {/* Desktop Left Drawer Navigation */}
          <Sidebar
            currentUser={currentUser}
            activeView={activeView}
            onViewChange={setActiveView}
            onNewNote={handleNewNoteClick}
            onLogout={handleLogout}
          />

          {/* Main Workspace Frame */}
          <div className="flex-1 min-w-0">
            <Dashboard
              currentUser={currentUser}
              notes={notes}
              stats={stats}
              activeView={activeView}
              onViewChange={setActiveView}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onNewNote={handleNewNoteClick}
              onEditNote={handleEditNoteClick}
              onToggleFavorite={handleToggleFavorite}
              onToggleArchive={handleToggleArchive}
              onDeleteNote={handleDeleteNote}
              onLogout={handleLogout}
            />
          </div>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center relative">
          {currentScreen === "register" ? (
            <Register
              onRegister={handleRegister}
              onNavigateToLogin={() => setCurrentScreen("login")}
              errorMsg={authError}
              clearError={() => setAuthError("")}
            />
          ) : (
            <Login
              onLogin={handleLogin}
              onNavigateToRegister={() => setCurrentScreen("register")}
              errorMsg={authError}
              clearError={() => setAuthError("")}
            />
          )}

          {/* General Auth Footer */}
          <footer className="absolute bottom-4 left-0 right-0 py-2 px-6 flex flex-col md:flex-row justify-between items-center w-full max-w-container-max mx-auto space-y-2 md:space-y-0 text-xs text-outline z-0">
            <p className="font-mono select-none">© 2026 Sentience Ledger. All rights reserved.</p>
            <div className="flex space-x-6">
              <button
                onClick={() => alert("Privacy Policy: All notes are stored encrypted on server disk. We collect zero analytics or trackers.")}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => alert("Security Terms: Credentials hashed on registration with bcrypt. Sessions protected with robust JWT verification.")}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Security Terms
              </button>
              <button
                onClick={() => alert("Help Center: Direct assistance is handled via corporate secure channels. Contact IT desk.")}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Help Center
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* Note Creation/Modification Overlay Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        editingNote={editingNote}
      />
    </div>
  );
}
