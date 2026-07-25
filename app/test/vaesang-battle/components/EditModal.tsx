"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Song } from "../lib/data";
import { XIcon } from "lucide-react";

interface EditModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, comment: string) => void;
}

export function EditModal({ song, isOpen, onClose, onSave }: EditModalProps) {
  return (
    <AnimatePresence>
      {isOpen && song && (
        <EditModalContent key={song.id} song={song} onClose={onClose} onSave={onSave} />
      )}
    </AnimatePresence>
  );
}

interface EditModalContentProps {
  song: Song;
  onClose: () => void;
  onSave: (id: string, comment: string) => void;
}

function EditModalContent({ song, onClose, onSave }: EditModalContentProps) {
  const [comment, setComment] = useState(song.comment || "");

  const handleSave = () => {
    onSave(song.id, comment);
    onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm dark:bg-black/60"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl dark:border-stone-800 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between border-b border-stone-100 p-4 dark:border-stone-800">
          <div>
            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100">编辑评语</h3>
            <p className="text-sm text-stone-500">{song.title}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 active:scale-95 dark:hover:bg-stone-800"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="写下你对这首歌的专属感悟..."
            className="h-32 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-transparent focus:ring-2 focus:ring-stone-500 dark:border-stone-800 dark:bg-zinc-950 dark:text-stone-200"
            autoFocus
          />
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-stone-100 bg-stone-50 p-4 dark:border-stone-800 dark:bg-zinc-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-stone-800 active:scale-95 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            保存评语
          </button>
        </div>
      </motion.div>
    </div>
  );
}
