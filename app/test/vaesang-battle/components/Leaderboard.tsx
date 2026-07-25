"use client";

import { useMemo, useState } from "react";
import { Song } from "../lib/data";

interface LeaderboardProps {
  songs: Song[];
}

export function Leaderboard({ songs }: LeaderboardProps) {
  const [filterAlbum, setFilterAlbum] = useState<string>("all");

  const rankedSongs = useMemo(() => {
    return songs
      .filter((s) => s.rank !== null)
      .sort((a, b) => (a.rank as number) - (b.rank as number));
  }, [songs]);

  const filteredSongs = useMemo(() => {
    if (filterAlbum === "all") return rankedSongs;
    return rankedSongs.filter((s) => s.album === filterAlbum);
  }, [rankedSongs, filterAlbum]);

  const allAlbums = useMemo(() => {
    const albums = new Set(rankedSongs.map((s) => s.album));
    return Array.from(albums);
  }, [rankedSongs]);

  if (rankedSongs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="mb-2 text-stone-500">暂无排单数据</p>
        <p className="text-sm text-stone-400">请前往「工作台」拖拽歌曲进行排榜。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium tracking-tight text-stone-900 dark:text-stone-100">
          Top {rankedSongs.length} 许嵩单曲
        </h2>
        <select
          value={filterAlbum}
          onChange={(e) => setFilterAlbum(e.target.value)}
          className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-stone-500 dark:border-stone-800 dark:bg-zinc-900 dark:text-stone-300"
        >
          <option value="all">所有专辑</option>
          {allAlbums.map((album) => (
            <option key={album} value={album}>
              {album}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSongs.map((song) => (
          <div
            key={song.id}
            className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-stone-300 dark:border-stone-800 dark:bg-zinc-900 dark:hover:border-stone-700"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-900 font-mono text-sm font-bold text-white dark:bg-stone-100 dark:text-stone-900">
                {song.rank}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-medium text-stone-900 dark:text-stone-100">
                  {song.title}
                </h3>
                <p className="mt-0.5 truncate text-xs text-stone-500">
                  {song.album} · {song.year}
                </p>
              </div>
            </div>
            {song.comment && (
              <div className="mt-2 border-t border-stone-100 pt-3 dark:border-stone-800/50">
                <p className="line-clamp-3 text-sm text-stone-600 italic dark:text-stone-400">
                  &ldquo;{song.comment}&rdquo;
                </p>
              </div>
            )}
          </div>
        ))}
        {filteredSongs.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-stone-200 py-12 text-center text-sm text-stone-400 dark:border-stone-800">
            此专辑下暂无入榜歌曲。
          </div>
        )}
      </div>
    </div>
  );
}
