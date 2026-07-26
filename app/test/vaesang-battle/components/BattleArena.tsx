"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Song } from "../lib/data";
import { synth } from "../lib/audio";
import {
  RefreshCwIcon,
  CheckIcon,
  SparklesIcon,
  FlameIcon,
  ArrowRightIcon,
  DownloadIcon,
  PenLineIcon,
  UndoIcon,
  PlayIcon,
  VolumeXIcon,
} from "lucide-react";

interface BattleArenaProps {
  songs: Song[];
  recordBattle: (songAId: string, songBId: string, outcome: "A" | "B" | "draw") => void;
  resetElo: () => void;
  syncEloToLeaderboard: () => void;
  updateComment: (id: string, comment: string) => void;
  undoLastBattle: () => void;
  canUndo: boolean;
  setRankedOrder: (ids: string[]) => void;
}

type ArenaState = "config" | "playing" | "completed";
type PosterTheme = "parchment" | "inkwash" | "film";

// Round definitions matching the image structure
interface RoundDef {
  id: string;
  name: string;
  targetStrength: number;
}

const customChorus: Record<string, number> = {
  "1": 68,
  "2": 68,
  "3": 50,
  "4": 66,
  "5": 64,
};

const getSongChorus = (s: Song): number => {
  return customChorus[s.id] || 60;
};

