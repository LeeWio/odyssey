"use client";

import {
  Avatar,
  Description,
  Header,
  Kbd,
  Label,
  ListBox,
  ScrollShadow,
  Separator,
} from "@heroui/react";
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
import { EmptyState } from "@heroui-pro/react";
import {
  filterRichTextEditorSuggestionItems,
  RichTextEditor,
  type RichTextEditorSuggestionItem,
  type RichTextEditorSuggestionMenuRenderProps,
} from "@heroui-pro/react/rich-text-editor";
import type { ComponentType, SVGProps } from "react";
import { useEffect, useMemo, useRef } from "react";
import { useGetAllUsersQuery, type UserResponse } from "@/lib/features/user";
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

interface MentionItem extends RichTextEditorSuggestionItem {
  id: string;
  user: UserResponse;
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

function MentionMenuContent({
  items,
  selectedIndex,
  selectItem,
  setSelectedIndex,
  query,
}: RichTextEditorSuggestionMenuRenderProps<MentionItem>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedItem = items[selectedIndex];

  useEffect(() => {
    if (!selectedItem) return;

    scrollContainerRef.current
      ?.querySelector<HTMLElement>(`[data-mention-user-id="${selectedItem.id}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedItem]);

  if (items.length === 0) {
    return <div className="text-muted px-3 py-2 text-sm">No users found for “{query}”.</div>;
  }

  return (
    <div
      ref={scrollContainerRef}
      className="w-fit max-w-[min(24rem,calc(100vw-1rem))] min-w-64 overflow-y-auto"
    >
      <ListBox
        aria-label="Mention user"
        className="w-64 p-1"
        selectedKeys={selectedItem ? new Set([selectedItem.id]) : new Set()}
        selectionMode="single"
        onAction={(key) => {
          const item = items.find((candidate) => candidate.id === String(key));
          if (item) selectItem(item);
        }}
      >
        {items.map((item, index) => (
          <ListBox.Item
            key={item.id}
            className="data-[selected=true]:bg-accent-soft data-[selected=true]:text-accent-soft-foreground"
            id={item.id}
            data-mention-user-id={item.id}
            textValue={item.title}
            onHoverStart={() => setSelectedIndex(index)}
            onMouseDown={(event) => event.preventDefault()}
          >
            <Avatar size="sm">
              {item.user.avatar ? <Avatar.Image alt={item.title} src={item.user.avatar} /> : null}
              <Avatar.Fallback>{item.title.slice(0, 1).toUpperCase()}</Avatar.Fallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <Label>{item.title}</Label>
              <Description className="truncate">{item.description}</Description>
            </div>
            <ListBox.ItemIndicator />
          </ListBox.Item>
        ))}
      </ListBox>
    </div>
  );
}

export function SuggestionToolbar() {
  // TODO: replace the admin-only endpoint with a public user search endpoint.
  const { data: users = [] } = useGetAllUsersQuery();

  const mentionItems = useMemo(
    () =>
      users.map((user): MentionItem => ({
        command: ({ editor, range }) => {
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: "mention",
                attrs: { id: String(user.id), label: user.username },
              },
              { type: "text", text: " " },
            ])
            .run();
        },
        description: user.nickname || user.email,
        id: String(user.id),
        keywords: [user.username, user.nickname || "", user.email],
        title: user.username,
        user,
      })),
    [users]
  );

  return (
    <>
      <RichTextEditor.SuggestionMenu<SlashCommandItem>
        char="/"
        className="p-0"
        items={getSlashItems}
        maxHeight={384}
        pluginKey="slash-command-menu"
      >
        {(props) => <SuggestionMenuContent {...props} />}
      </RichTextEditor.SuggestionMenu>
      <RichTextEditor.SuggestionMenu<MentionItem>
        char="@"
        className="w-fit min-w-0"
        items={({ query }) => filterRichTextEditorSuggestionItems(mentionItems, query)}
        pluginKey="mention-menu"
      >
        {(props) => <MentionMenuContent {...props} />}
      </RichTextEditor.SuggestionMenu>
    </>
  );
}
