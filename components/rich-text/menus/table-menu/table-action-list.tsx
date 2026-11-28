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
import type { Editor } from "@tiptap/core";
import { useMediaQuery } from "@mantine/hooks";
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
  ownerId: string;
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
  ownerId,
  onClose,
}: TableActionListProps) {
  const { common, allHeaders } = selectionFormat(editor);
  const narrow = useMediaQuery("(max-width: 600px)");
  const row = kind === "row";
  const axis = kind !== "cell";
  const rect =
    axis && editor.state.selection instanceof CellSelection ? selectedRect(editor.state) : null;
  const count = rect ? (row ? rect.bottom - rect.top : rect.right - rect.left) : 1;
  const noun = row ? "row" : "column";
  const scope = count > 1 ? `${count} ${noun}s` : noun;
  const canSplit = !axis && applyTableAction(editor, kind, "split", false);
  const canMerge = !axis && applyTableAction(editor, kind, "merge", false);
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
        className={action === "header" ? "ps-2.5! pe-7!" : undefined}
        onAction={() => onAction(action)}
      >
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        <Label>{label}</Label>
        {action === "header" && <Dropdown.ItemIndicator className="start-auto! end-2.5!" />}
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

  return (
    <div data-table-menu-owner={ownerId}>
      <Dropdown.Menu
        key="actions"
        shouldCloseOnSelect
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
        {kind === "column" && (
          <Dropdown.Section aria-label="Column widths">
            {item("distribute-columns", "Distribute columns evenly", ArrowsExpandHorizontal)}
            {item("fit-columns", "Fit to content", ArrowsExpandHorizontal)}
            {item("reset-column-widths", "Reset column widths", Eraser)}
          </Dropdown.Section>
        )}
        {!axis && (canSplit || canMerge) && (
          <Dropdown.Section aria-label="Cell structure">
            {canSplit
              ? item("split", "Split cell", ArrowsExpandHorizontal)
              : item("merge", "Merge cells", LayoutCellsLarge)}
          </Dropdown.Section>
        )}
        {(axis || canSplit || canMerge) && <Separator />}
        {(["Color", "Alignment"] as const).map((name) => {
          const TriggerIcon = name === "Color" ? BucketPaint : TextAlignLeft;
          return (
            <Dropdown.SubmenuTrigger key={name}>
              <Dropdown.Item id={name} textValue={name}>
                <TriggerIcon aria-hidden="true" className="size-4 shrink-0" />
                <Label>{name}</Label>
                <Dropdown.SubmenuIndicator />
              </Dropdown.Item>
              <Dropdown.Popover
                placement={narrow ? "bottom start" : "right top"}
                className="pointer-events-auto max-h-[min(24rem,75dvh)] w-56 overflow-y-auto data-[exiting=true]:pointer-events-none"
              >
                <Dropdown.Menu
                  aria-label={name}
                  className="max-h-[min(24rem,75dvh)] overflow-y-auto"
                >
                  {formatSections(name)}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown.SubmenuTrigger>
          );
        })}
        {item(
          "clear",
          axis
            ? count > 1
              ? `Clear contents of ${scope}`
              : `Clear ${scope} contents`
            : "Clear contents",
          Eraser
        )}
        {axis && <Separator />}
        {axis && item("duplicate", `Duplicate ${scope}`, Copy)}
        {axis && item("delete", `Delete ${scope}`, TrashBin, true)}
        {axis && item("delete-table", "Delete table", TrashBin, true)}
      </Dropdown.Menu>
    </div>
  );
}
