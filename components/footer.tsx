"use client";

import { useOs } from "@mantine/hooks";

export function Footer() {
  const os = useOs();

  return (
    <footer className="flex w-full flex-col items-center justify-center gap-1 py-3">
      <a
        className="flex items-center gap-1 text-current no-underline"
        href="https://heroui.com?utm_source=next-app-template"
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="text-muted">Powered by</span>
        <p className="text-accent">HeroUI</p>
      </a>
      {os !== "undetermined" && (
        <span className="text-muted text-xs select-none">
          Running on <span className="text-accent capitalize">{os}</span> • Pipeline Verified ✓
        </span>
      )}
      <a
        href="https://beian.miit.gov.cn/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted text-xs hover:underline"
      >
        鄂ICP备2026038770号-1
      </a>
    </footer>
  );
}
