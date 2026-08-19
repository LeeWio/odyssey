"use client";

import { CirclePlus, Pencil, TrashBin } from "@gravity-ui/icons";
import { AlertDialog, Button, Chip, SearchField, Spinner, Tooltip } from "@heroui/react";
import {
  DataGrid,
  EmptyState,
  type DataGridColumn,
  type DataGridSortDescriptor,
} from "@heroui-pro/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  type PostResponse,
  useDeletePostMutation,
  useLazySearchAdminPostsQuery,
} from "@/features/blog";
import { openRichText } from "@/lib/features/ui";
import { useAppDispatch } from "@/lib/hooks";
import { NEW_RICH_TEXT_DRAFT_ID } from "@/components/rich-text/utils/editor-draft";
import { usePortalContainer } from "../use-portal-container";

export function PostsPage() {
  const portalContainer = usePortalContainer();
  const dispatch = useAppDispatch();

  const pageSize = 30;
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });

  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [nextPage, setNextPage] = useState(0);
  const requestSequence = useRef(0);
  const [loadPosts, { isFetching, isLoading }] = useLazySearchAdminPostsQuery();

  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();

  // Alert State
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<PostResponse | null>(null);

  const loadPage = useCallback(
    async (page: number, replace = false) => {
      const sequence = ++requestSequence.current;
      const response = await loadPosts({
        page,
        size: pageSize,
        sort: sortDescriptor.column
          ? [
              `${sortDescriptor.column},${sortDescriptor.direction === "descending" ? "desc" : "asc"}`,
            ]
          : undefined,
      })
        .unwrap()
        .catch(() => null);

      if (!response) return;

      if (sequence !== requestSequence.current) return;

      setPosts((current) => {
        if (replace) return response.list;

        const existingIds = new Set(current.map((post) => post.id));
        return [...current, ...response.list.filter((post) => !existingIds.has(post.id))];
      });
      setNextPage(page + 1);
      setTotalPosts(response.total);
    },
    [loadPosts, sortDescriptor]
  );

  useEffect(() => {
    void loadPage(0, true);
  }, [loadPage]);

  const hasMore = posts.length < totalPosts;

  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) void loadPage(nextPage);
  }, [hasMore, isFetching, loadPage, nextPage]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleCreateOpen = () => {
    dispatch(
      openRichText({
        activeId: NEW_RICH_TEXT_DRAFT_ID,
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
      setPosts((current) => current.filter((post) => post.id !== postToDelete.id));
      setTotalPosts((current) => Math.max(0, current - 1));
      setIsDeleteAlertOpen(false);
      setPostToDelete(null);
    } catch {
      // Handled globally
    }
  };

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return posts;

    return posts.filter((post) =>
      [post.title, post.slug, post.category?.name || "", post.series?.name || ""].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [posts, search]);

  const columns = useMemo<DataGridColumn<PostResponse>[]>(
    () => [
      {
        accessorKey: "id",
        allowsResizing: true,
        allowsSorting: true,
        cell: (item) => <span className="font-medium tabular-nums">{item.id}</span>,
        header: "ID",
        id: "id",
        isRowHeader: true,
        minWidth: 80,
      },
      {
        accessorKey: "title",
        allowsResizing: true,
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
        pinned: "start",
      },
      {
        accessorKey: "status",
        allowsResizing: true,
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
        allowsResizing: true,
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
        accessorKey: "series",
        allowsResizing: true,
        allowsSorting: false,
        cell: (item) =>
          item.series ? (
            <Chip size="sm" variant="secondary">
              {item.series.name}
            </Chip>
          ) : (
            <span className="text-muted text-sm">No column</span>
          ),
        header: "Column",
        id: "series",
        minWidth: 160,
      },
      {
        accessorKey: "views",
        allowsResizing: true,
        allowsSorting: true,
        cell: (item) => <span className="text-muted text-sm tabular-nums">{item.views}</span>,
        header: "Views",
        id: "views",
        minWidth: 100,
      },
      {
        accessorKey: "createdAt",
        allowsResizing: true,
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
        allowsResizing: false,
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
        pinned: "end",
        width: 120,
      },
    ],
    [handleEditClick, handleDeleteClick]
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-8 pb-10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-base font-semibold">Post Management</h2>
          {totalPosts > 0 && (
            <Chip size="sm" variant="soft">
              {totalPosts}
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

      {isLoading && posts.length === 0 ? (
        <div className="flex h-56 items-center justify-center">
          <Spinner size="md" />
        </div>
      ) : (
        <DataGrid
          allowsColumnResize
          aria-label="Posts"
          columns={columns}
          contentClassName="h-[min(52vh,42rem)] min-w-[1060px] overflow-auto"
          data={filteredPosts}
          getRowId={(item) => item.id}
          headingHeight={40}
          isLoadingMore={isLoading || isFetching}
          loadMoreContent={<Spinner size="sm" />}
          renderEmptyState={() => (
            <EmptyState size="sm">
              <EmptyState.Header>
                <EmptyState.Title>No posts found</EmptyState.Title>
                <EmptyState.Description>
                  Adjust the search or create a new article.
                </EmptyState.Description>
              </EmptyState.Header>
            </EmptyState>
          )}
          rowHeight={56}
          sortDescriptor={sortDescriptor}
          virtualized
          onLoadMore={hasMore ? handleLoadMore : undefined}
          onSortChange={setSortDescriptor}
        />
      )}

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
