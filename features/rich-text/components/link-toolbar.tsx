"use client";

import * as React from "react";

import { LinkSlash } from "@gravity-ui/icons";

import { type UseVirtualFloatingOptions, flip, offset } from "@platejs/floating";
import {
  type LinkFloatingToolbarState,
  FloatingLinkUrlInput,
  useFloatingLinkEdit,
  useFloatingLinkEditState,
  useFloatingLinkInsert,
  useFloatingLinkInsertState,
  useFloatingLinkUrlInput,
  useFloatingLinkUrlInputState,
  useLink,
} from "@platejs/link/react";
import { KEYS } from "platejs";
import { useElement, useFormInputProps, usePluginOption } from "platejs/react";
import { Button, ButtonGroup, Input, Link, Separator, Surface, Toolbar } from "@heroui/react";

export function LinkEdit({
  inputProps,
  textInputProps,
}: {
  inputProps: React.HTMLAttributes<HTMLDivElement>;
  textInputProps: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  const state = useFloatingLinkUrlInputState();
  const { props, ref } = useFloatingLinkUrlInput(state);

  return (
    <Surface className="bg-overlay/80 flex transform-gpu flex-col items-center justify-center gap-1 rounded-3xl p-1.5 backdrop-blur-md backdrop-saturate-150">
      <Input
        fullWidth
        defaultValue={props.defaultValue}
        onChange={props.onChange}
        ref={ref}
        variant="secondary"
      />
      <Input
        fullWidth
        placeholder="Text to display"
        data-plate-focus
        {...textInputProps}
        variant="secondary"
      />
    </Surface>
  );
}

export function LinkPreview({
  editButtonProps,
  unlinkButtonProps,
}: {
  editButtonProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  unlinkButtonProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const urlState = useFloatingLinkUrlInputState();
  const { props } = useFloatingLinkUrlInput(urlState);

  return (
    <Toolbar isAttached>
      <Button size="sm" onPress={editButtonProps.onClick} variant="tertiary">
        Edit link
      </Button>

      <Separator orientation="vertical" />

      <button type="button" {...unlinkButtonProps}>
        unlink
      </button>

      <ButtonGroup orientation="horizontal" variant="tertiary">
        <Button isIconOnly onPress={unlinkButtonProps.onClick}>
          <LinkSlash />
        </Button>
      </ButtonGroup>
    </Toolbar>
  );
}

export function LinkFloatingToolbar({ state }: { state?: LinkFloatingToolbarState }) {
  const activeCommentId = usePluginOption({ key: KEYS.comment }, "activeId");
  const activeSuggestionId = usePluginOption({ key: KEYS.suggestion }, "activeId");

  const floatingOptions: UseVirtualFloatingOptions = React.useMemo(
    () => ({
      middleware: [
        offset(8),
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

  console.log(textInputProps);

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

  const { props: inputProps } = useFormInputProps({
    preventDefaultOnEnterKeydown: true,
  });

  return (
    <>
      <div ref={insertRef} {...insertProps}>
        <LinkEdit inputProps={inputProps} textInputProps={textInputProps} />
      </div>

      <div ref={editRef} {...editProps}>
        {editState.isEditing ? (
          <LinkEdit inputProps={inputProps} textInputProps={textInputProps} />
        ) : (
          <LinkPreview editButtonProps={editButtonProps} unlinkButtonProps={unlinkButtonProps} />
        )}
      </div>
    </>
  );
}
