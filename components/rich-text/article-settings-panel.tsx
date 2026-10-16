"use client";

import { Alert, Button, Card, Spinner } from "@heroui/react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";

import { ShaderBackgroundPreview } from "@/components/shader-background/shader-background-preview";
import type { PostRequest } from "@/lib/features/post";

import { PublishingWorkflow } from "./publishing-workflow";
import { RevisionHistoryDialog } from "./revision-history-dialog";
import { RichTextForm } from "./rich-text-form";

export function ArticleSettingsPanel({
  autosaveError,
  data,
  isAutosaving,
  isDisabled,
  isExistingPost,
  isOpen,
  isPending,
  mediaWarning,
  onChange,
  onRetryAutosave,
  onRetrySave,
  onSave,
  onWorkflowCompleted,
  postId,
  saveError,
  scheduledAt,
}: {
  autosaveError: string | null;
  data: Partial<PostRequest>;
  isAutosaving: boolean;
  isDisabled: boolean;
  isExistingPost: boolean;
  isOpen: boolean;
  isPending: boolean;
  mediaWarning: string | null;
  onChange: (data: Partial<PostRequest>) => void;
  onRetryAutosave: () => void;
  onRetrySave: () => void;
  onSave: (status: "DRAFT" | "PUBLISHED") => void;
  onWorkflowCompleted: () => Promise<void>;
  postId?: number;
  saveError: string | null;
  scheduledAt?: string;
}) {
  const hasBlockingMedia = Boolean(mediaWarning?.includes("uploads"));

  return (
    <AnimatePresence>
      {isOpen ? (
        <SettingsMotion
          hasBlockingMedia={hasBlockingMedia}
          {...{
            autosaveError,
            data,
            isAutosaving,
            isDisabled,
            isExistingPost,
            isPending,
            mediaWarning,
            onChange,
            onRetryAutosave,
            onRetrySave,
            onSave,
            onWorkflowCompleted,
            postId,
            saveError,
            scheduledAt,
          }}
        />
      ) : null}
    </AnimatePresence>
  );
}

