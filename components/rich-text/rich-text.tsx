"use client";

import React, { useEffect } from "react";
import { RichTextEditor } from "@heroui-pro/react";
import { Button, Modal, Tooltip } from "@heroui/react";
import type { JSONContent } from "@tiptap/react";
import { motion } from "motion/react";
import { Icon } from "@iconify/react";

import { useRichTextAutosave } from "./hooks/use-rich-text-autosave";
import { useRichTextPublish } from "./hooks/use-rich-text-publish";
import { PublishSettingsSidebar } from "./sidebar/publish-settings-sidebar";
import { TextMenu } from "./menus/text-menu/text-menu";
import { ExtensionKit } from "./extensions/extension-kit";
import { FixedToolbar } from "./toolbar/fixed-toolbar";
import { SuggestionToolbar } from "./toolbar/suggestion-toolbar";
import { LinkMenu } from "./menus/link-menu/link-menu";

interface RichTextProps {
  identifier: string;
  initialValue?: JSONContent;
  onChange?: (value: JSONContent) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClose?: () => void;
}

const MotionButton = motion.create(Button);

export function RichText({
  identifier,
  initialValue,
  onChange,
  isFullscreen = false,
  onToggleFullscreen,
  onClose,
}: RichTextProps) {
  // 1. Decoupled Content Autosaving State Hook
  const autosave = useRichTextAutosave(identifier, initialValue, onChange);

  // 2. Decoupled Document Publishing State Hook
  const publish = useRichTextPublish(identifier, autosave.currentContent);

  const { handleValueChange, isAutosaving, isAutosaveSuccess, isAutosaveError } = autosave;
  const { showSettings, setShowSettings, handleOpenPublish } = publish;

  // Intercept Escape to exit fullscreen before closing the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        e.stopPropagation();
        onToggleFullscreen?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true); // Capture phase to preempt Modal close
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isFullscreen, onToggleFullscreen]);

  return (
    <RichTextEditor
      extensions={ExtensionKit}
      className="flex h-full flex-1 flex-col overflow-hidden"
      defaultValue={initialValue}
      onValueChange={handleValueChange}
    >
      <Modal.Header className="rich-text-header flex flex-row items-center justify-between">
        <FixedToolbar />

        <div className="flex items-center gap-2">
          {onToggleFullscreen && (
            <Tooltip delay={0}>
              <MotionButton
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                isIconOnly
                size="sm"
                variant="tertiary"
                onPress={onToggleFullscreen}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <Icon
                  icon={
                    isFullscreen
                      ? "gravity-ui:chevrons-collapse-up-right"
                      : "gravity-ui:chevrons-expand-up-right"
                  }
                  aria-hidden="true"
                />
              </MotionButton>
              <Tooltip.Content>
                {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              </Tooltip.Content>
            </Tooltip>
          )}

          <Tooltip delay={0}>
            <MotionButton
              size="sm"
              aria-label={showSettings ? "Back to Edit" : "Publish"}
              isIconOnly
              variant={showSettings ? "secondary" : "tertiary"}
              onPress={() => (showSettings ? setShowSettings(false) : handleOpenPublish())}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
              <Icon
                icon={showSettings ? "gravity-ui:arrow-left" : "gravity-ui:paper-plane"}
                aria-hidden="true"
              />
            </MotionButton>
            <Tooltip.Content>{showSettings ? "Back to Edit" : "Publish"}</Tooltip.Content>
          </Tooltip>

          {onClose && (
            <Tooltip delay={0}>
              <MotionButton
                size="sm"
                aria-label="Close Editor"
                isIconOnly
                variant="tertiary"
                onPress={onClose}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <Icon icon="gravity-ui:xmark" aria-hidden="true" />
              </MotionButton>
              <Tooltip.Content>Close Editor</Tooltip.Content>
            </Tooltip>
          )}
        </div>

        <SuggestionToolbar />
        <TextMenu />
        <LinkMenu />
      </Modal.Header>

      <Modal.Body className="relative flex flex-1 flex-row overflow-hidden">
        <RichTextEditor.Content />

        {/* Modular Sidebar Publish Settings form with Staggered animations */}
        <PublishSettingsSidebar publish={publish} />
      </Modal.Body>

      <Modal.Footer className="flex items-center justify-between">
        <div className="text-default-400 flex items-center gap-2 text-xs select-none">
          {isAutosaving && (
            <>
              <span className="bg-warning h-2 w-2 animate-pulse rounded-full" />
              <span>Saving draft...</span>
            </>
          )}
          {isAutosaveSuccess && !isAutosaving && (
            <>
              <Icon icon="gravity-ui:check" className="text-success size-3.5" aria-hidden="true" />
              <span className="text-success-600">Draft saved</span>
            </>
          )}
          {isAutosaveError && (
            <>
              <span className="bg-danger h-2 w-2 rounded-full" />
              <span className="text-danger-500">Failed to save draft</span>
            </>
          )}
          {!isAutosaving && !isAutosaveSuccess && !isAutosaveError && (
            <>
              <span className="bg-default-300 h-2 w-2 rounded-full" />
              <span>Ready</span>
            </>
          )}
        </div>

        <RichTextEditor.CharacterCount showWords />
      </Modal.Footer>
    </RichTextEditor>
  );
}
