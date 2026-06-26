import React, { useState } from "react";
import {
  Menu,
  Search,
  Bell,
  Star,
  FileText,
  Archive,
  Trash2,
  Plus,
  PlusCircle,
  HelpCircle,
  Shield,
  FileSpreadsheet
} from "lucide-react";
import { Note, User, DashboardStats } from "../types";
import NoteCard from "./NoteCard";

interface DashboardProps {
  currentUser: Omit<User, "passwordHash"> | null;
  notes: Note[];
  stats: DashboardStats;
  activeView: string; // all, favorites, archived, trashed
  onViewChange: (view: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onNewNote: () => void;
  onEditNote: (note: Note) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onToggleArchive: (id: string, e: React.MouseEvent) => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
  onLogout: () => void;
}

export default function Dashboard({
  currentUser,
  notes,
  stats,
  activeView,
  onViewChange,
  searchQuery,
  onSearchQueryChange,
  onNewNote,
  onEditNote,
  onToggleFavorite,
  onToggleArchive,
  onDeleteNote,
  onLogout,
}: DashboardProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getTitle = () => {
    switch (activeView) {
      case "favorites":
        return "Favorites";
      case "archived":
        return "Archive";
      case "trashed":
        return "Trash Bin";
      default:
        return "All Notes";
    }
  };

  const userInitials = currentUser
    ? currentUser.username.substring(0, 2).toUpperCase()
    : "PU";

  const handleQuickDraft = () => {
    onNewNote();
  };

  const handleViewTasks = () => {
    alert("Listing all categorized tactical checklist items...");
    onSearchQueryChange("task");
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans">
      {/* Top AppBar (Desktop & Mobile) */}
      <header className="fixed top-0 right-0 left-0 md:left-[260px] z-30 bg-white border-b border-outline-variant h-[64px]">
        <div className="flex justify-between items-center px-6 h-full w-full max-w-7xl mx-auto">
          {/* Logo & Hamburguer */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1 rounded-md text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="hidden md:block font-headline-md text-lg font-bold text-primary">
              {getTitle()}
            </h1>
            <h1 className="md:hidden font-headline-md text-lg font-bold text-primary flex items-center gap-1.5">
              <Shield className="w-5 h-5" fill="currentColor" />
              <span>SecureNotes</span>
            </h1>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="flex-1 max-w-md mx-8 hidden sm:block">
            <div className="flex items-center gap-2 bg-surface-container px-4 py-1.5 rounded-full border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <Search className="w-5 h-5 text-on-surface-variant" />
              <input
                className="bg-transparent border-none outline-none w-full font-body-md text-sm text-on-surface placeholder:text-on-surface-variant/70"
                placeholder="Search notes by title or content keywords..."
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
              />
            </div>
          </div>

          {/* Notification Button / Initials bubble */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => alert("Notification vault empty. All security protocols operational.")}
              className="p-1.5 text-on-surface-variant hover:bg-surface-container transition-colors rounded-full cursor-pointer relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </button>

            <div className="md:hidden w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs select-none">
              {userInitials}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Collapsible Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Content */}
          <nav className="relative flex flex-col w-[260px] max-w-sm bg-surface-container-low h-full p-4 border-r border-outline-variant shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center gap-2 mb-8 px-2 justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" fill="currentColor" />
                <span className="font-headline-md text-lg font-bold text-primary">SecureNotes</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-on-surface-variant hover:text-primary transition-colors text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNewNote();
              }}
              className="mb-6 flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-container text-white rounded-xl font-bold active:scale-[0.97] transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span className="font-label-md text-sm">New Note</span>
            </button>

