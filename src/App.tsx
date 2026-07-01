import { lazy, Suspense, useMemo, useState } from "react";
import { Shield } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useNotes } from "./hooks/useNotes";
import { Note, NotePayload } from "./types";

const Login = lazy(() => import("./components/Login"));
const Register = lazy(() => import("./components/Register"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const NoteModal = lazy(() => import("./components/NoteModal"));
const Sidebar = lazy(() => import("./components/Sidebar"));

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col overflow-x-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-white">
        Skip to main content
      </a>
      {children}
    </div>
  );
}

export default function App() {
  const { token, currentUser, currentView, authError, appInitializing, setCurrentView, setAuthError, login, register, logout } = useAuth();
  const initialNotesView = currentView === "dashboard" ? "all" : "all";
  const { notes, stats, activeView, searchQuery, setActiveView, setSearchQuery, saveNote, toggleFavorite, toggleArchive, deleteNote, isLoading } = useNotes(token, initialNotesView);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const handleSaveNote = async (noteData: NotePayload) => {
    await saveNote(noteData);
  };

  const handleToggleFavorite = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await toggleFavorite(id);
  };

  const handleToggleArchive = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await toggleArchive(id);
  };

  const handleDeleteNote = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await deleteNote(id);
  };

  const handleNewNoteClick = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleEditNoteClick = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const currentScreen = currentView;

  const authContent = useMemo(() => {
    if (currentScreen === "register") {
      return (
        <Register
          onRegister={async (username: string, email: string, password: string) => {
            await register({ username, email, password });
          }}
          onNavigateToLogin={() => setCurrentView("login")}
          errorMsg={authError}
          clearError={() => setAuthError("")}
        />
      );
    }

    return (
      <Login
        onLogin={async (email: string, password: string) => {
          await login({ email, password });
        }}
        onNavigateToRegister={() => setCurrentView("register")}
        errorMsg={authError}
        clearError={() => setAuthError("")}
      />
    );
  }, [authError, currentScreen, login, register, setAuthError, setCurrentView]);

  if (appInitializing) {
    return (
      <AppShell>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface text-primary">
          <Shield className="h-12 w-12 animate-pulse" fill="currentColor" />
          <div className="font-mono text-xs uppercase tracking-widest">Initializing your workspace…</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {currentScreen === "dashboard" && currentUser ? (
        <div className="flex min-h-screen w-full" id="main-content">
          <Suspense fallback={<div className="hidden md:block" />}> 
            <Sidebar
              currentUser={currentUser}
              activeView={activeView}
              onViewChange={setActiveView}
              onNewNote={handleNewNoteClick}
              onLogout={logout}
            />
          </Suspense>

          <div className="min-w-0 flex-1">
            <Suspense fallback={<div className="p-8 text-sm text-on-surface-variant">Loading workspace…</div>}>
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
                onLogout={logout}
                isLoading={isLoading}
              />
            </Suspense>
          </div>
        </div>
      ) : (
        <div className="flex flex-grow items-center justify-center relative" id="main-content">
          <Suspense fallback={<div className="text-sm text-on-surface-variant">Loading experience…</div>}>{authContent}</Suspense>
        </div>
      )}

      <Suspense fallback={null}>
        <NoteModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingNote(null);
          }}
          onSave={handleSaveNote}
          editingNote={editingNote}
        />
      </Suspense>
    </AppShell>
  );
}
