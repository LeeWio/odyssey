"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowsExpandHorizontal,
  BarsAscendingAlignLeftArrowDown,
  BarsDescendingAlignLeftArrowDown,
  BucketPaint,
  Copy,
  Eraser,
  LayoutCellsLarge,
  LayoutHeader,
  LayoutHeaderColumns,
  LetterAUnderline,
  ObjectAlignTop,
  ObjectAlignCenterVertical,
  ObjectAlignBottom,
  Plus,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  TrashBin,
} from "@gravity-ui/icons";
import { Dropdown, Header, Label, Separator } from "@heroui/react";
import { useMediaQuery } from "@mantine/hooks";
import type { Editor } from "@tiptap/core";
import { useLayoutEffect, useRef, useState } from "react";
import { CellSelection, selectedRect } from "@tiptap/pm/tables";
import {
  applyTableAction,
  type TableAction,
  type TableTargetKind,
} from "../../extensions/table/actions";

type FormatAction = Extract<TableAction, { attribute: string }>;

interface TableActionListProps {
  editor: Editor;
  kind: TableTargetKind;
  sortColumn?: number;
  onAction: (action: TableAction) => void;
  onClose: () => void;
}

const palette = [
  ["Default", null, null],
  ["Gray", "#78716c", "#e7e5e4"],
  ["Brown", "#986344", "#ead9cd"],
  ["Orange", "#c76a20", "#ffdfbf"],
  ["Yellow", "#a77d14", "#fef08a"],
  ["Green", "#30815b", "#bbf7d0"],
  ["Blue", "#3975ad", "#bfdbfe"],
  ["Purple", "#8359af", "#ddd6fe"],
  ["Pink", "#b44d88", "#fbcfe8"],
  ["Red", "#bf5550", "#fecdd3"],
] as const;

function colorOptions(attribute: "cellTextColor" | "cellBackgroundColor") {
  const isText = attribute === "cellTextColor";
  return palette.map(([name, text, background]) => ({
    label: `${name} ${isText ? "text" : "background"}`,
    value: isText ? text : background,
    icon: isText ? LetterAUnderline : BucketPaint,
  }));
}

const formatGroups = {
  Color: [
    { title: "Text color", attribute: "cellTextColor", options: colorOptions("cellTextColor") },
    {
      title: "Background color",
      attribute: "cellBackgroundColor",
      options: colorOptions("cellBackgroundColor"),
    },
  ],
  Alignment: [
    {
      title: "Horizontal alignment",
      attribute: "align",
      options: [
        { label: "Align left", value: "left", icon: TextAlignLeft },
        { label: "Align center", value: "center", icon: TextAlignCenter },
        { label: "Align right", value: "right", icon: TextAlignRight },
      ],
    },
    {
      title: "Vertical alignment",
      attribute: "verticalAlign",
      options: [
        { label: "Align top", value: "top", icon: ObjectAlignTop },
        { label: "Align middle", value: "middle", icon: ObjectAlignCenterVertical },
        { label: "Align bottom", value: "bottom", icon: ObjectAlignBottom },
      ],
    },
  ],
} as const;

function selectionFormat(editor: Editor) {
  const { selection } = editor.state;
  const common = new Map<FormatAction["attribute"], string | null>();
  let allHeaders = selection instanceof CellSelection;
  if (selection instanceof CellSelection) {
    selection.forEachCell((node) => {
      allHeaders &&= node.type.spec.tableRole === "header_cell";
      for (const groups of Object.values(formatGroups)) {
        for (const { attribute } of groups) {
          const value =
            node.attrs[attribute] ??
            (attribute === "align" ? "left" : attribute === "verticalAlign" ? "top" : null);
          if (!common.has(attribute) || common.get(attribute) === value)
            common.set(attribute, value);
          else common.set(attribute, "mixed");
        }
      }
    });
  }
  return { common, allHeaders };
}

