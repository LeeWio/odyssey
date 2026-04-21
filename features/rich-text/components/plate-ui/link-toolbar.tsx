"use client";

import React, { useMemo } from "react";
import {
  LinkSlash,
  Link as LinkIcon,
  Text as TextIcon,
  ArrowUpRightFromSquare,
} from "@gravity-ui/icons";
import { flip, offset, type UseVirtualFloatingOptions } from "@platejs/floating";
import {
  useFloatingLinkEdit,
  useFloatingLinkEditState,
  useFloatingLinkInsert,
  useFloatingLinkInsertState,
  useFloatingLinkUrlInput,
  useFloatingLinkUrlInputState,
  useLinkOpenButtonState,
  type LinkFloatingToolbarState,
} from "@platejs/link/react";
import { getLinkAttributes } from "@platejs/link";
import { KEYS, type TLinkElement } from "platejs";
import { useEditorRef, usePluginOption } from "platejs/react";
import {
  Button,
  ButtonGroup,
  buttonVariants,
  cn,
  InputGroup,
  Link,
  TextField,
  Toolbar,
  Tooltip,
} from "@heroui/react";
import { AnimatePresence, motion } from "motion/react";
import { motionProps } from "../../types";

const MotionToolbar = motion.create(Toolbar);

export function LinkEdit({
  textInputProps,
}: {
  textInputProps: React.InputHTMLAttributes<HTMLInputElement> & {
    ref?: React.Ref<HTMLInputElement>;
  };
}) {
  const state = useFloatingLinkUrlInputState();
  const { props: urlInputProps, ref: urlRef } = useFloatingLinkUrlInput(state);

  const { defaultValue: urlDefaultValue, ...restUrlProps } = urlInputProps;
  const { defaultValue: textDefaultValue, ...restTextProps } = textInputProps;

  return (
    <MotionToolbar isAttached {...motionProps} className="flex items-center justify-center gap-2">
      <TextField defaultValue={urlDefaultValue}>
        <InputGroup>
          <InputGroup.Prefix>
            <LinkIcon />
          </InputGroup.Prefix>
          <InputGroup.Input {...restUrlProps} ref={urlRef} placeholder="Paste or type a link..." />
        </InputGroup>
      </TextField>

      <TextField defaultValue={textDefaultValue?.toString()}>
        <InputGroup>
          <InputGroup.Prefix>
            <TextIcon />
          </InputGroup.Prefix>
          <InputGroup.Input {...restTextProps} data-plate-focus placeholder="Text to display" />
        </InputGroup>
      </TextField>
    </MotionToolbar>
  );
}

export function LinkPreview({ onEdit, onUnlink }: { onEdit?: () => void; onUnlink?: () => void }) {
  const state = useLinkOpenButtonState();
  const url = state.element?.url;

  return (
    <MotionToolbar isAttached {...motionProps}>
      <Tooltip delay={0}>
        <Tooltip.Trigger>
          <Button
            size="sm"
            onPress={onEdit}
            variant="ghost"
            className="max-w-50 justify-start overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {url}
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content showArrow>Edit link</Tooltip.Content>
      </Tooltip>

      <ButtonGroup variant="tertiary" size="sm">
        <LinkOpenButton />
        <Tooltip delay={0}>
          <Button isIconOnly onPress={onUnlink} variant="tertiary" size="sm">
            <LinkSlash />
          </Button>
          <Tooltip.Content showArrow className="text-xs">
            Unlink
          </Tooltip.Content>
        </Tooltip>
      </ButtonGroup>
    </MotionToolbar>
  );
}

function LinkOpenButton() {
  const editor = useEditorRef();

  const attributes = useMemo(() => {
    const entry = editor.api.node<TLinkElement>({
      match: { type: editor.getType(KEYS.link) },
    });
    if (!entry) return {};
    const [element] = entry;
    return getLinkAttributes(editor, element);
  }, [editor]);

  return (
    <Tooltip delay={0}>
      <Link
        {...attributes}
        onMouseOver={(e) => e.stopPropagation()}
        aria-label="Open link"
        target="_blank"
        className={cn(buttonVariants({ variant: "tertiary", size: "sm", isIconOnly: true }))}
      >
        <ArrowUpRightFromSquare />
      </Link>
      <Tooltip.Content showArrow>Open link</Tooltip.Content>
    </Tooltip>
  );
}

export function LinkFloatingToolbar({ state }: { state?: LinkFloatingToolbarState }) {
  const activeCommentId = usePluginOption({ key: KEYS.comment }, "activeId");
  const activeSuggestionId = usePluginOption({ key: KEYS.suggestion }, "activeId");

  const floatingOptions: UseVirtualFloatingOptions = React.useMemo(
    () => ({
      middleware: [
        offset(12),
        flip({
          fallbackPlacements: ["bottom-end", "top-start", "top-end"],
          padding: 12,
        }),
      ],
      placement: activeSuggestionId || activeCommentId ? "top-start" : "bottom-start",
    }),
    [activeCommentId, activeSuggestionId],
  );

  const insertState = useFloatingLinkInsertState({
    ...state,
    floatingOptions: {
      ...floatingOptions,
      ...state?.floatingOptions,
    },
  });

  const {
    hidden,
    props: insertProps,
    ref: insertRef,
    textInputProps,
  } = useFloatingLinkInsert(insertState);

  const editState = useFloatingLinkEditState({
    ...state,
    floatingOptions: {
      ...floatingOptions,
      ...state?.floatingOptions,
    },
  });

  const {
    editButtonProps,
    props: editProps,
    ref: editRef,
    unlinkButtonProps,
  } = useFloatingLinkEdit(editState);

  if (hidden) return null;

  const input = <LinkEdit textInputProps={textInputProps} />;

  const editContent = editState.isEditing ? (
    input
  ) : (
    <LinkPreview onEdit={editButtonProps.onClick} onUnlink={unlinkButtonProps.onClick} />
  );

  return (
    <AnimatePresence>
      {!hidden && (
        <div className="z-50">
          <div ref={insertRef} {...insertProps}>
            {input}
          </div>

          <div ref={editRef} {...editProps}>
            {editContent}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