function SettingsMotion({
  autosaveError,
  data,
  hasBlockingMedia,
  isAutosaving,
  isDisabled,
  isExistingPost,
  isPending,
  mediaWarning,
  onChange,
  onRetryAutosave,
  onRetrySave,
  onSave,
  onWorkflowCompleted,
  postId,
  saveError,
  scheduledAt,
}: Omit<Parameters<typeof ArticleSettingsPanel>[0], "isOpen"> & {
  hasBlockingMedia: boolean;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const present = useIsPresent();
  const reveal = reducedMotion ? "none" : "translateX(12px)";

  return (
    <motion.section
      key="article-settings"
      animate="show"
      aria-label="Article settings"
      className="absolute inset-0 z-30 flex flex-col"
      exit="exit"
      initial="hidden"
      style={{
        pointerEvents: present ? "auto" : "none",
        transformOrigin: "top right",
      }}
      transition={{ duration: reducedMotion ? 0.12 : 0.22, ease: [0.23, 1, 0.32, 1] }}
      variants={{
        hidden: { opacity: 0, transform: reveal },
        show: {
          opacity: 1,
          transform: "none",
          transition: { staggerChildren: reducedMotion ? 0 : 0.045 },
        },
        exit: {
          opacity: 0,
          transform: reveal,
          transition: { duration: reducedMotion ? 0.1 : 0.16, ease: [0.23, 1, 0.32, 1] },
        },
      }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto xl:flex-row xl:items-start"
        data-lenis-prevent
      >
        <motion.div
          className="contents xl:flex xl:min-w-0 xl:flex-1 xl:flex-col xl:gap-4"
          variants={columnVariants(reducedMotion)}
        >
          <SettingsSection className="order-1 xl:order-none">
            <RichTextForm data={data} step="article" onChange={onChange} />
          </SettingsSection>
          <SettingsSection className="order-3 xl:order-none">
            <RichTextForm data={data} step="organize" onChange={onChange} />
          </SettingsSection>
        </motion.div>
        <motion.div
          className="contents xl:flex xl:min-w-0 xl:flex-1 xl:flex-col xl:gap-4"
          variants={columnVariants(reducedMotion)}
        >
          <SettingsSection className="order-2 xl:order-none">
            <ShaderBackgroundPreview
              value={data.shaderPreset}
              onChange={(presetId) => onChange({ ...data, shaderPreset: presetId })}
            />
          </SettingsSection>
          <SettingsSection className="order-4 xl:order-none">
            <RichTextForm data={data} step="publish" onChange={onChange} />
            {isExistingPost && postId ? (
              <div className="border-separator mt-4 flex flex-col gap-4 border-t pt-4">
                <RevisionHistoryDialog
                  isDisabled={isDisabled}
                  postId={postId}
                  onRestored={() => void onWorkflowCompleted()}
                />
                <PublishingWorkflow
                  isDisabled={isDisabled}
                  postId={postId}
                  scheduledAt={scheduledAt}
                  status={data.status || "DRAFT"}
                  onCompleted={onWorkflowCompleted}
                  onStatusChange={(status) => onChange({ ...data, status })}
                />
              </div>
            ) : null}
          </SettingsSection>
        </motion.div>
      </div>
      <motion.div
        className="border-separator mt-4 flex flex-col gap-3 border-t pt-4"
        variants={columnVariants(reducedMotion)}
      >
        {saveError ? (
          <Alert status="danger">
            <Alert.Content>
              <Alert.Title>Save failed</Alert.Title>
              <Alert.Description>
                <span>{saveError}</span>
                <Button className="mt-2" size="sm" variant="tertiary" onPress={onRetrySave}>
                  Retry save
                </Button>
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}
        {autosaveError ? (
          <Alert status="warning">
            <Alert.Content>
              <Alert.Title>Server autosave unavailable</Alert.Title>
              <Alert.Description>
                <span>{autosaveError} Local draft recovery remains available.</span>
                <Button className="mt-2" size="sm" variant="tertiary" onPress={onRetryAutosave}>
                  Retry autosave
                </Button>
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}
        {mediaWarning ? (
          <Alert status="warning">
            <Alert.Content>
              <Alert.Title>Media needs attention</Alert.Title>
              <Alert.Description>{mediaWarning}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            className="flex-1"
            isDisabled={isDisabled || hasBlockingMedia}
            isPending={isPending}
            variant="secondary"
            onPress={() => onSave("DRAFT")}
          >
            {({ isPending: pending }) => (
              <>
                {pending ? <Spinner color="current" size="sm" /> : null}
                Save Draft
              </>
            )}
          </Button>
          <Button
            className="flex-1"
            isDisabled={isDisabled || Boolean(mediaWarning)}
            isPending={isPending}
            variant="primary"
            onPress={() => onSave("PUBLISHED")}
          >
            {({ isPending: pending }) => (
              <>
                {pending ? <Spinner color="current" size="sm" /> : null}
                {data.status === "PUBLISHED" ? "Update" : "Publish"}
              </>
            )}
          </Button>
        </div>
        {isAutosaving ? (
          <p aria-live="polite" className="text-muted text-xs">
            Saving a server draft…
          </p>
        ) : null}
      </motion.div>
    </motion.section>
  );
}

function columnVariants(reducedMotion: boolean) {
  return {
    hidden: { opacity: 0, transform: reducedMotion ? "none" : "translateY(8px)" },
    show: {
      opacity: 1,
      transform: "none",
      transition: { duration: reducedMotion ? 0.12 : 0.22, ease: [0.23, 1, 0.32, 1] as const },
    },
    exit: { opacity: 0, transform: "none", transition: { duration: 0.1 } },
  };
}

function SettingsSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className ? `h-auto ${className}` : "h-auto"} variant="secondary">
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}
