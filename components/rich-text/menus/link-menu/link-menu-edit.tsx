import { Globe } from "@gravity-ui/icons";
import { CellSwitch, RichTextEditor, useRichTextEditor } from "@heroui-pro/react";
import { Button, ButtonGroup, InputGroup, Label, TextField, useOverlayState } from "@heroui/react";
import { Icon } from "@iconify/react";
import { getMarkRange } from "@tiptap/core";
import { useCallback, useState } from "react";

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

    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }

    onCancel?.();
  }, [editor, url]);

  return (
    <>
      <TextField className="w-full" name="text" isDisabled>
        <Label>Display Text</Label>
        <InputGroup variant="secondary">
          <InputGroup.Prefix>
            <Icon icon="gravity-ui:text" />
          </InputGroup.Prefix>
          <InputGroup.Input
            value={displayText}
            onChange={(e: any) => setDisplayText(e.target.value)}
            placeholder="Enter display text"
          />
        </InputGroup>
      </TextField>

      <TextField className="w-full" name="url">
        <Label>Link URL</Label>
        <InputGroup variant="secondary">
          <InputGroup.Prefix>
            <Globe className="text-muted size-4" />
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
            <Icon icon="gravity-ui:xmark" />
          </Button>
          <Button
            isIconOnly
            onPress={handleSave}
            isDisabled={url.trim() === ""}
            aria-label="Save link"
          >
            <ButtonGroup.Separator />
            <Icon icon="gravity-ui:arrow-uturn-cw-left" />
          </Button>
        </ButtonGroup>
      </RichTextEditor.LinkPopover.Actions>
    </>
  );
};
