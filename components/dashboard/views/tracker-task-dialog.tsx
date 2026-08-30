"use client";

import { Check, Plus, TrashBin } from "@gravity-ui/icons";
import {
  Button,
  Checkbox,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import { useState } from "react";
import type { KanbanColumn, KanbanTask, KanbanTaskRequest } from "@/lib/features/kanban";
import {
  useCompleteKanbanChecklistItemMutation,
  useCreateKanbanChecklistItemMutation,
  useDeleteKanbanChecklistItemMutation,
  useGetKanbanChecklistQuery,
  useUpdateKanbanChecklistItemMutation,
} from "@/lib/features/kanban";
import type { TrackerTask } from "./tracker-page";

interface TrackerTaskDialogProps {
  columns: KanbanColumn[];
  initialColumnId?: number | null;
  isOpen: boolean;
  task: TrackerTask | null;
  onOpenChange: (open: boolean) => void;
  onCreate?: (body: KanbanTaskRequest) => Promise<void>;
  onSave: (task: TrackerTask, body: KanbanTaskRequest) => Promise<void>;
}

export function TrackerTaskDialog({
  columns,
  initialColumnId,
  isOpen,
  task,
  onCreate,
  onOpenChange,
  onSave,
}: TrackerTaskDialogProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [content, setContent] = useState(task?.source.content ?? "");
  const [priority, setPriority] = useState<KanbanTask["priority"]>(
    task?.source.priority ?? "MEDIUM"
  );
  const [columnId, setColumnId] = useState(
    String(task?.source.columnId ?? initialColumnId ?? columns[0]?.id ?? "")
  );
  const [newItem, setNewItem] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const checklist = useGetKanbanChecklistQuery(task ? Number(task.id) : 0, {
    skip: !task || !isOpen,
  });
  const [createItem, { isLoading: isCreating }] = useCreateKanbanChecklistItemMutation();
  const [completeItem] = useCompleteKanbanChecklistItemMutation();
  const [updateItem] = useUpdateKanbanChecklistItemMutation();
  const [deleteItem] = useDeleteKanbanChecklistItemMutation();

  async function save() {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      const body = {
        title: title.trim(),
        content: content.trim() || null,
        priority,
        epic: task?.source.epic ?? "Odyssey workspace",
        size: task?.source.size ?? "M",
        columnId: Number(columnId),
        orderIndex: task?.source.orderIndex ?? 0,
        reminderAt: task?.source.reminderAt ?? null,
        tagIds: task ? task.source.tags.map((tag) => tag.id) : null,
        assigneeIds: task ? task.source.assignees.map((assignee) => assignee.id) : null,
      } satisfies KanbanTaskRequest;
      if (task) await onSave(task, body);
      else await onCreate?.(body);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function addChecklistItem() {
    if (!task || !newItem.trim()) return;
    try {
      await createItem({
        taskId: Number(task.id),
        body: {
          title: newItem.trim(),
          completed: false,
          orderIndex: checklist.data?.length ?? 0,
        },
      }).unwrap();
      setNewItem("");
      await checklist.refetch();
    } catch {
      toast.danger("Couldn't add this checklist item.");
    }
  }

  async function toggleChecklist(itemId: number, completed: boolean) {
    if (!task) return;
    try {
      await completeItem({ taskId: Number(task.id), itemId, completed }).unwrap();
      await checklist.refetch();
    } catch {
      toast.danger("Couldn't update this checklist item.");
    }
  }

  async function renameChecklist(item: NonNullable<typeof checklist.data>[number], value: string) {
    if (!task || !value.trim() || value.trim() === item.title) return;
    try {
      await updateItem({
        taskId: Number(task.id),
        itemId: item.id,
        body: { title: value.trim(), completed: item.completed, orderIndex: item.orderIndex },
      }).unwrap();
      await checklist.refetch();
    } catch {
      toast.danger("Couldn't rename this checklist item.");
    }
  }

  async function removeChecklistItem(itemId: number) {
    if (!task) return;
    try {
      await deleteItem({ taskId: Number(task.id), itemId }).unwrap();
      await checklist.refetch();
    } catch {
      toast.danger("Couldn't delete this checklist item.");
    }
  }

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} variant="blur">
        <Modal.Container size="sm">
          <Modal.Dialog aria-label="Edit tracker task" className="sm:max-w-lg">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{task ? "Edit task" : "Add task"}</Modal.Heading>
              <p className="text-muted text-sm">
                Keep the brief, status, and next action together.
              </p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <TextField isRequired>
                <Label>Title</Label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} />
              </TextField>
              <TextField>
                <Label>Description</Label>
                <TextArea
                  rows={4}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
              </TextField>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={priority}
                  onChange={(value) => setPriority(value as KanbanTask["priority"])}
                >
                  <Label>Priority</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {(["LOW", "MEDIUM", "HIGH"] as const).map((value) => (
                        <ListBox.Item key={value} id={value} textValue={value}>
                          {value}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
                <Select value={columnId} onChange={(value) => setColumnId(String(value ?? ""))}>
                  <Label>Status</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {columns.map((column) => (
                        <ListBox.Item
                          key={column.id}
                          id={String(column.id)}
                          textValue={column.name}
                        >
                          {column.name}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
              {task ? (
                <div className="border-separator flex flex-col gap-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Checklist</Label>
                    {checklist.isFetching ? <Spinner size="sm" /> : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    {checklist.data?.map((item) => (
                      <div className="flex items-center gap-2" key={item.id}>
                        <Checkbox
                          isSelected={item.completed}
                          onChange={(selected) => void toggleChecklist(item.id, selected)}
                        >
                          <Checkbox.Control>
                            <Checkbox.Indicator>
                              <Check />
                            </Checkbox.Indicator>
                          </Checkbox.Control>
                        </Checkbox>
                        <Input
                          aria-label="Checklist item"
                          className="min-w-0 flex-1"
                          defaultValue={item.title}
                          onBlur={(event) => void renameChecklist(item, event.target.value)}
                        />
                        <Button
                          isIconOnly
                          aria-label="Delete checklist item"
                          size="sm"
                          variant="ghost"
                          onPress={() => void removeChecklistItem(item.id)}
                        >
                          <TrashBin className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label="New checklist item"
                      className="min-w-0 flex-1"
                      placeholder="Add a next action"
                      value={newItem}
                      onChange={(event) => setNewItem(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void addChecklistItem();
                      }}
                    />
                    <Button
                      isDisabled={!newItem.trim()}
                      isPending={isCreating}
                      size="sm"
                      variant="secondary"
                      onPress={() => void addChecklistItem()}
                    >
                      <Plus className="size-4" /> Add
                    </Button>
                  </div>
                </div>
              ) : null}
            </Modal.Body>
            <Modal.Footer>
              <Button size="sm" variant="tertiary" onPress={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                isDisabled={!title.trim()}
                isPending={isSaving}
                size="sm"
                onPress={() => void save()}
              >
                {task ? "Save changes" : "Create task"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
