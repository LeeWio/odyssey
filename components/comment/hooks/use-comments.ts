"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  useGetPostCommentsQuery,
  useGetGuestbookEntriesQuery,
} from "@/lib/features/comment/comment-api";
import { useCommentContext } from "../context/comment-context";
import { simulationStore, EnhancedComment } from "./simulation-store";

interface CommentNode {
  id: number;
  parentId?: number | null;
  content: string;
  username?: string | null;
  nickname?: string | null;
  avatar?: string | null;
  status?: string | null;
  postId?: number | null;
  postTitle?: string | null;
  createdAt: string;
  children?: CommentNode[] | null;
}

const PAGE_SIZE_STEP = 5; // How many root comments to load per page

export function useComments() {
  const {
    isGuestbook,
    postId,
    sortOrder,
    setNewCommentCount,
    highlightedCommentId,
    likes,
    edits,
    deletions,
    reports,
    localComments,
    setLocalComments,
  } = useCommentContext();

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE_STEP);
  const prevTotalCommentsRef = useRef<number>(0);

  // Fetch comments from backend (conditionally for blog posts or guestbook)
  const postCommentsResult = useGetPostCommentsQuery(
    { postId, page: 0, size: 200 },
    { skip: isGuestbook }
  );

  const guestbookResult = useGetGuestbookEntriesQuery(undefined, { skip: !isGuestbook });

  const {
    data: commentsPage,
    isLoading,
    isFetching,
    refetch,
    error,
  } = isGuestbook ? guestbookResult : postCommentsResult;

  const rawCommentsList = commentsPage;

  // Local state for pending comments (optimistic UI that haven't been synced to DB yet)
  const [pendingComments, setPendingComments] = useState<EnhancedComment[]>([]);

  // Function to add a pending comment locally
  const addPendingComment = (comment: EnhancedComment) => {
    setPendingComments((prev) => [comment, ...prev]);
  };

  // Function to remove a pending comment or promote it
  const removePendingComment = (id: number) => {
    setPendingComments((prev) => prev.filter((c) => c.id !== id));
  };

  // Function to mark a pending comment as failed
  const markPendingCommentFailed = (id: number) => {
    setPendingComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFailed: true, isPending: false } : c))
    );
  };

  // Enrich & Transform raw comments from RTK query
  const enrichedComments = useMemo(() => {
    const rawComments = rawCommentsList || [];

    function processNode(node: CommentNode): EnhancedComment | null {
      if (deletions.includes(node.id)) return null;

      const localLike = likes[node.id] || { count: 0, isLiked: false };
      const localEdit = edits[node.id];
      const isReported = reports.includes(node.id);

      const processedChildren: EnhancedComment[] = [];
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          const processedChild = processNode(child);
          if (processedChild) {
            processedChildren.push(processedChild);
          }
        }
      }

      // Sort children: usually oldest first for natural reading flow in replies
      processedChildren.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      return {
        id: node.id,
        parentId: node.parentId || null,
        content: localEdit !== undefined ? localEdit : node.content,
        username: node.username || "Anonymous",
        nickname: node.nickname || node.username || "Anonymous",
        avatar: node.avatar || "",
        status: node.status || "APPROVED",
        postId: node.postId || postId,
        postTitle: node.postTitle || "",
        createdAt: node.createdAt,
        likesCount: localLike.isLiked ? Math.max(localLike.count, 1) : localLike.count,
        isLiked: localLike.isLiked,
        isEdited: localEdit !== undefined,
        isReported,
        children: processedChildren,
      };
    }

    const processedRoots: EnhancedComment[] = [];
    for (const raw of rawComments) {
      const processed = processNode(raw);
      if (processed) {
        processedRoots.push(processed);
      }
    }

    // Sync local comments awaiting approval with the rawComments from backend
    const approvedCommentsText = new Set<string>();
    const collectApprovedText = (nodes: EnhancedComment[]) => {
      for (const node of nodes) {
        approvedCommentsText.add(`${node.username}:${node.content}`);
        if (node.children && node.children.length > 0) {
          collectApprovedText(node.children);
        }
      }
    };
    collectApprovedText(processedRoots);

    const remainingLocal: EnhancedComment[] = [];
    for (const c of localComments) {
      const matchKey = `${c.username}:${c.content}`;
      if (!approvedCommentsText.has(matchKey)) {
        remainingLocal.push({
          ...c,
          status: "PENDING", // Visual marker
        });
      }
    }

    // Merge in local pending comments that belong to root (parentId === null)
    const rootPending = pendingComments.filter((c) => c.parentId === null);
    const rootLocal = remainingLocal.filter((c) => c.parentId === null);

    // Remove duplicates if a pending/local comment has successfully synced and now exists in rawComments
    const rawIds = new Set(processedRoots.map((c) => c.id));
    const filteredPendingAndLocal = [...rootPending, ...rootLocal].filter(
      (c) => c.isPending || c.isFailed || !rawIds.has(c.id)
    );

    const allRoots = [...filteredPendingAndLocal, ...processedRoots];

    // Incorporate inline replies recursively
    const inlineReplies = [
      ...pendingComments.filter((c) => c.parentId !== null),
      ...remainingLocal.filter((c) => c.parentId !== null),
    ];
    if (inlineReplies.length > 0) {
      const injectReplies = (nodes: EnhancedComment[]) => {
        for (const node of nodes) {
          const repliesForThisNode = inlineReplies.filter((r) => r.parentId === node.id);
          // filter out any replies that might already be in children
          const existingIds = new Set(node.children.map((c) => c.id));
          const uniqueReplies = repliesForThisNode.filter((r) => !existingIds.has(r.id));

          node.children = [...node.children, ...uniqueReplies];

          if (node.children.length > 0) {
            injectReplies(node.children);
          }
        }
      };
      injectReplies(allRoots);
    }

    // Apply Sorting to Top-Level Roots
    allRoots.sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOrder === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortOrder === "likes") {
        return b.likesCount - a.likesCount;
      }
      return 0;
    });

    return allRoots;
  }, [
    rawCommentsList,
    pendingComments,
    sortOrder,
    likes,
    edits,
    deletions,
    reports,
    localComments,
    postId,
  ]);

  // Synchronize/Cleanup approved comments from localStorage and context state asynchronously
  useEffect(() => {
    if (isLoading || !rawCommentsList) return;

    // Collect all approved comments text returned by backend
    const approvedCommentsText = new Set<string>();
    interface SimpleNode {
      username?: string | null;
      content: string;
      children?: SimpleNode[] | null;
    }
    const collectApprovedText = (nodes: SimpleNode[]) => {
      for (const node of nodes) {
        approvedCommentsText.add(`${node.username || "Anonymous"}:${node.content}`);
        if (node.children && node.children.length > 0) {
          collectApprovedText(node.children);
        }
      }
    };
    collectApprovedText(rawCommentsList);

    // Identify which local comments have been approved
    const syncedIds: number[] = [];
    for (const c of localComments) {
      const matchKey = `${c.username}:${c.content}`;
      if (approvedCommentsText.has(matchKey)) {
        syncedIds.push(c.id);
      }
    }

    if (syncedIds.length > 0) {
      const timer = setTimeout(() => {
        // Sync simulation store (localStorage)
        for (const id of syncedIds) {
          simulationStore.removeLocalComment(postId, id);
        }
        // Sync context state
        setLocalComments((prev) => prev.filter((c) => !syncedIds.includes(c.id)));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [rawCommentsList, localComments, postId, isLoading, setLocalComments]);

  // Track new comments and trigger notifications
  useEffect(() => {
    if (isLoading) return;
    const currentTotal = enrichedComments.filter((c) => !c.isPending && !c.isFailed).length;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (prevTotalCommentsRef.current > 0 && currentTotal > prevTotalCommentsRef.current) {
      const diff = currentTotal - prevTotalCommentsRef.current;
      timer = setTimeout(() => {
        setNewCommentCount(diff);
      }, 0);
    }
    prevTotalCommentsRef.current = currentTotal;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [enrichedComments, isLoading, setNewCommentCount]);

  // Handle Hash Anchoring (if highlighted ID needs to be visible)
  useEffect(() => {
    if (highlightedCommentId) {
      // Find comment position in the enriched list to auto-expand visibleCount if it's currently truncated
      const idx = enrichedComments.findIndex((c) => {
        // Simple search (check roots first)
        if (c.id === highlightedCommentId) return true;
        // Deep search recursively
        const findInTree = (node: EnhancedComment): boolean => {
          if (node.id === highlightedCommentId) return true;
          return node.children.some(findInTree);
        };
        return findInTree(c);
      });

      if (idx !== -1 && idx >= visibleCount) {
        // Expand visible range to make it visible
        const timer = setTimeout(() => {
          setVisibleCount(Math.ceil((idx + 1) / PAGE_SIZE_STEP) * PAGE_SIZE_STEP);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightedCommentId, enrichedComments, visibleCount]);

  // Load More logic
  const paginatedComments = useMemo(() => {
    return enrichedComments.slice(0, visibleCount);
  }, [enrichedComments, visibleCount]);

  const hasMore = enrichedComments.length > visibleCount;

  const loadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE_STEP);
  };

  const resetVisible = () => {
    setVisibleCount(PAGE_SIZE_STEP);
  };

  const totalComments = commentsPage?.length || 0;

  return {
    comments: paginatedComments,
    allCommentsCount: enrichedComments.length,
    backendTotal: totalComments,
    isLoading,
    isFetching,
    error,
    hasMore,
    loadMore,
    refetch,
    resetVisible,
    addPendingComment,
    removePendingComment,
    markPendingCommentFailed,
    pendingComments,
  };
}
