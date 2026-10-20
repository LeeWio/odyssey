"use client";

import type { UseKanbanReturn } from "@heroui-pro/react";

import { ListCheck, Plus } from "@gravity-ui/icons";
import {
  Button,
  Chip,
  Description,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import {
  EmptyState,
  Kanban,
  Sheet,
  useKanban,
  useKanbanCardPlaceholder,
  useKanbanColumn,
} from "@heroui-pro/react";
import { useMemo, useState } from "react";

import {
  useArchiveLifeListItemMutation,
  useChangeLifeListStatusMutation,
  useCreateLifeListItemMutation,
  useCreateLifeListMemoryMutation,
  useDeleteLifeListItemMutation,
  useGetAdminLifeListCategoriesQuery,
  useGetAdminLifeListQuery,
  useRestoreLifeListItemMutation,
  useUpdateLifeListItemMutation,
  type LifeListItemRequest,
  type LifeListItemResponse,
  type LifeListStatus,
  type LifeListVisibility,
} from "@/lib/features/life-list";
import { STATUS_PROGRESS, StatusMeter } from "@/components/life-list/progress-meter";

const COLUMNS: readonly LifeListStatus[] = ["planned", "in_progress", "completed", "abandoned"];

const COLUMN_LABEL: Record<LifeListStatus, string> = {
  abandoned: "Changed my mind",
  completed: "Completed",
  in_progress: "In progress",
  planned: "Planned",
};

const COLUMN_COLOR: Record<LifeListStatus, string> = {
  abandoned: "var(--muted)",
  completed: "var(--success)",
  in_progress: "var(--accent)",
  planned: "var(--warning)",
};

type BoardItem = LifeListItemResponse;

function toRequest(item: LifeListItemResponse, status: LifeListStatus): LifeListItemRequest {
  return {
    title: item.title,
    description: item.description,
    motivation: item.motivation,
    categoryId: item.category?.id ?? null,
    status,
    visibility: item.visibility,
    sortOrder: item.sortOrder,
    completedAt: status === "completed" ? (item.completedAt ?? today()) : null,
  };
}

export function LifeListNestedSheets({
  createOnly = false,
  createOpen = false,
  createStatus = "planned",
  item,
  onCreateOpenChange,
  onCreateStatusChange,
  onCreated,
  onItemOpenChange,
}: {
  createOnly?: boolean;
  createOpen?: boolean;
  createStatus?: LifeListStatus;
  item: LifeListItemResponse | null;
  onCreateOpenChange?: (open: boolean) => void;
  onCreateStatusChange?: (status: LifeListStatus) => void;
  onCreated?: (item: LifeListItemResponse) => void;
  onItemOpenChange: (open: boolean) => void;
}) {
  const query = useGetAdminLifeListQuery({ archived: true, page: 0, size: 200 });
  const latest = item ? (query.data?.list.find((entry) => entry.id === item.id) ?? item) : null;

  if (createOnly) {
    return (
      <CreateWishSheet
        isOpen={createOpen}
        status={createStatus}
        onCreated={(created) => onCreated?.(created)}
        onOpenChange={(open) => onCreateOpenChange?.(open)}
        onStatusChange={(next) => onCreateStatusChange?.(next)}
      />
    );
  }

  return (
    <LifeListSheet
      item={latest}
      onOpenChange={onItemOpenChange}
      onRefresh={() => query.refetch()}
    />
  );
}

export function LifeListAdminPage({
  onCreate,
  onOpen,
}: {
  onCreate: (status: LifeListStatus) => void;
  onOpen: (item: LifeListItemResponse) => void;
}) {
  const query = useGetAdminLifeListQuery({ archived: true, page: 0, size: 200 });

  if (query.isLoading) {
    return <p className="text-muted px-5 pt-6 text-sm">Loading the list…</p>;
  }
  if (query.isError || !query.data) {
    return (
      <EmptyState>
        <EmptyState.Title>The list could not be loaded.</EmptyState.Title>
        <Button variant="outline" onPress={() => query.refetch()}>
          Try again
        </Button>
      </EmptyState>
    );
  }

  return (
    <LifeListBoard
      key={query.data.list.map((item) => `${item.id}:${item.updatedAt}:${item.status}`).join("|")}
      completed={query.data.summary.completed}
      items={query.data.list}
      total={query.data.summary.total}
      onCreate={onCreate}
      onOpen={onOpen}
      onRefresh={() => query.refetch()}
    />
  );
}

function LifeListBoard({
  completed,
  items,
  onCreate,
  onOpen,
  onRefresh,
  total,
}: {
  completed: number;
  items: LifeListItemResponse[];
  onCreate: (status: LifeListStatus) => void;
  onOpen: (item: LifeListItemResponse) => void;
  onRefresh: () => void;
  total: number;
}) {
  const active = useMemo(() => items.filter((item) => !item.archivedAt), [items]);
  const kanban = useKanban<BoardItem>({
    getColumn: (item) => item.status,
    getKey: (item) => String(item.id),
    initialItems: active,
    setColumn: (item, column) => {
      const status = column as LifeListStatus;
      if (item.status !== status) onStageChange(item, status);
      return { ...item, status };
    },
  });
  const [changeStatus] = useChangeLifeListStatusMutation();
  const onStageChange = (item: BoardItem, status: LifeListStatus) => {
    void changeStatus({
      id: item.id,
      body: { status, completedAt: status === "completed" ? today() : null },
    })
      .unwrap()
      .catch(() => {
        toast.danger("Couldn't update the status. The board has been restored.");
        onRefresh();
      });
  };
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex h-[calc(100svh-8rem)] min-h-96 flex-col gap-2 overflow-hidden px-4 pt-4 pb-4">
      <Kanban hideScrollBar className="min-h-0 flex-1 items-stretch" size="md">
        {COLUMNS.map((status) => (
          <LifeListColumn
            key={status}
            kanban={kanban}
            status={status}
            onCreate={() => onCreate(status)}
            onOpen={onOpen}
          />
        ))}
      </Kanban>
      <div className="text-muted flex shrink-0 items-center justify-between gap-3 px-1 text-xs">
        <span>
          {active.length} wishes · {completed} / {total} completed
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-24">
            <WishMeter label={`${percent}% completed`} value={percent} />
          </span>
          <span className="tabular-nums">{percent}%</span>
        </span>
      </div>
    </div>
  );
}

