"use client";

import { useMemo } from "react";
import { Reorder, useReducedMotion } from "motion/react";
import { Song } from "../lib/data";
import { PlusIcon, XIcon, GripVerticalIcon } from "lucide-react";

interface WorkspaceProps {
  songs: Song[];
  setRankedOrder: (ids: string[]) => void;
  onEditComment: (song: Song) => void;
}

export function Workspace({ songs, setRankedOrder, onEditComment }: WorkspaceProps) {
  const reduce = useReducedMotion();

  // Split songs into ranked and unranked
  const rankedSongs = useMemo(() => {
    return songs
      .filter((s) => s.rank !== null)
      .sort((a, b) => (a.rank as number) - (b.rank as number));
  }, [songs]);

  const unrankedSongs = useMemo(() => {
    return songs.filter((s) => s.rank === null).sort((a, b) => a.year - b.year);
  }, [songs]);

  const handleReorder = (newRankedSongs: Song[]) => {
    setRankedOrder(newRankedSongs.map((s) => s.id));
  };

  const handleAdd = (song: Song) => {
    const newOrder = [...rankedSongs, song].map((s) => s.id);
    setRankedOrder(newOrder);
  };

  const handleRemove = (songId: string) => {
    const newOrder = rankedSongs.filter((s) => s.id !== songId).map((s) => s.id);
    setRankedOrder(newOrder);
  };

  return (
    <div className="grid min-h-[60vh] grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
      {/* Left: Pool */}
      <div className="flex flex-col gap-4 md:col-span-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
            待入榜歌曲
          </h2>
          <span className="font-mono text-xs text-stone-500">{unrankedSongs.length} 首</span>
        </div>
        <p className="max-w-[40ch] text-sm text-stone-500">
          点击下方歌曲，将其加入右侧的榜单中进行排序。
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {unrankedSongs.map((song) => (
            <button
              key={song.id}
              onClick={() => handleAdd(song)}
              className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 transition-colors hover:border-stone-400 active:scale-95 dark:border-stone-800 dark:bg-zinc-900 dark:text-stone-300 dark:hover:border-stone-600"
            >
              <span>{song.title}</span>
              <PlusIcon className="h-3.5 w-3.5 opacity-50" />
            </button>
          ))}
          {unrankedSongs.length === 0 && (
            <div className="w-full rounded-xl border border-dashed border-stone-200 p-8 text-center text-sm text-stone-400 dark:border-stone-800">
              所有歌曲均已入榜。
            </div>
          )}
        </div>
      </div>

      {/* Right: Leaderboard */}
      <div className="flex flex-col gap-4 md:col-span-7">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
            你的专属榜单
          </h2>
          <span className="font-mono text-xs text-stone-500">{rankedSongs.length} 首</span>
        </div>
        <p className="max-w-[40ch] text-sm text-stone-500">
          拖拽调整名次。点击歌曲卡片可以添加专属评语。
        </p>

        <div className="mt-2 flex-1">
          {rankedSongs.length === 0 ? (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-dashed border-stone-200 text-sm text-stone-400 dark:border-stone-800">
              左侧选择歌曲开始排榜
            </div>
          ) : (
            <Reorder.Group
              axis="y"
              values={rankedSongs}
              onReorder={handleReorder}
              className="flex flex-col gap-3"
            >
              {rankedSongs.map((song, index) => (
                <Reorder.Item
                  key={song.id}
                  value={song}
                  className="group relative flex cursor-grab items-center gap-4 rounded-xl border border-stone-200 bg-white p-3 shadow-sm transition-colors select-none hover:border-stone-300 active:cursor-grabbing sm:p-4 dark:border-stone-800 dark:bg-zinc-900 dark:hover:border-stone-700"
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Rank Badge */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 font-mono text-sm text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                    {index + 1}
                  </div>

                  {/* Info */}
                  <div
                    className="flex min-w-0 flex-1 flex-col gap-1"
                    onClick={() => onEditComment(song)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-stone-900 dark:text-stone-100">
                        {song.title}
                      </span>
                      <span className="shrink-0 rounded-md border border-stone-100 px-1.5 py-0.5 text-xs text-stone-400 dark:border-stone-800">
                        {song.album}
                      </span>
                    </div>
                    {song.comment ? (
                      <p className="truncate text-sm text-stone-500 dark:text-stone-400">
                        &ldquo;{song.comment}&rdquo;
                      </p>
                    ) : (
                      <p className="text-xs text-stone-400 opacity-0 transition-opacity group-hover:opacity-100">
                        点击添加评语...
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(song.id);
                      }}
                      className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 active:scale-95 dark:hover:bg-stone-800"
                      title="移出榜单"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                    <div className="cursor-grab p-1 text-stone-300 active:cursor-grabbing dark:text-stone-600">
                      <GripVerticalIcon className="h-5 w-5" />
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </div>
      </div>
    </div>
  );
}
