"use client";

import { Icon } from "@iconify/react";

import {
  AlertDialog,
  Button,
  Chip,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  SearchField,
  Spinner,
  Switch,
  TextArea,
  TextField,
  Tooltip,
} from "@heroui/react";
import {
  DataGrid,
  type DataGridColumn,
  type DataGridSelection,
  type DataGridSortDescriptor,
} from "@heroui-pro/react";
import { type FormEvent, useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  type ColumnRequest,
  type ColumnResponse,
  useCreateEditorialColumnMutation,
  useDeleteEditorialColumnMutation,
  useGetColumnsQuery,
  useUpdateEditorialColumnMutation,
} from "@/lib/features/column";
import { toUrlSlug, validateUrlSlug } from "@/lib/utils/slug";
import { usePortalContainer } from "../use-portal-container";

const emptyForm: ColumnRequest = {
  name: "",
  slug: "",
  description: "",
  coverImage: "",
  isPublished: true,
};

function columnRequest(column: ColumnResponse): ColumnRequest {
  return {
    name: column.name,
    slug: column.slug,
    description: column.description || "",
    coverImage: column.coverImage || "",
    isPublished: column.isPublished,
  };
}

type ColumnGridRow = {
  id: string;
  kind: "column" | "post";
  name: string;
  slug: string;
  count: number;
  isPublished: boolean;
  createdAt: string;
  source?: ColumnResponse;
  children?: ColumnGridRow[];
};

