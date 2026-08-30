"use client";

import { useMemo } from "react";
import { isTextDropItem, useDragAndDrop } from "react-aria-components/useDragAndDrop";
import type { UseKanbanReturn } from "@heroui-pro/react";

export function usePersistentKanbanColumn<T extends object>(
  kanban: UseKanbanReturn<T>,
  column: string,
  onPersist: (keys: string[]) => void
) {
  const items = useMemo(
    () => kanban.list.items.filter((item) => kanban.getColumn(item) === column),
    [column, kanban]
  );

  const { dragAndDropHooks } = useDragAndDrop({
    acceptedDragTypes: [kanban.dragType],
    getDropOperation: () => "move",
    getItems: (keys) =>
      [...keys].map((key) => ({ [kanban.dragType]: String(key), "text/plain": String(key) })),
    async onInsert(event) {
      const keys = await Promise.all(
        event.items.filter(isTextDropItem).map((item) => item.getText(kanban.dragType))
      );
      for (const key of keys) {
        const item = kanban.list.getItem(key);
        if (item) kanban.list.update(key, kanban.setColumn(item, column));
      }
      if (event.target.dropPosition === "before") kanban.list.moveBefore(event.target.key, keys);
      if (event.target.dropPosition === "after") kanban.list.moveAfter(event.target.key, keys);
      queueMicrotask(() => onPersist(keys));
    },
    onReorder(event) {
      const keys = [...event.keys].map(String);
      if (event.target.dropPosition === "before")
        kanban.list.moveBefore(event.target.key, event.keys);
      if (event.target.dropPosition === "after")
        kanban.list.moveAfter(event.target.key, event.keys);
      queueMicrotask(() => onPersist(keys));
    },
    async onRootDrop(event) {
      const keys = await Promise.all(
        event.items.filter(isTextDropItem).map((item) => item.getText(kanban.dragType))
      );
      for (const key of keys) {
        const item = kanban.list.getItem(key);
        if (item) kanban.list.update(key, kanban.setColumn(item, column));
      }
      queueMicrotask(() => onPersist(keys));
    },
  });

  return { dragAndDropHooks, items };
}
