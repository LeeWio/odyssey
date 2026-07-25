"use client";

import { useEffect, useState } from "react";
import { initialSongs, Song } from "./data";

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [songsHistory, setSongsHistory] = useState<Song[][]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("vaesong_battle_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Masterful self-healing merging strategy:
          // Keep user's custom ranks, comments, and ELOs for existing songs,
          // while seamlessly injecting any newly expanded songs with defaults!
          const merged = initialSongs.map((initialSong) => {
            const savedSong = parsed.find((s) => s.id === initialSong.id);
            if (savedSong) {
              return {
                ...initialSong, // Use latest static metadata (title, album, year)
                rank: savedSong.rank,
                comment: savedSong.comment ?? "",
                elo: savedSong.elo ?? 1200,
                matchCount: savedSong.matchCount ?? 0,
              };
            }
            // Newly added song
            return {
              ...initialSong,
              rank: null,
              comment: "",
              elo: 1200,
              matchCount: 0,
            };
          });

          console.log(
            `[Vae Song Battle Store] Successfully loaded cache. Merged ${parsed.length} cached entries into ${merged.length} total songs.`
          );

          setTimeout(() => {
            setSongs(merged);
            setIsLoaded(true);
          }, 0);
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved songs data", e);
      }
    }
    const initializedInitial = initialSongs.map((s) => ({
      ...s,
      elo: 1200,
      matchCount: 0,
    }));
    setTimeout(() => {
      setSongs(initializedInitial);
      setIsLoaded(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("vaesong_battle_data", JSON.stringify(songs));
    }
  }, [songs, isLoaded]);

  const updateRank = (id: string, newRank: number | null) => {
    setSongs((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, rank: newRank } : s));
      return updated;
    });
  };

  const updateComment = (id: string, comment: string) => {
    setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, comment } : s)));
  };

  const clearAllRanks = () => {
    // Upgraded: Complete force reset to fresh expanded 128-song initialSongs catalog
    const freshSongs = initialSongs.map((s) => ({
      ...s,
      elo: 1200,
      matchCount: 0,
      rank: null,
      comment: "",
    }));
    setSongs(freshSongs);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(songs, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vaesong_battle_data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (Array.isArray(parsed)) {
          if (parsed.every((item) => "id" in item && "title" in item)) {
            const initialized = parsed.map((s) => ({
              ...s,
              elo: s.elo ?? 1200,
              matchCount: s.matchCount ?? 0,
            }));
            setSongs(initialized);
          } else {
            alert("Invalid JSON format");
          }
        }
      } catch {
        alert("Failed to read JSON file");
      }
    };
    reader.readAsText(file);
  };

  const setRankedOrder = (orderedIds: string[]) => {
    setSongs((prev) => {
      const newSongs = [...prev];
      // Reset all ranks first
      newSongs.forEach((s) => (s.rank = null));
      // Set new ranks based on array order
      orderedIds.forEach((id, index) => {
        const song = newSongs.find((s) => s.id === id);
        if (song) {
          song.rank = index + 1;
        }
      });
      return newSongs;
    });
  };

  // Elo rating update for Battle mode duels
  const recordBattle = (songAId: string, songBId: string, outcome: "A" | "B" | "draw") => {
    setSongs((prev) => {
      // Save current state snapshot to history stack
      setSongsHistory((prevHistory) => [...prevHistory, prev]);

      const songA = prev.find((s) => s.id === songAId);
      const songB = prev.find((s) => s.id === songBId);
      if (!songA || !songB) return prev;

      const rA = songA.elo ?? 1200;
      const rB = songB.elo ?? 1200;

      // Expected scores
      const eA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
      const eB = 1 / (1 + Math.pow(10, (rA - rB) / 400));

      // Actual scores
      let sA = 0.5;
      let sB = 0.5;
      if (outcome === "A") {
        sA = 1;
        sB = 0;
      } else if (outcome === "B") {
        sA = 0;
        sB = 1;
      }

      // New ratings
      const k = 32;
      const newRA = Math.round(rA + k * (sA - eA));
      const newRB = Math.round(rB + k * (sB - eB));

      return prev.map((s) => {
        if (s.id === songAId) {
          return {
            ...s,
            elo: newRA,
            matchCount: (s.matchCount ?? 0) + 1,
          };
        }
        if (s.id === songBId) {
          return {
            ...s,
            elo: newRB,
            matchCount: (s.matchCount ?? 0) + 1,
          };
        }
        return s;
      });
    });
  };

  // Reset all Elo ratings to start fresh
  const resetElo = () => {
    setSongsHistory([]); // Clear undo history
    setSongs((prev) =>
      prev.map((s) => ({
        ...s,
        elo: 1200,
        matchCount: 0,
      }))
    );
  };

  // Rollback to the previous state
  const undoLastBattle = () => {
    if (songsHistory.length === 0) return;
    const previousState = songsHistory[songsHistory.length - 1];
    setSongs(previousState);
    setSongsHistory((prev) => prev.slice(0, -1));
  };

  // Compile ELO ratings directly into leaderboard ranks
  const syncEloToLeaderboard = () => {
    setSongs((prev) => {
      const sorted = [...prev].sort((a, b) => {
        const eloA = a.elo ?? 1200;
        const eloB = b.elo ?? 1200;
        if (eloB !== eloA) return eloB - eloA;
        if ((b.matchCount ?? 0) !== (a.matchCount ?? 0)) {
          return (b.matchCount ?? 0) - (a.matchCount ?? 0);
        }
        return a.year - b.year;
      });

      return prev.map((s) => {
        const index = sorted.findIndex((item) => item.id === s.id);
        return {
          ...s,
          rank: index + 1,
        };
      });
    });
  };

  return {
    songs,
    isLoaded,
    updateRank,
    updateComment,
    clearAllRanks,
    exportData,
    importData,
    setRankedOrder,
    recordBattle,
    resetElo,
    syncEloToLeaderboard,
    undoLastBattle,
    canUndo: songsHistory.length > 0,
  };
}