export function BattleArena({
  songs,
  resetElo,
  updateComment,
  canUndo,
  setRankedOrder,
}: BattleArenaProps) {
  // ─── TIER 1: RAW STATE HOOKS ───
  const [gameState, setGameState] = useState<ArenaState>("config");
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>(() => [
    "1",
    "2",
    "3",
    "4",
    "5",
    "7",
    "16",
    "17",
    "18",
    "43",
  ]);

  // Tournament specific states
  const [activeSongs, setActiveSongs] = useState<Song[]>([]);
  const [eliminatedSongs, setEliminatedSongs] = useState<{ song: Song; roundId: string }[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [selectedInGroup, setSelectedInGroup] = useState<string[]>([]);
  const [advancedSongs, setAdvancedSongs] = useState<string[]>([]);

  // Local storage for history to support Undo
  const [tournamentHistory, setTournamentHistory] = useState<
    {
      activeSongs: Song[];
      eliminatedSongs: { song: Song; roundId: string }[];
      currentRoundIndex: number;
      currentGroupIndex: number;
      selectedInGroup: string[];
      advancedSongs: string[];
    }[]
  >([]);

  const [playingId, setPlayingId] = useState<string | null>(null);

  const [customComments, setCustomComments] = useState<Record<string, string>>({});
  const [editingCommentId, setEditingSongCommentId] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showSyncedToast, setShowSyncedToast] = useState(false);
  const [shareName, setShareName] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [posterTheme, setPosterTheme] = useState<PosterTheme>("parchment");

  // ─── TIER 2: CHRONOLOGICAL DERIVED STATES (useMemos) ───
  const sessionSongs = useMemo(() => {
    return songs.filter((s) => selectedSongIds.includes(s.id));
  }, [songs, selectedSongIds]);

  // Determine starting round and tournament configuration based on total count
  const tournamentConfig = useMemo(() => {
    const totalCount = activeSongs.length > 0 ? activeSongs.length : sessionSongs.length;
    let target = 128;
    if (totalCount > 64) target = 128;
    else if (totalCount > 32) target = 64;
    else if (totalCount > 16) target = 32;
    else if (totalCount > 8) target = 16;
    else if (totalCount > 4) target = 8;
    else if (totalCount > 2) target = 4;
    else target = 2;

    const allRounds: RoundDef[] = [
      { id: "128_64", name: "128 进 64", targetStrength: 64 },
      { id: "64_32", name: "64 进 32", targetStrength: 32 },
      { id: "32_16", name: "32 进 16", targetStrength: 16 },
      { id: "16_8", name: "16 进 8", targetStrength: 8 },
      { id: "8_4", name: "8 进 4", targetStrength: 4 },
      { id: "4_2", name: "4 进 2", targetStrength: 2 },
      { id: "championship", name: "冠军战", targetStrength: 1 },
    ];

    // Filter rounds to start from the nearest bracket
    const startIndex = allRounds.findIndex((r) => {
      if (target === 128) return r.id === "128_64";
      if (target === 64) return r.id === "64_32";
      if (target === 32) return r.id === "32_16";
      if (target === 16) return r.id === "16_8";
      if (target === 8) return r.id === "8_4";
      if (target === 4) return r.id === "4_2";
      return r.id === "championship";
    });

    return {
      bracketSize: target,
      rounds: allRounds.slice(startIndex),
    };
  }, [activeSongs.length, sessionSongs.length]);

  const currentRoundDef = useMemo(() => {
    return tournamentConfig.rounds[currentRoundIndex] || tournamentConfig.rounds[0];
  }, [tournamentConfig, currentRoundIndex]);

  // Grouping configuration
  const groupSize = useMemo(() => {
    if (currentRoundDef.id === "championship") return 2;
    if (currentRoundDef.id === "4_2") return 4;
    return 8; // Default group of 8
  }, [currentRoundDef]);

  const targetSelectCount = useMemo(() => {
    return groupSize / 2; // Always select exactly half to advance
  }, [groupSize]);

  const totalGroups = useMemo(() => {
    return Math.max(1, Math.ceil(activeSongs.length / groupSize));
  }, [activeSongs, groupSize]);

  const groupSongs = useMemo(() => {
    const start = currentGroupIndex * groupSize;
    return activeSongs.slice(start, start + groupSize);
  }, [activeSongs, currentGroupIndex, groupSize]);

  // Final compile sorted ranking on completed
  const sortedSessionSongs = useMemo(() => {
    if (gameState !== "completed") return [];

    // Ordered from Rank 1 (Champion) to Rank N
    const result: Song[] = [];

    // 1. Champion is the active advancedSongs (exactly 1 element left)
    const champ = activeSongs[0];
    if (champ) result.push(champ);

    // 2. Add Runner-up (eliminated in championship)
    const runnerUp = eliminatedSongs.find((e) => e.roundId === "championship")?.song;
    if (runnerUp) result.push(runnerUp);

    // 3. Add eliminated songs round by round in reverse order
    const roundOrder = ["4_2", "8_4", "16_8", "32_16", "64_32", "128_64"];
    roundOrder.forEach((rId) => {
      const songsInRound = eliminatedSongs
        .filter((e) => e.roundId === rId)
        .map((e) => e.song)
        // Secondary sort by Elo rating or year
        .sort((a, b) => (b.elo ?? 1200) - (a.elo ?? 1200));
      result.push(...songsInRound);
    });

    return result;
  }, [gameState, activeSongs, eliminatedSongs]);

  const presets = useMemo(
    () => [
      {
        id: "hits",
        name: "🔥 至尊热门金曲 (10首)",
        description: "《有何不可》《素颜》《庐州月》《断桥残雪》《玫瑰花的葬礼》等",
        filter: () => ["1", "2", "3", "4", "5", "7", "16", "17", "18", "43"],
      },
      {
        id: "early",
        name: "🎒 网络远古情怀 (32首)",
        description: "《你若成风》《南山忆》《浅唱》《雪花谣》《红尘沙画》等",
        filter: (all: Song[]) =>
          all
            .filter((s) => s.album === "早期单曲" || s.year <= 2008 || s.id === "18")
            .map((s) => s.id),
      },
      {
        id: "golden",
        name: "💿 巅峰双神专 (18首)",
        description: "《自定义》与《寻雾启示》全收录，《如果当时》《多余的解释》等",
        filter: (all: Song[]) =>
          all
            .filter(
              (s) =>
                s.album === "《自定义》" ||
                s.album === "《寻雾启示》" ||
                s.id === "16" ||
                s.id === "17"
            )
            .map((s) => s.id),
      },
      {
        id: "philosophy",
        name: "🍂 中期哲思 (47首)",
        description: "《苏格拉没有底》至《寻宝游戏》，收录先锋作《等到烟火清凉》等",
        filter: (all: Song[]) =>
          all
            .filter((s) =>
              [
                "《苏格拉没有底》",
                "《梦游计》",
                "《不如吃茶去》",
                "《青年晚报》",
                "《寻宝游戏》",
              ].includes(s.album)
            )
            .map((s) => s.id),
      },
      {
        id: "indie",
        name: "🌲 呼吸之野与近期 (25首)",
        description:
          "《呼吸之野》的冷冽哲思、最新单曲《飞驰于沙场》《昨夜书》《留香》《雨幕》《羡慕》等",
        filter: (all: Song[]) =>
          all.filter((s) => s.album === "《呼吸之野》" || s.album === "近期单曲").map((s) => s.id),
      },
    ],
    []
  );

  // ─── TIER 3: TOPO INTERACTION HANDLERS ───
  const handleToggleSongSelect = (id: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(id) ? (prev.length <= 2 ? prev : prev.filter((x) => x !== id)) : [...prev, id]
    );
  };

  const handleStartBattle = () => {
    if (selectedSongIds.length < 2) return alert("请至少选择两首歌曲进行对决！");
    synth.stop();
    setPlayingId(null);
    resetElo();

    // 1. Gather selected songs
    const pool = songs.filter((s) => selectedSongIds.includes(s.id));

    // 2. Pad to nearest power of 2 bracket
    let target = 2;
    if (pool.length > 64) target = 128;
    else if (pool.length > 32) target = 64;
    else if (pool.length > 16) target = 32;
    else if (pool.length > 8) target = 16;
    else if (pool.length > 4) target = 8;
    else if (pool.length > 2) target = 4;

    const paddedPool = [...pool];
    const unselected = songs.filter((s) => !selectedSongIds.includes(s.id));

    while (paddedPool.length < target && unselected.length > 0) {
      paddedPool.push(unselected.shift()!);
    }

    // 3. Shuffle pool to mix groups beautifully
    const shuffledPool = paddedPool.sort(() => Math.random() - 0.5);

    setActiveSongs(shuffledPool);
    setEliminatedSongs([]);
    setCurrentRoundIndex(0);
    setCurrentGroupIndex(0);
    setSelectedInGroup([]);
    setAdvancedSongs([]);
    setTournamentHistory([]);
    setGameState("playing");

    // Autoplay the first song of Group 1
    const firstSong = shuffledPool[0];
    if (firstSong) {
      setTimeout(() => {
        synth.play(
          firstSong.id,
          firstSong.title,
          `/vae-song-stream?title=${encodeURIComponent(firstSong.title)}`,
          () => setPlayingId(null),
          getSongChorus(firstSong)
        );
        setPlayingId(firstSong.id);
      }, 300);
    }
  };

  // Toggle selection (checks/unchecks) - Separated from play
  const handleToggleSelect = (song: Song) => {
    const isSelected = selectedInGroup.includes(song.id);
    if (isSelected) {
      setSelectedInGroup((prev) => prev.filter((id) => id !== song.id));
    } else {
      if (selectedInGroup.length < targetSelectCount) {
        setSelectedInGroup((prev) => [...prev, song.id]);
      }
    }
  };

  // Toggle play (auditions chorus directly!) - Separated from selection
  const handleTogglePlay = (song: Song) => {
    if (playingId === song.id) {
      synth.stop();
      setPlayingId(null);
    } else {
      // Pass getSongChorus(song) directly as 5th argument so it starts natively from chorus climax!
      synth.play(
        song.id,
        song.title,
        `/vae-song-stream?title=${encodeURIComponent(song.title)}`,
        () => setPlayingId(null),
        getSongChorus(song)
      );
      setPlayingId(song.id);
    }
  };

  const handleClearGroupSelection = () => {
    setSelectedInGroup([]);
  };

  const handleConfirmAdvancement = () => {
    if (selectedInGroup.length !== targetSelectCount) return;

    synth.stop();
    setPlayingId(null);

    // Save current step to history stack for Undo support
    setTournamentHistory((prev) => [
      ...prev,
      {
        activeSongs: [...activeSongs],
        eliminatedSongs: [...eliminatedSongs],
        currentRoundIndex,
        currentGroupIndex,
        selectedInGroup: [...selectedInGroup],
        advancedSongs: [...advancedSongs],
      },
    ]);

    // Group calculation
    const roundEliminated = groupSongs
      .filter((s) => !selectedInGroup.includes(s.id))
      .map((s) => ({ song: s, roundId: currentRoundDef.id }));

    const nextAdvanced = [...advancedSongs, ...selectedInGroup];
    const nextEliminated = [...eliminatedSongs, ...roundEliminated];

    // Check if there are more groups in this round
    if (currentGroupIndex < totalGroups - 1) {
      setAdvancedSongs(nextAdvanced);
      setEliminatedSongs(nextEliminated);
      setSelectedInGroup([]);
      setCurrentGroupIndex((v) => v + 1);

      // Autoplay the first song of the next group
      const nextGroupFirstSong = activeSongs[(currentGroupIndex + 1) * groupSize];
      if (nextGroupFirstSong) {
        setTimeout(() => {
          synth.play(
            nextGroupFirstSong.id,
            nextGroupFirstSong.title,
            `/vae-song-stream?title=${encodeURIComponent(nextGroupFirstSong.title)}`,
            () => setPlayingId(null),
            getSongChorus(nextGroupFirstSong)
          );
          setPlayingId(nextGroupFirstSong.id);
        }, 150);
      }
    } else {
      // Current round completed! Transition to next round
      const advancedPool = nextAdvanced
        .map((id) => songs.find((s) => s.id === id)!)
        .filter(Boolean);

      if (currentRoundDef.id === "championship") {
        // Championship completed! We have our winner!
        setActiveSongs(advancedPool);
        setEliminatedSongs(nextEliminated);
        localStorage.removeItem("vaesong_tournament_active_state"); // Clear active tournament save on championship complete!
        setGameState("completed");
      } else {
        // Move to next round
        setActiveSongs(advancedPool);
        setEliminatedSongs(nextEliminated);
        setCurrentRoundIndex((v) => v + 1);
        setCurrentGroupIndex(0);
        setSelectedInGroup([]);
        setAdvancedSongs([]);

        // Autoplay the first song of the first group of the new round
        const nextRoundFirstSong = advancedPool[0];
        if (nextRoundFirstSong) {
          setTimeout(() => {
            synth.play(
              nextRoundFirstSong.id,
              nextRoundFirstSong.title,
              `/vae-song-stream?title=${encodeURIComponent(nextRoundFirstSong.title)}`,
              () => setPlayingId(null),
              getSongChorus(nextRoundFirstSong)
            );
            setPlayingId(nextRoundFirstSong.id);
          }, 150);
        }
      }
    }
  };

  const handleUndo = () => {
    if (tournamentHistory.length === 0) return;
    synth.stop();
    setPlayingId(null);
    const lastState = tournamentHistory[tournamentHistory.length - 1];

    setActiveSongs(lastState.activeSongs);
    setEliminatedSongs(lastState.eliminatedSongs);
    setCurrentRoundIndex(lastState.currentRoundIndex);
    setCurrentGroupIndex(lastState.currentGroupIndex);
    setSelectedInGroup(lastState.selectedInGroup);
    setAdvancedSongs(lastState.advancedSongs);
    setTournamentHistory((prev) => prev.slice(0, -1));
  };

  const handleSaveLocalComment = (id: string, text: string) => {
    setCustomComments((prev) => ({ ...prev, [id]: text }));
    updateComment(id, text);
    setEditingSongCommentId(null);
  };

  const handleSaveCeremonyResult = () => {
    const finalOrderedIds = sortedSessionSongs.map((s) => s.id);
    setRankedOrder(finalOrderedIds);
    Object.entries(customComments).forEach(([id, text]) => updateComment(id, text));
    setShowSyncedToast(true);
    localStorage.removeItem("vaesong_tournament_active_state"); // Clear active tournament save on complete sync!
    setTimeout(() => {
      setShowSyncedToast(false);
      setGameState("config");
    }, 2000);
  };

  const handleExportPoster = () => {
    setIsGeneratingImage(true);
    try {
      const c = document.createElement("canvas");
      c.width = 700;
      c.height = 1000;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = posterTheme === "film" ? "#18181b" : "#fcfaf2";
      ctx.fillRect(0, 0, 700, 1000);
      ctx.fillStyle = posterTheme === "film" ? "#ffffff" : "#1c1917";
      ctx.font = "bold 32px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("许嵩单曲智能金榜", 350, 80);
      sortedSessionSongs.slice(0, 5).forEach((song, i) => {
        ctx.fillStyle = posterTheme === "film" ? "#a1a1aa" : "#78716c";
        ctx.font = "20px serif";
        ctx.textAlign = "left";
        ctx.fillText(
          `${i + 1}. 《${song.title}》 · ${song.album} · ELO ${song.elo ?? 1200}`,
          100,
          180 + i * 140
        );
        ctx.font = "italic 16px sans-serif";
        ctx.fillText(
          customComments[song.id] || song.comment || "“ 回忆在有线耳机里慢慢流淌 ”",
          120,
          215 + i * 140
        );
      });
      const link = document.createElement("a");
      link.href = c.toDataURL();
      link.download = `Vae_Golden_List_${posterTheme}.png`;
      link.click();
    } catch {
      alert("生成卡片失败！");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShareGoldenList = async () => {
    if (isShared) return;
    setShareLoading(true);
    try {
      const championSong = sortedSessionSongs[0];
      const championTitle = championSong ? championSong.title : "暂无";
      const top5Titles = sortedSessionSongs.slice(0, 5).map((s) => s.title);
      const championComment = championSong
        ? (customComments[championSong.id] ?? championSong.comment)
        : "";

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
        alert(
          "🎉 恭喜！您的金榜已成功晒出到共享广场！大家现在都能在「大千世界共享广场」看到您的册封报告啦！"
        );
      } else {
        alert("提交失败，请重试");
      }
    } catch {
      alert("提交超时，请检查您的网络连接");
    } finally {
      setShareLoading(false);
    }
  };

  // ─── TIER 4: COMPONENT INTERNAL EFFECTS & DEPS ───

  // 1. Auto-save active tournament state to LocalStorage
  useEffect(() => {
    if (gameState === "playing") {
      const stateToSave = {
        gameState,
        activeSongs,
        eliminatedSongs,
        currentRoundIndex,
        currentGroupIndex,
        selectedInGroup,
        advancedSongs,
        tournamentHistory,
        selectedSongIds,
      };
      localStorage.setItem("vaesong_tournament_active_state", JSON.stringify(stateToSave));
    }
  }, [
    gameState,
    activeSongs,
    eliminatedSongs,
    currentRoundIndex,
    currentGroupIndex,
    selectedInGroup,
    advancedSongs,
    tournamentHistory,
    selectedSongIds,
  ]);

  // 2. Hot-resume active tournament state on Mount (with self-healing metadata merging)
  useEffect(() => {
    const savedStateStr = localStorage.getItem("vaesong_tournament_active_state");
    if (savedStateStr) {
      try {
        const saved = JSON.parse(savedStateStr);
        if (saved && saved.gameState === "playing") {
          // Self-heal and restore latest metadata from static songs list (handles album/title typo updates)
          const restoredActive = saved.activeSongs.map((s: Song) => {
            const staticSong = songs.find((x) => x.id === s.id);
            return staticSong ? { ...staticSong, elo: s.elo } : s;
          });

          const restoredEliminated = saved.eliminatedSongs.map(
            (e: { song: Song; roundId: string }) => {
              const staticSong = songs.find((x) => x.id === e.song.id);
              return {
                song: staticSong ? { ...staticSong, elo: e.song.elo } : e.song,
                roundId: e.roundId,
              };
            }
          );

          // Wrap inside setTimeout macro-task to completely decouple from React Mount and satisfy ESLint setstate rule
          setTimeout(() => {
            setActiveSongs(restoredActive);
            setEliminatedSongs(restoredEliminated);
            setCurrentRoundIndex(saved.currentRoundIndex);
            setCurrentGroupIndex(saved.currentGroupIndex);
            setSelectedInGroup(saved.selectedInGroup);
            setAdvancedSongs(saved.advancedSongs);
            setTournamentHistory(saved.tournamentHistory);
            setSelectedSongIds(saved.selectedSongIds || []);
            setGameState("playing");

            // Seamlessly autoplay the first song of the currently resumed group at its chorus
            const K = saved.currentRoundIndex === 5 ? 4 : saved.currentRoundIndex === 6 ? 2 : 8;
            const firstSong = restoredActive[saved.currentGroupIndex * K];
            if (firstSong) {
              synth.play(
                firstSong.id,
                firstSong.title,
                `/vae-song-stream?title=${encodeURIComponent(firstSong.title)}`,
                () => setPlayingId(null),
                getSongChorus(firstSong)
              );
              setPlayingId(firstSong.id);
            }
          }, 0);
        }
      } catch (err) {
        console.warn("[Vae Tournament Restore] Failed to parse active tournament state", err);
      }
    }
  }, [songs]);

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden">
      {/* CONFIG SCREEN */}
      {gameState === "config" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white/70 px-4 py-10 text-center shadow-sm dark:border-stone-800 dark:bg-zinc-900/60">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 font-serif text-xl text-white italic dark:bg-stone-100 dark:text-stone-900">
              V
            </span>
            <h2 className="font-serif text-2xl font-bold dark:text-stone-100">
              许嵩单曲分组晋级赛 · 智能天梯决选
            </h2>
            <p className="mt-2 max-w-[50ch] font-serif text-xs leading-relaxed text-stone-500 dark:text-stone-400">
              采用截图同款<b>「分组淘汰晋级锦标赛」制</b>，128
              首曲目两两分组对决。点击歌曲自动高保真播放副歌，一键选定、层层筛选，直达冠军之巅！
            </p>
          </div>

          <div className="flex flex-col gap-5 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-zinc-900">
            <div>
              <h3 className="font-serif text-xs font-bold text-stone-900 dark:text-stone-200">
                1. 选用经典编年史快捷曲池
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {presets.map((p) => {
                  const pIds = p.filter(songs);
                  const active =
                    selectedSongIds.length === pIds.length &&
                    pIds.every((id) => selectedSongIds.includes(id));
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedSongIds(pIds)}
                      className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${active ? "border-stone-955 dark:bg-zinc-955/40 bg-stone-50/50 dark:border-stone-200" : "border-stone-200 hover:scale-[1.01]"}`}
                    >
                      <span className="flex items-center gap-1 text-xs font-bold text-stone-900 dark:text-stone-100">
                        {p.name}
                        {active && (
                          <span className="h-1 w-1 animate-pulse rounded-full bg-amber-500" />
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-1 font-serif text-[10px] text-stone-400">
                        {p.description}
                      </span>
                      <span className="mt-1.5 rounded bg-stone-100/60 px-1.5 py-0.5 text-[9px] font-bold text-stone-500">
                        {pIds.length}首曲池
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-stone-150 border-t pt-5 dark:border-stone-800">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-serif text-xs font-bold text-stone-900 dark:text-stone-200">
                  2. 确认或微调参赛候选单曲 ({selectedSongIds.length} 首已勾选)
                </h3>
                <div className="flex gap-2 font-serif text-[10px]">
                  <button
                    onClick={() => setSelectedSongIds(songs.map((s) => s.id))}
                    className="text-stone-500 hover:text-stone-900"
                  >
                    全选 {songs.length} 首
                  </button>
                  <span className="text-stone-300">·</span>
                  <button
                    onClick={() => setSelectedSongIds(songs.slice(0, 10).map((s) => s.id))}
                    className="text-stone-500 hover:text-stone-900"
                  >
                    精选 10 首
                  </button>
                </div>
              </div>
              <div className="dark:bg-zinc-955/10 mt-3 flex max-h-52 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-stone-100 bg-stone-50/20 p-2.5 dark:border-stone-800">
                {songs.map((song) => {
                  const checked = selectedSongIds.includes(song.id);
                  return (
                    <button
                      key={song.id}
                      onClick={() => handleToggleSongSelect(song.id)}
                      className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all ${checked ? "dark:text-stone-955 border-stone-900 bg-stone-950 text-white dark:border-stone-100 dark:bg-stone-100" : "border-stone-200 bg-white text-stone-600 dark:border-stone-800 dark:bg-zinc-900 dark:text-stone-400"}`}
                    >
                      <span>{song.title}</span>
                      <span className="text-[9px] opacity-40">({song.year})</span>
                      {checked && <CheckIcon className="h-2.5 w-2.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-1 flex justify-center border-t border-stone-100 pt-5 dark:border-stone-800">
              <button
                onClick={handleStartBattle}
                className="group flex items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-xs font-bold text-white transition-all hover:scale-105 active:scale-95 dark:bg-stone-100 dark:text-stone-900"
              >
                <FlameIcon className="h-3.5 w-3.5 animate-pulse text-amber-500" />
                <span>开启分组淘汰赛 (开始 PK)</span>
                <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* PLAYING SCREEN */}
      {gameState === "playing" && (
        <div className="flex flex-col gap-4 font-sans text-stone-800 dark:text-stone-200">
          {/* Header Progress matching IMG_5274 */}
          <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight md:text-2xl">
                  {currentRoundDef.name}
                </h2>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-stone-400">
                  <span>
                    第 {currentGroupIndex + 1} / {totalGroups} 组
                  </span>
                  <span>•</span>
                  <span>本轮目标：选出 {currentRoundDef.targetStrength} 强</span>
                </div>
              </div>
              <div className="dark:bg-amber-955/20 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                双击可切换试听
              </div>
            </div>

            {/* Custom styled lavender/blue Progress Track */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((currentGroupIndex + 1) / totalGroups) * 100}%` }}
              />
            </div>

            {/* Round Pills Navigation match 100% */}
            <div className="dark:border-stone-850 flex scrollbar-none items-center gap-1.5 overflow-x-auto border-t border-stone-100 py-1 pt-3">
              {tournamentConfig.rounds.map((r, index) => {
                const isActive = index === currentRoundIndex;
                const isCompleted = index < currentRoundIndex;
                return (
                  <span
                    key={r.id}
                    className={`shrink-0 rounded-full px-3 py-1 text-[10.5px] font-bold transition-all ${
                      isActive
                        ? "dark:bg-blue-955/30 border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:text-blue-400"
                        : isCompleted
                          ? "bg-stone-100 text-stone-400 line-through dark:bg-zinc-800 dark:text-stone-500"
                          : "bg-stone-50/50 text-stone-300 dark:bg-zinc-950 dark:text-stone-600"
                    }`}
                  >
                    {r.name}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Group Prompt Guidance */}
          <div className="px-1 text-xs leading-relaxed font-medium text-stone-500 dark:text-stone-400">
            当前组共 <b className="text-stone-900 dark:text-stone-100">{groupSongs.length} 首</b>
            ，请选择 <b className="text-blue-600 dark:text-blue-400">{targetSelectCount} 首</b>{" "}
            你更喜欢的歌曲。已选满后点击「确认晋级」。
          </div>

          {/* Song Grid (8 items - Double Column side-by-side) */}
          <div className="grid grid-cols-2 gap-3">
            {groupSongs.map((song) => {
              const checked = selectedInGroup.includes(song.id);
              const isPlaying = playingId === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => handleToggleSelect(song)}
                  className={`relative flex min-h-[76px] cursor-pointer flex-row items-center justify-between rounded-2xl border-2 px-3 py-3 text-left transition-all duration-200 select-none active:scale-97 md:min-h-[88px] ${
                    checked
                      ? "dark:bg-blue-955/30 border-blue-500 bg-[#eff6ff] text-blue-900 shadow-sm dark:border-blue-400 dark:text-blue-100"
                      : isPlaying
                        ? "dark:bg-amber-955/10 border-amber-400 bg-amber-50/10 text-stone-900 dark:border-amber-500 dark:text-stone-100"
                        : "dark:border-stone-850 border-stone-200 bg-white text-stone-700 hover:bg-stone-50/50 dark:bg-zinc-900 dark:text-stone-300"
                  }`}
                >
                  {/* Left: Dedicated play button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePlay(song);
                    }}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all md:h-8 md:w-8 ${
                      isPlaying
                        ? "animate-pulse border-amber-600 bg-amber-500 text-white"
                        : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:bg-zinc-800 dark:text-stone-300"
                    }`}
                  >
                    {isPlaying ? (
                      <VolumeXIcon className="h-3.5 w-3.5" />
                    ) : (
                      <PlayIcon className="h-3.5 w-3.5 fill-current" />
                    )}
                  </button>

                  {/* Center: Song info */}
                  <div className="flex min-w-0 flex-1 flex-col items-start pl-2">
                    <span className="max-w-full truncate font-serif text-[12.5px] leading-tight font-extrabold text-stone-900 md:text-[14.5px] dark:text-stone-100">
                      {song.title}
                    </span>
                    <span className="mt-1 max-w-full truncate font-serif text-[9.5px] leading-none opacity-40">
                      {song.album} ({song.year})
                    </span>
                  </div>

                  {/* Right: Checkbox indicator */}
                  <div className="flex shrink-0 items-center justify-center pl-1">
                    {checked ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm md:h-5 md:w-5 dark:bg-blue-500">
                        <CheckIcon className="h-2.5 w-2.5 stroke-[3] md:h-3 md:w-3" />
                      </span>
                    ) : (
                      <span className="dark:bg-zinc-955 h-4 w-4 rounded-full border border-stone-200 bg-white md:h-5 md:w-5 dark:border-stone-700" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Status Footer matching 100% */}
          <div className="flex flex-col gap-1 rounded-xl border border-dashed border-stone-200 bg-stone-50/40 p-4 font-serif text-xs leading-relaxed text-stone-500 shadow-inner dark:border-stone-800 dark:bg-zinc-950/20">
            <div className="flex justify-between">
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                已选择{" "}
                <b className="font-bold text-blue-600 dark:text-blue-400">
                  {selectedInGroup.length} / {targetSelectCount}
                </b>
                ：
              </span>
              <span className="text-[10px] opacity-60">点击卡片可在选定与取消之间自如切换</span>
            </div>
            <div className="mt-0.5 truncate text-[12.5px] font-extrabold text-stone-800 dark:text-stone-200">
              {selectedInGroup.length > 0
                ? selectedInGroup.map((id) => songs.find((s) => s.id === id)?.title).join(" 、 ")
                : "尚未在本组挑选任何晋级单曲"}
            </div>
          </div>

          {/* Control Bar Actions Button Row */}
          <div className="mt-1 flex items-center justify-between gap-3 font-serif text-xs select-none">
            <button
              type="button"
              onClick={() => {
                if (confirm("确定重置对决并返回首页？这将清除当前所有对决进度。")) {
                  synth.stop();
                  localStorage.removeItem("vaesong_tournament_active_state");
                  setGameState("config");
                }
              }}
              className="dark:border-stone-850 rounded-full border border-stone-200 bg-white px-4 py-3 font-bold text-red-500 transition-all hover:bg-red-50/10 active:scale-95 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/20"
            >
              重置
            </button>

            <button
              type="button"
              onClick={handleClearGroupSelection}
              className="dark:border-stone-850 rounded-full border border-stone-200 bg-white px-4 py-3 font-bold text-stone-600 transition-all hover:bg-stone-50 active:scale-95 dark:bg-zinc-900 dark:text-stone-300"
            >
              清空本组
            </button>

            {canUndo && (
              <button
                type="button"
                onClick={handleUndo}
                className="dark:border-stone-850 flex items-center gap-1 rounded-full border border-stone-200 bg-white px-4 py-3 font-bold text-stone-600 transition-all hover:bg-stone-50 active:scale-95 dark:bg-zinc-900 dark:text-stone-300"
              >
                <UndoIcon className="h-3 w-3" />
                <span>撤销</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirmAdvancement}
              disabled={selectedInGroup.length !== targetSelectCount}
              className={`flex-1 rounded-full px-6 py-3 text-center font-serif text-xs font-extrabold transition-all duration-200 active:scale-98 ${
                selectedInGroup.length !== targetSelectCount
                  ? "dark:border-stone-850 cursor-not-allowed border border-stone-200 bg-stone-100 text-stone-300 dark:bg-zinc-950 dark:text-stone-700"
                  : "cursor-pointer bg-blue-600 text-white shadow-md shadow-blue-600/10 hover:bg-blue-500"
              }`}
            >
              确认晋级
            </button>
          </div>

          {/* Helper details */}
          <div className="dark:border-stone-850 mt-1 flex items-center justify-between border-t border-stone-100 px-1 pt-3 font-serif text-[10px] text-stone-400">
            <span>双核对决淘汰制锦标赛 · Vae Song Arena</span>
            <span>
              按 <b>确认晋级</b> 可演进到下一组
            </span>
          </div>
        </div>
      )}

      {/* CEREMONY COMPLETE SCREEN */}
      {gameState === "completed" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto flex max-w-xl flex-col gap-6"
        >
          <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-[#fcfaf2] p-6 font-serif text-stone-900 shadow-md dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100">
            <div className="flex flex-col items-center border-b pb-4 text-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 font-serif text-base text-white italic">
                V
              </span>
              <h2 className="mt-2 text-xl font-bold">许嵩单曲分组晋级赛 · 个人金榜</h2>
              <p className="mt-0.5 text-[10px] text-stone-500 italic">
                - 课桌底下的有线耳机与滚烫夏天 -
              </p>
            </div>

            <div className="dark:bg-zinc-955/20 my-4 rounded-xl border border-dashed border-stone-300 bg-stone-100/30 p-3.5 text-xs leading-relaxed text-stone-600 dark:border-stone-800 dark:text-stone-400">
              <h4 className="flex items-center gap-1 font-bold text-stone-900 dark:text-stone-200">
                <SparklesIcon className="h-3.5 w-3.5 text-amber-500" />
                水墨金榜册封报告
              </h4>
              <p className="mt-1">
                <b>【第一挚爱】</b> 经过多轮残酷的小组突围、半决赛及终极巅峰对决，您册封的无尚至尊为{" "}
                <b>《{sortedSessionSongs[0]?.title}》</b>。
              </p>
              <p className="mt-1">
                <b>【天梯封赏】</b>{" "}
                我们已根据各首曲目在各轮淘汰赛中坚持的深度，为您自动精密编译出了完整的 ELO
                梯级金榜，点击下方卡片可留下您专属的回忆评语。
              </p>
            </div>

            <div className="divide-stone-150 mt-4 flex flex-col gap-4 divide-y dark:divide-stone-800">
              {sortedSessionSongs.slice(0, 8).map((song, idx) => {
                const isTop = idx < 3;
                const val = customComments[song.id] ?? song.comment;
                return (
                  <div
                    key={song.id}
                    className={`flex items-start gap-3 pt-4 ${idx === 0 ? "border-none pt-0" : ""}`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-sm ${isTop ? (idx === 0 ? "bg-amber-600 text-white" : idx === 1 ? "bg-stone-500 text-white" : "bg-amber-800 text-white") : "text-stone-400"}`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-bold">
                          {song.title}{" "}
                          <b className="py-0.2 dark:border-stone-850 rounded-md border px-1 text-[10px] font-normal">
                            {song.album}
                          </b>
                        </span>
                        <span className="font-mono text-[10px] text-stone-400">R{song.year}</span>
                      </div>
                      <div className="group relative">
                        {editingCommentId === song.id ? (
                          <div className="mt-1 flex items-end gap-1.5">
                            <textarea
                              value={val}
                              onChange={(e) =>
                                setCustomComments({ ...customComments, [song.id]: e.target.value })
                              }
                              className="flex-1 rounded-lg border bg-white p-2 text-xs outline-none focus:ring-1 focus:ring-stone-500 dark:border-stone-700 dark:bg-zinc-800"
                              rows={2}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveLocalComment(song.id, val)}
                              className="rounded-lg bg-stone-950 px-2.5 py-1.5 text-xs text-white dark:bg-stone-100 dark:text-stone-900"
                            >
                              确定
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => setEditingSongCommentId(song.id)}
                            className="mt-1 cursor-pointer rounded-lg bg-stone-100/50 p-2 text-[11px] text-stone-500 italic hover:bg-stone-200/50 dark:bg-zinc-800/20"
                          >
                            {val ? (
                              `“ ${val} ”`
                            ) : (
                              <span className="flex items-center gap-1 text-[10px]">
                                <PenLineIcon className="h-2.5 w-2.5" /> 留下你对这首歌的评语感悟...
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cloud Shared Leaderboard Square Submission Form */}
          <div className="flex flex-col gap-3.5 rounded-2xl border bg-white p-5 font-serif text-xs shadow-sm dark:border-stone-800 dark:bg-zinc-900">
            <div>
              <h4 className="flex items-center gap-1 text-sm font-bold text-stone-900 dark:text-stone-200">
                🌍 晒出我的金榜到共享广场
              </h4>
              <p className="mt-0.5 text-[10px] text-stone-400">
                将您的金榜殿堂和冠军评语一键上传，在全网歌迷的「大千世界共享广场」亮起您的署名！
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareName}
                onChange={(e) => setShareName(e.target.value)}
                disabled={isShared}
                placeholder="✍️ 留下你的大名（默认：匿名的嵩迷）"
                className="dark:bg-zinc-955 flex-1 rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-stone-400 dark:border-stone-800 dark:text-stone-200"
              />
              <button
                type="button"
                onClick={handleShareGoldenList}
                disabled={isShared || shareLoading}
                className={`shrink-0 rounded-xl px-5 py-3 text-center font-extrabold transition-all ${
                  isShared
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400"
                    : shareLoading
                      ? "border border-stone-200 bg-stone-100 text-stone-400"
                      : "bg-blue-600 text-white shadow-md shadow-blue-600/10 hover:bg-blue-500 active:scale-98"
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

          <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 font-serif text-xs dark:border-stone-800 dark:bg-zinc-900">
            <h4 className="font-bold">选择分享卡片画意主题 (Canvas Poster Style)</h4>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  {
                    id: "parchment",
                    name: "古籍宣纸",
                    cl: "border-amber-200 text-amber-900 bg-amber-50/10",
                  },
                  {
                    id: "inkwash",
                    name: "极简水墨",
                    cl: "border-stone-300 text-stone-900 bg-stone-50",
                  },
                  { id: "film", name: "文艺胶片", cl: "border-zinc-700 text-zinc-100 bg-zinc-950" },
                ] as const
              ).map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setPosterTheme(th.id)}
                  className={`rounded-lg border p-2 text-center font-bold transition-all ${posterTheme === th.id ? "scale-102 ring-2 ring-stone-900 dark:ring-stone-100" : "opacity-60"} ${th.cl}`}
                >
                  {th.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 font-serif sm:flex-row">
            <button
              type="button"
              onClick={handleSaveCeremonyResult}
              className="bg-stone-955 flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-xs font-bold text-white dark:bg-stone-100 dark:text-stone-900"
            >
              <CheckIcon className="h-4 w-4" /> 同步到主排行榜
            </button>
            <button
              type="button"
              onClick={handleExportPoster}
              disabled={isGeneratingImage}
              className="dark:bg-zinc-955 flex flex-1 items-center justify-center gap-1.5 rounded-full border bg-white py-3 text-xs font-semibold text-stone-700 dark:border-stone-800 dark:text-stone-300"
            >
              {isGeneratingImage ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-400 border-t-stone-800" />
              ) : (
                <DownloadIcon className="h-4 w-4" />
              )}{" "}
              保存卡片海报
            </button>
            <button
              type="button"
              onClick={() => {
                resetElo();
                localStorage.removeItem("vaesong_tournament_active_state"); // Clear active tournament save on play again!
                setGameState("config");
              }}
              className="dark:bg-zinc-955 flex flex-1 items-center justify-center gap-1.5 rounded-full border bg-white py-3 text-xs font-semibold text-stone-700 dark:border-stone-800 dark:text-stone-300"
            >
              <RefreshCwIcon className="h-4 w-4" /> 重新再战
            </button>
          </div>
        </motion.div>
      )}

      {/* Sync Toast */}
      <AnimatePresence>
        {showSyncedToast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 shadow dark:bg-emerald-950 dark:text-emerald-200"
          >
            <CheckIcon className="h-3.5 w-3.5" />{" "}
            <span>排名及专属感悟已成功同步保存至主「排行榜」！</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
