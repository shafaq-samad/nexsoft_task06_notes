import React from "react";
import { Shield, Plus, FileText, Star, Archive, Trash2, LogOut } from "lucide-react";
import { User } from "../types";

interface SidebarProps {
  currentUser: Omit<User, "passwordHash"> | null;
  activeView: string; // all, favorites, archived, trashed
  onViewChange: (view: string) => void;
  onNewNote: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  currentUser,
  activeView,
  onViewChange,
  onNewNote,
  onLogout,
}: SidebarProps) {
  const menuItems = [
    { id: "all", label: "All Notes", icon: FileText },
    { id: "favorites", label: "Favorites", icon: Star },
    { id: "archived", label: "Archive", icon: Archive },
    { id: "trashed", label: "Trash", icon: Trash2 },
  ];

  const userInitials = currentUser
    ? currentUser.username.substring(0, 2).toUpperCase()
    : "PU";

  return (
    <aside
      id="main-drawer"
      className="hidden md:flex fixed left-0 top-0 h-full w-[260px] flex-col p-4 bg-surface-container-low border-r border-outline-variant z-40"
    >
      {/* Brand Logo */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <Shield className="w-7 h-7 text-primary animate-pulse" fill="currentColor" />
        <span className="font-headline-md text-xl font-bold text-primary">Northstar Notes</span>
      </div>

      {/* New Note Button */}
      <button
        onClick={onNewNote}
        className="mb-6 flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-container text-white rounded-xl font-bold active:scale-[0.97] transition-all shadow-md cursor-pointer group"
      >
        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
        <span className="font-label-md text-sm">New Note</span>
      </button>

      {/* Navigation Menu */}
      <nav className="space-y-1.5 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-200 cursor-pointer text-left ${
                isActive
                  ? "bg-secondary-container text-on-secondary-container font-medium shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" fill={isActive && item.id === "favorites" ? "currentColor" : "none"} />
              <span className="font-label-md text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom User Profile Section */}
      <div className="mt-auto pt-4 border-t border-outline-variant flex flex-col gap-3">
        <div className="flex items-center gap-3 px-1 overflow-hidden">
          {/* Avatar image or fallback Initials bubble */}
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold font-mono border border-outline-variant shrink-0 select-none">
            {userInitials}
          </div>
          <div className="flex flex-col overflow-hidden text-left flex-1">
            <span className="font-label-md text-sm font-bold truncate text-on-surface">
              {currentUser?.username || "Professional User"}
            </span>
            <span className="font-body-sm text-xs text-on-surface-variant truncate">
              {currentUser?.email || "secure.user@enterprise.com"}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 justify-center py-2 px-3 border border-outline-variant hover:border-error/30 hover:bg-error-container/10 text-on-surface-variant hover:text-error rounded-lg text-xs transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
