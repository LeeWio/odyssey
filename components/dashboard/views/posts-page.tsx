"use client";

import { CirclePlus, Pencil, TrashBin } from "@gravity-ui/icons";
import { AlertDialog, Button, Chip, SearchField, Spinner, Tooltip } from "@heroui/react";
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
import { useCallback, useMemo, useState } from "react";

import {
  type PostResponse,
  useDeletePostMutation,
  useSearchAdminPostsQuery,
} from "@/features/blog";
import { openRichText } from "@/lib/features/ui";
import { useAppDispatch } from "@/lib/hooks";
import { usePortalContainer } from "../use-portal-container";

export function PostsPage() {
  const portalContainer = usePortalContainer();
  const dispatch = useAppDispatch();

  // Pagination & Sorting State
  const [page] = useState(0);
  const [size] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });

  // Search State
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching } = useSearchAdminPostsQuery({
    page,
    size,
    sort: sortDescriptor.column
      ? [`${sortDescriptor.column},${sortDescriptor.direction === "descending" ? "desc" : "asc"}`]
      : undefined,
  });

  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();

  // Alert State
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<PostResponse | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleCreateOpen = () => {
    dispatch(
      openRichText({
        activeId: `new-${Date.now()}`,
        initialValue: null,
        isReadOnly: false,
      })
    );
  };

  const handleEditClick = useCallback(
    (post: PostResponse) => {
      dispatch(
        openRichText({
          activeId: post.id.toString(),
          isReadOnly: false,
        })
      );
    },
    [dispatch]
  );

  const handleDeleteClick = useCallback((post: PostResponse) => {
    setPostToDelete(post);
    setIsDeleteAlertOpen(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    try {
      await deletePost(postToDelete.id).unwrap();
      setIsDeleteAlertOpen(false);
      setPostToDelete(null);
    } catch {
      // Handled globally
    }
  };

  const columns = useMemo<DataGridColumn<PostResponse>[]>(
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
        accessorKey: "title",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex flex-col gap-0.5">
            <span className="line-clamp-1 text-sm font-semibold">{item.title}</span>
            <span className="text-muted text-xs tabular-nums">/{item.slug}</span>
          </div>
        ),
        header: "Title",
        id: "title",
        minWidth: 240,
      },
      {
        accessorKey: "status",
        allowsSorting: true,
        cell: (item) => {
          const variants: Record<string, "soft" | "primary" | "secondary" | "tertiary"> = {
            PUBLISHED: "soft",
            DRAFT: "secondary",
            ARCHIVED: "tertiary",
          };
          const colors: Record<string, "success" | "warning" | "default"> = {
            PUBLISHED: "success",
            DRAFT: "warning",
            ARCHIVED: "default",
          };
          return (
            <Chip size="sm" variant={variants[item.status]} color={colors[item.status]}>
              {item.status}
            </Chip>
          );
        },
        header: "Status",
        id: "status",
        minWidth: 120,
      },
      {
        accessorKey: "category",
        allowsSorting: false,
        cell: (item) => (
          <Chip size="sm" variant="secondary">
            {item.category?.name || "Uncategorized"}
          </Chip>
        ),
        header: "Category",
        id: "category",
        minWidth: 140,
      },
      {
        accessorKey: "views",
        allowsSorting: true,
        cell: (item) => <span className="text-muted text-sm tabular-nums">{item.views}</span>,
        header: "Views",
        id: "views",
        minWidth: 100,
      },
      {
        accessorKey: "createdAt",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted text-sm tabular-nums">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        ),
        header: "Date",
        id: "createdAt",
        minWidth: 120,
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
                aria-label="Edit Post"
              >
                <Pencil className="size-4" />
              </Button>
              <Tooltip.Content>Edit Article</Tooltip.Content>
            </Tooltip>

            <Tooltip delay={0}>
              <Button
                isIconOnly
                size="sm"
                variant="danger-soft"
                onPress={() => handleDeleteClick(item)}
                aria-label="Delete Post"
              >
                <TrashBin className="size-4" />
              </Button>
              <Tooltip.Content>Delete Article</Tooltip.Content>
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
          <h2 className="text-foreground text-base font-semibold">Post Management</h2>
          {data && (
            <Chip size="sm" variant="soft">
              {data.total}
            </Chip>
          )}
        </div>
        <p className="text-muted text-sm">Create, edit and manage your blog articles.</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button size="sm" onPress={handleCreateOpen}>
          <CirclePlus className="size-4" />
          New Article
        </Button>

        <SearchField
          className="w-full sm:w-[240px]"
          name="post-search"
          onChange={handleSearchChange}
          value={search}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search articles..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      <DataGrid
        aria-label="Posts"
        columns={columns}
        contentClassName="min-w-[900px]"
        data={data?.list || []}
        getRowId={(item) => item.id}
        isLoadingMore={isLoading || isFetching}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      />

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
                <AlertDialog.Heading>Delete Article?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  Are you sure you want to delete the article{" "}
                  <strong className="text-foreground">&quot;{postToDelete?.title}&quot;</strong>?
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
