"use client";

import { CirclePlus, Pencil, TrashBin } from "@gravity-ui/icons";
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
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
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

  const columnsDefinition = useMemo<DataGridColumn<ColumnResponse>[]>(
    () => [
      {
        accessorKey: "name",
        allowsSorting: true,
        cell: (column) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-semibold">{column.name}</span>
            <span className="text-muted truncate font-mono text-xs">/{column.slug}</span>
          </div>
        ),
        header: "Column",
        id: "name",
        isRowHeader: true,
        minWidth: 240,
      },
      {
        accessorKey: "postsCount",
        allowsSorting: true,
        cell: (column) => <span className="text-muted tabular-nums">{column.postsCount}</span>,
        header: "Essays",
        id: "postsCount",
        minWidth: 100,
      },
      {
        accessorKey: "isPublished",
        allowsSorting: true,
        cell: (column) => (
          <Chip color={column.isPublished ? "success" : "warning"} size="sm" variant="soft">
            {column.isPublished ? "Published" : "Draft"}
          </Chip>
        ),
        header: "Visibility",
        id: "isPublished",
        minWidth: 130,
      },
      {
        accessorKey: "createdAt",
        allowsSorting: true,
        cell: (column) => (
          <span className="text-muted text-sm">
            {new Date(column.createdAt).toLocaleDateString()}
          </span>
        ),
        header: "Created",
        id: "createdAt",
        minWidth: 140,
      },
      {
        align: "end",
        cell: (column) => (
          <div className="flex items-center justify-end gap-2">
            <Tooltip delay={0}>
              <Button
                isIconOnly
                aria-label="Edit column"
                onPress={() => openEdit(column)}
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
                onPress={() => openDelete(column)}
                size="sm"
                variant="danger-soft"
              >
                <TrashBin className="size-4" />
              </Button>
              <Tooltip.Content>Delete column</Tooltip.Content>
            </Tooltip>
          </div>
        ),
        header: "Actions",
        id: "actions",
        minWidth: 120,
      },
    ],
    [openDelete, openEdit]
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
          aria-label="Columns"
          columns={columnsDefinition}
          contentClassName="min-w-[760px]"
          data={sortedColumns}
          getRowId={(column) => column.id}
          isLoadingMore={isLoading}
          sortDescriptor={sortDescriptor}
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
            <Modal.Dialog className="sm:max-w-md">
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
            <AlertDialog.Dialog className="sm:max-w-md">
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
