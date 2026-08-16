"use client";

import { Description, Header, Kbd, Label, ListBox, ScrollShadow, Separator } from "@heroui/react";
import {
  Check,
  CircleChevronDown,
  CurlyBrackets,
  Function as FunctionIcon,
  Heading1,
  Heading2,
  Heading3,
  LayoutCellsLarge,
  LayoutColumns,
  ListOl,
  ListCheck,
  ListUl,
  MusicNote,
  Magnifier,
  Minus,
  Picture,
  Paperclip,
  Play,
  QuoteOpen,
  Sparkles,
  Text,
} from "@gravity-ui/icons";
import {
  EmptyState,
  filterRichTextEditorSuggestionItems,
  RichTextEditor,
  type RichTextEditorSuggestionItem,
  type RichTextEditorSuggestionMenuRenderProps,
} from "@heroui-pro/react";
import type { ComponentType, SVGProps } from "react";
import { useEffect, useRef } from "react";
import { OPEN_YOUTUBE_DIALOG_EVENT } from "../media-insert-dialog";

const SLASH_COMMAND_GROUPS = [
  { id: "text", label: "Text" },
  { id: "blocks", label: "Lists and blocks" },
  { id: "media", label: "Media and layout" },
] as const;

type SlashCommandGroup = (typeof SLASH_COMMAND_GROUPS)[number]["id"];

interface SlashCommandItem extends RichTextEditorSuggestionItem {
  description: string;
  group: SlashCommandGroup;
  id: string;
}

const icon = (IconComponent: ComponentType<SVGProps<SVGSVGElement>>) => (
  <IconComponent aria-hidden="true" className="size-4" />
);

const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
    description: "Continue with plain body text",
    group: "text",
    icon: icon(Text),
    id: "paragraph",
    keywords: ["body", "paragraph", "plain", "text"],
    title: "Text",
  },
  ...([1, 2, 3] as const).map((level): SlashCommandItem => ({
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level }).run();
    },
    description:
      level === 1
        ? "Large section heading"
        : level === 2
          ? "Medium section heading"
          : "Small section heading",
    group: "text",
    icon: icon(level === 1 ? Heading1 : level === 2 ? Heading2 : Heading3),
    id: `heading-${level}`,
    keywords: [`h${level}`, "heading", "section", "title"],
    title: `Heading ${level}`,
  })),
  {
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
    description: "Create an unordered list",
    group: "blocks",
    icon: icon(ListUl),
    id: "bullet-list",
    keywords: ["bullet", "list", "unordered"],
    title: "Bulleted list",
  },
  {
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
    description: "Create a numbered list",
    group: "blocks",
    icon: icon(ListOl),
    id: "ordered-list",
    keywords: ["list", "number", "ordered"],
    title: "Numbered list",
  },
  {
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
    description: "Create a checklist with nestable tasks",
    group: "blocks",
    icon: icon(ListCheck),
    id: "task-list",
    keywords: ["check", "checklist", "task", "todo"],
    title: "Task list",
  },
  {
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
    description: "Highlight a quoted passage",
    group: "blocks",
    icon: icon(QuoteOpen),
    id: "blockquote",
    keywords: ["blockquote", "citation", "quote"],
    title: "Blockquote",
  },
  {
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
    description: "Insert a formatted code block",
    group: "blocks",
    icon: icon(CurlyBrackets),
    id: "code-block",
    keywords: ["code", "developer", "pre"],
    title: "Code block",
  },
  {
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          content: [
            {
              content: [{ text: "Action item: ", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "blockquote",
        })
        .run();
    },
    description: "Emphasize an action or takeaway",
    group: "blocks",
    icon: icon(Sparkles),
    id: "action-callout",
    keywords: ["action", "callout", "custom", "todo"],
    title: "Action callout",
  },
  {
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setDetails()
        .updateAttributes("details", { open: true })
        .run();
    },
    description: "Add collapsible supporting content",
    group: "blocks",
    icon: icon(CircleChevronDown),
    id: "details",
    keywords: ["accordion", "collapse", "details", "disclosure"],
    title: "Details",
  },
  {
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertBlockMath({ latex: "x" })
        .setNodeSelection(range.from)
        .run();
    },
    description: "Insert and edit a display equation",
    group: "media",
    icon: icon(FunctionIcon),
    id: "equation",
    keywords: ["equation", "formula", "latex", "math"],
    title: "Equation",
  },
  {
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent({ type: "image" }).run();
    },
    description: "Upload or drop an image",
    group: "media",
    icon: icon(Picture),
    id: "image",
    keywords: ["image", "media", "photo", "picture", "upload"],
    title: "Image",
  },
  {
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent({ type: "audio" }).run();
    },
    description: "Upload an audio player with retry support",
    group: "media",
    icon: icon(MusicNote),
    id: "audio",
    keywords: ["audio", "music", "podcast", "sound", "upload"],
    title: "Audio",
  },
  {
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent({ type: "attachment" }).run();
    },
    description: "Upload a downloadable file",
    group: "media",
    icon: icon(Paperclip),
    id: "attachment",
    keywords: ["attachment", "download", "file", "upload"],
    title: "Attachment",
  },
  {
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      editor.view.dom.dispatchEvent(new Event(OPEN_YOUTUBE_DIALOG_EVENT));
    },
    description: "Embed a privacy-enhanced YouTube player",
    group: "media",
    icon: icon(Play),
    id: "youtube",
    keywords: ["embed", "video", "youtube"],
    title: "YouTube",
  },
  {
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ cols: 3, rows: 3, withHeaderRow: true })
        .run();
    },
    description: "Insert a 3 by 3 table",
    group: "media",
    icon: icon(LayoutCellsLarge),
    id: "table",
    keywords: ["cells", "grid", "table"],
    title: "Table",
  },
  {
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertColumns(2).run();
    },
    description: "Split content into two columns",
    group: "media",
    icon: icon(LayoutColumns),
    id: "columns",
    keywords: ["columns", "layout", "split", "two"],
    title: "Columns",
  },
  {
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
    description: "Separate sections with a divider",
    group: "media",
    icon: icon(Minus),
    id: "divider",
    keywords: ["divider", "horizontal", "line", "rule", "separator"],
    title: "Divider",
  },
];