            <div className="space-y-1.5 flex-1">
              {[
                { id: "all", label: "All Notes", icon: FileText },
                { id: "favorites", label: "Favorites", icon: Star },
                { id: "archived", label: "Archive", icon: Archive },
                { id: "trashed", label: "Trash", icon: Trash2 },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-200 text-left ${
                      isActive
                        ? "bg-secondary-container text-on-secondary-container font-medium"
                        : "text-on-surface-variant hover:bg-surface-container-highest"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="font-label-md text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-4 border-t border-outline-variant flex flex-col gap-3">
              <div className="flex items-center gap-3 px-1">
                <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs select-none">
                  {userInitials}
                </div>
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="font-label-md text-sm font-bold truncate">
                    {currentUser?.username || "Professional User"}
                  </span>
                  <span className="font-body-sm text-xs text-on-surface-variant truncate">
                    {currentUser?.email || "secure.user@enterprise.com"}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="w-full text-center py-2 border border-outline-variant hover:bg-error-container/10 hover:text-error rounded-lg text-xs transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="pt-[80px] pb-24 px-6 md:ml-[260px] min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Search Bar (Visible only on small screens) */}
          <div className="sm:hidden mb-6">
            <div className="flex items-center gap-2 bg-surface-container px-4 py-2.5 rounded-xl border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <Search className="w-5 h-5 text-on-surface-variant" />
              <input
                className="bg-transparent border-none outline-none w-full font-body-md text-sm text-on-surface"
                placeholder="Search title or content..."
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
              />
            </div>
          </div>

          {/* Dashboard Stats / Summary (Bento Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Greeting Card */}
            <div className="md:col-span-2 bg-surface-container-high rounded-xl p-6 border border-outline-variant flex flex-col justify-between text-left">
              <div>
                <h2 className="font-headline-md text-xl md:text-2xl font-bold mb-1">
                  Welcome back, {currentUser?.username || "User"}
                </h2>
                <p className="font-body-sm text-xs md:text-sm text-on-surface-variant leading-relaxed">
                  You have {stats.totalNotes} active secure records within your personal ledger workspace.
                </p>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleQuickDraft}
                  className="font-label-md text-sm bg-primary hover:bg-primary-container text-white px-5 py-2 rounded-full transition-transform active:scale-95 cursor-pointer shadow-sm"
                >
                  Quick Draft
                </button>
                <button
                  onClick={handleViewTasks}
                  className="font-label-md text-sm border border-primary text-primary px-5 py-2 rounded-full hover:bg-primary-container/5 transition-colors cursor-pointer"
                >
                  View Tasks
                </button>
              </div>
            </div>

            {/* Total Notes Stats */}
            <div className="bg-white rounded-xl p-6 border border-outline-variant flex flex-col items-center justify-center text-center shadow-xs">
              <span className="font-display text-4xl md:text-5xl font-bold text-primary mb-1">
                {stats.totalNotes}
              </span>
              <span className="font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                Total Notes
              </span>
            </div>

            {/* Favorites Stats */}
            <div className="bg-white rounded-xl p-6 border border-outline-variant flex flex-col items-center justify-center text-center shadow-xs">
              <span className="font-display text-4xl md:text-5xl font-bold text-secondary mb-1">
                {stats.favoritesCount}
              </span>
              <span className="font-label-sm text-xs uppercase tracking-wider text-on-surface-variant font-semibold">
                Favorites
              </span>
            </div>
          </div>

          {/* Notes Title Header for List section */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline-md text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
              {getTitle()} ({(notes || []).length})
            </h3>

            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange("")}
                className="text-xs text-primary hover:underline font-semibold"
              >
                Clear Search filter
              </button>
            )}
          </div>

          {/* Notes Grid List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="notes-container">
            {/* Create New Note Draft Box (only if not viewing trash) */}
            {activeView !== "trashed" && (
              <div
                onClick={onNewNote}
                className="note-card bg-surface-container border border-dashed border-outline rounded-xl p-6 flex flex-col items-center justify-center h-full min-h-[180px] cursor-pointer hover:bg-surface-container-high transition-all hover:border-primary text-center group"
              >
                <PlusCircle className="w-8 h-8 text-on-surface-variant group-hover:text-primary transition-colors mb-2" />
                <span className="font-label-md text-sm text-on-surface-variant font-semibold group-hover:text-primary transition-colors">
                  Create new note...
                </span>
              </div>
            )}

            {/* Note Cards List */}
            {notes && notes.length > 0 ? (
              notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={onEditNote}
                  onToggleFavorite={onToggleFavorite}
                  onToggleArchive={onToggleArchive}
                  onDelete={onDeleteNote}
                />
              ))
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center text-on-surface-variant">
                <FileSpreadsheet className="w-12 h-12 text-outline/50 mb-3" />
                <p className="font-headline-md text-base font-semibold">No secure records found</p>
                <p className="text-xs text-outline mt-1 max-w-sm">
                  {searchQuery
                    ? "Try adjusting your query term or filter variables."
                    : "Create your first encrypted record using the New Note button."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button (Mobile FAB) */}
      <button
        onClick={onNewNote}
        className="md:hidden fixed bottom-20 right-6 z-50 w-14 h-14 bg-primary hover:bg-primary-container text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
        title="Create New Note"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Bottom Navigation Bar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe h-[64px] bg-white border-t border-outline-variant shadow-lg">
        {[
          { id: "all", label: "Notes", icon: FileText },
          { id: "favorites", label: "Favorites", icon: Star },
          { id: "archived", label: "Archive", icon: Archive },
          { id: "trashed", label: "Trash", icon: Trash2 },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 cursor-pointer transition-colors ${
                isActive
                  ? "text-primary font-bold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" fill={isActive && item.id === "favorites" ? "currentColor" : "none"} />
              <span className="text-[10px] uppercase font-semibold tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
