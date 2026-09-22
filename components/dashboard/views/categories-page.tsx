"use client";

import {
  BarsDescendingAlignCenter,
  CirclePlus,
  Copy,
  LayoutColumns3,
  Pencil,
  Sliders,
  TrashBin,
} from "@gravity-ui/icons";
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
  TextArea,
  TextField,
} from "@heroui/react";
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
import { type FormEvent, useCallback, useMemo, useState } from "react";

import {
  type CategoryRequest,
  type CategoryResponse,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useUpdateCategoryMutation,
} from "@/lib/features/category";
import { toUrlSlug, validateUrlSlug } from "@/lib/utils/slug";
import { IconButton } from "../icon-button";
import { usePortalContainer } from "../use-portal-container";

export function CategoriesPage() {
  const portalContainer = usePortalContainer();

  const { data: categories = [], isLoading, error } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

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
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [formDescription, setFormDescription] = useState("");

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  // Filter Categories
  const filteredCategories = useMemo(() => {
    let result = [...categories];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (cat) =>
          cat.name.toLowerCase().includes(q) ||
          cat.slug.toLowerCase().includes(q) ||
          cat.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [categories, search]);

  // Sort Categories
  const sortedCategories = useMemo(() => {
    if (!sortDescriptor.column) return filteredCategories;
    const col = sortDescriptor.column as keyof CategoryResponse;

    return [...filteredCategories].sort((a, b) => {
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
  }, [filteredCategories, sortDescriptor]);

  // Open Form Modal for Create
  const handleCreateOpen = () => {
    setSelectedCategory(null);
    setFormName("");
    setFormSlug("");
    setSlugTouched(false);
    setFormDescription("");
    setIsFormModalOpen(true);
  };

  // Open Form Modal for Edit
  const handleEditClick = useCallback((category: CategoryResponse) => {
    setSelectedCategory(category);
    setFormName(category.name);
    setFormSlug(category.slug);
    setSlugTouched(true);
    setFormDescription(category.description || "");
    setIsFormModalOpen(true);
  }, []);

  // Open Delete Confirmation
  const handleDeleteClick = useCallback((category: CategoryResponse) => {
    setSelectedCategory(category);
    setIsDeleteAlertOpen(true);
  }, []);

  const handleNameChange = (value: string) => {
    setFormName(value);
    if (!slugTouched) {
      setFormSlug(toUrlSlug(value));
    }
  };

  // Form Submit (Create or Update)
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const slug = formSlug.trim() || toUrlSlug(formName);
    if (!slugTouched && slug !== formSlug) {
      setFormSlug(slug);
    }
    const body: CategoryRequest = {
      name: formName.trim(),
      slug,
      description: formDescription.trim(),
    };

    try {
      if (selectedCategory) {
        await updateCategory({ id: selectedCategory.id, body }).unwrap();
      } else {
        await createCategory(body).unwrap();
      }
      setIsFormModalOpen(false);
    } catch {
      // RTK Query's onQueryStarted already displays toast errors
    }
  };

  // Delete Category
  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;
    try {
      await deleteCategory(selectedCategory.id).unwrap();
      setIsDeleteAlertOpen(false);
    } catch {
      // Handled globally/in slice
    }
  };

  const columns = useMemo<DataGridColumn<CategoryResponse>[]>(
    () => [
      {
        accessorKey: "id",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex items-center gap-2">
            <span className="font-medium tabular-nums">{item.id}</span>
            <Button
              isIconOnly
              aria-label="Copy ID"
              size="sm"
              variant="ghost"
              onPress={() => void navigator.clipboard.writeText(String(item.id))}
            >
              <Copy className="text-muted size-3.5" />
            </Button>
          </div>
        ),
        header: "ID",
        id: "id",
        isRowHeader: true,
        minWidth: 80,
      },
      {
        accessorKey: "name",
        allowsSorting: true,
        cell: (item) => <span className="text-xs font-medium">{item.name}</span>,
        header: "Name",
        id: "name",
        minWidth: 160,
      },
      {
        accessorKey: "slug",
        allowsSorting: true,
        cell: (item) => item.slug,
        header: "Slug",
        id: "slug",
        minWidth: 160,
      },
      {
        accessorKey: "description",
        allowsSorting: false,
        cell: (item) => <span className="text-muted text-xs">{item.description || "-"}</span>,
        header: "Description",
        id: "description",
        minWidth: 260,
      },
      {
        accessorKey: "createdAt",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted text-xs tabular-nums">
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
        header: "Created At",
        id: "createdAt",
        minWidth: 140,
      },
      {
        align: "end",
        cell: (item) => (
          <div className="flex items-center justify-end gap-0.5">
            <IconButton
              label="Edit Category"
              size="sm"
              variant="tertiary"
              onPress={() => handleEditClick(item)}
            >
              <Pencil className="size-4" />
            </IconButton>
            <IconButton
              label="Delete Category"
              size="sm"
              variant="danger-soft"
              onPress={() => handleDeleteClick(item)}
            >
              <TrashBin className="size-4" />
            </IconButton>
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
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-4 pb-10">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground text-base font-semibold">All Categories</span>
            <Chip size="sm" variant="soft">
              {categories.length}
            </Chip>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="tertiary">
                <Sliders className="size-4" />
                Filter
              </Button>
              <Button size="sm" variant="tertiary">
                <BarsDescendingAlignCenter className="size-4" />
                Sort
              </Button>
              <Button size="sm" variant="tertiary">
                <LayoutColumns3 className="size-4" />
                Columns
              </Button>
              <Button size="sm" onPress={handleCreateOpen}>
                <CirclePlus className="size-4" />
                Add Category
              </Button>
            </div>
            <SearchField
              className="w-full sm:w-[220px]"
              name="category-search"
              value={search}
              onChange={handleSearchChange}
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search..." />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-danger-soft/10 border-danger/20 mt-4 flex flex-col items-center justify-center rounded-2xl border p-12 text-center">
          <p className="text-danger font-semibold">Failed to load categories</p>
        </div>
      ) : (
        <DataGrid
          aria-label="Categories"
          columns={columns}
          contentClassName="min-w-[700px]"
          data={sortedCategories}
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
            <Modal.Dialog className="sm:max-w-md" aria-label="Modal dialog">
              <Modal.CloseTrigger />
              <Form onSubmit={handleFormSubmit}>
                <Modal.Header>
                  <Modal.Heading className="text-lg font-bold">
                    {selectedCategory ? "Edit Category" : "Create Category"}
                  </Modal.Heading>
                  <p className="text-muted text-sm">
                    {selectedCategory
                      ? "Update existing category details. Slug should be URL-safe."
                      : "Add a new category to group related blog posts."}
                  </p>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4 py-4">
                  <TextField isRequired name="name" type="text">
                    <Label className="text-sm font-medium">Name</Label>
                    <Input
                      variant="secondary"
                      placeholder="e.g. Technology"
                      value={formName}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                    <FieldError />
                  </TextField>

                  <TextField
                    isRequired
                    name="slug"
                    type="text"
                    validate={(val) => validateUrlSlug(val)}
                  >
                    <Label className="text-sm font-medium">Slug</Label>
                    <Input
                      variant="secondary"
                      placeholder="e.g. technology"
                      value={formSlug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setFormSlug(e.target.value);
                      }}
                    />
                    <FieldError />
                  </TextField>

                  <TextField name="description">
                    <Label className="text-sm font-medium">Description</Label>
                    <TextArea
                      variant="secondary"
                      placeholder="Describe this category..."
                      className="min-h-20"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
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
                    {selectedCategory ? "Save Changes" : "Create"}
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
            <AlertDialog.Dialog className="sm:max-w-md" aria-label="Alert dialog">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete Category?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  Are you sure you want to delete the category{" "}
                  <strong className="text-foreground">&quot;{selectedCategory?.name}&quot;</strong>?
                  This action cannot be undone.
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
