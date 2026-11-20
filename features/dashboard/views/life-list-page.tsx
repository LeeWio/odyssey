"use client";

import type { UseKanbanReturn } from "@heroui-pro/react";

import { CirclePlus, ListCheck, Pencil, Plus, TrashBin } from "@gravity-ui/icons";
import {
  AlertDialog,
  Button,
  Chip,
  Description,
  Form,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Sheet,
  Spinner,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import {
  EmptyState,
  Kanban,
  useKanban,
  useKanbanCardPlaceholder,
  useKanbanColumn,
} from "@heroui-pro/react";
import { type FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import {
  useArchiveLifeListItemMutation,
  useChangeLifeListStatusMutation,
  useCreateLifeListCategoryMutation,
  useCreateLifeListItemMutation,
  useCreateLifeListMemoryMutation,
  useDeleteLifeListCategoryMutation,
  useDeleteLifeListItemMutation,
  useGetAdminLifeListCategoriesQuery,
  useGetAdminLifeListQuery,
  useRestoreLifeListItemMutation,
  useUpdateLifeListCategoryMutation,
  useUpdateLifeListItemMutation,
  type LifeListCategoryRequest,
  type LifeListItemRequest,
  type LifeListItemResponse,
  type LifeListStatus,
  type LifeListVisibility,
} from "@/lib/features/life-list";
import { type AppLocale } from "@/i18n/config";
import {
  TranslationFields,
  type TranslationValues,
  compactTranslations,
  translationValues,
} from "@/components/content-translations/translation-fields";
import { STATUS_PROGRESS, StatusMeter } from "@/components/life-list/progress-meter";
import { toUrlSlug, validateUrlSlug } from "@/lib/utils/slug";

const COLUMNS: readonly LifeListStatus[] = ["planned", "in_progress", "completed", "abandoned"];

type DashboardTranslations = ReturnType<typeof useTranslations>;

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

function columnLabel(status: LifeListStatus, t: DashboardTranslations) {
  return t(
    `lifeList.${
      (
        {
          abandoned: "abandoned",
          completed: "completed",
          in_progress: "inProgress",
          planned: "planned",
        } as const
      )[status]
    }`
  );
}

function LifeListCategoryManager() {
  const t = useTranslations("ContentTranslations");
  const dashboardT = useTranslations("Dashboard");
  const { data: categories = [] } = useGetAdminLifeListCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateLifeListCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateLifeListCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteLifeListCategoryMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<(typeof categories)[number] | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [slugTouched, setSlugTouched] = useState(false);
  const [locale, setLocale] = useState<AppLocale>("zh");
  const [translations, setTranslations] = useState<TranslationValues>({ en: {} });
  const translationFields = [
    { key: "name", label: t("name"), placeholder: t("namePlaceholder"), required: true },
  ];

  const reset = () => {
    setSelected(null);
    setName("");
    setSlug("");
    setSortOrder("0");
    setSlugTouched(false);
    setLocale("zh");
    setTranslations({ en: {} });
  };

  const openCreate = () => {
    reset();
    setIsOpen(true);
  };

  const openEdit = (category: (typeof categories)[number]) => {
    setSelected(category);
    setName(category.name);
    setSlug(category.slug);
    setSortOrder(String(category.sortOrder));
    setSlugTouched(true);
    setLocale("zh");
    setTranslations(translationValues(category.translations, translationFields));
    setIsOpen(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextSlug = slug.trim() || toUrlSlug(name);
    const body = {
      name: name.trim(),
      slug: nextSlug,
      sortOrder: Number(sortOrder) || 0,
      translations: compactTranslations(
        translations,
        "name"
      ) as LifeListCategoryRequest["translations"],
    };
    try {
      if (selected) await updateCategory({ id: selected.id, body }).unwrap();
      else await createCategory(body).unwrap();
      setIsOpen(false);
    } catch {
      // Mutation toast communicates the API failure.
    }
  };

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-1 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{t("lifeListCategory")}</span>
          <Chip size="sm" variant="soft">
            {categories.length}
          </Chip>
        </div>
        <Button size="sm" variant="tertiary" onPress={openCreate}>
          <CirclePlus className="size-4" />
          {t("createLifeListCategory")}
        </Button>
      </div>
      {categories.length > 0 ? (
        <div className="flex shrink-0 gap-2 overflow-x-auto px-1 pb-2">
          {categories.map((category) => (
            <div key={category.id} className="flex shrink-0 items-center gap-1">
              <Chip variant="soft">{category.name}</Chip>
              <Button
                isIconOnly
                aria-label={`${t("editLifeListCategory")}: ${category.name}`}
                size="sm"
                variant="ghost"
                onPress={() => openEdit(category)}
              >
                <Pencil className="size-3" />
              </Button>
              <Button
                isIconOnly
                aria-label={`${t("lifeListCategory")}: ${category.name}`}
                size="sm"
                variant="ghost"
                onPress={() => {
                  setSelected(category);
                  setIsDeleteOpen(true);
                }}
              >
                <TrashBin className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
      <Modal>
        <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen} variant="blur">
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Form onSubmit={submit}>
                <Modal.Header>
                  <Modal.Heading>
                    {selected ? t("editLifeListCategory") : t("createLifeListCategory")}
                  </Modal.Heading>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4">
                  <TranslationFields
                    fields={translationFields}
                    locale={locale}
                    values={{ zh: { name }, ...translations }}
                    onChange={(changedLocale, field, value) => {
                      if (changedLocale === "zh") {
                        setName(value);
                        if (!slugTouched) setSlug(toUrlSlug(value));
                      } else {
                        setTranslations((current) => ({
                          ...current,
                          [changedLocale]: { ...current[changedLocale], [field]: value },
                        }));
                      }
                    }}
                    onLocaleChange={setLocale}
                  />
                  <TextField
                    isRequired
                    name="slug"
                    value={slug}
                    validate={(value) => validateUrlSlug(value)}
                    onChange={(value) => {
                      setSlugTouched(true);
                      setSlug(value);
                    }}
                  >
                    <Label>{dashboardT("common.slug")}</Label>
                    <Input placeholder="travel" />
                  </TextField>
                  <TextField
                    name="sortOrder"
                    type="number"
                    value={sortOrder}
                    onChange={setSortOrder}
                  >
                    <Label>{dashboardT("lifeList.sortOrder")}</Label>
                    <Input min={0} />
                  </TextField>
                </Modal.Body>
                <Modal.Footer>
                  <Button slot="close" size="sm" variant="tertiary">
                    {dashboardT("common.cancel")}
                  </Button>
                  <Button type="submit" size="sm" isDisabled={isCreating || isUpdating}>
                    {(isCreating || isUpdating) && <Spinner size="sm" />}
                    {dashboardT("common.save")}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <AlertDialog>
        <AlertDialog.Backdrop isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen} variant="blur">
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>
                  {dashboardT("lifeList.removeCategoryQuestion")}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {selected?.name} · {dashboardT("lifeList.uncategorized")}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" size="sm" variant="tertiary">
                  {dashboardT("common.cancel")}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  isDisabled={isDeleting}
                  onPress={() => {
                    if (!selected) return;
                    void deleteCategory(selected.id)
                      .unwrap()
                      .then(() => setIsDeleteOpen(false));
                  }}
                >
                  {isDeleting && <Spinner size="sm" />}
                  {dashboardT("common.remove")}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </>
  );
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
  const t = useTranslations("Dashboard");
  const query = useGetAdminLifeListQuery({ archived: true, page: 0, size: 200 });

  if (query.isLoading) {
    return <p className="text-muted px-5 pt-6 text-sm">{t("lifeList.loading")}</p>;
  }
  if (query.isError || !query.data) {
    return (
      <EmptyState>
        <EmptyState.Title>{t("lifeList.loadFailed")}</EmptyState.Title>
        <Button variant="outline" onPress={() => query.refetch()}>
          {t("common.retry")}
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
  const t = useTranslations("Dashboard");
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
      <LifeListCategoryManager />
      <div className="min-h-0 flex-1">
        <Kanban hideScrollBar className="h-full min-h-0 items-stretch" size="md">
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
      </div>
      <div className="text-muted flex shrink-0 items-center justify-between gap-3 px-1 text-xs">
        <span>
          {active.length} · {completed} / {total} {t("lifeList.completed")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-24">
            <WishMeter label={`${percent}% ${t("lifeList.completed")}`} value={percent} />
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
  const t = useTranslations("Dashboard");
  const { renderDropIndicator } = useKanbanCardPlaceholder({
    renderIndicator: (target) => <Kanban.DropIndicator target={target} />,
  });
  const column = useKanbanColumn(kanban, status, { renderDropIndicator });

  const memories = column.items.reduce((sum, item) => sum + item.memoryCount, 0);

  return (
    <Kanban.Column className="h-full min-h-0 border-0 shadow-none ring-0 outline-none">
      <Kanban.ColumnHeader>
        <Kanban.ColumnIndicator style={{ backgroundColor: COLUMN_COLOR[status] }} />
        <Kanban.ColumnTitle>{columnLabel(status, t)}</Kanban.ColumnTitle>
        <Kanban.ColumnCount>{column.items.length}</Kanban.ColumnCount>
        <span className="text-muted ml-auto text-xs tabular-nums">{memories}</span>
      </Kanban.ColumnHeader>
      <Kanban.ColumnBody className="min-h-0 flex-1 border-0 shadow-none ring-0 outline-none">
        <Kanban.ScrollShadow className="mb-0 min-h-0 flex-1 overflow-y-auto">
          <Kanban.CardList
            aria-label={`${columnLabel(status, t)} ${t("lifeList.wish")}`}
            className="min-h-0 flex-1 pb-0"
            dragAndDropHooks={column.dragAndDropHooks}
            items={column.items}
            renderEmptyState={() => t("lifeList.noWishesInStage")}
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
            {t("lifeList.createWish")}
          </Button>
          <div className="text-muted flex items-center justify-between px-2 text-xs">
            <span>{t("lifeList.stageTotal")}</span>
            <span className="font-medium tabular-nums">{column.items.length}</span>
          </div>
        </div>
      </Kanban.ColumnBody>
    </Kanban.Column>
  );
}

function WishCard({ id, item, onAction }: { id: string; item: BoardItem; onAction: () => void }) {
  const t = useTranslations("Dashboard");
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
          className="shrink-0"
          color={item.visibility === "private" ? "default" : "success"}
          size="sm"
          variant="soft"
        >
          {item.visibility === "private" ? t("lifeList.private") : t("lifeList.public")}
        </Chip>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold tabular-nums">{item.memoryCount}</span>
        <span className="text-muted max-w-28 truncate text-[11px]">
          {item.memoryCount} {t("lifeList.memories")}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <WishMeter label={`${item.title} progress ${progress}%`} value={progress} />
        </div>
        <span className="text-muted text-xs tabular-nums">{progress}%</span>
      </div>
      <div className="text-muted flex justify-between text-[11px]">
        <span>
          {item.completedAt ? `${t("lifeList.done")} ${item.completedAt}` : t("lifeList.open")}
        </span>
        <span>{columnLabel(item.status, t)}</span>
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
  const t = useTranslations("Dashboard");
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
      <Sheet.Backdrop isExiting variant="transparent">
        <Sheet.Content className="mx-auto w-full sm:max-w-[520px]">
          <Sheet.Dialog className="h-[85vh]">
            <Sheet.CloseTrigger />
            <Sheet.Header>
              <Sheet.Heading>{item?.title ?? t("lifeList.wish")}</Sheet.Heading>
            </Sheet.Header>
            <Sheet.Body className="flex flex-col gap-5">
              {item && form ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {item.category?.name ?? t("lifeList.uncategorized")}
                      </p>
                      <p className="text-muted mt-1 text-xs">
                        {t("lifeList.number", { number: String(item.number).padStart(3, "0") })}
                        {item.completedAt ? ` · ${t("lifeList.done")} ${item.completedAt}` : ""}
                      </p>
                    </div>
                    <Chip
                      color={form.visibility === "private" ? "default" : "success"}
                      variant="soft"
                    >
                      {form.visibility === "private" ? t("lifeList.private") : t("lifeList.public")}
                    </Chip>
                  </div>

                  <section className="border-separator border-t pt-4">
                    <SectionLabel>{t("lifeList.progress")}</SectionLabel>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Metric label={t("lifeList.status")} value={columnLabel(form.status, t)} />
                      <Metric label={t("lifeList.memories")} value={String(item.memoryCount)} />
                      <Metric
                        label={t("lifeList.progress")}
                        value={`${STATUS_PROGRESS[form.status]}%`}
                      />
                      <Metric
                        label={t("lifeList.visibility")}
                        value={
                          form.visibility === "private"
                            ? t("lifeList.private")
                            : t("lifeList.public")
                        }
                      />
                    </div>
                    <div className="mt-4">
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="text-muted">{t("lifeList.confidence")}</span>
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
                    <SectionLabel>{t("lifeList.wish")}</SectionLabel>
                    <div className="mt-3 flex flex-col gap-3">
                      <TextField
                        name="title"
                        value={form.title}
                        variant="secondary"
                        onChange={(title) => setDraft({ ...form, title })}
                      >
                        <Label>{t("lifeList.title")}</Label>
                        <Input maxLength={160} />
                      </TextField>
                      <TextField
                        name="description"
                        value={form.description ?? ""}
                        variant="secondary"
                        onChange={(description) => setDraft({ ...form, description })}
                      >
                        <Label>{t("lifeList.description")}</Label>
                        <TextArea rows={3} />
                      </TextField>
                      <TextField
                        name="motivation"
                        value={form.motivation ?? ""}
                        variant="secondary"
                        onChange={(motivation) => setDraft({ ...form, motivation })}
                      >
                        <Label>{t("lifeList.why")}</Label>
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
                          <Label>{t("lifeList.status")}</Label>
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
                                  textValue={columnLabel(status, t)}
                                >
                                  {columnLabel(status, t)}
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
                          <Label>{t("lifeList.visibility")}</Label>
                          <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              <ListBox.Item id="public" textValue={t("lifeList.public")}>
                                {t("lifeList.public")}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                              <ListBox.Item id="private" textValue={t("lifeList.private")}>
                                {t("lifeList.private")}
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
                        <Label>{t("common.category")}</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            <ListBox.Item id="none" textValue={t("lifeList.uncategorized")}>
                              {t("lifeList.uncategorized")}
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
                          <Label>{t("lifeList.completedOn")}</Label>
                          <Input />
                        </TextField>
                      ) : null}
                    </div>
                  </section>

                  <section className="border-separator border-t pt-4">
                    <SectionLabel>{t("lifeList.memory")}</SectionLabel>
                    <p className="text-muted mt-2 text-sm">{t("lifeList.notePrivacy")}</p>
                    <div className="mt-3 flex gap-2">
                      <TextField
                        className="min-w-0 flex-1"
                        name="memory"
                        value={memory}
                        variant="secondary"
                        onChange={setMemory}
                      >
                        <Label className="sr-only">{t("lifeList.memory")}</Label>
                        <Input placeholder={t("lifeList.whatHappened")} />
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
                        {t("common.save")}
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
                              {entry.visibility === "private"
                                ? t("lifeList.private")
                                : t("lifeList.public")}
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
                  {t("lifeList.restore")}
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
                  {t("lifeList.archive")}
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
                {t("common.remove")}
              </Button>
              <Button isDisabled={isLoading} variant="outline" onPress={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button isDisabled={isLoading} onPress={() => void save()}>
                {t("common.saveChanges")}
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
  const t = useTranslations("Dashboard");
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
              <Modal.Heading>{t("lifeList.createWish")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3 overflow-visible">
              <TextField autoFocus value={title} variant="secondary" onChange={setTitle}>
                <Label>{t("lifeList.wish")}</Label>
                <Input maxLength={160} placeholder={t("lifeList.oneThingWorthDoing")} />
              </TextField>
              {matches.length > 0 ? (
                <ListBox
                  aria-label={t("lifeList.matchingWishes")}
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
                          {t("lifeList.number", { number: String(item.number).padStart(3, "0") })} ·{" "}
                          {columnLabel(item.status, t)}
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
                <Label>{t("lifeList.stage")}</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {COLUMNS.map((item) => (
                      <ListBox.Item key={item} id={item} textValue={columnLabel(item, t)}>
                        {columnLabel(item, t)}
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
                    .catch(() => toast.danger(t("lifeList.createFailed")));
                }}
              >
                <Plus className="size-4" />
                {trimmed
                  ? t("lifeList.manualCreateNamed", { title: trimmed })
                  : t("lifeList.manualCreate")}
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