const getSlashItems = ({ query }: { query: string }): SlashCommandItem[] =>
  filterRichTextEditorSuggestionItems(SLASH_COMMANDS, query);

function SuggestionMenuContent({
  editor,
  items,
  query,
  selectedIndex,
  selectItem,
  setSelectedIndex,
}: RichTextEditorSuggestionMenuRenderProps<SlashCommandItem>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedItem = items[selectedIndex];
  const visibleGroups = SLASH_COMMAND_GROUPS.map((group) => ({
    ...group,
    items: items.filter((item) => item.group === group.id),
  })).filter((group) => group.items.length > 0);

  useEffect(() => {
    if (!selectedItem) return;

    scrollContainerRef.current
      ?.querySelector<HTMLElement>(`[data-slash-command-id="${selectedItem.id}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedItem]);

  useEffect(() => {
    const editorElement = editor.view.dom;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.isComposing ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        items.length === 0
      ) {
        return;
      }

      let nextIndex: number | undefined;

      if (event.key === "ArrowDown") {
        nextIndex = Math.min(selectedIndex + 1, items.length - 1);
      } else if (event.key === "ArrowUp") {
        nextIndex = Math.max(selectedIndex - 1, 0);
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = items.length - 1;
      } else if (event.key === "Enter" || event.key === "Tab") {
        const item = items[selectedIndex];

        if (!item) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        selectItem(item);

        return;
      } else {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      setSelectedIndex(nextIndex);
    };

    editorElement.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      editorElement.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [editor, items, selectItem, selectedIndex, setSelectedIndex]);

  if (items.length === 0) {
    return (
      <EmptyState className="py-6" size="sm">
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <Magnifier aria-hidden="true" />
          </EmptyState.Media>
          <EmptyState.Title>No commands found</EmptyState.Title>
          <EmptyState.Description>No insert command matches “{query}”.</EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
    );
  }

  return (
    <>
      <Header className="flex min-h-11 items-center px-3 py-2 text-sm font-medium">
        Insert block
      </Header>

      <ScrollShadow
        ref={scrollContainerRef}
        hideScrollBar
        className="max-h-[276px] overflow-y-auto px-1"
      >
        <ListBox
          aria-label="Insert block"
          className="w-full gap-1 p-1"
          selectedKeys={selectedItem ? new Set([selectedItem.id]) : new Set()}
          selectionMode="single"
          onAction={(key) => {
            const item = items.find((candidate) => candidate.id === String(key));

            if (item) selectItem(item);
          }}
        >
          {visibleGroups.map((group) => (
            <ListBox.Section key={group.id}>
              <Header className="text-muted px-2 py-1 text-xs font-medium">{group.label}</Header>
              {group.items.map((item) => {
                const index = items.indexOf(item);

                return (
                  <ListBox.Item
                    key={item.id}
                    className="data-[selected=true]:bg-accent-soft data-[selected=true]:text-accent-soft-foreground"
                    data-slash-command-id={item.id}
                    id={item.id}
                    textValue={item.title}
                    onHoverStart={() => setSelectedIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    <span className="bg-default text-muted flex size-9 shrink-0 items-center justify-center rounded-full">
                      {item.icon}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <Label>{item.title}</Label>
                      <Description className="truncate">{item.description}</Description>
                    </span>
                    <ListBox.ItemIndicator className="text-accent ms-auto">
                      {({ isSelected }) =>
                        isSelected ? <Check aria-hidden="true" className="size-4" /> : null
                      }
                    </ListBox.ItemIndicator>
                  </ListBox.Item>
                );
              })}
            </ListBox.Section>
          ))}
        </ListBox>
      </ScrollShadow>

      <Separator />

      <div className="text-muted flex min-h-10 items-center gap-3 px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5">
          <Kbd variant="light">
            <Kbd.Abbr keyValue="up" />
          </Kbd>
          <Kbd variant="light">
            <Kbd.Abbr keyValue="down" />
          </Kbd>
          Navigate
        </span>
        <span className="ms-auto flex items-center gap-1.5">
          <Kbd variant="light">
            <Kbd.Abbr keyValue="enter" />
          </Kbd>
          Insert
        </span>
      </div>
    </>
  );
}

export function SuggestionToolbar() {
  return (
    <RichTextEditor.SuggestionMenu<SlashCommandItem>
      char="/"
      className="p-0"
      items={getSlashItems}
      maxHeight={384}
      pluginKey="slash-command-menu"
    >
      {(props) => <SuggestionMenuContent {...props} />}
    </RichTextEditor.SuggestionMenu>
  );
}
