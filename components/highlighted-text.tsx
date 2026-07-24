"use client";

import { useMemo } from "react";

interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
}

export function HighlightedText({ text, query, className = "" }: HighlightedTextProps) {
  const parts = useMemo(() => {
    if (!query.trim() || !text) {
      return [{ text, isHighlight: false }];
    }

    // Escape regex special characters to prevent errors and create case-insensitive regex
    const safeQuery = query.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(${safeQuery})`, "gi");

    return text.split(regex).map((part) => ({
      text: part,
      isHighlight: regex.test(part),
    }));
  }, [text, query]);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.isHighlight ? (
          <mark
            key={i}
            className="text-accent bg-transparent font-semibold transition-colors duration-250"
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
}
