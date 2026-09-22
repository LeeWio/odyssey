"use client";

import type { DataGridColumn, DataGridSortDescriptor } from "@heroui-pro/react";
import type { ReactNode } from "react";
import type { Selection } from "react-aria-components";

import {
  ArrowDownToLine,
  BarsDescendingAlignCenter,
  CirclePlus,
  Copy,
  EllipsisVertical,
  Eye,
  Funnel,
  LayoutColumns3,
  Magnifier,
  Pencil,
  TrashBin,
} from "@gravity-ui/icons";
import {
  AlertDialog,
  Avatar,
  Button,
  Chip,
  Dropdown,
  Label,
  Separator,
  Spinner,
  Tooltip,
} from "@heroui/react";
import { ActionBar, DataGrid, EmptyState } from "@heroui-pro/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { NEW_RICH_TEXT_DRAFT_ID } from "@/components/rich-text/utils/editor-draft";
import {
  type PostResponse,
  type PostStatus,
  useDeletePostMutation,
  useLazySearchAdminPostsQuery,
} from "@/lib/features/post";
import { openRichText } from "@/lib/features/ui";
import { useAppDispatch } from "@/lib/hooks";

import { usePortalContainer } from "../use-portal-container";

const ALL_COLUMN_IDS = [
  "title",
  "status",
  "category",
  "series",
  "authorName",
  "views",
  "likesCount",
  "createdAt",
  "updatedAt",
  "actions",
] as const;

const STATUS_OPTIONS: { id: PostStatus | "all"; label: string }[] = [
  { id: "all", label: "All stages" },
  { id: "DRAFT", label: "Draft" },
  { id: "PENDING_REVIEW", label: "Review" },
  { id: "SCHEDULED", label: "Scheduled" },
  { id: "PUBLISHED", label: "Published" },
  { id: "REJECTED", label: "Rejected" },
  { id: "ARCHIVED", label: "Archived" },
];

const STATUS_COLORS: Record<string, "success" | "warning" | "danger" | "default"> = {
  ARCHIVED: "default",
  DRAFT: "warning",
  PENDING_REVIEW: "warning",
  PUBLISHED: "success",
  REJECTED: "danger",
  SCHEDULED: "default",
};

const COLUMN_OPTIONS = [
  { id: "title", label: "Article" },
  { id: "status", label: "Status" },
  { id: "category", label: "Category" },
  { id: "series", label: "Column" },
  { id: "authorName", label: "Author" },
  { id: "views", label: "Views" },
  { id: "likesCount", label: "Likes" },
  { id: "createdAt", label: "Published" },
  { id: "updatedAt", label: "Updated" },
  { id: "actions", label: "Row actions" },
] as const;

