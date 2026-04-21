"use client";

import { ButtonGroup, ToggleButtonGroup } from "@heroui/react";
import { KEYS } from "platejs";
import { useEditorReadOnly } from "platejs/react";
import { Icon } from "@iconify/react";
import {
  MarkToolbarButton,
  AlignToolbarButton,
  LinkToolbarButton,
  ToggleToolbarButton,
  InlineEquationToolbarButton,
  LineHeightToolbarButton,
  FontFamilyToolbarButton,
} from "./toolbar-kit";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  CurlyBracketsFunction,
  Link,
  ListCheckLock,
  BucketPaint,
} from "@gravity-ui/icons";
import { FontSizeToolbarButton } from "./font-size-toolbar-button";
import { FontColorToolbarButton } from "./plate-ui/font-color-toolbar-button";

export function FloatingToolbarButtons() {
  const readOnly = useEditorReadOnly();

  return (
    <>
      {!readOnly && (
        <>
          <ButtonGroup size="sm" variant="tertiary">
            <FontFamilyToolbarButton />
            <LineHeightToolbarButton />
          </ButtonGroup>

          <FontSizeToolbarButton />

          <ToggleButtonGroup size="sm">
            <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘+B)" icon={<Bold />} />
            <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘+I)" icon={<Italic />} />
            <MarkToolbarButton
              nodeType={KEYS.underline}
              tooltip="Underline (⌘+U)"
              icon={<Underline />}
            />
            <MarkToolbarButton
              nodeType={KEYS.strikethrough}
              tooltip="Strikethrough (⌘+⇧+M)"
              icon={<Strikethrough />}
            />
          </ToggleButtonGroup>

          <ToggleButtonGroup size="sm" selectionMode="multiple">
            <MarkToolbarButton
              nodeType={KEYS.sup}
              tooltip="Superscript (⌘+.)"
              icon={<Icon icon="lucide:superscript" />}
            />
            <MarkToolbarButton
              nodeType={KEYS.sub}
              tooltip="Subscript (⌘+,)"
              icon={<Icon icon="lucide:subscript" />}
            />
          </ToggleButtonGroup>

          <AlignToolbarButton />

          <LinkToolbarButton size="sm" variant="ghost">
            <Link />
          </LinkToolbarButton>

          <ToggleToolbarButton size="sm" variant="ghost">
            <ListCheckLock />
          </ToggleToolbarButton>

          <InlineEquationToolbarButton size="sm" variant="ghost">
            <CurlyBracketsFunction />
          </InlineEquationToolbarButton>

          <FontColorToolbarButton nodeType={KEYS.color} tooltip="Text color">
            <BucketPaint />
          </FontColorToolbarButton>
        </>
      )}
    </>
  );
}
