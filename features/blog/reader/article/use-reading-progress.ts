"use client";

import { toast } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { useRecordReadingProgressMutation } from "@/lib/features/library/library-api";
import {
  clearPendingReadingProgress,
  readPendingReadingProgress,
  writePendingReadingProgress,
} from "@/lib/reading-position";

import { useArticleOutline } from "./article-outline";
import {
  quantizeReadingProgress,
  readingPositionAnchor,
  shouldReportReadingProgress,
  type ReadingCheckpoint,
} from "./reading-progress";

/**
 * Reports signed-in reading in 10-point steps. A failed save stays in session
 * storage and is submitted again before newer scroll progress replaces it.
 * Guests never call the library endpoint.
 */
export function useReadingProgress({
  enabled,
  postId,
  progress,
}: {
  enabled: boolean;
  postId: number;
  progress: number;
}) {
  const t = useTranslations("Article");
  const outline = useArticleOutline();
  const [recordProgress] = useRecordReadingProgressMutation();
  const outlineRef = useRef(outline);
  const progressRef = useRef(progress);
  const sentRef = useRef<ReadingCheckpoint | null>(null);
  const failedRef = useRef<ReadingCheckpoint | null>(null);

  useEffect(() => {
    outlineRef.current = outline;
    progressRef.current = progress;
  });

  useEffect(() => {
    if (!enabled) return;

    const articleId = postId;
    let active = true;
    let draining = false;
    let inFlight = false;
    const queue: ReadingCheckpoint[] = [];
    sentRef.current = null;
    failedRef.current = null;

    const checkpoint = (): ReadingCheckpoint => {
      const positionAnchor = readingPositionAnchor(outlineRef.current?.items ?? []);
      return {
        postId: articleId,
        progressPercent: quantizeReadingProgress(progressRef.current),
        ...(positionAnchor ? { positionAnchor } : {}),
      };
    };

    const enqueue = (next: ReadingCheckpoint) => {
      queue.push(next);
      void drain();
    };

    const drain = async () => {
      if (draining) return;
      draining = true;
      while (active && queue.length > 0 && !failedRef.current) {
        const next = queue.shift();
        if (!next || !shouldReportReadingProgress(sentRef.current, next)) continue;

        sentRef.current = next;
        inFlight = true;
        writePendingReadingProgress({
          postId: next.postId,
          progressPercent: next.progressPercent,
          positionAnchor: next.positionAnchor ?? "",
        });

        let saved = false;
        try {
          await recordProgress({
            postId: next.postId,
            body: {
              progressPercent: next.progressPercent,
              ...(next.positionAnchor ? { positionAnchor: next.positionAnchor } : {}),
            },
          }).unwrap();
          saved = true;
        } catch {
          saved = false;
        } finally {
          inFlight = false;
        }

        if (!active) break;
        if (saved) {
          clearPendingReadingProgress(articleId);
          failedRef.current = null;
          continue;
        }

        failedRef.current = next;
        queue.length = 0;
        toast.danger(t("progressSaveFailed"), {
          actionProps: {
            children: t("tryAgain"),
            onPress: () => {
              failedRef.current = null;
              sentRef.current = null;
              enqueue(next);
            },
          },
        });
      }
      draining = false;
    };

    const pending = readPendingReadingProgress(articleId);
    if (pending) {
      // The stored checkpoint is the last attempt. Newer scroll progress waits
      // until this one settles, so a failed save is not replaced by a guess.
      enqueue({
        postId: pending.postId,
        progressPercent: pending.progressPercent,
        ...(pending.positionAnchor ? { positionAnchor: pending.positionAnchor } : {}),
      });
    }
    enqueue(checkpoint());

    let frame = 0;
    const remember = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (failedRef.current) return;
        enqueue(checkpoint());
      });
    };

    remember();
    window.addEventListener("scroll", remember, { passive: true });
    const flush = () => {
      if (failedRef.current) return;
      enqueue(checkpoint());
    };
    window.addEventListener("pagehide", flush);

    return () => {
      active = false;
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", remember);
      window.removeEventListener("pagehide", flush);
      if (failedRef.current || inFlight) return;
      const next = checkpoint();
      if (!shouldReportReadingProgress(sentRef.current, next)) return;
      writePendingReadingProgress({
        postId: next.postId,
        progressPercent: next.progressPercent,
        positionAnchor: next.positionAnchor ?? "",
      });
      void recordProgress({
        postId: next.postId,
        body: {
          progressPercent: next.progressPercent,
          ...(next.positionAnchor ? { positionAnchor: next.positionAnchor } : {}),
        },
      });
    };
  }, [enabled, postId, recordProgress, t]);
}
