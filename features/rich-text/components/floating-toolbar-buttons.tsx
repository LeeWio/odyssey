"use client";

import { Button, ButtonGroup, ToggleButtonGroup } from "@heroui/react";
import { KEYS } from "platejs";
import { useEditorReadOnly } from "platejs/react";
import { MarkToolbarButton } from "./toolbar-kit";
import { Bold, Italic, Strikethrough, Underline, Superscript } from "@gravity-ui/icons";
import { FontSizeToolbarButton } from "./font-size-toolbar-button";
import { LineHeightToolbarButton } from "./line-height-toolbar-button";
import { FontFamilyToolbarButton } from "./font-family-toolbar-button";
import { AlignToolbarButton } from "./align-toolbar-button";
import { LinkToolbarButton } from "./link-toolbar-button";
import { Link } from "@gravity-ui/icons";

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

          <ToggleButtonGroup size="sm">
            <MarkToolbarButton nodeType={KEYS.sup} tooltip="Sup (⌘+,)" icon={<Superscript />} />
            <MarkToolbarButton nodeType={KEYS.sub} tooltip="Sub (⌘+.)" icon={<Superscript />} />
          </ToggleButtonGroup>

          <AlignToolbarButton />

          <LinkToolbarButton size="sm" tooltip="Insert Link (⌘+K)" variant="tertiary">
            <Link />
          </LinkToolbarButton>
        </>
      )}
    </>
  );
}