export function ColumnsPage() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const portalContainer = usePortalContainer();
  const { data: columns = [], error, isLoading } = useGetColumnsQuery();
  const [createColumn, { isLoading: isCreating }] = useCreateEditorialColumnMutation();
  const [updateColumn, { isLoading: isUpdating }] = useUpdateEditorialColumnMutation();
  const [deleteColumn, { isLoading: isDeleting }] = useDeleteEditorialColumnMutation();
  const [search, setSearch] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });
  const [expandedKeys, setExpandedKeys] = useState<DataGridSelection>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<ColumnResponse | null>(null);
  const [form, setForm] = useState<ColumnRequest>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);

  const filteredColumns = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return columns;
    return columns.filter((column) =>
      [column.name, column.slug, column.description || ""].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [columns, search]);

  const sortedColumns = useMemo(() => {
    if (!sortDescriptor.column) return filteredColumns;
    const key = sortDescriptor.column as keyof ColumnResponse;
    const direction = sortDescriptor.direction === "descending" ? -1 : 1;
    return [...filteredColumns].sort((first, second) => {
      const left = first[key];
      const right = second[key];
      const result =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left ?? "").localeCompare(String(right ?? ""));
      return result * direction;
    });
  }, [filteredColumns, sortDescriptor]);

  const gridRows = useMemo<ColumnGridRow[]>(
    () =>
      sortedColumns.map((column) => ({
        children: column.posts.map((post) => ({
          count: post.views,
          createdAt: post.publishedAt || column.createdAt,
          id: `post-${post.id}`,
          isPublished: Boolean(post.publishedAt),
          kind: "post" as const,
          name: post.title,
          slug: post.slug,
        })),
        count: column.postsCount,
        createdAt: column.createdAt,
        id: `column-${column.id}`,
        isPublished: column.isPublished,
        kind: "column" as const,
        name: column.name,
        slug: column.slug,
        source: column,
      })),
    [sortedColumns]
  );

  const openCreate = () => {
    setSelectedColumn(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setIsFormOpen(true);
  };

  const openEdit = useCallback((column: ColumnResponse) => {
    setSelectedColumn(column);
    setForm(columnRequest(column));
    setSlugTouched(true);
    setIsFormOpen(true);
  }, []);

  const openDelete = useCallback((column: ColumnResponse) => {
    setSelectedColumn(column);
    setIsDeleteOpen(true);
  }, []);

  const previewColumn = useCallback((column: ColumnResponse) => {
    window.open(`/columns/${column.slug}`, "_blank", "noopener,noreferrer");
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const slug = form.slug.trim() || toUrlSlug(form.name);
    if (!slugTouched && slug !== form.slug) {
      setForm((current) => ({ ...current, slug }));
    }
    const payload = {
      ...form,
      name: form.name.trim(),
      slug,
      description: form.description?.trim(),
      coverImage: form.coverImage?.trim(),
    };
    try {
      if (selectedColumn) {
        await updateColumn({ id: selectedColumn.id, body: payload }).unwrap();
      } else {
        await createColumn(payload).unwrap();
      }
      setIsFormOpen(false);
    } catch {
      // Mutation handlers show the request error.
    }
  };

  const confirmDelete = async () => {
    if (!selectedColumn) return;
    try {
      await deleteColumn(selectedColumn.id).unwrap();
      setIsDeleteOpen(false);
      setSelectedColumn(null);
    } catch {
      // Mutation handlers show the request error.
    }
  };

  const columnsDefinition = useMemo<DataGridColumn<ColumnGridRow>[]>(
    () => [
      {
        accessorKey: "name",
        allowsResizing: true,
        allowsSorting: true,
        cell: (row) => {
          const iconName =
            row.kind === "column"
              ? expandedKeys instanceof Set && expandedKeys.has(row.id)
                ? "gravity-ui:folder-open"
                : "gravity-ui:folder"
              : "gravity-ui:file-text";

          return (
            <div className="flex min-w-0 items-center gap-2">
              <Icon
                icon={iconName}
                aria-hidden="true"
                className={
                  row.kind === "column"
                    ? "text-warning size-4 shrink-0"
                    : "text-muted size-4 shrink-0"
                }
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold">{row.name}</span>
                <span className="text-muted truncate font-mono text-xs">/{row.slug}</span>
              </div>
            </div>
          );
        },
        header: t("nav.columns"),
        id: "name",
        isRowHeader: true,
        minWidth: 240,
        pinned: "start",
      },
      {
        accessorKey: "count",
        allowsResizing: true,
        allowsSorting: true,
        cell: (row) => <span className="text-muted tabular-nums">{row.count}</span>,
        header: t("columns.essaysViews"),
        id: "postsCount",
        minWidth: 100,
      },
      {
        accessorKey: "isPublished",
        allowsResizing: true,
        allowsSorting: true,
        cell: (row) => (
          <Chip color={row.isPublished ? "success" : "warning"} size="sm" variant="soft">
            {row.isPublished ? t("common.published") : t("columns.draft")}
          </Chip>
        ),
        header: t("columns.visibility"),
        id: "isPublished",
        minWidth: 130,
      },
      {
        accessorKey: "createdAt",
        allowsResizing: true,
        allowsSorting: true,
        cell: (row) => (
          <span className="text-muted text-sm">
            {new Date(row.createdAt).toLocaleDateString(locale)}
          </span>
        ),
        header: t("common.createdAt"),
        id: "createdAt",
        minWidth: 140,
      },
      {
        align: "end",
        allowsResizing: false,
        cell: (row) =>
          row.source ? (
            <div className="flex items-center justify-end gap-2">
              <Tooltip delay={0}>
                <Button
                  isDisabled={!row.source.isPublished}
                  isIconOnly
                  aria-label={t("columns.preview")}
                  onPress={() => previewColumn(row.source!)}
                  size="sm"
                  variant="tertiary"
                >
                  <Icon icon="gravity-ui:eye" className="size-4" />
                </Button>
                <Tooltip.Content>
                  {row.source.isPublished ? t("columns.preview") : t("columns.publishToPreview")}
                </Tooltip.Content>
              </Tooltip>
              <Tooltip delay={0}>
                <Button
                  isIconOnly
                  aria-label={t("columns.edit")}
                  onPress={() => openEdit(row.source!)}
                  size="sm"
                  variant="tertiary"
                >
                  <Icon icon="gravity-ui:pencil" className="size-4" />
                </Button>
                <Tooltip.Content>{t("columns.edit")}</Tooltip.Content>
              </Tooltip>
              <Tooltip delay={0}>
                <Button
                  isIconOnly
                  aria-label={t("columns.delete")}
                  onPress={() => openDelete(row.source!)}
                  size="sm"
                  variant="danger-soft"
                >
                  <Icon icon="gravity-ui:trash-bin" className="size-4" />
                </Button>
                <Tooltip.Content>{t("columns.delete")}</Tooltip.Content>
              </Tooltip>
            </div>
          ) : null,
        header: t("common.actions"),
        id: "actions",
        pinned: "end",
        width: 168,
      },
    ],
    [expandedKeys, locale, openDelete, openEdit, previewColumn, t]
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-8 pb-10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-base font-semibold">{t("columns.title")}</h2>
          {!isLoading && (
            <Chip size="sm" variant="soft">
              {columns.length}
            </Chip>
          )}
        </div>
        <p className="text-muted text-sm">{t("columns.description")}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button onPress={openCreate} size="sm">
          <Icon icon="gravity-ui:circle-plus" className="size-4" />
          {t("columns.new")}
        </Button>
        <SearchField
          className="w-full sm:w-65"
          name="column-search"
          value={search}
          onChange={setSearch}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder={t("columns.search")} />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>
      {error ? (
        <div className="bg-danger-soft/10 border-danger/20 text-danger flex justify-center rounded-lg border p-10 text-sm">
          {t("columns.failed")}
        </div>
      ) : (
        <DataGrid
          allowsColumnResize
          aria-label={t("columns.table")}
          columns={columnsDefinition}
          contentClassName="min-w-[808px]"
          data={gridRows}
          expandedKeys={expandedKeys}
          getChildren={(row) => row.children}
          getRowId={(row) => row.id}
          isLoadingMore={isLoading}
          sortDescriptor={sortDescriptor}
          treeColumn="name"
          onExpandedChange={setExpandedKeys}
          onSortChange={setSortDescriptor}
        />
      )}

      <Modal>
        <Modal.Backdrop
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          variant="blur"
          UNSTABLE_portalContainer={portalContainer || undefined}
        >
          <Modal.Container size="sm">
            <Modal.Dialog className="sm:max-w-md" aria-label={t("columns.form")}>
              <Modal.CloseTrigger />
              <Form onSubmit={submit}>
                <Modal.Header>
                  <Modal.Heading>
                    {selectedColumn ? t("columns.edit") : t("columns.new")}
                  </Modal.Heading>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4">
                  <TextField isRequired name="name">
                    <Label>{t("common.name")}</Label>
                    <Input
                      placeholder={t("columns.namePlaceholder")}
                      value={form.name}
                      onChange={(event) => {
                        const name = event.target.value;
                        setForm((current) => ({
                          ...current,
                          name,
                          slug: slugTouched ? current.slug : toUrlSlug(name),
                        }));
                      }}
                    />
                    <FieldError />
                  </TextField>
                  <TextField isRequired name="slug" validate={(value) => validateUrlSlug(value)}>
                    <Label>{t("common.slug")}</Label>
                    <Input
                      placeholder={t("columns.slugPlaceholder")}
                      value={form.slug}
                      onChange={(event) => {
                        setSlugTouched(true);
                        setForm((current) => ({ ...current, slug: event.target.value }));
                      }}
                    />
                    <FieldError />
                  </TextField>
                  <TextField name="description">
                    <Label>{t("common.description")}</Label>
                    <TextArea
                      placeholder={t("columns.descriptionPlaceholder")}
                      rows={3}
                      value={form.description || ""}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, description: event.target.value }))
                      }
                    />
                  </TextField>
                  <TextField name="coverImage">
                    <Label>{t("columns.coverImage")}</Label>
                    <Input
                      placeholder={t("columns.coverImagePlaceholder")}
                      value={form.coverImage || ""}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, coverImage: event.target.value }))
                      }
                    />
                  </TextField>
                  <Switch
                    isSelected={form.isPublished}
                    onChange={(isPublished) => setForm((current) => ({ ...current, isPublished }))}
                  >
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <span className="text-sm font-medium">{t("common.published")}</span>
                    </Switch.Content>
                  </Switch>
                </Modal.Body>
                <Modal.Footer>
                  <Button slot="close" size="sm" variant="tertiary">
                    {t("common.cancel")}
                  </Button>
                  <Button isPending={isCreating || isUpdating} size="sm" type="submit">
                    {({ isPending }) => (
                      <>
                        {isPending && <Spinner color="current" size="sm" />}
                        {selectedColumn ? t("common.saveChanges") : t("columns.new")}
                      </>
                    )}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          variant="blur"
          UNSTABLE_portalContainer={portalContainer || undefined}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md" aria-label={t("columns.deleteQuestion")}>
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>{t("columns.deleteQuestion")}</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  {t("columns.deleteDescription", { name: selectedColumn?.name ?? "" })}
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" size="sm" variant="tertiary">
                  {t("common.cancel")}
                </Button>
                <Button isPending={isDeleting} onPress={confirmDelete} size="sm" variant="danger">
                  {t("common.delete")}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}
