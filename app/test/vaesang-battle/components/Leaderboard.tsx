"use client";

import { useEffect, useMemo, useState } from "react";
import { Song } from "../lib/data";
import { SparklesIcon, CalendarIcon, HeartIcon, RefreshCwIcon } from "lucide-react";

interface LeaderboardProps {
  songs: Song[];
}

interface SharedList {
  id: string;
  username: string;
  champion: string;
  nemesis: string;
  topSongs: string[];
  comment: string;
  timestamp: string;
}

type ActiveTab = "local" | "shared";

const formatTimeAgo = (isoString: string) => {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "昨天";
    return new Date(isoString).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  } catch {
    return "刚刚";
  }
};

export function Leaderboard({ songs }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("local");
  const [filterAlbum, setFilterAlbum] = useState<string>("all");

  // Shared board states
  const [sharedLists, setSharedLists] = useState<SharedList[]>([]);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedError, setSharedError] = useState<string | null>(null);

  // Sharing local state form
  const [shareName, setShareName] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  // Fetch cloud shared lists
  const fetchSharedLists = async () => {
    Promise.resolve().then(() => {
      setSharedLoading(true);
      setSharedError(null);
    });
    try {
      const res = await fetch("/vae-song-stream/shared");
      if (res.ok) {
        const data = await res.json();
        setSharedLists(data);
      } else {
        setSharedError("无法载入共享墙数据");
      }
    } catch {
      setSharedError("网络连接超时，请重试");
    } finally {
      setSharedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "shared") {
      const timer = setTimeout(() => {
        fetchSharedLists();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

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

  // Handle sharing of currently persisted local browser leaderboard
  const handleShareLocalList = async () => {
    if (rankedSongs.length === 0 || isShared) return;
    setShareLoading(true);
    try {
      const championSong = rankedSongs[0];
      const championTitle = championSong ? championSong.title : "暂无";
      const top5Titles = rankedSongs.slice(0, 5).map((s) => s.title);
      const championComment = championSong ? championSong.comment || "" : "";

      const response = await fetch("/vae-song-stream/shared", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: shareName || "匿名的嵩迷",
          champion: championTitle,
          topSongs: top5Titles,
          comment: championComment,
        }),
      });

      if (response.ok) {
        setIsShared(true);
        alert("🎉 恭喜！您积存的本地个人金榜已成功晒出！");
        // Automatically switch tab and refresh shared square wall to let the user see their name instantly!
        setActiveTab("shared");
        fetchSharedLists();
      } else {
        alert("提交失败，请重试");
      }
    } catch {
      alert("提交超时，请检查您的网络连接");
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Dynamic Tab Switcher */}
      <div className="mx-auto mb-2 flex w-full max-w-sm items-center justify-center rounded-xl bg-stone-200/50 p-1 select-none dark:bg-stone-800/50">
        <button
          onClick={() => setActiveTab("local")}
          className={`flex-1 rounded-lg py-2 text-center font-serif text-xs font-bold transition-all ${
            activeTab === "local"
              ? "bg-white text-stone-900 shadow-sm dark:bg-zinc-900 dark:text-stone-100"
              : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
          }`}
        >
          🏆 本机个人天梯榜
        </button>
        <button
          onClick={() => setActiveTab("shared")}
          className={`flex-1 rounded-lg py-2 text-center font-serif text-xs font-bold transition-all ${
            activeTab === "shared"
              ? "bg-white text-stone-900 shadow-sm dark:bg-zinc-900 dark:text-stone-100"
              : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
          }`}
        >
          🌍 大千世界共享广场
        </button>
      </div>

      {/* LOCAL LEADERBOARD TAB */}
      {activeTab === "local" && (
        <div className="flex flex-col gap-6">
          {rankedSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="mb-3 text-3xl">🗳️</span>
              <p className="mb-1 font-serif font-bold text-stone-500">本地暂无排单数据</p>
              <p className="max-w-[36ch] font-sans font-serif text-sm leading-relaxed text-stone-400">
                请前往「竞技场」开启一轮淘汰赛，或者点击右上角清空/一键重置缓存来载入天梯。
              </p>
            </div>
          ) : (
            <>
              {/* Cloud Shared Leaderboard Square Submission Form (Rendered directly at top of Local Leaderboard!) */}
              <div className="flex flex-col gap-3.5 rounded-2xl border bg-white p-5 font-serif text-xs shadow-sm dark:border-stone-800 dark:bg-zinc-900">
                <div>
                  <h4 className="flex items-center gap-1 text-sm font-bold text-stone-900 dark:text-stone-200">
                    🌍 晒出我的个人金榜到共享广场
                  </h4>
                  <p className="mt-0.5 font-sans text-[10px] leading-relaxed text-stone-400">
                    一键将您当前保存在本机天梯的第一名《{rankedSongs[0]?.title}》、Top 5
                    与专属评语上传分享，在全网共享墙上亮起您的大名！
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareName}
                    onChange={(e) => setShareName(e.target.value)}
                    disabled={isShared}
                    placeholder="✍️ 留下你的大名（默认：匿名的嵩迷）"
                    className="dark:border-stone-850 dark:bg-zinc-955 flex-1 rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-stone-400 dark:text-stone-200"
                  />
                  <button
                    type="button"
                    onClick={handleShareLocalList}
                    disabled={isShared || shareLoading}
                    className={`shrink-0 rounded-xl px-5 py-3 text-center font-extrabold transition-all ${
                      isShared
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400"
                        : shareLoading
                          ? "border border-stone-200 bg-stone-100 text-stone-400"
                          : "cursor-pointer bg-blue-600 text-white shadow-md shadow-blue-600/10 hover:bg-blue-500 active:scale-98"
                    }`}
                  >
                    {shareLoading ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-400 border-t-stone-800" />
                    ) : isShared ? (
                      "✓ 已成功晒出"
                    ) : (
                      "立即晒出"
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-1 flex items-center justify-between">
                <h2 className="font-serif text-base font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  Top {rankedSongs.length} 个人天梯金榜
                </h2>
                <select
                  value={filterAlbum}
                  onChange={(e) => setFilterAlbum(e.target.value)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-serif text-xs font-bold text-stone-700 outline-none focus:ring-1 focus:ring-stone-400 dark:border-stone-800 dark:bg-zinc-900 dark:text-stone-300"
                >
                  <option value="all">所有专辑</option>
                  {allAlbums.map((album) => (
                    <option key={album} value={album}>
                      {album}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 select-none md:grid-cols-2 lg:grid-cols-3">
                {filteredSongs.map((song) => {
                  const isTop = (song.rank as number) <= 3;
                  return (
                    <div
                      key={song.id}
                      className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5 transition-colors hover:border-stone-300 dark:border-stone-800 dark:bg-zinc-900 dark:hover:border-stone-700"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-serif text-sm font-black shadow-sm ${
                            isTop
                              ? song.rank === 1
                                ? "bg-amber-600 text-white"
                                : song.rank === 2
                                  ? "bg-stone-500 text-white"
                                  : "bg-amber-800 text-white"
                              : "dark:bg-zinc-955 bg-stone-100 text-stone-400"
                          }`}
                        >
                          {song.rank}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-serif text-base leading-tight font-bold text-stone-900 dark:text-stone-100">
                            {song.title}
                          </h3>
                          <p className="mt-1 truncate font-serif text-[10px] text-stone-400">
                            {song.album} · {song.year}
                          </p>
                        </div>
                      </div>
                      {song.comment && (
                        <div className="dark:border-stone-850 mt-1 border-t border-stone-100 pt-3">
                          <p className="line-clamp-3 font-serif text-xs leading-relaxed text-stone-500 italic dark:text-stone-400">
                            &ldquo; {song.comment} &rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredSongs.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-dashed border-stone-200 py-12 text-center font-serif text-xs text-stone-400 dark:border-stone-800">
                    此专辑下暂无入榜歌曲。
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* CLOUD SHARED SQUARE TAB */}
      {activeTab === "shared" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-1 font-serif text-base font-bold tracking-tight text-stone-900 dark:text-stone-100">
                <SparklesIcon className="h-4 w-4 text-amber-500" />
                <span>全网嵩迷共享金榜广场 (Shared Wall)</span>
              </h2>
              <p className="mt-0.5 font-serif text-[10px] text-stone-400">
                读别人的回忆，找回当年那个单曲循环的炙热夏天
              </p>
            </div>
            <button
              onClick={fetchSharedLists}
              disabled={sharedLoading}
              className="dark:border-stone-850 flex h-7 w-7 items-center justify-center rounded-full border bg-white text-stone-500 shadow-sm hover:text-stone-900 dark:bg-zinc-900 dark:text-stone-300"
              title="刷新广场"
            >
              <RefreshCwIcon className={`h-3.5 w-3.5 ${sharedLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {sharedLoading && sharedLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-stone-800" />
              <p className="mt-3 font-serif text-xs text-stone-400">正在拉取全网最新大千金榜...</p>
            </div>
          ) : sharedError && sharedLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center font-serif text-stone-400">
              <span className="mb-1 text-2xl">📡</span>
              <p className="text-xs">{sharedError}</p>
              <button
                onClick={fetchSharedLists}
                className="mt-3 rounded-lg border bg-white px-3 py-1.5 font-serif text-[10px] font-bold dark:bg-zinc-900"
              >
                重新加载
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 select-none md:grid-cols-2">
              {sharedLists.map((item) => (
                <div
                  key={item.id}
                  className="dark:border-stone-850 relative flex flex-col gap-3 rounded-2xl border border-stone-200 bg-[#fcfaf2]/50 p-5 shadow-sm dark:bg-zinc-900/40"
                >
                  {/* Card Header: Username and Timeago */}
                  <div className="border-stone-150 flex items-center justify-between border-b pb-2.5 font-serif text-[10.5px] dark:border-stone-800">
                    <span className="flex items-center gap-1 font-extrabold text-stone-900 dark:text-stone-100">
                      👤 {item.username}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 font-sans text-stone-400">
                      <CalendarIcon className="h-3 w-3" />
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>

                  {/* Champion Display Block */}
                  <div className="rounded-xl border border-blue-100 bg-[#eff6ff] p-2.5 dark:border-blue-900/30 dark:bg-blue-950/20">
                    <span className="block font-serif text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      👑 册封至尊神作
                    </span>
                    <span className="mt-0.5 block font-serif text-sm leading-tight font-extrabold text-blue-950 dark:text-blue-100">
                      《 {item.champion} 》
                    </span>
                  </div>

                  {/* Comment block in beautiful Quote format */}
                  {item.comment && (
                    <div className="rounded-r-lg border-l-4 border-stone-300 bg-stone-50 p-3 font-serif text-xs leading-relaxed text-stone-600 italic dark:border-zinc-700 dark:bg-zinc-900 dark:text-stone-400">
                      “ {item.comment} ”
                    </div>
                  )}

                  {/* Top 5 Songs Hall of Fame */}
                  <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-0.5 font-serif text-[9.5px] font-bold text-stone-400">
                      <HeartIcon className="h-2.5 w-2.5 fill-current text-red-500" /> Top 5
                      挚爱单曲殿堂:
                    </span>
                    <div className="flex flex-wrap gap-1 font-serif">
                      {item.topSongs.slice(0, 5).map((title, i) => (
                        <span
                          key={title + i}
                          className="rounded-full bg-stone-100 px-2 py-0.5 text-[9.5px] font-medium text-stone-700 dark:bg-zinc-800 dark:text-stone-300"
                        >
                          {i + 1}. {title}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