export function PostsPage() {
  const portalContainer = usePortalContainer();
  const dispatch = useAppDispatch();
  const pageSize = 30;
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibleColumns, setVisibleColumns] = useState<Selection>(new Set(ALL_COLUMN_IDS));
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [nextPage, setNextPage] = useState(0);
  const requestSequence = useRef(0);
  const [loadPosts, { isFetching, isLoading }] = useLazySearchAdminPostsQuery();
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
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

      if (!response || sequence !== requestSequence.current) return;

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

  const openEditor = useCallback(
    (post?: PostResponse) => {
      dispatch(
        post
          ? openRichText({ activeId: post.id.toString(), isReadOnly: false })
          : openRichText({
              activeId: NEW_RICH_TEXT_DRAFT_ID,
              initialValue: null,
              isReadOnly: false,
            })
      );
    },
    [dispatch]
  );

  const categories = useMemo(
    () => [...new Set(posts.map((post) => post.category?.name).filter(Boolean) as string[])],
    [posts]
  );
  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesQuery =
        !normalizedQuery ||
        [post.title, post.slug, post.category?.name || "", post.authorName || ""].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        );
      const matchesStatus = statusFilter === "all" || post.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || post.category?.name === categoryFilter;

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, posts, query, statusFilter]);
  const totalViews = filteredPosts.reduce((sum, post) => sum + post.views, 0);
  const selectedIds = useMemo(
    () =>
      selectedKeys === "all"
        ? new Set(filteredPosts.map((post) => String(post.id)))
        : new Set([...selectedKeys].map(String)),
    [filteredPosts, selectedKeys]
  );
  const selectedCount = selectedIds.size;

  const columns = useMemo<DataGridColumn<PostResponse>[]>(() => {
    const visibleColumnSet =
      visibleColumns === "all" ? new Set<string>(ALL_COLUMN_IDS) : (visibleColumns as Set<string>);
    const allColumns: DataGridColumn<PostResponse>[] = [
      {
        accessorKey: "title",
        allowsResizing: true,
        allowsSorting: true,
        cell: (post) => (
          <Tooltip delay={400}>
            <div className="flex w-full min-w-0 items-center gap-2">
              <Avatar className="size-5 shrink-0 rounded-md">
                {post.coverImage ? <Avatar.Image alt="" src={post.coverImage} /> : null}
                <Avatar.Fallback className="text-[9px]">{initials(post.title)}</Avatar.Fallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col items-start text-left leading-tight">
                <span className="block w-full truncate text-xs font-medium">{post.title}</span>
                <span className="text-muted block w-full truncate text-[11px]">/{post.slug}</span>
              </div>
            </div>
            <Tooltip.Content className="max-w-xs">
              <p className="text-sm font-medium">{post.title}</p>
              <p className="text-muted text-xs">/{post.slug}</p>
            </Tooltip.Content>
          </Tooltip>
        ),
        header: "Article",
        headerClassName: "whitespace-nowrap",
        id: "title",
        isRowHeader: true,
        minWidth: 280,
        pinned: "start",
      },
      {
        accessorKey: "status",
        allowsResizing: true,
        allowsSorting: true,
        cell: (post) => (
          <Chip
            className="shrink-0 whitespace-nowrap"
            color={STATUS_COLORS[post.status]}
            size="sm"
            variant="soft"
          >
            {statusLabel(post.status)}
          </Chip>
        ),
        header: "Status",
        headerClassName: "whitespace-nowrap",
        id: "status",
        minWidth: 88,
        width: 96,
      },
      {
        allowsResizing: true,
        cell: (post) => (
          <div className="flex max-w-full flex-nowrap items-center gap-1 overflow-hidden">
            {post.category ? (
              <Chip className="shrink-0 whitespace-nowrap" size="sm" variant="soft">
                {post.category.name}
              </Chip>
            ) : (
              <span className="text-muted text-xs">None</span>
            )}
          </div>
        ),
        header: "Category",
        headerClassName: "whitespace-nowrap",
        id: "category",
        minWidth: 120,
        width: 160,
      },
      {
        allowsResizing: true,
        cell: (post) =>
          post.series ? (
            <span className="block truncate text-xs">{post.series.name}</span>
          ) : (
            <span className="text-muted text-xs">None</span>
          ),
        header: "Column",
        headerClassName: "whitespace-nowrap",
        id: "series",
        minWidth: 96,
        width: 120,
      },
      {
        accessorKey: "authorName",
        allowsResizing: true,
        allowsSorting: true,
        cell: (post) => (
          <div className="flex items-center gap-2">
            <Avatar className="size-5 rounded-[var(--radius)]">
              {post.authorAvatar ? (
                <Avatar.Image alt={post.authorName || "Author"} src={post.authorAvatar} />
              ) : null}
              <Avatar.Fallback className="text-[9px]">
                {initials(post.authorName || "A")}
              </Avatar.Fallback>
            </Avatar>
            <span className="text-xs">{post.authorName || "Anonymous"}</span>
          </div>
        ),
        header: "Author",
        headerClassName: "whitespace-nowrap",
        id: "authorName",
        minWidth: 140,
        width: 168,
      },
      {
        accessorKey: "views",
        align: "end",
        allowsResizing: true,
        allowsSorting: true,
        cell: (post) => <span className="font-medium tabular-nums">{post.views}</span>,
        header: "Views",
        headerClassName: "whitespace-nowrap",
        id: "views",
        minWidth: 80,
        width: 96,
      },
      {
        accessorKey: "likesCount",
        align: "end",
        allowsResizing: true,
        allowsSorting: true,
        cell: (post) => <span className="tabular-nums">{post.likesCount}</span>,
        header: "Likes",
        headerClassName: "whitespace-nowrap",
        id: "likesCount",
        minWidth: 72,
        width: 88,
      },
      {
        accessorKey: "createdAt",
        allowsResizing: true,
        allowsSorting: true,
        cell: (post) => (
          <span className="text-muted text-xs whitespace-nowrap">
            {new Date(post.createdAt).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
        header: "Published",
        headerClassName: "whitespace-nowrap",
        id: "createdAt",
        minWidth: 100,
        width: 108,
      },
      {
        accessorKey: "updatedAt",
        allowsResizing: true,
        allowsSorting: true,
        cell: (post) => (
          <span className="text-muted text-xs whitespace-nowrap">
            {new Date(post.updatedAt).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
        header: "Updated",
        headerClassName: "whitespace-nowrap",
        id: "updatedAt",
        minWidth: 100,
        width: 108,
      },
      {
        align: "end",
        allowsResizing: false,
        cell: (post) => (
          <PostRowMenu
            portalContainer={portalContainer}
            onCopy={() => void navigator.clipboard.writeText(post.slug)}
            onDelete={() => {
              setPostToDelete(post);
              setIsDeleteAlertOpen(true);
            }}
            onEdit={() => openEditor(post)}
          />
        ),
        header: "",
        id: "actions",
        minWidth: 48,
        pinned: "end",
        width: 48,
      },
    ];

    return allColumns.filter((column) => visibleColumnSet.has(column.id));
  }, [openEditor, portalContainer, visibleColumns]);

  const exportPosts = (records: readonly PostResponse[]) => {
    downloadCsv("posts.csv", [
      "Title,Slug,Status,Category,Column,Author,Views,Likes,Created,Updated",
      ...records.map(
        (post) =>
          `"${post.title}",${post.slug},${post.status},${post.category?.name ?? ""},${post.series?.name ?? ""},${post.authorName ?? ""},${post.views},${post.likesCount},${post.createdAt},${post.updatedAt}`
      ),
    ]);
  };

  return (
    <>
      <main className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col gap-3 overflow-hidden px-6 pt-4 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSearch portalContainer={portalContainer} query={query} onChange={setQuery} />
          <FilterMenu
            icon={<BarsDescendingAlignCenter className="size-4" />}
            label="Sort: Published"
            options={[
              { id: "descending", label: "Newest first" },
              { id: "ascending", label: "Oldest first" },
            ]}
            portalContainer={portalContainer}
            selected={sortDescriptor.direction}
            onChange={(direction) =>
              setSortDescriptor({
                column: "createdAt",
                direction: direction as "ascending" | "descending",
              })
            }
          />
          <FilterMenu
            icon={<Funnel className="size-4" />}
            label={statusFilter === "all" ? "Stage" : statusLabel(statusFilter)}
            options={STATUS_OPTIONS}
            portalContainer={portalContainer}
            selected={statusFilter}
            onChange={(value) => setStatusFilter(value as PostStatus | "all")}
          />
          <FilterMenu
            icon={<Funnel className="size-4" />}
            label={categoryFilter === "all" ? "Category" : categoryFilter}
            options={[
              { id: "all", label: "All categories" },
              ...categories.map((category) => ({ id: category, label: category })),
            ]}
            portalContainer={portalContainer}
            selected={categoryFilter}
            onChange={setCategoryFilter}
          />
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" onPress={() => openEditor()}>
              <CirclePlus className="size-4" />
              New Article
            </Button>
            <Button size="sm" variant="ghost" onPress={() => exportPosts(filteredPosts)}>
              <ArrowDownToLine className="size-4" />
              Export CSV
            </Button>
            <Dropdown>
              <Button size="sm" variant="tertiary">
                <LayoutColumns3 className="size-4" />
                Display
              </Button>
              <Dropdown.Popover UNSTABLE_portalContainer={portalContainer || undefined}>
                <Dropdown.Menu
                  disallowEmptySelection
                  selectedKeys={visibleColumns}
                  selectionMode="multiple"
                  onSelectionChange={setVisibleColumns}
                >
                  {COLUMN_OPTIONS.map((option) => (
                    <Dropdown.Item key={option.id} id={option.id} textValue={option.label}>
                      <Label>{option.label}</Label>
                      <Dropdown.ItemIndicator />
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </div>

        <div className="flex min-h-0 max-w-full min-w-0 flex-1 flex-col gap-2 overflow-hidden">
          <DataGrid
            allowsColumnResize
            showSelectionCheckboxes
            aria-label="Posts"
            className="min-h-0 max-w-full min-w-0 flex-1 [&_.table__column]:sticky [&_.table__column]:top-0 [&_.table__column]:z-[3]"
            columns={columns}
            contentClassName="w-full min-w-full"
            data={filteredPosts}
            getRowId={(post) => String(post.id)}
            headingHeight={40}
            isLoadingMore={isLoading || isFetching}
            loadMoreContent={<Spinner size="sm" />}
            rowHeight={56}
            scrollContainerClassName="h-full min-h-0 overflow-auto"
            selectedKeys={selectedKeys}
            selectionMode="multiple"
            sortDescriptor={sortDescriptor}
            variant="primary"
            virtualized
            renderEmptyState={() => (
              <div className="py-8">
                <EmptyState size="sm">
                  <EmptyState.Header>
                    <EmptyState.Media variant="icon">
                      <Magnifier />
                    </EmptyState.Media>
                    <EmptyState.Title>No posts found</EmptyState.Title>
                    <EmptyState.Description>
                      Adjust the search or clear filters to restore the article list.
                    </EmptyState.Description>
                  </EmptyState.Header>
                  <EmptyState.Content>
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => {
                        setQuery("");
                        setStatusFilter("all");
                        setCategoryFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  </EmptyState.Content>
                </EmptyState>
              </div>
            )}
            onLoadMore={hasMore ? handleLoadMore : undefined}
            onSelectionChange={setSelectedKeys}
            onSortChange={setSortDescriptor}
          />
          <div className="text-muted flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs">
            <span>
              {filteredPosts.length} of {totalPosts} posts
            </span>
            <span>Views {totalViews.toLocaleString("en-US")}</span>
          </div>
        </div>
      </main>

      <ActionBar aria-label="Post bulk actions" isOpen={selectedCount > 0}>
        <ActionBar.Prefix>
          <Chip className="shrink-0 tabular-nums" size="sm">
            {selectedCount} selected
          </Chip>
        </ActionBar.Prefix>
        <Separator />
        <ActionBar.Content>
          <Button
            aria-label="Export"
            size="sm"
            variant="ghost"
            onPress={() =>
              exportPosts(filteredPosts.filter((post) => selectedIds.has(String(post.id))))
            }
          >
            <ArrowDownToLine />
            <span>Export</span>
          </Button>
          <Button
            aria-label="Delete"
            className="text-danger bg-danger/10"
            size="sm"
            variant="ghost"
            onPress={() => {
              const first = filteredPosts.find((post) => selectedIds.has(String(post.id)));
              if (!first) return;
              setPostToDelete(first);
              setIsDeleteAlertOpen(true);
            }}
          >
            <TrashBin />
            <span>Delete</span>
          </Button>
        </ActionBar.Content>
        <Separator />
        <ActionBar.Suffix>
          <Button
            isIconOnly
            aria-label="Clear selection"
            size="sm"
            variant="ghost"
            onPress={() => setSelectedKeys(new Set())}
          >
            <span className="text-sm">×</span>
          </Button>
        </ActionBar.Suffix>
      </ActionBar>

      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isDeleteAlertOpen}
          variant="blur"
          UNSTABLE_portalContainer={portalContainer || undefined}
          onOpenChange={setIsDeleteAlertOpen}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog aria-label="Delete article" className="sm:max-w-md">
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
                <Button slot="close" size="sm" variant="tertiary">
                  Cancel
                </Button>
                <Button
                  isDisabled={isDeleting}
                  size="sm"
                  variant="danger"
                  onPress={async () => {
                    if (!postToDelete) return;
                    await deletePost(postToDelete.id).unwrap();
                    setPosts((current) => current.filter((post) => post.id !== postToDelete.id));
                    setTotalPosts((current) => Math.max(0, current - 1));
                    setSelectedKeys(new Set());
                    setIsDeleteAlertOpen(false);
                    setPostToDelete(null);
                  }}
                >
                  {isDeleting ? <Spinner size="sm" className="mr-1" /> : null}
                  Delete
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </>
  );
}

function FilterSearch({
  onChange,
  portalContainer,
  query,
}: {
  onChange: (value: string) => void;
  portalContainer: HTMLElement | null;
  query: string;
}) {
  return (
    <Dropdown>
      <Button size="sm" variant="tertiary">
        <Funnel className="size-4" />
        {query || "Filter"}
      </Button>
      <Dropdown.Popover
        className="min-w-[220px]"
        UNSTABLE_portalContainer={portalContainer || undefined}
      >
        <div className="px-2 pt-2">
          <input
            aria-label="Filter posts"
            className="border-border bg-surface text-foreground w-full rounded-lg border px-3 py-2 text-sm outline-none"
            placeholder="Search posts"
            value={query}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
        <Dropdown.Menu
          disabledKeys={query ? [] : ["clear"]}
          onAction={(key) => {
            if (key === "clear") onChange("");
          }}
        >
          <Dropdown.Item id="clear" textValue="Clear search">
            <Label>Clear search</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

function FilterMenu({
  icon,
  label,
  onChange,
  options,
  portalContainer,
  selected,
}: {
  icon: ReactNode;
  label: string;
  onChange: (value: string) => void;
  options: readonly { id: string; label: string }[];
  portalContainer: HTMLElement | null;
  selected: string;
}) {
  return (
    <Dropdown>
      <Button size="sm" variant="tertiary">
        {icon}
        {label}
      </Button>
      <Dropdown.Popover UNSTABLE_portalContainer={portalContainer || undefined}>
        <Dropdown.Menu
          disallowEmptySelection
          selectedKeys={new Set([selected])}
          selectionMode="single"
          onSelectionChange={(keys) => {
            const value = [...keys][0];
            if (value) onChange(String(value));
          }}
        >
          {options.map((option) => (
            <Dropdown.Item key={option.id} id={option.id} textValue={option.label}>
              <Label>{option.label}</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

function PostRowMenu({
  onCopy,
  onDelete,
  onEdit,
  portalContainer,
}: {
  onCopy: () => void;
  onDelete: () => void;
  onEdit: () => void;
  portalContainer: HTMLElement | null;
}) {
  return (
    <Dropdown>
      <Button isIconOnly aria-label="Article actions" size="sm" variant="ghost">
        <EllipsisVertical className="size-4" />
      </Button>
      <Dropdown.Popover UNSTABLE_portalContainer={portalContainer || undefined}>
        <Dropdown.Menu>
          <Dropdown.Item id="open" textValue="Open article" onAction={onEdit}>
            <Eye className="size-4" />
            <Label>Open article</Label>
          </Dropdown.Item>
          <Dropdown.Item id="edit" textValue="Edit article" onAction={onEdit}>
            <Pencil className="size-4" />
            <Label>Edit article</Label>
          </Dropdown.Item>
          <Dropdown.Item id="copy" textValue="Copy slug" onAction={onCopy}>
            <Copy className="size-4" />
            <Label>Copy slug</Label>
          </Dropdown.Item>
          <Separator />
          <Dropdown.Item id="delete" textValue="Delete" variant="danger" onAction={onDelete}>
            <TrashBin className="size-4" />
            <Label>Delete</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

function downloadCsv(filename: string, lines: readonly string[]) {
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusLabel(status: string): string {
  return STATUS_OPTIONS.find((option) => option.id === status)?.label ?? status;
}
