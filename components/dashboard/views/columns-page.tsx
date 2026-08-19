"use client";

import { CirclePlus, Eye, FileText, Folder, FolderOpen, Pencil, TrashBin } from "@gravity-ui/icons";
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
import {
  type ColumnRequest,
  type ColumnResponse,
  useCreateEditorialColumnMutation,
  useDeleteEditorialColumnMutation,
  useGetColumnsQuery,
  useUpdateEditorialColumnMutation,
} from "@/lib/features/column";
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
    setIsFormOpen(true);
  };

  const openEdit = useCallback((column: ColumnResponse) => {
    setSelectedColumn(column);
    setForm(columnRequest(column));
    setIsFormOpen(true);
  }, []);

  const openDelete = useCallback((column: ColumnResponse) => {
    setSelectedColumn(column);
    setIsDeleteOpen(true);
  }, []);

  const previewColumn = useCallback((column: ColumnResponse) => {
    window.open(`/columns/${column.slug}`, "_blank", "noopener,noreferrer");
  }, []);

  const fillSlug = () => {
    if (form.slug || !form.name) return;
    setForm((current) => ({
      ...current,
      slug: current.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      ...form,
      name: form.name.trim(),
      slug: form.slug.trim(),
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
          const Icon =
            row.kind === "column"
              ? expandedKeys instanceof Set && expandedKeys.has(row.id)
                ? FolderOpen
                : Folder
              : FileText;

          return (
            <div className="flex min-w-0 items-center gap-2">
              <Icon
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
        header: "Column",
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
        header: "Essays / Views",
        id: "postsCount",
        minWidth: 100,
      },
      {
        accessorKey: "isPublished",
        allowsResizing: true,
        allowsSorting: true,
        cell: (row) => (
          <Chip color={row.isPublished ? "success" : "warning"} size="sm" variant="soft">
            {row.isPublished ? "Published" : "Draft"}
          </Chip>
        ),
        header: "Visibility",
        id: "isPublished",
        minWidth: 130,
      },
      {
        accessorKey: "createdAt",
        allowsResizing: true,
        allowsSorting: true,
        cell: (row) => (
          <span className="text-muted text-sm">{new Date(row.createdAt).toLocaleDateString()}</span>
        ),
        header: "Created",
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
                  aria-label="Preview public column"
                  onPress={() => previewColumn(row.source!)}
                  size="sm"
                  variant="tertiary"
                >
                  <Eye className="size-4" />
                </Button>
                <Tooltip.Content>
                  {row.source.isPublished
                    ? "Preview public column"
                    : "Publish the column to preview it"}
                </Tooltip.Content>
              </Tooltip>
              <Tooltip delay={0}>
                <Button
                  isIconOnly
                  aria-label="Edit column"
                  onPress={() => openEdit(row.source!)}
                  size="sm"
                  variant="tertiary"
                >
                  <Pencil className="size-4" />
                </Button>
                <Tooltip.Content>Edit column</Tooltip.Content>
              </Tooltip>
              <Tooltip delay={0}>
                <Button
                  isIconOnly
                  aria-label="Delete column"
                  onPress={() => openDelete(row.source!)}
                  size="sm"
                  variant="danger-soft"
                >
                  <TrashBin className="size-4" />
                </Button>
                <Tooltip.Content>Delete column</Tooltip.Content>
              </Tooltip>
            </div>
          ) : null,
        header: "Actions",
        id: "actions",
        pinned: "end",
        width: 168,
      },
    ],
    [expandedKeys, openDelete, openEdit, previewColumn]
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-8 pb-10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-base font-semibold">Column Management</h2>
          {!isLoading && (
            <Chip size="sm" variant="soft">
              {columns.length}
            </Chip>
          )}
        </div>
        <p className="text-muted text-sm">
          Create focused reading paths and curate the articles within them.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button onPress={openCreate} size="sm">
          <CirclePlus className="size-4" />
          New Column
        </Button>
        <SearchField
          className="w-full sm:w-[260px]"
          name="column-search"
          value={search}
          onChange={setSearch}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search columns..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>
      {error ? (
        <div className="bg-danger-soft/10 border-danger/20 text-danger flex justify-center rounded-lg border p-10 text-sm">
          Failed to load columns.
        </div>
      ) : (
        <DataGrid
          allowsColumnResize
          aria-label="Columns"
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
            <Modal.Dialog className="sm:max-w-md" aria-label="Modal dialog">
              <Modal.CloseTrigger />
              <Form onSubmit={submit}>
                <Modal.Header>
                  <Modal.Heading>{selectedColumn ? "Edit Column" : "Create Column"}</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4 py-4">
                  <TextField isRequired name="name">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g. Building durable software"
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                      onBlur={fillSlug}
                    />
                    <FieldError />
                  </TextField>
                  <TextField
                    isRequired
                    name="slug"
                    validate={(value) =>
                      /^[a-z0-9-]+$/.test(value)
                        ? null
                        : "Use lowercase letters, numbers, and hyphens only"
                    }
                  >
                    <Label>Slug</Label>
                    <Input
                      placeholder="durable-software"
                      value={form.slug}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, slug: event.target.value }))
                      }
                    />
                    <FieldError />
                  </TextField>
                  <TextField name="description">
                    <Label>Description</Label>
                    <TextArea
                      placeholder="What connects these essays?"
                      rows={3}
                      value={form.description || ""}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, description: event.target.value }))
                      }
                    />
                  </TextField>
                  <TextField name="coverImage">
                    <Label>Cover image URL</Label>
                    <Input
                      placeholder="https://..."
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
                      <span className="text-sm font-medium">Published</span>
                    </Switch.Content>
                  </Switch>
                </Modal.Body>
                <Modal.Footer>
                  <Button slot="close" size="sm" variant="tertiary">
                    Cancel
                  </Button>
                  <Button isPending={isCreating || isUpdating} size="sm" type="submit">
                    {({ isPending }) => (
                      <>
                        {isPending && <Spinner color="current" size="sm" />}
                        {selectedColumn ? "Save changes" : "Create column"}
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
            <AlertDialog.Dialog className="sm:max-w-md" aria-label="Alert dialog">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete column?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  Articles will remain in the archive, but they will no longer be associated with{" "}
                  <strong>{selectedColumn?.name}</strong>.
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" size="sm" variant="tertiary">
                  Cancel
                </Button>
                <Button isPending={isDeleting} onPress={confirmDelete} size="sm" variant="danger">
                  Delete
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}
