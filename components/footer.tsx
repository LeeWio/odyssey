"use client";

import { useOs } from "@mantine/hooks";

export function Footer() {
  const os = useOs();

  return (
    <footer className="flex w-full flex-row items-center justify-center gap-1 py-3">
      {os !== "undetermined" && (
        <span className="text-muted text-xs select-none">
          Running on <span className="text-accent capitalize">{os}</span>
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
