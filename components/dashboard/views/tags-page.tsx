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
  TextField,
  Tooltip,
} from "@heroui/react";
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
import { type FormEvent, useCallback, useMemo, useState } from "react";

import {
  type TagRequest,
  type TagResponse,
  useCreateTagMutation,
  useDeleteTagMutation,
  useGetAllTagsQuery,
  useUpdateTagMutation,
} from "@/lib/features/tag/tag-api";
import { usePortalContainer } from "../use-portal-container";

export function TagsPage() {
  const portalContainer = usePortalContainer();

  const { data: tags = [], isLoading, error } = useGetAllTagsQuery();
  const [createTag, { isLoading: isCreating }] = useCreateTagMutation();
  const [updateTag, { isLoading: isUpdating }] = useUpdateTagMutation();
  const [deleteTag, { isLoading: isDeleting }] = useDeleteTagMutation();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  // Modal & Alert States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  // Editing State
  const [selectedTag, setSelectedTag] = useState<TagResponse | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  // Filter Tags
  const filteredTags = useMemo(() => {
    let result = [...tags];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (tag) => tag.name.toLowerCase().includes(q) || tag.slug.toLowerCase().includes(q)
      );
    }

    return result;
  }, [tags, search]);

  // Sort Tags
  const sortedTags = useMemo(() => {
    if (!sortDescriptor.column) return filteredTags;
    const col = sortDescriptor.column as keyof TagResponse;

    return [...filteredTags].sort((a, b) => {
      const first = a[col];
      const second = b[col];

      let cmp = 0;
      if (typeof first === "number" && typeof second === "number") {
        cmp = first - second;
      } else {
        cmp = String(first ?? "").localeCompare(String(second ?? ""));
      }

      const direction = sortDescriptor.direction === "descending" ? -1 : 1;
      return cmp * direction;
    });
  }, [filteredTags, sortDescriptor]);

  // Open Form Modal for Create
  const handleCreateOpen = () => {
    setSelectedTag(null);
    setFormName("");
    setFormSlug("");
    setIsFormModalOpen(true);
  };

  // Open Form Modal for Edit
  const handleEditClick = useCallback((tag: TagResponse) => {
    setSelectedTag(tag);
    setFormName(tag.name);
    setFormSlug(tag.slug);
    setIsFormModalOpen(true);
  }, []);

  // Open Delete Confirmation
  const handleDeleteClick = useCallback((tag: TagResponse) => {
    setSelectedTag(tag);
    setIsDeleteAlertOpen(true);
  }, []);

  // Auto-generate slug from name if empty
  const handleNameBlur = () => {
    if (!formSlug && formName) {
      const generated = formName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormSlug(generated);
    }
  };

  // Form Submit (Create or Update)
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body: TagRequest = {
      name: formName.trim(),
      slug: formSlug.trim(),
    };

    try {
      if (selectedTag) {
        await updateTag({ id: selectedTag.id, body }).unwrap();
      } else {
        await createTag(body).unwrap();
      }
      setIsFormModalOpen(false);
    } catch {
      // RTK Query's onQueryStarted already displays toast errors
    }
  };

  // Delete Tag
  const handleDeleteConfirm = async () => {
    if (!selectedTag) return;
    try {
      await deleteTag(selectedTag.id).unwrap();
      setIsDeleteAlertOpen(false);
    } catch {
      // Handled globally/in slice
    }
  };

  const columns = useMemo<DataGridColumn<TagResponse>[]>(
    () => [
      {
        accessorKey: "id",
        allowsSorting: true,
        cell: (item) => <span className="font-medium tabular-nums">{item.id}</span>,
        header: "ID",
        id: "id",
        isRowHeader: true,
        minWidth: 80,
      },
      {
        accessorKey: "name",
        allowsSorting: true,
        cell: (item) => <span className="text-sm font-semibold">{item.name}</span>,
        header: "Name",
        id: "name",
        minWidth: 180,
      },
      {
        accessorKey: "slug",
        allowsSorting: true,
        cell: (item) => (
          <code className="bg-muted border-border rounded border px-1.5 py-0.5 font-mono text-xs">
            {item.slug}
          </code>
        ),
        header: "Slug",
        id: "slug",
        minWidth: 180,
      },
      {
        accessorKey: "createdAt",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted text-sm tabular-nums">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        ),
        header: "Created At",
        id: "createdAt",
        minWidth: 200,
      },
      {
        align: "end",
        cell: (item) => (
          <div className="flex items-center justify-end gap-2">
            <Tooltip delay={0}>
              <Button
                isIconOnly
                size="sm"
                variant="tertiary"
                onPress={() => handleEditClick(item)}
                aria-label="Edit Tag"
              >
                <Pencil className="size-4" />
              </Button>
              <Tooltip.Content>Edit Tag</Tooltip.Content>
            </Tooltip>

            <Tooltip delay={0}>
              <Button
                isIconOnly
                size="sm"
                variant="danger-soft"
                onPress={() => handleDeleteClick(item)}
                aria-label="Delete Tag"
              >
                <TrashBin className="size-4" />
              </Button>
              <Tooltip.Content>Delete Tag</Tooltip.Content>
            </Tooltip>
          </div>
        ),
        header: "Actions",
        id: "actions",
        minWidth: 120,
      },
    ],
    [handleEditClick, handleDeleteClick]
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-8 pb-10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-base font-semibold">Tag Management</h2>
          {!isLoading && (
            <Chip size="sm" variant="soft">
              {tags.length}
            </Chip>
          )}
        </div>
        <p className="text-muted text-sm">Manage blog tags to label and index content.</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button size="sm" onPress={handleCreateOpen}>
          <CirclePlus className="size-4" />
          Add Tag
        </Button>

        <SearchField
          className="w-full sm:w-[240px]"
          name="tag-search"
          onChange={handleSearchChange}
          value={search}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search tags..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      {error ? (
        <div className="bg-danger-soft/10 border-danger/20 mt-4 flex flex-col items-center justify-center rounded-2xl border p-12 text-center">
          <p className="text-danger font-semibold">Failed to load tags</p>
        </div>
      ) : (
        <DataGrid
          aria-label="Tags"
          columns={columns}
          contentClassName="min-w-[800px]"
          data={sortedTags}
          getRowId={(item) => item.id}
          isLoadingMore={isLoading}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
        />
      )}

      {/* Create / Edit Form Modal */}
      <Modal>
        <Modal.Backdrop
          isOpen={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          variant="blur"
          UNSTABLE_portalContainer={portalContainer || undefined}
        >
          <Modal.Container size="sm">
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Form onSubmit={handleFormSubmit}>
                <Modal.Header>
                  <Modal.Heading className="text-lg font-bold">
                    {selectedTag ? "Edit Tag" : "Create Tag"}
                  </Modal.Heading>
                  <p className="text-muted text-sm">
                    {selectedTag
                      ? "Update existing tag details. Slug should be URL-safe."
                      : "Add a new tag to label and index blog posts."}
                  </p>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4 py-4">
                  <TextField isRequired name="name" type="text">
                    <Label className="text-sm font-medium">Name</Label>
                    <Input
                      variant="secondary"
                      placeholder="e.g. Next.js"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      onBlur={handleNameBlur}
                    />
                    <FieldError />
                  </TextField>

                  <TextField
                    isRequired
                    name="slug"
                    type="text"
                    validate={(val) => {
                      if (!/^[a-z0-9-]+$/.test(val)) {
                        return "Slug must only contain lowercase letters, numbers, and hyphens";
                      }
                      return null;
                    }}
                  >
                    <Label className="text-sm font-medium">Slug</Label>
                    <Input
                      variant="secondary"
                      placeholder="e.g. next-js"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                    />
                    <FieldError />
                  </TextField>
                </Modal.Body>
                <Modal.Footer className="border-border border-t pt-4">
                  <Button slot="close" variant="tertiary" size="sm">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" isDisabled={isCreating || isUpdating}>
                    {(isCreating || isUpdating) && <Spinner size="sm" className="mr-1" />}
                    {selectedTag ? "Save Changes" : "Create"}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Delete Confirmation Alert */}
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isDeleteAlertOpen}
          onOpenChange={setIsDeleteAlertOpen}
          variant="blur"
          UNSTABLE_portalContainer={portalContainer || undefined}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete Tag?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  Are you sure you want to delete the tag{" "}
                  <strong className="text-foreground">&quot;{selectedTag?.name}&quot;</strong>? This
                  action cannot be undone.
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" variant="tertiary" size="sm">
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onPress={handleDeleteConfirm}
                  isDisabled={isDeleting}
                >
                  {isDeleting && <Spinner size="sm" className="mr-1" />}
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
