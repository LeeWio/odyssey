"use client";

import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { useRichTextEditor } from "@heroui-pro/react";
import { isValidYoutubeUrl } from "@tiptap/extension-youtube";
import { useEffect, useState } from "react";

export const OPEN_YOUTUBE_DIALOG_EVENT = "odyssey:open-youtube-dialog";

export function MediaInsertDialog() {
  const { editor } = useRichTextEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const isInvalid = url.length > 0 && !isValidYoutubeUrl(url.trim());

  useEffect(() => {
    if (!editor) return;
    const editorElement = editor.view.dom;
    const openDialog = () => setIsOpen(true);
    editorElement.addEventListener(OPEN_YOUTUBE_DIALOG_EVENT, openDialog);
    return () => editorElement.removeEventListener(OPEN_YOUTUBE_DIALOG_EVENT, openDialog);
  }, [editor]);

  const insertVideo = () => {
    const normalizedUrl = url.trim();
    if (!editor || !isValidYoutubeUrl(normalizedUrl)) return;
    editor.chain().focus().setYoutubeVideo({ src: normalizedUrl }).run();
    setUrl("");
    setIsOpen(false);
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        variant="blur"
        onOpenChange={(nextIsOpen) => {
          setIsOpen(nextIsOpen);
          if (!nextIsOpen) setUrl("");
        }}
      >
        <Modal.Container size="sm">
          <Modal.Dialog aria-label="Insert YouTube video">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Insert YouTube video</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <TextField isRequired isInvalid={isInvalid} name="youtube-url">
                <Label>YouTube URL</Label>
                <Input
                  autoFocus
                  placeholder="https://www.youtube.com/watch?v=…"
                  value={url}
                  variant="secondary"
                  onChange={(event) => setUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      insertVideo();
                    }
                  }}
                />
                <p className="text-muted text-xs">
                  Paste a youtube.com or youtu.be link. Playback uses YouTube&apos;s
                  privacy-enhanced domain.
                </p>
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button isDisabled={!url.trim() || isInvalid} variant="primary" onPress={insertVideo}>
                Insert video
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
