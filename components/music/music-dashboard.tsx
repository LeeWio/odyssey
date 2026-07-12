"use client";

import React from "react";
import { Card, Button, Avatar, Chip, ProgressBar } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMounted } from "@mantine/hooks";

export function MusicDashboard() {
  const mounted = useMounted();

  if (!mounted) return null;

  return (
    <div className="grid w-full grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6">
      
      {/* 1. Left Content Area (Column Span 8) */}
      <div className="col-span-12 md:col-span-8 flex flex-col gap-5 lg:gap-6">
        
        {/* A. Hero Trending Song Banner */}
        <Card className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 md:p-8 border-none rounded-[28px] shadow-lg min-h-[180px] sm:min-h-[220px] flex flex-row items-center justify-between">
          {/* Decorative Background Circles */}
          <div className="absolute -top-10 -right-10 size-44 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -bottom-10 -left-10 size-44 rounded-full bg-black/10 blur-xl" />
          
          <div className="relative z-10 flex flex-col items-start max-w-[65%] gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">MUSKINAJA</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Listen to trending songs all the time
            </h2>
            <p className="text-xs text-white/80 leading-relaxed hidden sm:block max-w-sm">
              With Muskinaja, you can get premium music for free anywhere and at any time.
            </p>
            <Button className="mt-2 bg-white text-violet-700 font-bold px-5 py-2 rounded-full shadow-sm hover:scale-105 transition-transform duration-200 text-xs" size="sm">
              Explore Now
            </Button>
          </div>

          {/* Banner Hero Image Placeholder (representing the girl with headphones) */}
          <div className="relative size-32 sm:size-40 md:size-44 shrink-0 select-none mr-2 hidden sm:block">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-white/5 border border-white/20 flex items-center justify-center backdrop-blur-md">
              <Icon icon="solar:headphones-round-bold-duotone" className="size-20 md:size-24 text-white/90 animate-pulse" />
            </div>
          </div>
        </Card>

        {/* B. Playlists Horizontal Row */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Playlists</h3>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted border-none min-w-0 px-2">
              See More
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Playlist 1 */}
            <Card className="group relative aspect-square overflow-hidden rounded-2xl p-0 border border-default/20 hover:border-default/30 transition-all duration-300" variant="default">
              {/* Cover Art Placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/10 flex items-center justify-center">
                <Icon icon="solar:music-note-bold" className="size-10 text-violet-500/30 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="absolute right-3 top-3 bg-black/40 backdrop-blur-md p-1.5 rounded-full text-white size-7 flex items-center justify-center">
                <Icon icon="solar:music-library-bold" className="size-3.5" />
              </div>
              {/* Glassmorphic bottom bar */}
              <div className="absolute bottom-2 inset-x-2 bg-zinc-950/70 dark:bg-black/40 border border-white/10 dark:border-default/20 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-white truncate leading-tight">Musik Pagi</span>
                  <span className="text-[9px] text-white/70 truncate mt-0.5">12 Tracks</span>
                </div>
                <Button isIconOnly size="sm" className="size-6 bg-white text-violet-700 rounded-full shrink-0">
                  <Icon icon="solar:play-bold" className="size-2.5" />
                </Button>
              </div>
            </Card>

            {/* Playlist 2 */}
            <Card className="group relative aspect-square overflow-hidden rounded-2xl p-0 border border-default/20 hover:border-default/30 transition-all duration-300" variant="default">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 flex items-center justify-center">
                <Icon icon="solar:music-notes-bold" className="size-10 text-purple-500/30 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="absolute right-3 top-3 bg-black/40 backdrop-blur-md p-1.5 rounded-full text-white size-7 flex items-center justify-center">
                <Icon icon="solar:heart-bold" className="size-3.5" />
              </div>
              <div className="absolute bottom-2 inset-x-2 bg-zinc-950/70 dark:bg-black/40 border border-white/10 dark:border-default/20 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-white truncate leading-tight">Musik Anu</span>
                  <span className="text-[9px] text-white/70 truncate mt-0.5">22 Tracks</span>
                </div>
                <Button isIconOnly size="sm" className="size-6 bg-white text-purple-700 rounded-full shrink-0">
                  <Icon icon="solar:play-bold" className="size-2.5" />
                </Button>
              </div>
            </Card>

            {/* Playlist 3 */}
            <Card className="group relative aspect-square overflow-hidden rounded-2xl p-0 border border-default/20 hover:border-default/30 transition-all duration-300" variant="default">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center">
                <Icon icon="solar:volume-loud-bold" className="size-10 text-blue-500/30 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="absolute right-3 top-3 bg-black/40 backdrop-blur-md p-1.5 rounded-full text-white size-7 flex items-center justify-center">
                <Icon icon="solar:star-bold" className="size-3.5" />
              </div>
              <div className="absolute bottom-2 inset-x-2 bg-zinc-950/70 dark:bg-black/40 border border-white/10 dark:border-default/20 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-white truncate leading-tight">Lofi Bass</span>
                  <span className="text-[9px] text-white/70 truncate mt-0.5">18 Tracks</span>
                </div>
                <Button isIconOnly size="sm" className="size-6 bg-white text-blue-700 rounded-full shrink-0">
                  <Icon icon="solar:play-bold" className="size-2.5" />
                </Button>
              </div>
            </Card>

            {/* Playlist 4 */}
            <Card className="group relative aspect-square overflow-hidden rounded-2xl p-0 border border-default/20 hover:border-default/30 transition-all duration-300" variant="default">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-pink-500/10 flex items-center justify-center">
                <Icon icon="solar:soundwave-bold" className="size-10 text-indigo-500/30 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="absolute right-3 top-3 bg-black/40 backdrop-blur-md p-1.5 rounded-full text-white size-7 flex items-center justify-center">
                <Icon icon="solar:globus-bold" className="size-3.5" />
              </div>
              <div className="absolute bottom-2 inset-x-2 bg-zinc-950/70 dark:bg-black/40 border border-white/10 dark:border-default/20 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-white truncate leading-tight">Anak Senja</span>
                  <span className="text-[9px] text-white/70 truncate mt-0.5">25 Tracks</span>
                </div>
                <Button isIconOnly size="sm" className="size-6 bg-white text-indigo-700 rounded-full shrink-0">
                  <Icon icon="solar:play-bold" className="size-2.5" />
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* C. Trending Tracks Vertical List */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Trending</h3>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted border-none min-w-0 px-2">
              See More
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {/* Track 1 */}
            <Card className="group flex flex-row items-center justify-between p-3 border border-default/20 hover:border-default/30 bg-background/40 hover:bg-background/80 transition-all duration-200 rounded-2xl shadow-sm" variant="default">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <span className="text-xs font-bold text-muted w-5 text-center">01</span>
                {/* Micro Cover */}
                <div className="relative size-11 rounded-xl overflow-hidden bg-default shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center">
                    <Icon icon="solar:music-note-2-bold" className="size-5 text-violet-500" />
                  </div>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-foreground truncate group-hover:text-accent transition-colors duration-200">
                    Balonku Ada 5 Meter
                  </span>
                  <span className="text-[10px] text-muted truncate mt-0.5">
                    Mamank · Dance Beat
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-[10px] font-mono text-muted">3:20</span>
                <Button isIconOnly size="sm" variant="ghost" className="size-8 rounded-xl border border-default/20 hover:bg-default/40">
                  <Icon icon="solar:play-bold" className="size-3 text-foreground" />
                </Button>
              </div>
            </Card>

            {/* Track 2 */}
            <Card className="group flex flex-row items-center justify-between p-3 border border-default/20 hover:border-default/30 bg-background/40 hover:bg-background/80 transition-all duration-200 rounded-2xl shadow-sm" variant="default">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <span className="text-xs font-bold text-muted w-5 text-center">02</span>
                <div className="relative size-11 rounded-xl overflow-hidden bg-default shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-pink-500/10 flex items-center justify-center">
                    <Icon icon="solar:music-note-4-bold" className="size-5 text-rose-500" />
                  </div>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-foreground truncate group-hover:text-accent transition-colors duration-200">
                    Kucing Kesayangan
                  </span>
                  <span className="text-[10px] text-muted truncate mt-0.5">
                    Maimunah · Electro Pop
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-[10px] font-mono text-muted">3:20</span>
                <Button isIconOnly size="sm" variant="ghost" className="size-8 rounded-xl border border-default/20 hover:bg-default/40">
                  <Icon icon="solar:play-bold" className="size-3 text-foreground" />
                </Button>
              </div>
            </Card>
          </div>
        </div>

      </div>

      {/* 2. Right Sidebar Area (Column Span 4) */}
      <div className="col-span-12 md:col-span-4 flex flex-col gap-5 lg:gap-6">
        
        {/* A. Top Artist Card List */}
        <Card className="p-4 border border-default/20 bg-background/30 dark:bg-zinc-950/20 rounded-[24px]" variant="default">
          <div className="flex items-center justify-between px-1 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Top Artist</h3>
            <Button variant="ghost" size="sm" className="h-5 text-[10px] text-muted border-none min-w-0 px-1">
              See More
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {/* Artist 1 */}
            <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-default/30 transition-colors duration-150">
              <div className="flex items-center gap-3">
                <Avatar size="sm" className="size-8 font-semibold bg-violet-500 text-white">M</Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground leading-tight">Mamank</span>
                  <span className="text-[9px] text-muted mt-0.5">1.92B Followers · 1.22M Plays</span>
                </div>
              </div>
              <Button isIconOnly size="sm" variant="ghost" className="size-7 rounded-lg border border-default/20">
                <Icon icon="solar:add-folder-bold" className="size-3 text-muted-fg" />
              </Button>
            </div>

            {/* Artist 2 */}
            <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-default/30 transition-colors duration-150">
              <div className="flex items-center gap-3">
                <Avatar size="sm" className="size-8 font-semibold bg-fuchsia-500 text-white">MA</Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground leading-tight">Maimunah</span>
                  <span className="text-[9px] text-muted mt-0.5">1.92B Followers · 50M Plays</span>
                </div>
              </div>
              <Button isIconOnly size="sm" variant="ghost" className="size-7 rounded-lg border border-default/20">
                <Icon icon="solar:add-folder-bold" className="size-3 text-muted-fg" />
              </Button>
            </div>

            {/* Artist 3 */}
            <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-default/30 transition-colors duration-150">
              <div className="flex items-center gap-3">
                <Avatar size="sm" className="size-8 font-semibold bg-blue-500 text-white">P</Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground leading-tight">Paijo</span>
                  <span className="text-[9px] text-muted mt-0.5">1.92B Followers · 32M Plays</span>
                </div>
              </div>
              <Button isIconOnly size="sm" variant="ghost" className="size-7 rounded-lg border border-default/20">
                <Icon icon="solar:add-folder-bold" className="size-3 text-muted-fg" />
              </Button>
            </div>
          </div>
        </Card>

        {/* B. Hanging Music Player Card (Mock console card matching bottom-right of the mockup) */}
        <Card className="p-5 border border-default/20 bg-indigo-950/80 dark:bg-black/40 text-white rounded-[24px] shadow-lg flex flex-col gap-4" variant="default">
          {/* Mock Track Cover Image with absolute overlay gradient */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-inner">
            <Icon icon="solar:music-note-bold-duotone" className="size-16 text-white/20 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          {/* Title & Artist info */}
          <div className="flex flex-col items-center text-center px-1">
            <h4 className="text-sm font-bold text-white leading-tight">Balonku Ada 5 Meter</h4>
            <span className="text-[10px] text-white/70 mt-1">Mamank</span>
          </div>

          {/* Active Soundwave Equalizer Placeholder */}
          <div className="flex items-end justify-center gap-1 h-8 px-4 my-1 select-none pointer-events-none">
            {/* 12 small bounding bars that bounce */}
            <div className="w-1 rounded-full bg-white/70 h-4 animate-pulse" />
            <div className="w-1 rounded-full bg-white/40 h-6 animate-pulse" />
            <div className="w-1 rounded-full bg-white/80 h-2 animate-pulse" />
            <div className="w-1 rounded-full bg-white/50 h-5 animate-pulse" />
            <div className="w-1 rounded-full bg-white/90 h-3 animate-pulse" />
            <div className="w-1 rounded-full bg-white/30 h-7 animate-pulse" />
            <div className="w-1 rounded-full bg-white/60 h-4 animate-pulse" />
            <div className="w-1 rounded-full bg-white/80 h-6 animate-pulse" />
            <div className="w-1 rounded-full bg-white/45 h-2 animate-pulse" />
            <div className="w-1 rounded-full bg-white/70 h-5 animate-pulse" />
            <div className="w-1 rounded-full bg-white/30 h-3 animate-pulse" />
            <div className="w-1 rounded-full bg-white/50 h-4 animate-pulse" />
          </div>

          {/* Timeline slider and times */}
          <div className="flex flex-col gap-1.5 w-full">
            <ProgressBar aria-label="Mock player play progress" value={36} size="sm" color="success" className="w-full bg-white/10 rounded-full" />
            <div className="flex justify-between items-center text-[9px] text-white/60 font-mono mt-0.5">
              <span>1:20</span>
              <span>3:30</span>
            </div>
          </div>

          {/* Audio Console Control buttons (Loop, Prev, Play, Next, Shuffle) */}
          <div className="flex items-center justify-between px-2 mt-1">
            <Button isIconOnly size="sm" variant="ghost" className="size-8 rounded-full border-none text-white/70 hover:text-white hover:bg-white/10">
              <Icon icon="solar:repeat-bold" className="size-4" />
            </Button>
            <Button isIconOnly size="sm" variant="ghost" className="size-8 rounded-full border-none text-white/70 hover:text-white hover:bg-white/10">
              <Icon icon="solar:skip-backward-bold" className="size-4" />
            </Button>
            {/* Play Button - White solid circle */}
            <Button isIconOnly size="md" className="size-9 bg-white text-indigo-950 rounded-full hover:scale-105 transition-transform shadow-sm">
              <Icon icon="solar:pause-bold" className="size-4 text-indigo-950" />
            </Button>
            <Button isIconOnly size="sm" variant="ghost" className="size-8 rounded-full border-none text-white/70 hover:text-white hover:bg-white/10">
              <Icon icon="solar:skip-forward-bold" className="size-4" />
            </Button>
            <Button isIconOnly size="sm" variant="ghost" className="size-8 rounded-full border-none text-white/70 hover:text-white hover:bg-white/10">
              <Icon icon="solar:shuffle-bold" className="size-4" />
            </Button>
          </div>

        </Card>

      </div>

    </div>
  );
}
