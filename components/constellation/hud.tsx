"use client";

import { motion } from "motion/react";
import { UniverseStats, ViewLevel } from "./types";

interface HUDProps {
  stats: UniverseStats;
  viewLevel: ViewLevel;
  onViewChange: (level: ViewLevel) => void;
  onExplore: () => void;
}

export function HUD({ stats, viewLevel, onViewChange, onExplore }: HUDProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      {/* Top Left: Title & Stats */}
      <div className="absolute top-10 left-10 flex flex-col gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-4xl leading-none font-black tracking-tighter text-white uppercase italic">
            DECENTRALIZED
            <br />
            KNOWLEDGE UNIVERSE
          </h1>
          <p className="mt-4 text-xs font-light text-white/40">
            The world scrolls.
            <br />I stay.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-8"
        >
          <StatItem label="Articles" value={stats.articles} />
          <StatItem label="Topics" value={stats.topics} />
          <StatItem label="Constellations" value={stats.constellations} />
          <StatItem label="Years" value={stats.years} />
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={onExplore}
          className="group pointer-events-auto flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] text-white uppercase"
        >
          Explore the universe
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 transition-colors group-hover:border-cyan-500">
            <div className="h-1 w-1 rounded-full bg-white group-hover:bg-cyan-500" />
          </div>
        </motion.button>
      </div>

      {/* Bottom Left: Interaction Hints */}
      <div className="absolute bottom-10 left-10 flex items-center gap-6 text-[10px] font-bold tracking-widest text-white/20 uppercase">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-[2px] border border-white/20" />
          Drag to rotate
        </div>
        <div className="flex gap-6 opacity-50">
          <span>Rotate</span>
          <span>Zoom</span>
          <span>Select</span>
        </div>
      </div>

      {/* Bottom Right: Activity Legend */}
      <div className="absolute right-10 bottom-10 flex flex-col items-end gap-2">
        <ActivityLegendItem color="#44ff88" label="活跃度高" />
        <ActivityLegendItem color="#44aaff" label="活跃度中" />
        <ActivityLegendItem color="#888888" label="活跃度低" />
      </div>

      {/* Right: View Selector */}
      <div className="pointer-events-auto absolute top-1/2 right-10 flex -translate-y-1/2 flex-col items-end gap-6">
        <div className="mb-2 text-[8px] font-bold tracking-[0.4em] text-white/20 uppercase">
          View
        </div>
        <ViewSelectorItem
          active={viewLevel === "universe"}
          label="Universe"
          onClick={() => onViewChange("universe")}
        />
        <ViewSelectorItem
          active={viewLevel === "constellation"}
          label="Constellation"
          onClick={() => onViewChange("constellation")}
        />
        <ViewSelectorItem
          active={viewLevel === "star"}
          label="Star System"
          onClick={() => onViewChange("star")}
        />
        <ViewSelectorItem
          active={viewLevel === "article"}
          label="Article"
          onClick={() => onViewChange("article")}
        />
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono text-xl font-bold tracking-tighter text-white">{value}</div>
      <div className="text-[8px] font-bold tracking-widest text-white/20 uppercase">{label}</div>
    </div>
  );
}

function ActivityLegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[9px] leading-none font-medium tracking-widest text-white/30">
        {label}
      </span>
      <div className="flex h-2 w-2 items-center justify-center rounded-full border border-white/20">
        <div className="h-1 w-1 rounded-full" style={{ backgroundColor: color }} />
      </div>
    </div>
  );
}

function ViewSelectorItem({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="group flex items-center gap-3">
      <span
        className={`text-[10px] tracking-widest transition-colors ${active ? "text-white" : "text-white/30 group-hover:text-white/60"}`}
      >
        {label}
      </span>
      <div
        className={`h-3 w-3 rounded-full border transition-all ${active ? "border-cyan-500 bg-cyan-500/20" : "border-white/20 group-hover:border-white/40"}`}
      >
        {active && <div className="mx-auto mt-[3px] h-1 w-1 rounded-full bg-cyan-500" />}
      </div>
    </button>
  );
}