export function TableActionList({
  editor,
  kind,
  sortColumn,
  onAction,
  onClose,
}: TableActionListProps) {
  const { common, allHeaders } = selectionFormat(editor);
  const compact = useMediaQuery("(max-width: 640px)", false, { getInitialValueInEffect: false });
  const [page, setPage] = useState<keyof typeof formatGroups | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const restoreItem = useRef<string | null>(null);
  const back = () => {
    restoreItem.current = page;
    setPage(null);
  };
  useLayoutEffect(() => {
    if (!page && restoreItem.current) {
      menuRef.current?.querySelector<HTMLElement>(`[data-key="${restoreItem.current}"]`)?.focus();
      restoreItem.current = null;
    }
  }, [page]);
  const row = kind === "row";
  const axis = kind !== "cell";
  const rect =
    axis && editor.state.selection instanceof CellSelection ? selectedRect(editor.state) : null;
  const count = rect ? (row ? rect.bottom - rect.top : rect.right - rect.left) : 1;
  const noun = row ? "row" : "column";
  const scope = count > 1 ? `${count} ${noun}s` : noun;
  const atStart = rect && (row ? rect.top === 0 : rect.left === 0);
  const atEnd = rect && (row ? rect.bottom === rect.map.height : rect.right === rect.map.width);

  function item(
    action: Exclude<TableAction, FormatAction>,
    label: string,
    Icon: typeof Plus,
    danger = false
  ) {
    return (
      <Dropdown.Item
        key={action}
        id={action}
        textValue={label}
        isDisabled={!applyTableAction(editor, kind, action, false, sortColumn)}
        variant={danger ? "danger" : undefined}
        onAction={() => onAction(action)}
      >
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        <Label>{label}</Label>
        {action === "header" && <Dropdown.ItemIndicator />}
      </Dropdown.Item>
    );
  }

  function formatSections(name: keyof typeof formatGroups) {
    return formatGroups[name].map(({ title, attribute, options }) => {
      const current = options.find((option) => option.value === common.get(attribute));
      return (
        <Dropdown.Section
          key={attribute}
          aria-label={title}
          selectionMode="single"
          selectedKeys={current ? [current.label] : []}
        >
          <Header>{title}</Header>
          {options.map(({ label, value, icon: Icon }) => (
            <Dropdown.Item
              key={label}
              id={label}
              textValue={label}
              onAction={() => onAction({ attribute, value })}
            >
              {attribute === "cellBackgroundColor" && value ? (
                <span
                  aria-hidden="true"
                  className="size-4 rounded-sm border border-current/15"
                  style={{ backgroundColor: value }}
                />
              ) : (
                <Icon
                  aria-hidden="true"
                  className="size-4"
                  style={attribute === "cellTextColor" && value ? { color: value } : undefined}
                />
              )}
              <Label>{label}</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          ))}
        </Dropdown.Section>
      );
    });
  }

  if (compact && page) {
    return (
      <div
        onKeyDownCapture={(event) => {
          if (event.key === "Escape" || event.key === "ArrowLeft") {
            event.preventDefault();
            event.stopPropagation();
            back();
          }
        }}
      >
        <Dropdown.Menu
          key={page}
          aria-label={page}
          autoFocus="first"
          shouldCloseOnSelect={false}
          className="w-56 max-w-full"
        >
          <Dropdown.Item id="back" textValue="Back" onAction={back}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            <Label>Back</Label>
          </Dropdown.Item>
          {formatSections(page)}
        </Dropdown.Menu>
      </div>
    );
  }

  return (
    <div
      onKeyDownCapture={(event) => {
        if (
          event.key !== "Escape" ||
          !(event.target instanceof Element) ||
          event.target.closest('[role="menu"]') !== menuRef.current
        )
          return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
        requestAnimationFrame(() => {
          if (!editor.isDestroyed) editor.view.focus();
        });
      }}
    >
      <Dropdown.Menu
        key="actions"
        ref={menuRef}
        shouldCloseOnSelect={!compact}
        aria-label="Table actions"
        autoFocus="first"
        onClose={onClose}
        className="w-56 max-w-full"
      >
        {axis && (
          <Dropdown.Section
            aria-label="Headers"
            selectionMode="multiple"
            selectedKeys={allHeaders ? ["header"] : []}
          >
            {count > 1 && <Header>{scope} selected</Header>}
            {item(
              "header",
              count > 1 ? `Header ${noun}s` : `Header ${kind}`,
              row ? LayoutHeader : LayoutHeaderColumns
            )}
          </Dropdown.Section>
        )}
        {axis && <Separator />}
        {axis && (
          <Dropdown.Section aria-label="Move and insert">
            {!atStart &&
              item(
                "move-before",
                row ? `Move ${scope} up` : `Move ${scope} left`,
                row ? ArrowUp : ArrowLeft
              )}
            {!atEnd &&
              item(
                "move-after",
                row ? `Move ${scope} down` : `Move ${scope} right`,
                row ? ArrowDown : ArrowRight
              )}
            {item("insert-before", row ? "Insert row above" : "Insert column left", Plus)}
            {item("insert-after", row ? "Insert row below" : "Insert column right", Plus)}
          </Dropdown.Section>
        )}
        {kind === "column" && (
          <Dropdown.Section aria-label="Sort rows">
            {item("sort-asc", "Sort column A–Z", BarsAscendingAlignLeftArrowDown)}
            {item("sort-desc", "Sort column Z–A", BarsDescendingAlignLeftArrowDown)}
          </Dropdown.Section>
        )}
        {!axis && (
          <Dropdown.Section aria-label="Cell structure">
            {applyTableAction(editor, kind, "split", false)
              ? item("split", "Split cell", ArrowsExpandHorizontal)
              : item("merge", "Merge cells", LayoutCellsLarge)}
          </Dropdown.Section>
        )}
        <Separator />
        {(["Color", "Alignment"] as const).map((name) => {
          const TriggerIcon = name === "Color" ? BucketPaint : TextAlignLeft;
          if (compact) {
            return (
              <Dropdown.Item key={name} id={name} textValue={name} onAction={() => setPage(name)}>
                <TriggerIcon aria-hidden="true" className="size-4 shrink-0" />
                <Label>{name}</Label>
                <Dropdown.SubmenuIndicator />
              </Dropdown.Item>
            );
          }
          return (
            <Dropdown.SubmenuTrigger key={name}>
              <Dropdown.Item id={name} textValue={name}>
                <TriggerIcon aria-hidden="true" className="size-4 shrink-0" />
                <Label>{name}</Label>
                <Dropdown.SubmenuIndicator />
              </Dropdown.Item>
              <Dropdown.Popover className="pointer-events-auto max-h-[min(24rem,75dvh)] overflow-y-auto data-[exiting=true]:pointer-events-none">
                <Dropdown.Menu aria-label={name} className="w-48">
                  {formatSections(name)}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown.SubmenuTrigger>
          );
        })}
        {item("clear", axis ? `Clear ${scope} contents` : "Clear contents", Eraser)}
        {axis && <Separator />}
        {axis && item("duplicate", `Duplicate ${scope}`, Copy)}
        {axis && item("delete", `Delete ${scope}`, TrashBin, true)}
        {axis && item("delete-table", "Delete table", TrashBin, true)}
      </Dropdown.Menu>
    </div>
  );
}
