"use client";

import { useRef, useState } from "react";
import { useSongs } from "./lib/store";
import { Song } from "./lib/data";
import { BattleArena } from "./components/BattleArena";
import { Workspace } from "./components/Workspace";
import { Leaderboard } from "./components/Leaderboard";
import { EditModal } from "./components/EditModal";
import { motion } from "motion/react";
import { DownloadIcon, UploadIcon, Trash2Icon } from "lucide-react";

type Tab = "battle" | "workspace" | "leaderboard";

export default function VaesangBattlePage() {
  const {
    songs,
    isLoaded,
    updateComment,
    clearAllRanks,
    exportData,
    importData,
    setRankedOrder,
    recordBattle,
    resetElo,
    syncEloToLeaderboard,
    undoLastBattle,
    canUndo,
  } = useSongs();

  const [activeTab, setActiveTab] = useState<Tab>("battle");
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-stone-800" />
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importData(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-stone-50/80 backdrop-blur-md dark:border-stone-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 font-serif font-bold text-white italic dark:bg-stone-100 dark:text-stone-900">
              V
            </div>
            <h1 className="hidden text-lg font-medium tracking-tight text-stone-900 sm:block dark:text-stone-100">
              Vae Song Battle
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-stone-200/50 p-1 dark:bg-stone-800/50">
            {(["battle", "workspace", "leaderboard"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "text-stone-900 dark:text-stone-100"
                    : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 rounded-md border border-stone-200/50 bg-white shadow-sm dark:border-stone-700/50 dark:bg-zinc-900"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">
                  {tab === "battle" ? "竞技场" : tab === "workspace" ? "工作台" : "排行榜"}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md p-2 text-stone-500 transition-colors hover:bg-stone-200 dark:hover:bg-stone-800"
              title="导入数据"
            >
              <UploadIcon className="h-4 w-4" />
            </button>
            <button
              onClick={exportData}
              className="rounded-md p-2 text-stone-500 transition-colors hover:bg-stone-200 dark:hover:bg-stone-800"
              title="导出数据"
            >
              <DownloadIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (confirm("确定要清空所有排名数据吗？")) clearAllRanks();
              }}
              className="rounded-md p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
              title="清空排名"
            >
              <Trash2Icon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12">
        {activeTab === "battle" ? (
          <BattleArena
            songs={songs}
            recordBattle={recordBattle}
            resetElo={resetElo}
            syncEloToLeaderboard={syncEloToLeaderboard}
            updateComment={updateComment}
            undoLastBattle={undoLastBattle}
            canUndo={canUndo}
            setRankedOrder={setRankedOrder}
          />
        ) : activeTab === "workspace" ? (
          <Workspace songs={songs} setRankedOrder={setRankedOrder} onEditComment={setEditingSong} />
        ) : (
          <Leaderboard songs={songs} />
        )}
      </main>

      {/* Modals */}
      <EditModal
        song={editingSong}
        isOpen={!!editingSong}
        onClose={() => setEditingSong(null)}
        onSave={updateComment}
      />
    </div>
  );
}
