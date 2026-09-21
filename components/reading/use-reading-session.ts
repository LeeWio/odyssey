"use client";

import { useInterval, useLocalStorage, useMounted } from "@mantine/hooks";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

const sessionSchema = z
  .object({
    articleId: z.number().int().positive(),
    articleTitle: z.string(),
    elapsedSeconds: z.number().int().nonnegative(),
    isRunning: z.boolean(),
    lastResumedAt: z.number().int().nonnegative().nullable(),
    targetSeconds: z.number().int().positive(),
    version: z.literal(1),
  })
  .refine((session) => session.elapsedSeconds <= session.targetSeconds)
  .refine((session) =>
    session.isRunning ? session.lastResumedAt !== null : session.lastResumedAt === null
  );

type ReadingSessionSnapshot = z.infer<typeof sessionSchema>;

export type ReadingSessionProps = {
  articleId: number;
  articleTitle: string;
  estimatedMinutes: number;
};

function deserializeSession(value: string | undefined): ReadingSessionSnapshot | null {
  try {
    return sessionSchema.safeParse(JSON.parse(value ?? "null")).data ?? null;
  } catch {
    return null;
  }
}

function getElapsedSeconds(session: ReadingSessionSnapshot, now: number) {
  const runningSeconds =
    session.isRunning && session.lastResumedAt !== null
      ? Math.max(0, Math.floor((now - session.lastResumedAt) / 1000))
      : 0;
  return Math.min(session.targetSeconds, session.elapsedSeconds + runningSeconds);
}

export function useReadingSession({
  articleId,
  articleTitle,
  estimatedMinutes,
}: ReadingSessionProps) {
  const [storedSession, setStoredSession, removeStoredSession] =
    useLocalStorage<ReadingSessionSnapshot | null>({
      key: "odyssey-reading-session",
      defaultValue: null,
      deserialize: deserializeSession,
    });
  const isHydrated = useMounted();
  const [now, setNow] = useState(() => Date.now());
  // Keep the existing single-session storage format, but never expose another article's session.
  const session = storedSession?.articleId === articleId ? storedSession : null;

  const update = useCallback(() => {
    if (!session?.isRunning) return;
    const currentTime = Date.now();
    setNow(currentTime);
    if (getElapsedSeconds(session, currentTime) >= session.targetSeconds) {
      setStoredSession({
        ...session,
        elapsedSeconds: session.targetSeconds,
        isRunning: false,
        lastResumedAt: null,
      });
    }
  }, [session, setStoredSession]);
  const { start, stop } = useInterval(update, 1000);

  useEffect(() => {
    if (session?.isRunning) start();
    else stop();
    return stop;
  }, [session, start, stop]);

  const elapsedSeconds = session ? getElapsedSeconds(session, now) : 0;
  const targetSeconds = session?.targetSeconds ?? estimatedMinutes * 60;
  const progress =
    targetSeconds > 0 ? Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100)) : 0;
  const isComplete = session !== null && elapsedSeconds >= targetSeconds;

  const startSession = () => {
    const startedAt = Date.now();
    setNow(startedAt);
    setStoredSession({
      articleId,
      articleTitle,
      elapsedSeconds: 0,
      isRunning: true,
      lastResumedAt: startedAt,
      targetSeconds: estimatedMinutes * 60,
      version: 1,
    });
  };

  const toggleSession = () => {
    if (!session) return;
    const currentTime = Date.now();
    setNow(currentTime);
    setStoredSession(
      session.isRunning
        ? {
            ...session,
            elapsedSeconds: getElapsedSeconds(session, currentTime),
            isRunning: false,
            lastResumedAt: null,
          }
        : {
            ...session,
            isRunning: true,
            lastResumedAt: currentTime,
          }
    );
  };

  return {
    session,
    elapsedSeconds,
    targetSeconds,
    progress,
    isComplete,
    isHydrated,
    startSession,
    toggleSession,
    resetSession: removeStoredSession,
  };
}
