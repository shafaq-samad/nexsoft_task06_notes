import React, { useState, useEffect } from "react";
import { X, Star, Plus, ShieldCheck, AlertTriangle } from "lucide-react";
import { Note } from "../types";

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: {
    title: string;
    content: string;
    tags: string[];
    isFavorite: boolean;
    isArchived?: boolean;
    isTrashed?: boolean;
  }) => Promise<void>;
  editingNote: Note | null;
}

export default function NoteModal({ isOpen, onClose, onSave, editingNote }: NoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
      setTags(editingNote.tags || []);
      setIsFavorite(editingNote.isFavorite);
    } else {
      setTitle("");
      setContent("");
      setTags([]);
      setIsFavorite(false);
    }
    setErrorMsg("");
  }, [editingNote, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = tagInput.trim().replace(/,/g, "");
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/,/g, "");
      if (cleanTag && !tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
        setTagInput("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      setErrorMsg("Please provide either a title or content for the note.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await onSave({
        title,
        content,
        tags,
        isFavorite,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save note. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white border border-outline-variant rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="font-headline-md text-lg font-bold text-primary">
              {editingNote ? "Modify Encrypted Note" : "Create New Secure Note"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container-high cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-error-container text-on-error-container rounded-lg flex items-center gap-2 text-sm border border-error/20">
              <AlertTriangle className="w-4 h-4 text-error shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-1">
            <label className="font-label-md text-xs text-on-surface-variant font-medium uppercase tracking-wider block" htmlFor="note-title">
              Note Title
            </label>
            <input
              id="note-title"
              type="text"
              className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2.5 font-sans font-semibold text-base text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-outline-variant"
              placeholder="e.g. Q3 Strategic Planning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Content Field */}
          <div className="space-y-1">
            <label className="font-label-md text-xs text-on-surface-variant font-medium uppercase tracking-wider block" htmlFor="note-content">
              Secure Payload Content
            </label>
            <textarea
              id="note-content"
              rows={8}
              className="w-full bg-white border border-outline-variant rounded-lg px-4 py-3 font-sans text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-outline-variant resize-y"
              placeholder="Write your encrypted notes here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Tags Manager */}
          <div className="space-y-2">
            <label className="font-label-md text-xs text-on-surface-variant font-medium uppercase tracking-wider block" htmlFor="note-tags">
              Classification Tags
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-surface-container-low border border-outline-variant rounded-lg min-h-12 items-center">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-secondary/10"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-on-secondary-container hover:text-error transition-colors font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}

              <div className="flex-grow flex items-center min-w-36">
                <input
                  id="note-tags"
                  type="text"
                  className="bg-transparent border-none outline-none focus:ring-0 text-xs text-on-surface w-full p-1"
                  placeholder="Type tag and press enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="text-primary hover:text-primary-container p-1 cursor-pointer"
                  title="Add Tag"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Config Row */}
          <div className="flex justify-between items-center py-2 border-t border-b border-outline-variant/30">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer select-none"
              >
                <Star
                  className={`w-5 h-5 ${isFavorite ? "text-primary fill-current" : "text-outline"}`}
                />
                <span>Flag as Favorite</span>
              </button>
            </div>

            <div className="text-xs font-mono text-outline">
              AES-256 Client-Server Payload
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-bold bg-primary text-white hover:bg-primary-container rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Encrypting & Saving..." : "Save Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
