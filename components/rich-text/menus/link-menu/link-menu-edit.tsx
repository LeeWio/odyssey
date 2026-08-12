import { Globe } from "@gravity-ui/icons";
import { Button, ButtonGroup, InputGroup, Label, TextField, toast } from "@heroui/react";
import { CellSwitch, RichTextEditor, useRichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { getMarkRange } from "@tiptap/core";
import { useCallback, useState } from "react";

import { normalizeLinkUrl } from "@/components/rich-text/utils/link-utils";

interface LinkMenuEditProps {
  onCancel: () => void;
}

export const LinkMenuEdit: React.FC<LinkMenuEditProps> = ({ onCancel }) => {
  const { editor } = useRichTextEditor();

  const [url, setUrl] = useState(() => {
    return editor ? (editor.getAttributes("link").href ?? "") : "";
  });

  const [openInNewTab, setOpenInNewTab] = useState(() => {
    return editor ? editor.getAttributes("link").target === "_blank" : false;
  });

  const [displayText, setDisplayText] = useState(() => {
    if (!editor) {
      return "";
    }

    const { state } = editor;
    const { selection } = state;

    const range = getMarkRange(selection.$from, state.schema.marks.link);
    if (range) {
      return state.doc.textBetween(range.from, range.to, " ");
    }
    return state.doc.textBetween(selection.from, selection.to, " ");
  });

  const handleSave = useCallback(() => {
    if (!editor) {
      return;
    }

    const normalizedUrl = normalizeLinkUrl(url);
    if (url.trim() && !normalizedUrl) {
      toast.warning("Use a valid web, mail, telephone, page anchor, or site-relative link.");
      return;
    }

    if (normalizedUrl) {
      const { selection } = editor.state;
      const markRange = getMarkRange(selection.$from, editor.state.schema.marks.link);
      const from = markRange?.from ?? selection.from;
      const to = markRange?.to ?? selection.to;
      const selectedText = editor.state.doc.textBetween(from, to, " ");
      const linkText = displayText.trim();
      const chain = editor.chain().focus();

      if (linkText && linkText !== selectedText) {
        chain
          .insertContentAt({ from, to }, linkText)
          .setTextSelection({ from, to: from + linkText.length });
      } else if (from !== to) {
        chain.setTextSelection({ from, to });
      }

      chain.setLink({ href: normalizedUrl, target: openInNewTab ? "_blank" : null }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }

    onCancel?.();
  }, [displayText, editor, onCancel, openInNewTab, url]);

  return (
    <>
      <TextField className="w-full" name="text">
        <Label>Display Text</Label>
        <InputGroup variant="secondary">
          <InputGroup.Prefix>
            <Icon icon="gravity-ui:text" aria-hidden="true" />
          </InputGroup.Prefix>
          <InputGroup.Input
            value={displayText}
            onChange={(e) => setDisplayText(e.target.value)}
            placeholder="Enter display text"
          />
        </InputGroup>
      </TextField>

      <TextField className="w-full" name="url">
        <Label>Link URL</Label>
        <InputGroup variant="secondary">
          <InputGroup.Prefix>
            <Globe className="text-muted size-4" aria-hidden="true" />
          </InputGroup.Prefix>
          <InputGroup.Input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") onCancel?.();
            }}
            placeholder="Enter link URL..."
          />
        </InputGroup>
      </TextField>

      <RichTextEditor.LinkPopover.Actions>
        <CellSwitch isSelected={openInNewTab} onChange={setOpenInNewTab} className="w-full">
          <CellSwitch.Trigger>
            <CellSwitch.Label>Open in new tab</CellSwitch.Label>
            <CellSwitch.Control />
          </CellSwitch.Trigger>
        </CellSwitch>
        <ButtonGroup variant="secondary">
          <Button isIconOnly onPress={onCancel} aria-label="Cancel">
            <Icon icon="gravity-ui:xmark" aria-hidden="true" />
          </Button>
          <Button
            isIconOnly
            onPress={handleSave}
            isDisabled={url.trim() === ""}
            aria-label="Save link"
          >
            <ButtonGroup.Separator />
            <Icon icon="gravity-ui:arrow-uturn-cw-left" aria-hidden="true" />
          </Button>
        </ButtonGroup>
      </RichTextEditor.LinkPopover.Actions>
    </>
  );
};
