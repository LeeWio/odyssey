"use client";

import { Button, Kbd, Modal } from "@heroui/react";
import { RichTextEditor } from "@heroui-pro/react";
import { Keyboard } from "@gravity-ui/icons";
import { useEffect, useState } from "react";

const SHORTCUT_GROUPS = [
  {
    label: "Editing",
    shortcuts: [
      { action: "Undo", keys: ["⌘/Ctrl", "Z"] },
      { action: "Redo", keys: ["⌘/Ctrl", "Shift", "Z"] },
      { action: "Find and replace", keys: ["⌘/Ctrl", "F"] },
    ],
  },
  {
    label: "Formatting",
    shortcuts: [
      { action: "Bold", keys: ["⌘/Ctrl", "B"] },
      { action: "Italic", keys: ["⌘/Ctrl", "I"] },
      { action: "Underline", keys: ["⌘/Ctrl", "U"] },
      { action: "Inline code", keys: ["⌘/Ctrl", "E"] },
    ],
  },
  {
    label: "Blocks",
    shortcuts: [
      { action: "Heading 1", keys: ["⌘/Ctrl", "Alt", "1"] },
      { action: "Code block", keys: ["⌘/Ctrl", "Alt", "0"] },
      { action: "Task list", keys: ["⌘/Ctrl", "Shift", "9"] },
      { action: "Indent list item", keys: ["Tab"] },
    ],
  },
] as const;

export function EditorFooter() {
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        !(event.metaKey || event.ctrlKey) ||
        event.key !== "/"
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element) || !target.closest('[data-slot="rich-text-editor"]')) {
        return;
      }

      event.preventDefault();
      setIsShortcutHelpOpen(true);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <RichTextEditor.Footer className="flex shrink-0 items-center justify-between gap-3 select-none">
        <RichTextEditor.CharacterCount showWords />
        <Button size="sm" variant="tertiary" onPress={() => setIsShortcutHelpOpen(true)}>
          <Keyboard aria-hidden="true" className="size-4" />
          Shortcuts
        </Button>
      </RichTextEditor.Footer>

      <Modal>
        <Modal.Backdrop isOpen={isShortcutHelpOpen} onOpenChange={setIsShortcutHelpOpen}>
          <Modal.Container size="sm">
            <Modal.Dialog aria-label="Keyboard shortcuts" className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Keyboard shortcuts</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto py-4">
                {SHORTCUT_GROUPS.map((group) => (
                  <section aria-labelledby={`shortcut-group-${group.label}`} key={group.label}>
                    <h3
                      className="text-muted mb-2 text-xs font-medium"
                      id={`shortcut-group-${group.label}`}
                    >
                      {group.label}
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {group.shortcuts.map((shortcut) => (
                        <li
                          className="flex min-h-8 items-center justify-between gap-4 text-sm"
                          key={shortcut.action}
                        >
                          <span>{shortcut.action}</span>
                          <span
                            className="flex items-center gap-1"
                            aria-label={shortcut.keys.join(" plus ")}
                          >
                            {shortcut.keys.map((key) => (
                              <Kbd key={key}>
                                <Kbd.Content>{key}</Kbd.Content>
                              </Kbd>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onPress={() => setIsShortcutHelpOpen(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
