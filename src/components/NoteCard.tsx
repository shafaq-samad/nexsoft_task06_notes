import React from "react";
import { Star, Archive, Trash2, RotateCcw, Edit2 } from "lucide-react";
import { Note } from "../types";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onToggleArchive: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export default function NoteCard({
  note,
  onEdit,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
}: NoteCardProps) {
  // Format standard date
  const formattedDate = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Decide Tag background styles
  const getTagColor = (tag: string) => {
    const t = tag.toLowerCase();
    if (t === "secure" || t === "critical" || t === "devops") {
      return "bg-error-container text-on-error-container border border-error/10";
    }
    if (t === "personal" || t === "private") {
      return "bg-secondary-container text-on-secondary-container border border-secondary/10";
    }
    return "bg-surface-container-highest text-on-surface-variant border border-outline-variant/30";
  };

  return (
    <div
      onClick={() => onEdit(note)}
      className="note-card bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col h-full cursor-pointer hover:border-primary hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)] transition-all group duration-200"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-headline-md text-base md:text-lg font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors flex-1 pr-2">
          {note.title || "Untitled Note"}
        </h3>
        <button
          onClick={(e) => onToggleFavorite(note.id, e)}
          className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container-high cursor-pointer shrink-0"
          title={note.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Star
            className={`w-5 h-5 ${note.isFavorite ? "text-primary shrink-0" : "text-outline shrink-0"}`}
            fill={note.isFavorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      {/* Note Content Snippet */}
      <p className="font-body-sm text-sm text-on-surface-variant mb-6 flex-grow line-clamp-4 leading-relaxed font-normal break-words">
        {note.content || <em className="text-outline">No content</em>}
      </p>

      {/* Metadata & Actions */}
      <div className="flex flex-col gap-3 mt-auto">
        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.map((tag, idx) => (
              <span
                key={idx}
                className={`px-2.5 py-0.5 font-mono text-[10px] uppercase font-semibold tracking-wider rounded-full ${getTagColor(
                  tag
                )}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Date and hover actions */}
        <div className="flex justify-between items-center text-xs text-outline font-mono pt-1 border-t border-outline-variant/30">
          <span>{formattedDate}</span>

          {/* Quick Actions (Appear on hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Archive / Unarchive Action */}
            {!note.isTrashed && (
              <button
                onClick={(e) => onToggleArchive(note.id, e)}
                className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                title={note.isArchived ? "Unarchive Note" : "Archive Note"}
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Edit action */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(note);
              }}
              className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              title="Edit Note"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Trash / Delete permanently action */}
            <button
              onClick={(e) => onDelete(note.id, e)}
              className="p-1 rounded hover:bg-error-container/25 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
              title={note.isTrashed ? "Delete permanently" : "Move to Trash"}
            >
              {note.isTrashed ? <Trash2 className="w-3.5 h-3.5 text-error" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>

            {/* Restore action for trashed items */}
            {note.isTrashed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleArchive(note.id, e); // Toggle isTrashed in db to false
                }}
                className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                title="Restore note"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
