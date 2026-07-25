"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Song } from "../lib/data";
import { synth } from "../lib/audio";
import {
  TrophyIcon,
  Volume2Icon,
  VolumeXIcon,
  RefreshCwIcon,
  CheckIcon,
  SparklesIcon,
  CheckCircle2Icon,
  FlameIcon,
  ArrowRightIcon,
  DownloadIcon,
  PenLineIcon,
  UndoIcon,
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

interface InkParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}
interface TournamentStep {
  sortedList: string[];
  unrankedList: string[];
  currentChallengerId: string | null;
  binaryLeft: number;
  binaryRight: number;
  binaryMid: number;
  battleCount: number;
  playedTimeA: number;
  playedTimeB: number;
}

const formatTime = (sec: number) => {
  if (isNaN(sec) || sec <= 0) return "00:00";
  return `${Math.floor(sec / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(sec % 60)
    .toString()
    .padStart(2, "0")}`;
};

// Nostalgic lyrics mapping for major classics, with a dynamic fallback
const customLyrics: Record<string, string> = {
  "1": "“ 俗的无畏，雅的轻狂。最喜欢在深夜里，雅俗共赏。 ”",
  "2": "“ 庐州月光，洒在心头，月下的你暂不留。 ”",
  "3": "“ 为你唱首歌，没有什么大不了，有何不可。 ”",
  "4": "“ 又是清明雨上，折菊寄到你身旁，把你遗忘。 ”",
  "5": "“ 你的头像闪动着，那停留的手指，再也不曾亮起。 ”",
};

const customChorus: Record<string, number> = {
  "1": 68,
  "2": 68,
  "3": 50,
  "4": 66,
  "5": 64,
};

const getSongLyrics = (s: Song): string => {
  return customLyrics[s.id] || `“《${s.title}》：课桌底下的有线耳机与关于青春的旧夏天。 ”`;
};

const getSongChorus = (s: Song): number => {
  return customChorus[s.id] || 60;
};

