"use client";

import React from "react";
import { RichTextEditor } from "@heroui-pro/react";
import { Button, Modal, Tooltip } from "@heroui/react";
import type { JSONContent } from "@tiptap/react";
import type { Extensions } from "@tiptap/core";
import type { RichTextEditorValueChangeDetails } from "@heroui-pro/react";
import { motion } from "motion/react";
import { Icon } from "@iconify/react";

import { useRichTextSetup } from "./hooks/use-rich-text-setup";
import { PublishSettingsSidebar } from "./sidebar/publish-settings-sidebar";
import { TextMenu } from "./menus/text-menu/text-menu";
import { ExtensionKit } from "./extensions/extension-kit";
import { FixedToolbar } from "./toolbar/fixed-toolbar";
import { SuggestionToolbar } from "./toolbar/suggestion-toolbar";
import { LinkMenu } from "./menus/link-menu/link-menu";
import { RichTextTableOfContents } from "./table-of-contents";
import { normalizeJSONContent } from "./utils/document-normalizer";

interface RichTextProps {
  identifier: string;
  initialValue?: JSONContent; // Uncontrolled defaultValue
  value?: JSONContent; // Controlled value
  onChange?: (value: JSONContent, details: RichTextEditorValueChangeDetails) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClose?: () => void;

  // Custom official Tiptap/HeroUI Pro config options
  placeholder?: string;
  maxLength?: number;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  extensions?: Extensions;
}

const MotionButton = motion.create(Button);

export function RichText({
  identifier,
  initialValue,
  value,
  onChange,
  isFullscreen = false,
  onToggleFullscreen,
  onClose,
  placeholder = "Start writing...",
  maxLength,
  isDisabled = false,
  isReadOnly = false,
  extensions = ExtensionKit,
}: RichTextProps) {
  // 1. Single unified source of truth setup hook
  const { editorRef, autosave, publish } = useRichTextSetup({
    identifier,
    initialValue: initialValue || value, // Fallback safely to any provided input
    onChange,
    isFullscreen,
    onToggleFullscreen,
    onClose,
  });

  const { handleValueChange, isAutosaving, isAutosaveSuccess, isAutosaveError } = autosave;
  const { showSettings, setShowSettings, handleOpenPublish } = publish;

  const normalizedDefaultValue = initialValue ? normalizeJSONContent(initialValue) : undefined;
  const normalizedValue = value ? normalizeJSONContent(value) : undefined;

  return (
    <RichTextEditor
      extensions={extensions}
      className="flex h-full flex-1 flex-col overflow-hidden"
      defaultValue={normalizedDefaultValue}
      value={normalizedValue}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      maxLength={maxLength}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      editorOptions={{
        // 2. Intercept and capture Tiptap Editor instance for maximum programmatical flexibility
        onCreate: ({ editor }) => {
          editorRef.current = editor;
        },
      }}
    >
      {/* 🛠️ Editor Header bar containing toolbars & modal controls */}
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

      {/* 📄 Core Editor Content View & Floating TOC & Publish sidebar */}
      <Modal.Body className="relative flex flex-1 flex-row overflow-hidden">
        <RichTextEditor.Content />

        {/* 🎯 Real-time floating TOC on writing canvas */}
        <RichTextTableOfContents placement="right" />

        {/* Modular Sidebar Publish Settings form with Staggered animations */}
        <PublishSettingsSidebar publish={publish} />
      </Modal.Body>

      {/* 🏷️ Status footer bar */}
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
