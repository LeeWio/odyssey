"use client";

import { useDropZonePickerContext } from "@heroui-pro/react";
import { Button, ProgressCircle, ScrollShadow, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "motion/react";
import { ComposerTool, type ComposerToolProps } from "./composer-tool";
import {
  MOMENT_CHARACTER_LIMIT,
  MOMENT_SHORT_FORM_CHARACTER_LIMIT,
} from "../../utils/character-count";

interface PublisherToolbarProps {
  charCount: number;
  isSubmitting: boolean;
  isSubmitDisabled: boolean;
  onPublish: () => void;
  onAction?: (actionId: string) => void;
}

export const PublisherToolbar = ({
  charCount,
  isSubmitting,
  isSubmitDisabled,
  onPublish,
  onAction,
}: PublisherToolbarProps) => {
  const { openFilePicker } = useDropZonePickerContext();

  const tools: ComposerToolProps[] = [
    { id: "image", icon: "gravity-ui:picture", label: "Image" },
    { id: "video", icon: "gravity-ui:video", label: "Video" },
    { id: "poll", icon: "gravity-ui:seal-check", label: "Poll" },
    { id: "emoji", icon: "gravity-ui:face-smile", label: "Emoji" },
    { id: "topic", icon: "gravity-ui:hashtag", label: "Topic" },
    { id: "location", icon: "gravity-ui:map-pin", label: "Location" },
  ];

  const warningThreshold = MOMENT_CHARACTER_LIMIT - 200;
  const isLongForm = charCount > MOMENT_SHORT_FORM_CHARACTER_LIMIT;
  const percentage = Math.min(
    (isLongForm
      ? (charCount - MOMENT_SHORT_FORM_CHARACTER_LIMIT) /
        (MOMENT_CHARACTER_LIMIT - MOMENT_SHORT_FORM_CHARACTER_LIMIT)
      : charCount / MOMENT_SHORT_FORM_CHARACTER_LIMIT) * 100,
    100
  );
  const charColor =
    charCount < warningThreshold
      ? "accent"
      : charCount < MOMENT_CHARACTER_LIMIT
        ? "warning"
        : "danger";

  return (
    <div className="flex w-full flex-col gap-3">
      {/* 1. Tools Scrollshadow list */}
      <ScrollShadow
        hideScrollBar
        variant="fade"
        className="flex flex-row gap-3"
        orientation="horizontal"
      >
        {tools.map((tool) => (
          <ComposerTool
            key={tool.id}
            {...tool}
            onClick={() => {
              if (tool.id === "image") {
                openFilePicker();
              } else if (onAction) {
                onAction(tool.id);
              }
            }}
          />
        ))}
      </ScrollShadow>

      {/* 2. Divider-free footer row with metrics & share button */}
      <div className="flex w-full flex-row items-center justify-between pt-1">
        {/* Left metrics Area */}
        <div className="flex flex-1 flex-row items-center justify-start">
          <AnimatePresence>
            {charCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6, x: -5 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.6, x: -5 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 26,
                }}
                className="flex flex-row items-center gap-2"
              >
                <ProgressCircle
                  aria-label="Character limit"
                  size="sm"
                  value={percentage}
                  color={charColor}
                  className="size-5"
                >
                  <ProgressCircle.Track strokeWidth={3}>
                    <ProgressCircle.TrackCircle strokeWidth={3} />
                    <ProgressCircle.FillCircle strokeWidth={3} strokeLinecap="round" />
                  </ProgressCircle.Track>
                </ProgressCircle>
                {(charCount >= MOMENT_SHORT_FORM_CHARACTER_LIMIT - 40 ||
                  charCount >= warningThreshold) && (
                  <span
                    className={`font-mono text-xs font-medium ${
                      charCount >= MOMENT_CHARACTER_LIMIT ? "text-danger" : "text-warning"
                    }`}
                  >
                    {charCount >= warningThreshold
                      ? MOMENT_CHARACTER_LIMIT - charCount
                      : `${charCount}/${MOMENT_CHARACTER_LIMIT}`}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right share CTA */}
        <Button variant="tertiary" onPress={onPublish} isDisabled={isSubmitDisabled} size="sm">
          {isSubmitting ? (
            <Spinner size="sm" color="current" className="mr-1.5" />
          ) : (
            <Icon icon="gravity-ui:location-arrow-fill" className="size-4" />
          )}
          {isSubmitting ? "Sharing..." : "Share"}
        </Button>
      </div>
    </div>
  );
};
