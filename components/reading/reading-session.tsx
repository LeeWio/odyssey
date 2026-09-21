"use client";

import { Button, Chip, Tooltip, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useReadingSession, type ReadingSessionProps } from "./use-reading-session";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function ReadingSession({ articleId, articleTitle, estimatedMinutes }: ReadingSessionProps) {
  const {
    session,
    elapsedSeconds,
    targetSeconds,
    progress,
    isComplete,
    isHydrated,
    startSession,
    toggleSession,
    resetSession,
  } = useReadingSession({ articleId, articleTitle, estimatedMinutes });

  if (!isHydrated) return null;

  return (
    <aside
      aria-label="Reading session"
      className="border-default-200 bg-default/35 mb-10 overflow-hidden border p-5 sm:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-muted flex items-center gap-2 font-mono text-xs font-semibold uppercase">
            <Icon aria-hidden="true" className="size-3.5" icon="lucide:timer-reset" />
            Reading session
          </div>
          <Typography type="h2" weight="semibold" className="mt-2 text-xl">
            {isComplete
              ? "Reading session complete"
              : session
                ? session.isRunning
                  ? "Stay with the page."
                  : "Your place is waiting."
                : "Make room for this essay."}
          </Typography>
          <Typography color="muted" type="body-sm" className="mt-1.5 max-w-lg">
            {isComplete
              ? "A full reading pass is saved on this device."
              : `A quiet ${estimatedMinutes}-minute pace for ${articleTitle}.`}
          </Typography>
        </div>

        {session ? (
          <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
            <span className="font-mono text-2xl tabular-nums">
              {formatDuration(elapsedSeconds)}
            </span>
            <Chip size="sm" variant="soft">
              {isComplete ? "Complete" : `${progress}% read`}
            </Chip>
          </div>
        ) : (
          <Chip className="shrink-0" size="sm" variant="soft">
            {estimatedMinutes} min
          </Chip>
        )}
      </div>

      {session ? (
        <div className="mt-5">
          <div
            aria-label={`${progress}% of the reading session complete`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="bg-default-200 h-1.5 w-full overflow-hidden"
            role="progressbar"
          >
            <div
              className="bg-accent h-full transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Typography aria-live="polite" color="muted" type="body-xs">
              {isComplete
                ? "Take a moment before moving on."
                : session.isRunning
                  ? `${formatDuration(Math.max(0, targetSeconds - elapsedSeconds))} remaining`
                  : `${formatDuration(elapsedSeconds)} kept so far`}
            </Typography>
            <div className="flex items-center gap-2">
              {!isComplete ? (
                <Button size="sm" variant="secondary" onPress={toggleSession}>
                  <Icon
                    aria-hidden="true"
                    className="size-4"
                    icon={session.isRunning ? "lucide:pause" : "lucide:play"}
                  />
                  {session.isRunning ? "Pause" : "Resume"}
                </Button>
              ) : null}
              <Tooltip>
                <Button
                  isIconOnly
                  aria-label="Reset reading session"
                  size="sm"
                  variant="ghost"
                  onPress={resetSession}
                >
                  <Icon aria-hidden="true" className="size-4" icon="lucide:rotate-ccw" />
                </Button>
                <Tooltip.Content>Reset session</Tooltip.Content>
              </Tooltip>
            </div>
          </div>
        </div>
      ) : (
        <Button className="mt-5" size="sm" onPress={startSession}>
          <Icon aria-hidden="true" className="size-4" icon="lucide:play" />
          Begin reading
        </Button>
      )}
    </aside>
  );
}
