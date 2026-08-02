"use client";

import { motion } from "motion/react";
import { Star, Article } from "./types";

interface DetailPanelProps {
  activeStar: Star | null;
  onClose: () => void;
}

export function DetailPanel({ activeStar, onClose }: DetailPanelProps) {
  if (!activeStar) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="pointer-events-none absolute top-10 right-10 bottom-10 z-20 flex w-[400px] flex-col gap-6"
    >
      {/* Header Info */}
      <div className="pointer-events-auto rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-white italic">
              {activeStar.name}
            </h2>
            <div className="mt-1 text-[10px] font-bold tracking-widest text-cyan-500 uppercase">
              {activeStar.articles.length} Articles
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/20 transition-colors hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <p className="mt-4 text-xs leading-relaxed font-light text-white/50">
          {activeStar.description}
        </p>
      </div>

      {/* Article List */}
      <div className="custom-scrollbar pointer-events-auto flex-1 overflow-y-auto rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4">
          {activeStar.articles.map((article) => (
            <ArticleListItem key={article.id} article={article} />
          ))}
          {activeStar.articles.length === 0 && (
            <div className="py-10 text-center text-[10px] font-bold tracking-widest text-white/20 uppercase">
              No articles found
            </div>
          )}
        </div>
      </div>

      {/* Featured Preview */}
      {activeStar.articles.length > 0 && (
        <div className="pointer-events-auto rounded-3xl border border-cyan-500/30 bg-black/60 p-6 shadow-[0_0_50px_rgba(6,182,212,0.1)] backdrop-blur-2xl">
          <div className="group relative mb-4 aspect-video overflow-hidden rounded-xl bg-cyan-900/20">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-40 transition-opacity group-hover:opacity-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500">
                <div className="ml-1 h-0 w-0 border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-black" />
              </div>
            </div>
            {/* Mock Image Placeholder */}
            <div className="flex h-full w-full items-center justify-center text-4xl font-black text-cyan-500/20 italic">
              ODYSSEY
            </div>
          </div>

          <h3 className="text-sm leading-snug font-bold tracking-tight text-white">
            {activeStar.articles[0].title}
          </h3>
          <div className="mt-2 flex gap-4">
            <div className="text-[9px] font-medium text-white/30">
              {activeStar.articles[0].publishedAt}
            </div>
            <div className="text-[9px] font-medium text-white/30">
              {activeStar.articles[0].readingTime} min read
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {activeStar.articles[0].topics.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-bold tracking-widest text-white/40 uppercase"
              >
                {t}
              </span>
            ))}
          </div>

          <button className="mt-6 w-full rounded-xl bg-white py-3 text-[10px] font-black tracking-widest text-black uppercase transition-colors hover:bg-cyan-500">
            Read Article →
          </button>
        </div>
      )}
    </motion.div>
  );
}

function ArticleListItem({ article }: { article: Article }) {
  return (
    <div className="group cursor-pointer">
      <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition-all group-hover:border-white/10 group-hover:bg-white/[0.05]">
        <div className="flex flex-col gap-1">
          <div className="line-clamp-1 text-xs font-medium text-white/80 transition-colors group-hover:text-white">
            {article.title}
          </div>
          <div className="text-[9px] font-medium text-white/30">{article.publishedAt}</div>
        </div>
        <div className="text-white/20 transition-colors group-hover:text-cyan-500">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 12L10 8L6 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