function LifeListColumn({
  kanban,
  onCreate,
  onOpen,
  status,
}: {
  kanban: UseKanbanReturn<BoardItem>;
  onCreate: () => void;
  onOpen: (item: BoardItem) => void;
  status: LifeListStatus;
}) {
  const { renderDropIndicator } = useKanbanCardPlaceholder({
    renderIndicator: (target) => <Kanban.DropIndicator target={target} />,
  });
  const column = useKanbanColumn(kanban, status, { renderDropIndicator });

  const memories = column.items.reduce((sum, item) => sum + item.memoryCount, 0);

  return (
    <Kanban.Column className="h-full min-h-0 border-0 shadow-none ring-0 outline-none">
      <Kanban.ColumnHeader>
        <Kanban.ColumnIndicator style={{ backgroundColor: COLUMN_COLOR[status] }} />
        <Kanban.ColumnTitle>{COLUMN_LABEL[status]}</Kanban.ColumnTitle>
        <Kanban.ColumnCount>{column.items.length}</Kanban.ColumnCount>
        <span className="text-muted ml-auto text-xs tabular-nums">{memories}</span>
      </Kanban.ColumnHeader>
      <Kanban.ColumnBody className="min-h-0 flex-1 border-0 shadow-none ring-0 outline-none">
        <Kanban.ScrollShadow className="mb-0 min-h-0 flex-1 overflow-y-auto">
          <Kanban.CardList
            aria-label={`${COLUMN_LABEL[status]} wishes`}
            className="min-h-0 flex-1 pb-0"
            dragAndDropHooks={column.dragAndDropHooks}
            items={column.items}
            renderEmptyState={() => "No wishes in this stage."}
          >
            {(item) => <WishCard id={String(item.id)} item={item} onAction={() => onOpen(item)} />}
          </Kanban.CardList>
        </Kanban.ScrollShadow>
        <div className="flex flex-col gap-1 px-2 pt-2 pb-2">
          <Button
            fullWidth
            className="text-muted hover:text-foreground data-[hovered=true]:text-foreground justify-start text-xs"
            size="sm"
            variant="ghost"
            onPress={onCreate}
          >
            <Plus className="size-3" />
            Create wish
          </Button>
          <div className="text-muted flex items-center justify-between px-2 text-xs">
            <span>Stage total</span>
            <span className="font-medium tabular-nums">{column.items.length}</span>
          </div>
        </div>
      </Kanban.ColumnBody>
    </Kanban.Column>
  );
}

