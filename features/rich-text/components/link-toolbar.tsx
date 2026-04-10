"use client";

import * as React from "react";

import { LinkSlash, Link as LinkIcon } from "@gravity-ui/icons";

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
  useLinkOpenButtonState,
} from "@platejs/link/react";
import { KEYS, OperationApi, TLinkElement } from "platejs";
import {
  useEditorRef,
  useEditorSelection,
  useElement,
  useFormInputProps,
  usePluginOption,
} from "platejs/react";
import {
  Button,
  ButtonGroup,
  buttonVariants,
  Input,
  Link,
  Separator,
  Surface,
  Toolbar,
} from "@heroui/react";
import { AnimatePresence } from "motion/react";
import { useMemo } from "react";
import { getLinkAttributes } from "@platejs/link";

export function LinkEdit({
  textDefaultValue,
  textRef,
  textOnChange,
  onKeyDownCapture,
}: {
  onKeyDownCapture?: React.KeyboardEventHandler<HTMLDivElement>;
  textDefaultValue?: string;
  textRef?: React.Ref<HTMLInputElement>;
  textOnChange?: React.ChangeEventHandler<HTMLInputElement>;
}) {
  const state = useFloatingLinkUrlInputState();
  const { props: urlInputProps, ref } = useFloatingLinkUrlInput(state);

  return (
    <Surface className="toolbar toolbar--vertical toolbar--attached rounded-xl">
      <Input
        ref={ref}
        fullWidth
        variant="secondary"
        defaultValue={urlInputProps.defaultValue}
        onChange={urlInputProps.onChange}
      />

      <Input
        fullWidth
        variant="secondary"
        placeholder="Text to display"
        data-plate-focus
        defaultValue={textDefaultValue}
        ref={textRef}
        onChange={textOnChange}
      />
    </Surface>
  );
}

type LinkPreviewProps = {
  onEdit?: () => void;
  onUnlink?: () => void;
};

export function LinkPreview({ onEdit, onUnlink }: { onEdit?: () => void; onUnlink?: () => void }) {
  const state = useLinkOpenButtonState();
  const url = state.element?.url;

  return (
    <Toolbar isAttached>
      <Button size="sm" onPress={onEdit} variant="ghost">
        {url}
      </Button>

      <Separator orientation="vertical" />

      <ButtonGroup orientation="horizontal" variant="tertiary" size="sm">
        <LinkOpenButton />
        <Button isIconOnly onPress={onUnlink}>
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

  const input = (
    <LinkEdit
      onKeyDownCapture={inputProps.onKeyDownCapture}
      textDefaultValue={textInputProps.defaultValue}
      textRef={textInputProps.ref}
      textOnChange={textInputProps.onChange}
    />
  );

  const editContent = editState.isEditing ? (
    input
  ) : (
    <LinkPreview onEdit={editButtonProps.onClick} onUnlink={unlinkButtonProps.onClick} />
  );

  return (
    <>
      <AnimatePresence>
        {!hidden && (
          <>
            <div ref={insertRef} {...insertProps}>
              {input}
            </div>

            <div ref={editRef} {...editProps}>
              {editContent}
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function LinkOpenButton() {
  const editor = useEditorRef();
  const selection = useEditorSelection();

  const attributes = useMemo(() => {
    const entry = editor.api.node<TLinkElement>({
      match: { type: editor.getType(KEYS.link) },
    });
    if (!entry) {
      return {};
    }
    const [element] = entry;
    return getLinkAttributes(editor, element);
  }, [editor, selection]);

  return (
    <Link
      {...attributes}
      onMouseOver={(e) => {
        e.stopPropagation();
      }}
      aria-label="Open link in a new tab"
      target="_blank"
      className={buttonVariants({ size: "sm", isIconOnly: true, variant: "tertiary" })}
    >
      <LinkIcon />
    </Link>
  );
}