export function BattleArena({
  songs,
  recordBattle,
  resetElo,
  updateComment,
  undoLastBattle,
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

  const [sortedList, setSortedList] = useState<string[]>([]);
  const [unrankedList, setUnrankedList] = useState<string[]>([]);
  const [currentChallengerId, setCurrentChallengerId] = useState<string | null>(null);

  const [binaryLeft, setBinaryLeft] = useState(0);
  const [binaryRight, setBinaryRight] = useState(0);
  const [binaryMid, setBinaryMid] = useState(0);
  const [battleCount, setBattleCount] = useState(0);
  const [maxRounds, setMaxRounds] = useState(30);

  const [playedTimeA, setPlayedTimeA] = useState(0);
  const [playedTimeB, setPlayedTimeB] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const [playbackProgress, setPlaybackProgress] = useState({ currentTime: 0, duration: 0 });
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const isScrubbingRef = useRef(false);

  const [draggedCard, setDraggedCard] = useState<"A" | "B" | null>(null);
  const [draggedOffset, setDraggedOffset] = useState({ x: 0, y: 0 });
  const [tiltA, setTiltA] = useState({ x: 0, y: 0 });
  const [tiltB, setTiltB] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<InkParticle[]>([]);
  const [tournamentHistory, setTournamentHistory] = useState<TournamentStep[]>([]);
  const [customComments, setCustomComments] = useState<Record<string, string>>({});
  const [editingCommentId, setEditingSongCommentId] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showSyncedToast, setShowSyncedToast] = useState(false);
  const [posterTheme, setPosterTheme] = useState<PosterTheme>("parchment");

  // ─── TIER 2: CHRONOLOGICAL DERIVED STATES (useMemos) ───
  // Declared BEFORE any handlers or useEffects so they are TDZ-safe
  const isAudited = playedTimeA >= 3 && playedTimeB >= 3;

  const sessionSongs = useMemo(() => {
    return songs.filter((s) => selectedSongIds.includes(s.id));
  }, [songs, selectedSongIds]);

  const songA = useMemo(() => {
    return songs.find((s) => s.id === currentChallengerId) || songs[0];
  }, [songs, currentChallengerId]);

  const songB = useMemo(() => {
    const defenderId = sortedList[binaryMid];
    return songs.find((s) => s.id === defenderId) || songs[1];
  }, [songs, sortedList, binaryMid]);

  const sortedSessionSongs = useMemo(() => {
    if (gameState === "completed") {
      return sortedList.map((id) => songs.find((s) => s.id === id)!).filter(Boolean);
    }
    return [...sessionSongs].sort((a, b) => (b.elo ?? 1200) - (a.elo ?? 1200));
  }, [songs, sortedList, sessionSongs, gameState]);

  const battleAnalytics = useMemo(() => {
    if (gameState !== "completed" || tournamentHistory.length === 0) return null;
    const battleCounts: Record<string, number> = {};
    tournamentHistory.forEach((step) => {
      if (step.currentChallengerId) {
        battleCounts[step.currentChallengerId] = (battleCounts[step.currentChallengerId] || 0) + 1;
      }
      const defenderId = step.sortedList[step.binaryMid];
      if (defenderId) {
        battleCounts[defenderId] = (battleCounts[defenderId] || 0) + 1;
      }
    });

    let nemesisId = "";
    let nemesisMaxCount = 0;
    Object.entries(battleCounts).forEach(([id, count]) => {
      if (count > nemesisMaxCount) {
        nemesisMaxCount = count;
        nemesisId = id;
      }
    });

    const nemesisSong = songs.find((s) => s.id === nemesisId);
    const absoluteKingId = sortedList[0];
    const absoluteKing = songs.find((s) => s.id === absoluteKingId);

    return {
      nemesisTitle: nemesisSong ? nemesisSong.title : "暂无",
      nemesisCount: nemesisMaxCount,
      absoluteKingTitle: absoluteKing ? absoluteKing.title : "暂无",
    };
  }, [gameState, tournamentHistory, songs, sortedList]);

  const metrics = useMemo(() => {
    if (sortedList.length === 0)
      return { confidence: "无数据", colorClass: "text-stone-400", progressPercentage: 0 };
    const p = Math.round((sortedList.length / selectedSongIds.length) * 100);
    return {
      progressPercentage: p,
      confidence:
        p < 40 ? `对决打磨中 (${p}%)` : p < 80 ? `初具规模 (${p}%)` : `金榜大功告成 (100%)`,
      colorClass:
        p < 40
          ? "text-red-500 bg-red-50"
          : p < 80
            ? "text-amber-600 bg-amber-50"
            : "text-emerald-600 bg-emerald-50",
    };
  }, [sortedList, selectedSongIds]);

  const presets = useMemo(
    () => [
      {
        id: "hits",
        name: "🔥 至尊热门金曲 (10首)",
        description: "《有何不可》《素颜》《庐州月》《断桥残雪》《玫瑰花的葬礼》等",
        matches: "对决约 22 轮",
        filter: () => ["1", "2", "3", "4", "5", "7", "16", "17", "18", "43"],
      },
      {
        id: "early",
        name: "🎒 网络远古情怀 (2006-2008)",
        description: "《你若成风》《南山忆》《浅唱》《雪花谣》《红尘沙画》等",
        matches: "对决约 10 轮",
        filter: (all: Song[]) =>
          all
            .filter((s) => s.album === "早期单曲" || s.year <= 2008 || s.id === "18")
            .map((s) => s.id),
      },
      {
        id: "golden",
        name: "💿 巅峰双神专 (2009-2010)",
        description: "《自定义》与《寻雾启示》全收录，《如果当时》《多余的解释》等",
        matches: "对决约 45 轮",
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
        name: "🍂 中期哲思 (2011-2018)",
        description: "《苏格拉没有底》至《寻宝游戏》，收录先锋作《等到烟火清凉》等",
        matches: "对决约 56 轮",
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
        name: "🌲 呼吸之野与近期 (13首)",
        description:
          "《呼吸之野》的冷冽哲思、最新单曲《飞驰于沙场》《昨夜书》《留香》《雨幕》《羡慕》等",
        matches: "对决约 33 轮",
        filter: (all: Song[]) =>
          all.filter((s) => s.album === "《呼吸之野》" || s.album === "近期单曲").map((s) => s.id),
      },
    ],
    []
  );

  // ─── TIER 3: TOPO INTERACTION HANDLERS ───
  const spawnInkSplashes = (target: "A" | "B" | "draw") => {
    const startX = target === "A" ? -180 : target === "B" ? 180 : 0;
    const temp: InkParticle[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 5;
      temp.push({
        id: Date.now() + i + Math.random(),
        x: startX,
        y: -40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 3 + Math.random() * 10,
        opacity: 0.9,
        color: "rgba(30,30,30,0.7)",
      });
    }
    setParticles(temp);
  };

  const handleVote = (outcome: "A" | "B" | "draw") => {
    if (!currentChallengerId || sortedList.length === 0 || !isAudited) return;
    const defenderId = sortedList[binaryMid];
    spawnInkSplashes(outcome);
    recordBattle(currentChallengerId, defenderId, outcome);
    setTournamentHistory((prev) => [
      ...prev,
      {
        sortedList: [...sortedList],
        unrankedList: [...unrankedList],
        currentChallengerId,
        binaryLeft,
        binaryRight,
        binaryMid,
        battleCount,
        playedTimeA,
        playedTimeB,
      },
    ]);

    synth.stop();
    setPlayingId(null);
    setBattleCount((v) => v + 1);
    setPlayedTimeA(0);
    setPlayedTimeB(0);
    setDraggedCard(null);
    setDraggedOffset({ x: 0, y: 0 });

    let left = binaryLeft;
    let right = binaryRight;
    if (outcome === "A") right = binaryMid - 1;
    else if (outcome === "B") left = binaryMid + 1;
    else {
      left = binaryMid + 1;
      right = binaryMid;
    }

    if (left > right) {
      const nextSorted = [...sortedList];
      nextSorted.splice(left, 0, currentChallengerId);
      if (unrankedList.length > 1) {
        setSortedList(nextSorted);
        setUnrankedList(unrankedList.slice(1));
        setCurrentChallengerId(unrankedList[1]);
        setBinaryLeft(0);
        setBinaryRight(nextSorted.length - 1);
        setBinaryMid(Math.floor((nextSorted.length - 1) / 2));
      } else {
        setSortedList(nextSorted);
        setCurrentChallengerId(null);
        setGameState("completed");
      }
    } else {
      const mid = Math.floor((left + right) / 2);
      setBinaryLeft(left);
      setBinaryRight(right);
      setBinaryMid(mid);
    }
  };

  const handleUndo = () => {
    if (tournamentHistory.length === 0) return;
    synth.stop();
    setPlayingId(null);
    undoLastBattle();
    const prev = tournamentHistory[tournamentHistory.length - 1];
    setSortedList(prev.sortedList);
    setUnrankedList(prev.unrankedList);
    setCurrentChallengerId(prev.currentChallengerId);
    setBinaryLeft(prev.binaryLeft);
    setBinaryRight(prev.binaryRight);
    setBinaryMid(prev.binaryMid);
    setBattleCount(prev.battleCount);
    setPlayedTimeA(3);
    setPlayedTimeB(3);
    setDraggedCard(null);
    setDraggedOffset({ x: 0, y: 0 });
    setTournamentHistory((v) => v.slice(0, -1));
  };

  const handleFinishBattle = () => {
    synth.stop();
    setPlayingId(null);
    setGameState("completed");
  };

  const handleSaveLocalComment = (id: string, text: string) => {
    setCustomComments((prev) => ({ ...prev, [id]: text }));
    updateComment(id, text);
    setEditingSongCommentId(null);
  };

  const handleSaveCeremonyResult = () => {
    setRankedOrder(sortedList);
    Object.entries(customComments).forEach(([id, text]) => updateComment(id, text));
    setShowSyncedToast(true);
    setTimeout(() => {
      setShowSyncedToast(false);
      setGameState("config");
    }, 2000);
  };

  const handleToggleSongSelect = (id: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(id) ? (prev.length <= 2 ? prev : prev.filter((x) => x !== id)) : [...prev, id]
    );
  };

  const handleStartBattle = () => {
    if (selectedSongIds.length < 2) return alert("请至少选择两首歌曲进行对决！");
    resetElo();
    const pool = songs.filter((s) => selectedSongIds.includes(s.id));
    setSortedList([pool[0].id]);
    setUnrankedList(pool.slice(1).map((s) => s.id));
    setCurrentChallengerId(pool.slice(1)[0]?.id || null);
    setBinaryLeft(0);
    setBinaryRight(0);
    setBinaryMid(0);
    setBattleCount(0);
    setPlayedTimeA(0);
    setPlayedTimeB(0);
    setTournamentHistory([]);
    setParticles([]);

    let sum = 0;
    for (let i = 2; i <= pool.length; i++) sum += Math.ceil(Math.log2(i));
    setMaxRounds(sum);
    setGameState("playing");
  };

  const handleDragAUpdate = (e: unknown, info: { offset: { x: number; y: number } }) => {
    setDraggedCard("A");
    setDraggedOffset({ x: info.offset.x, y: info.offset.y });
  };
  const handleDragAEnd = (e: unknown, info: { offset: { x: number; y: number } }) => {
    setDraggedCard(null);
    setDraggedOffset({ x: 0, y: 0 });
    if (isAudited) {
      if (info.offset.y < -110) handleVote("A");
      else if (info.offset.y > 100) handleVote("draw");
    }
  };
  const handleDragBUpdate = (e: unknown, info: { offset: { x: number; y: number } }) => {
    setDraggedCard("B");
    setDraggedOffset({ x: info.offset.x, y: info.offset.y });
  };
  const handleDragBEnd = (e: unknown, info: { offset: { x: number; y: number } }) => {
    setDraggedCard(null);
    setDraggedOffset({ x: 0, y: 0 });
    if (isAudited) {
      if (info.offset.y < -110) handleVote("B");
      else if (info.offset.y > 100) handleVote("draw");
    }
  };

  const handleMouseMoveA = (e: React.MouseEvent) => {
    const box = e.currentTarget.getBoundingClientRect();
    setTiltA({
      x: ((e.clientX - box.left - box.width / 2) / box.width) * 12,
      y: -((e.clientY - box.top - box.height / 2) / box.height) * 12,
    });
  };
  const handleMouseMoveB = (e: React.MouseEvent) => {
    const box = e.currentTarget.getBoundingClientRect();
    setTiltB({
      x: ((e.clientX - box.left - box.width / 2) / box.width) * 12,
      y: -((e.clientY - box.top - box.height / 2) / box.height) * 12,
    });
  };

  const handleTogglePlay = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingId === song.id) {
      synth.stop();
      setPlayingId(null);
    } else {
      synth.play(
        song.id,
        song.title,
        `/vae-song-stream?title=${encodeURIComponent(song.title)}`,
        () => setPlayingId(null)
      );
      setPlayingId(song.id);
    }
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

  // ─── TIER 4: COMPONENT INTERNAL EFFECTS & DEPS ───
  useEffect(() => {
    isScrubbingRef.current = isScrubbing;
  }, [isScrubbing]);

  // Audio timer
  useEffect(() => {
    if (!playingId || gameState !== "playing") return;
    const t = setInterval(() => {
      if (playingId === songA.id) setPlayedTimeA((v) => Math.min(3, v + 1));
      if (playingId === songB.id) setPlayedTimeB((v) => Math.min(3, v + 1));
    }, 1000);
    return () => clearInterval(t);
  }, [playingId, songA.id, songB.id, gameState]);

  // Audio playhead polling
  useEffect(() => {
    if (!playingId) return;
    let active = true;
    const update = () => {
      if (!active) return;
      if (!isScrubbingRef.current) {
        setPlaybackProgress({ currentTime: synth.getCurrentTime(), duration: synth.getDuration() });
      }
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
    return () => {
      active = false;
    };
  }, [playingId]);

  // Ink Splashes animation loop
  useEffect(() => {
    if (particles.length === 0) return;
    const f = requestAnimationFrame(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.12,
            opacity: p.opacity - 0.025,
          }))
          .filter((p) => p.opacity > 0)
      );
    });
    return () => cancelAnimationFrame(f);
  }, [particles]);

  const cardAStyle = useMemo(
    () =>
      gameState === "playing" && draggedCard === "B" && draggedOffset.y < -30
        ? {
            opacity: 1 - Math.min(0.65, -draggedOffset.y / 150),
            filter: `blur(${Math.min(3, (-draggedOffset.y - 30) / 30)}px)`,
          }
        : {},
    [draggedCard, draggedOffset, gameState]
  );
  const cardBStyle = useMemo(
    () =>
      gameState === "playing" && draggedCard === "A" && draggedOffset.y < -30
        ? {
            opacity: 1 - Math.min(0.65, -draggedOffset.y / 150),
            filter: `blur(${Math.min(3, (-draggedOffset.y - 30) / 30)}px)`,
          }
        : {},
    [draggedCard, draggedOffset, gameState]
  );

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden">
      {/* Ink splasher particles */}
      <div className="pointer-events-none absolute inset-0 z-30">
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `calc(50% + ${p.x}px)`,
              top: `calc(50% + ${p.y}px)`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: p.color,
              opacity: p.opacity,
              transform: "translate(-50%, -50%) blur(0.5px)",
            }}
          />
        ))}
      </div>

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
              许嵩单曲 ELO 争霸赛 · 智能天梯挑战
            </h2>
            <p className="mt-2 max-w-[50ch] font-serif text-xs leading-relaxed text-stone-500 dark:text-stone-400">
              基于 <b>二分插入锦标赛算法 (Binary Insertion Tournament)</b>，用最少对决次数产出 100%
              完美的个人专属金榜。我们已为您扩充至 <b>{songs.length} 首生涯至尊大曲库</b>！
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
                        {p.matches} ({pIds.length}首)
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
                    onClick={() => setSelectedSongIds(songs.slice(0, 2).map((s) => s.id))}
                    className="text-stone-500 hover:text-stone-900"
                  >
                    精简 2 首
                  </button>
                </div>
              </div>
              <div className="mt-3 flex max-h-52 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-stone-100 bg-stone-50/20 p-2.5 dark:border-stone-800 dark:bg-zinc-950/10">
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
                <span>开启对决之旅 (开始 PK)</span>
                <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* PLAYING SCREEN */}
      {gameState === "playing" && (
        <div className="flex flex-col gap-5">
          {/* Top Drop Target */}
          <AnimatePresence>
            {draggedCard && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed py-4 font-serif transition-colors ${!isAudited ? "animate-pulse border-stone-200 bg-stone-100/40 text-stone-400 dark:border-stone-800" : draggedOffset.y < -110 ? "dark:bg-amber-955/20 border-amber-500 bg-amber-50 text-amber-900 dark:text-amber-200" : "border-stone-300 bg-white text-stone-500"}`}
              >
                <TrophyIcon
                  className={`h-4 w-4 ${!isAudited ? "text-stone-300" : "animate-pulse text-amber-500"}`}
                />
                <span className="text-xs font-bold">
                  {!isAudited
                    ? "🎧 试听未满 3s：请先点击下方唱片分别试听"
                    : draggedOffset.y < -110
                      ? "松手立即确定：本轮投给此卡片 ✓"
                      : `向上拖拽《${draggedCard === "A" ? songA.title : songB.title}》投票`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cards 1v1 Grid */}
          <div className="relative grid grid-cols-1 items-stretch gap-4 select-none md:grid-cols-11">
            {/* Card A */}
            <motion.div
              drag
              dragSnapToOrigin
              dragConstraints={{ left: -30, right: 100, top: -180, bottom: 100 }}
              dragElastic={0.1}
              onDrag={handleDragAUpdate}
              onDragEnd={handleDragAEnd}
              style={cardAStyle}
              className="relative flex cursor-grab flex-col items-center justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:col-span-5 dark:border-stone-800 dark:bg-zinc-900"
            >
              <div
                onMouseMove={handleMouseMoveA}
                onMouseLeave={() => setTiltA({ x: 0, y: 0 })}
                style={{
                  transform: `perspective(600px) rotateX(${tiltA.y}deg) rotateY(${tiltA.x}deg)`,
                  transition: "transform 0.1s",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div className="w-full text-center">
                  <span className="inline-block rounded-md bg-stone-900 px-1.5 py-0.5 text-[8px] font-bold text-white dark:bg-stone-100 dark:text-stone-900">
                    ⚡ 挑战者
                  </span>
                  <h3 className="mt-2 truncate font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                    {songA.title}
                  </h3>
                  <p className="font-serif text-[10px] text-stone-400">
                    {songA.album} · {songA.year}
                  </p>
                  <p className="mt-2 line-clamp-1 min-h-6 font-serif text-[11px] text-stone-400 italic">
                    {getSongLyrics(songA)}
                  </p>
                </div>

                <div className="relative my-6 flex h-28 w-28 items-center justify-center">
                  <div
                    className={`absolute h-28 w-28 rounded-full bg-stone-900 shadow dark:bg-black ${playingId === songA.id ? "animate-spin" : ""}`}
                    style={{ animationDuration: "8s" }}
                  >
                    <div className="absolute inset-2 rounded-full border border-stone-800/40" />
                    <div className="absolute inset-4 rounded-full border border-stone-800/20" />
                    <div className="absolute inset-6 flex items-center justify-center rounded-full border border-stone-300 bg-stone-100/90 dark:bg-zinc-800">
                      <div className="h-4 w-4 rounded-full bg-stone-900/15" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleTogglePlay(songA, e)}
                    className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-stone-50 shadow-md dark:bg-zinc-800"
                  >
                    {playingId === songA.id ? (
                      <VolumeXIcon className="h-4 w-4 animate-pulse text-red-500" />
                    ) : (
                      <Volume2Icon className="h-4 w-4 text-stone-700 dark:text-stone-200" />
                    )}
                  </button>
                </div>

                {playingId === songA.id && playbackProgress.duration > 0 && (
                  <div className="mb-3 w-full px-2 select-none">
                    <div className="flex items-center gap-1.5 font-mono text-[9px] text-stone-400">
                      <span>
                        {formatTime(isScrubbing ? scrubValue : playbackProgress.currentTime)}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={playbackProgress.duration}
                        step={0.1}
                        value={isScrubbing ? scrubValue : playbackProgress.currentTime}
                        onMouseDown={() => {
                          setIsScrubbing(true);
                          setScrubValue(playbackProgress.currentTime);
                        }}
                        onTouchStart={() => {
                          setIsScrubbing(true);
                          setScrubValue(playbackProgress.currentTime);
                        }}
                        onChange={(e) => setScrubValue(parseFloat(e.target.value))}
                        onMouseUp={() => {
                          synth.seek(scrubValue);
                          setIsScrubbing(false);
                        }}
                        onTouchEnd={() => {
                          synth.seek(scrubValue);
                          setIsScrubbing(false);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-1 flex-1 cursor-pointer rounded-full bg-stone-100 focus:outline-none dark:bg-stone-800"
                      />
                      <span>{formatTime(playbackProgress.duration)}</span>
                    </div>
                    <div className="mt-1.5 flex justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          synth.seek(getSongChorus(songA));
                        }}
                        className="dark:bg-amber-955/20 flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 font-serif text-[9px] font-bold text-amber-600 hover:scale-105 active:scale-95"
                      >
                        <FlameIcon className="h-2 w-2" /> 直达副歌 ⚡{" "}
                        {formatTime(getSongChorus(songA))}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center gap-1 font-serif text-[10px]">
                  {playedTimeA >= 3 ? (
                    <span className="flex items-center gap-0.5 font-bold text-emerald-600">
                      <CheckCircle2Icon className="h-3 w-3" />
                      已解锁
                    </span>
                  ) : (
                    <span className="text-stone-400">
                      {playingId === songA.id ? `试听中 ${playedTimeA}/3s` : "未试听 (需3秒)"}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* VS Divider */}
            <div className="flex min-h-[40px] flex-col items-center justify-center py-1 font-serif font-bold text-stone-300 italic md:col-span-1">
              VS
            </div>

            {/* Card B */}
            <motion.div
              drag
              dragSnapToOrigin
              dragConstraints={{ left: -100, right: 30, top: -180, bottom: 100 }}
              dragElastic={0.1}
              onDrag={handleDragBUpdate}
              onDragEnd={handleDragBEnd}
              style={cardBStyle}
              className="relative flex cursor-grab flex-col items-center justify-between rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:col-span-5 dark:border-stone-800 dark:bg-zinc-900"
            >
              <div
                onMouseMove={handleMouseMoveB}
                onMouseLeave={() => setTiltB({ x: 0, y: 0 })}
                style={{
                  transform: `perspective(600px) rotateX(${tiltB.y}deg) rotateY(${tiltB.x}deg)`,
                  transition: "transform 0.1s",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div className="w-full text-center">
                  <span className="inline-block rounded-md bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-800">
                    🛡️ 守门员 第 {binaryMid + 1} 名
                  </span>
                  <h3 className="mt-2 truncate font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                    {songB.title}
                  </h3>
                  <p className="font-serif text-[10px] text-stone-400">
                    {songB.album} · {songB.year}
                  </p>
                  <p className="mt-2 line-clamp-1 min-h-6 font-serif text-[11px] text-stone-400 italic">
                    {getSongLyrics(songB)}
                  </p>
                </div>

                <div className="relative my-6 flex h-28 w-28 items-center justify-center">
                  <div
                    className={`absolute h-28 w-28 rounded-full bg-stone-900 shadow dark:bg-black ${playingId === songB.id ? "animate-spin" : ""}`}
                    style={{ animationDuration: "8s" }}
                  >
                    <div className="absolute inset-2 rounded-full border border-stone-800/40" />
                    <div className="absolute inset-4 rounded-full border border-stone-800/20" />
                    <div className="absolute inset-6 flex items-center justify-center rounded-full border border-stone-300 bg-stone-100/90 dark:bg-zinc-800">
                      <div className="h-6 w-6 rounded-full border border-stone-400/40 bg-stone-900/10 dark:bg-stone-50/10" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleTogglePlay(songB, e)}
                    className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-stone-50 shadow-md dark:bg-zinc-800"
                  >
                    {playingId === songB.id ? (
                      <VolumeXIcon className="h-4 w-4 animate-pulse text-red-500" />
                    ) : (
                      <Volume2Icon className="h-4 w-4 text-stone-700 dark:text-stone-200" />
                    )}
                  </button>
                </div>

                {playingId === songB.id && playbackProgress.duration > 0 && (
                  <div className="mb-3 w-full px-2 select-none">
                    <div className="flex items-center gap-1.5 font-mono text-[9px] text-stone-400">
                      <span>
                        {formatTime(isScrubbing ? scrubValue : playbackProgress.currentTime)}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={playbackProgress.duration}
                        step={0.1}
                        value={isScrubbing ? scrubValue : playbackProgress.currentTime}
                        onMouseDown={() => {
                          setIsScrubbing(true);
                          setScrubValue(playbackProgress.currentTime);
                        }}
                        onTouchStart={() => {
                          setIsScrubbing(true);
                          setScrubValue(playbackProgress.currentTime);
                        }}
                        onChange={(e) => setScrubValue(parseFloat(e.target.value))}
                        onMouseUp={() => {
                          synth.seek(scrubValue);
                          setIsScrubbing(false);
                        }}
                        onTouchEnd={() => {
                          synth.seek(scrubValue);
                          setIsScrubbing(false);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-1 flex-1 cursor-pointer rounded-full bg-stone-100 focus:outline-none dark:bg-stone-800"
                      />
                      <span>{formatTime(playbackProgress.duration)}</span>
                    </div>
                    <div className="mt-1.5 flex justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          synth.seek(getSongChorus(songB));
                        }}
                        className="dark:bg-amber-955/20 flex items-center gap-0.5 rounded-full bg-amber-50 px-2.5 py-0.5 font-serif text-[9px] font-bold text-amber-600 hover:scale-105 active:scale-95"
                      >
                        <FlameIcon className="h-2 w-2" /> 直达副歌 ⚡{" "}
                        {formatTime(getSongChorus(songB))}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center gap-1 font-serif text-[10px]">
                  {playedTimeB >= 3 ? (
                    <span className="flex items-center gap-0.5 font-bold text-emerald-600">
                      <CheckCircle2Icon className="h-3 w-3" />
                      已解锁
                    </span>
                  ) : (
                    <span className="text-stone-400">
                      {playingId === songB.id ? `试听中 ${playedTimeB}/3s` : "未试听 (需3秒)"}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Gestures Draw */}
          <div className="flex flex-col items-center gap-2">
            <AnimatePresence>
              {draggedCard && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex w-full items-center justify-center rounded-xl border-2 border-dashed py-3 font-serif text-xs ${draggedOffset.y > 100 ? "border-stone-500 bg-stone-100 text-stone-900 dark:bg-zinc-950 dark:text-stone-200" : "border-stone-200 text-stone-400"}`}
                >
                  <span>
                    {draggedOffset.y > 100
                      ? "松手确定平手 / 难分轩轾 📥"
                      : "向下拖拽判定本对决为 Draw (平手)"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {!draggedCard && (
              <div className="flex items-center gap-2 font-serif text-[11px] text-stone-400">
                {canUndo && (
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="hover:text-stone-955 dark:bg-zinc-955 flex items-center gap-1 rounded-full border bg-white px-3 py-1.5 shadow-sm dark:border-stone-800"
                  >
                    <UndoIcon className="h-3.5 w-3.5" /> 撤销上一步
                  </button>
                )}
                <span>( 向上 110px 投票选择，向下 100px 判为平手 )</span>
              </div>
            )}
          </div>

          {/* Stats Progress and天梯预览 */}
          <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between font-serif text-xs">
              <div>
                <h4 className="font-bold">智能天梯金榜进度看板</h4>
                <p className="text-[10px] text-stone-400">
                  已对决: {battleCount} / 约 {maxRounds} 轮 · 锁定排名: {sortedList.length} /{" "}
                  {selectedSongIds.length} 首
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${metrics.colorClass}`}
              >
                {metrics.confidence}
              </span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-stone-800">
              <div
                className="h-full rounded-full bg-stone-900 transition-all duration-300 dark:bg-stone-100"
                style={{ width: `${metrics.progressPercentage}%` }}
              />
            </div>

            <div className="dark:border-stone-850 flex items-center justify-between border-t border-stone-100 pt-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleFinishBattle}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 font-serif text-xs font-bold text-white hover:bg-amber-500"
                >
                  生成当前金榜
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("确定重置？")) {
                      synth.stop();
                      setGameState("config");
                    }
                  }}
                  className="dark:border-stone-850 rounded-lg border px-3 py-1.5 font-serif text-xs font-semibold text-stone-600"
                >
                  重置
                </button>
              </div>
              <span className="font-serif text-[10px] text-stone-400">
                高精度二分插入算法天梯 · 2026
              </span>
            </div>
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
              <h2 className="mt-2 text-xl font-bold">许嵩单曲 ELO 争霸赛 · 个人金榜</h2>
              <p className="mt-0.5 text-[10px] text-stone-500 italic">
                - 课桌底下的有线耳机与滚烫夏天 -
              </p>
            </div>

            {battleAnalytics && (
              <div className="dark:bg-zinc-955/20 my-4 rounded-xl border border-dashed border-stone-300 bg-stone-100/30 p-3.5 text-xs leading-relaxed text-stone-600 dark:border-stone-800 dark:text-stone-400">
                <h4 className="flex items-center gap-1 font-bold text-stone-900 dark:text-stone-200">
                  <SparklesIcon className="h-3.5 w-3.5 text-amber-500" />
                  水墨战况诊断报告
                </h4>
                <p className="mt-1">
                  <b>【第一挚爱】</b> 经过多轮攻防，您无懈可击的挚爱至尊为{" "}
                  <b>《{battleAnalytics.absoluteKingTitle}》</b>。
                </p>
                <p className="mt-1">
                  <b>【终极宿敌】</b> 您的最大决策纠结线为 <b>《{battleAnalytics.nemesisTitle}》</b>
                  （在对决中拉锯了 {battleAnalytics.nemesisCount} 次）。
                </p>
              </div>
            )}

            <div className="divide-stone-150 mt-4 flex flex-col gap-4 divide-y dark:divide-stone-800">
              {sortedSessionSongs.map((song, idx) => {
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
                        <span className="font-mono text-[10px] text-stone-400">
                          ELO {song.elo ?? 1200}
                        </span>
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