function WishCard({ id, item, onAction }: { id: string; item: BoardItem; onAction: () => void }) {
  const progress = STATUS_PROGRESS[item.status];
  const subtitle = [String(item.number).padStart(3, "0"), item.category?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <Kanban.Card id={id} textValue={`${item.number} ${item.title}`} onAction={onAction}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="bg-surface-secondary text-muted flex size-6 shrink-0 items-center justify-center rounded-md">
            <ListCheck className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm leading-6 font-semibold">{item.title}</p>
            <p className="text-muted truncate text-xs leading-4">{subtitle}</p>
          </div>
        </div>
        <Chip
          className="h-6 shrink-0"
          color={item.visibility === "private" ? "default" : "success"}
          size="sm"
          variant="soft"
        >
          {item.visibility === "private" ? "Private" : "Public"}
        </Chip>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold tabular-nums">{item.memoryCount}</span>
        <span className="text-muted max-w-28 truncate text-[11px]">
          {item.memoryCount === 1 ? "1 memory" : `${item.memoryCount} memories`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <WishMeter label={`${item.title} progress ${progress}%`} value={progress} />
        </div>
        <span className="text-muted text-xs tabular-nums">{progress}%</span>
      </div>
      <div className="text-muted flex justify-between text-[11px]">
        <span>{item.completedAt ? `Done ${item.completedAt}` : "Open"}</span>
        <span>{COLUMN_LABEL[item.status]}</span>
      </div>
    </Kanban.Card>
  );
}

function WishMeter({ label, value }: { label: string; value: number }) {
  return <StatusMeter label={label} value={value} />;
}

function LifeListSheet({
  item,
  onOpenChange,
  onRefresh,
}: {
  item: LifeListItemResponse | null;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}) {
  const { data: categories = [] } = useGetAdminLifeListCategoriesQuery();
  const [updateItem, { isLoading }] = useUpdateLifeListItemMutation();
  const [archiveItem] = useArchiveLifeListItemMutation();
  const [restoreItem] = useRestoreLifeListItemMutation();
  const [deleteItem] = useDeleteLifeListItemMutation();
  const [createMemory, { isLoading: isSavingMemory }] = useCreateLifeListMemoryMutation();
  const [draft, setDraft] = useState<LifeListItemRequest | null>(null);
  const [memory, setMemory] = useState("");
  const form = draft ?? (item ? toRequest(item, item.status) : null);

  const save = async () => {
    if (!item || !form || !form.title.trim()) return;
    await updateItem({
      id: item.id,
      body: {
        ...form,
        title: form.title.trim(),
        completedAt: form.status === "completed" ? form.completedAt || today() : null,
      },
    }).unwrap();
    setDraft(null);
    onRefresh();
  };

  return (
    <Sheet.NestedRoot isOpen={Boolean(item)} placement="right" onOpenChange={onOpenChange}>
      <Sheet.Backdrop variant="transparent">
        <Sheet.Content className="mx-auto w-full sm:max-w-[520px]">
          <Sheet.Dialog className="h-[85vh]">
            <Sheet.CloseTrigger />
            <Sheet.Header>
              <Sheet.Heading>{item?.title ?? "Wish"}</Sheet.Heading>
            </Sheet.Header>
            <Sheet.Body className="flex flex-col gap-5">
              {item && form ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {item.category?.name ?? "Uncategorized"}
                      </p>
                      <p className="text-muted mt-1 text-xs">
                        No. {String(item.number).padStart(3, "0")}
                        {item.completedAt ? ` · Done ${item.completedAt}` : ""}
                      </p>
                    </div>
                    <Chip
                      color={form.visibility === "private" ? "default" : "success"}
                      variant="soft"
                    >
                      {form.visibility === "private" ? "Private" : "Public"}
                    </Chip>
                  </div>

                  <section className="border-separator border-t pt-4">
                    <SectionLabel>Progress</SectionLabel>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Metric label="Status" value={COLUMN_LABEL[form.status]} />
                      <Metric label="Memories" value={String(item.memoryCount)} />
                      <Metric label="Progress" value={`${STATUS_PROGRESS[form.status]}%`} />
                      <Metric
                        label="Visibility"
                        value={form.visibility === "private" ? "Private" : "Public"}
                      />
                    </div>
                    <div className="mt-4">
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="text-muted">Confidence</span>
                        <span className="font-medium tabular-nums">
                          {STATUS_PROGRESS[form.status]}%
                        </span>
                      </div>
                      <WishMeter
                        label={`${item.title} progress ${STATUS_PROGRESS[form.status]}%`}
                        value={STATUS_PROGRESS[form.status]}
                      />
                    </div>
                  </section>

                  <section className="border-separator border-t pt-4">
                    <SectionLabel>Wish</SectionLabel>
                    <div className="mt-3 flex flex-col gap-3">
                      <TextField
                        name="title"
                        value={form.title}
                        variant="secondary"
                        onChange={(title) => setDraft({ ...form, title })}
                      >
                        <Label>Title</Label>
                        <Input maxLength={160} />
                      </TextField>
                      <TextField
                        name="description"
                        value={form.description ?? ""}
                        variant="secondary"
                        onChange={(description) => setDraft({ ...form, description })}
                      >
                        <Label>Description</Label>
                        <TextArea rows={3} />
                      </TextField>
                      <TextField
                        name="motivation"
                        value={form.motivation ?? ""}
                        variant="secondary"
                        onChange={(motivation) => setDraft({ ...form, motivation })}
                      >
                        <Label>Why this matters</Label>
                        <TextArea rows={3} />
                      </TextField>
                      <div className="grid grid-cols-2 gap-3">
                        <Select
                          value={form.status}
                          variant="secondary"
                          onChange={(value) => {
                            if (value)
                              setDraft({ ...form, status: String(value) as LifeListStatus });
                          }}
                        >
                          <Label>Status</Label>
                          <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              {COLUMNS.map((status) => (
                                <ListBox.Item
                                  key={status}
                                  id={status}
                                  textValue={COLUMN_LABEL[status]}
                                >
                                  {COLUMN_LABEL[status]}
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                              ))}
                            </ListBox>
                          </Select.Popover>
                        </Select>
                        <Select
                          value={form.visibility}
                          variant="secondary"
                          onChange={(value) => {
                            if (value)
                              setDraft({
                                ...form,
                                visibility: String(value) as LifeListVisibility,
                              });
                          }}
                        >
                          <Label>Visibility</Label>
                          <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              <ListBox.Item id="public" textValue="Public">
                                Public
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                              <ListBox.Item id="private" textValue="Private">
                                Private
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      </div>
                      <Select
                        value={form.categoryId ? String(form.categoryId) : "none"}
                        variant="secondary"
                        onChange={(value) =>
                          setDraft({
                            ...form,
                            categoryId: !value || value === "none" ? null : Number(value),
                          })
                        }
                      >
                        <Label>Category</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            <ListBox.Item id="none" textValue="Uncategorized">
                              Uncategorized
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            {categories.map((category) => (
                              <ListBox.Item
                                key={category.id}
                                id={String(category.id)}
                                textValue={category.name}
                              >
                                {category.name}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      {form.status === "completed" ? (
                        <TextField
                          name="completed-at"
                          type="date"
                          value={form.completedAt ?? today()}
                          variant="secondary"
                          onChange={(completedAt) => setDraft({ ...form, completedAt })}
                        >
                          <Label>Completed on</Label>
                          <Input />
                        </TextField>
                      ) : null}
                    </div>
                  </section>

                  <section className="border-separator border-t pt-4">
                    <SectionLabel>Memory</SectionLabel>
                    <p className="text-muted mt-2 text-sm">
                      Saving a note does not change the status. Notes start private.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <TextField
                        className="min-w-0 flex-1"
                        name="memory"
                        value={memory}
                        variant="secondary"
                        onChange={setMemory}
                      >
                        <Label className="sr-only">Memory</Label>
                        <Input placeholder="What happened" />
                      </TextField>
                      <Button
                        isDisabled={isSavingMemory || !memory.trim()}
                        variant="outline"
                        onPress={() => {
                          void createMemory({
                            itemId: item.id,
                            body: {
                              content: memory.trim(),
                              visibility: "private",
                              occurredAt: today(),
                            },
                          })
                            .unwrap()
                            .then(() => {
                              setMemory("");
                              onRefresh();
                            });
                        }}
                      >
                        Save
                      </Button>
                    </div>
                    {item.memories.length > 0 ? (
                      <ul className="mt-3 flex flex-col gap-2">
                        {item.memories.map((entry) => (
                          <li
                            key={entry.id}
                            className="bg-surface-secondary rounded-xl p-3 text-sm"
                          >
                            <p className="text-muted text-[11px] tracking-wide uppercase">
                              {entry.visibility === "private" ? "Private" : "Public"}
                              {entry.occurredAt ? ` · ${entry.occurredAt}` : ""}
                            </p>
                            <p className="mt-1">{entry.content}</p>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                </>
              ) : null}
            </Sheet.Body>
            <Sheet.Footer className="justify-start">
              {item?.archivedAt ? (
                <Button
                  variant="ghost"
                  onPress={() => void restoreItem(item.id).unwrap().then(onRefresh)}
                >
                  Restore
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onPress={() => {
                    if (!item) return;
                    void archiveItem(item.id)
                      .unwrap()
                      .then(() => {
                        onOpenChange(false);
                        onRefresh();
                      });
                  }}
                >
                  Archive
                </Button>
              )}
              <Button
                variant="danger-soft"
                onPress={() => {
                  if (!item || !window.confirm("Remove this wish and its memories?")) return;
                  void deleteItem(item.id)
                    .unwrap()
                    .then(() => {
                      onOpenChange(false);
                      onRefresh();
                    });
                }}
              >
                Remove
              </Button>
              <Button isDisabled={isLoading} variant="outline" onPress={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button isDisabled={isLoading} onPress={() => void save()}>
                Save changes
              </Button>
            </Sheet.Footer>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet.NestedRoot>
  );
}

function CreateWishSheet({
  isOpen,
  onCreated,
  onOpenChange,
  onStatusChange,
  status,
}: {
  isOpen: boolean;
  onCreated: (item: LifeListItemResponse) => void;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (status: LifeListStatus) => void;
  status: LifeListStatus;
}) {
  const [title, setTitle] = useState("");
  const [createItem, { isLoading }] = useCreateLifeListItemMutation();
  const query = useGetAdminLifeListQuery({ archived: true, page: 0, size: 200 });
  const trimmed = title.trim();
  const matches = trimmed
    ? (query.data?.list ?? [])
        .filter((item) => item.title.toLowerCase().includes(trimmed.toLowerCase()))
        .slice(0, 6)
    : [];

  const close = (open: boolean) => {
    if (!open) setTitle("");
    onOpenChange(open);
  };

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={close}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-surface-secondary text-foreground">
                <ListCheck className="size-4" />
              </Modal.Icon>
              <Modal.Heading>Create wish</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3 overflow-visible">
              <TextField autoFocus value={title} variant="secondary" onChange={setTitle}>
                <Label>Wish</Label>
                <Input maxLength={160} placeholder="One thing worth doing" />
              </TextField>
              {matches.length > 0 ? (
                <ListBox
                  aria-label="Matching wishes"
                  className="max-h-72 overflow-y-auto p-0"
                  selectionMode="none"
                  onAction={(key) => {
                    const item = matches.find((entry) => String(entry.id) === String(key));
                    if (!item) return;
                    setTitle("");
                    onOpenChange(false);
                    onCreated(item);
                  }}
                >
                  {matches.map((item) => (
                    <ListBox.Item
                      key={item.id}
                      id={String(item.id)}
                      textValue={`${item.title} ${item.number}`}
                    >
                      <span className="bg-surface-secondary flex size-7 shrink-0 items-center justify-center rounded-[var(--radius)]">
                        <ListCheck className="size-3.5" />
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <Label>{item.title}</Label>
                        <Description>
                          {String(item.number).padStart(3, "0")} · {COLUMN_LABEL[item.status]}
                        </Description>
                      </div>
                    </ListBox.Item>
                  ))}
                </ListBox>
              ) : null}
              <Select
                value={status}
                variant="secondary"
                onChange={(value) => {
                  if (value) onStatusChange(String(value) as LifeListStatus);
                }}
              >
                <Label>Stage</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {COLUMNS.map((item) => (
                      <ListBox.Item key={item} id={item} textValue={COLUMN_LABEL[item]}>
                        {COLUMN_LABEL[item]}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </Modal.Body>
            <Modal.Footer className="justify-start">
              <Button
                isDisabled={isLoading || !trimmed}
                variant="ghost"
                onPress={() => {
                  void createItem({
                    title: trimmed,
                    status,
                    visibility: "public",
                    completedAt: status === "completed" ? today() : null,
                  })
                    .unwrap()
                    .then((item) => {
                      setTitle("");
                      onOpenChange(false);
                      onCreated(item);
                    })
                    .catch(() => toast.danger("Couldn't create the wish."));
                }}
              >
                <Plus className="size-4" />
                {trimmed ? `Create "${trimmed}" manually` : "Create manually"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-secondary rounded-xl p-3">
      <p className="text-muted text-[11px] tracking-wide uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium tabular-nums">{value}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="text-muted text-[11px] font-medium tracking-wide uppercase">{children}</p>;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
