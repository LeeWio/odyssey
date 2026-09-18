"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useGetNewGuestbookRootsCountQuery,
  useGetNewMomentCommentRootsCountQuery,
  useGetNewPostCommentRootsCountQuery,
  useLazyGetNewGuestbookRootsQuery,
  useLazyGetNewMomentCommentRootsQuery,
  useLazyGetNewPostCommentRootsQuery,
  type CommentResponse,
} from "@/lib/features/comment";
import type { SortOrder } from "../context/comment-context";

const POLL_MS = 60_000;

interface UseCommentFreshnessArgs {
  isGuestbook: boolean;
  isMoment: boolean;
  postId: number;
  momentId: number;
  sortOrder: SortOrder;
  newestSeenId?: number;
  onPrefetchRoots: (roots: CommentResponse[]) => void;
}

export function useCommentFreshness({
  isGuestbook,
  isMoment,
  postId,
  momentId,
  sortOrder,
  newestSeenId,
  onPrefetchRoots,
}: UseCommentFreshnessArgs) {
  const enabled = sortOrder === "newest" && (isGuestbook || (isMoment ? momentId > 0 : postId > 0));
  const baselineKey = `${isGuestbook ? "guestbook" : isMoment ? `moment:${momentId}` : `post:${postId}`}:${sortOrder}`;
  const [baselineByKey, setBaselineByKey] = useState<Record<string, number | undefined>>({});
  const [isLoadingNew, setIsLoadingNew] = useState(false);

  const afterId = useMemo(() => {
    const stored = baselineByKey[baselineKey];
    if (stored == null) return newestSeenId;
    if (newestSeenId == null) return stored;
    return Math.max(stored, newestSeenId);
  }, [baselineByKey, baselineKey, newestSeenId]);

  const postCountResult = useGetNewPostCommentRootsCountQuery(
    { postId, afterId },
    {
      skip: !enabled || isGuestbook || isMoment || afterId == null,
      pollingInterval: POLL_MS,
      refetchOnFocus: true,
    }
  );
  const momentCountResult = useGetNewMomentCommentRootsCountQuery(
    { momentId, afterId },
    {
      skip: !enabled || !isMoment || afterId == null,
      pollingInterval: POLL_MS,
      refetchOnFocus: true,
    }
  );
  const guestbookCountResult = useGetNewGuestbookRootsCountQuery(
    { afterId },
    {
      skip: !enabled || !isGuestbook || afterId == null,
      pollingInterval: POLL_MS,
      refetchOnFocus: true,
    }
  );

  const [loadPostNew] = useLazyGetNewPostCommentRootsQuery();
  const [loadMomentNew] = useLazyGetNewMomentCommentRootsQuery();
  const [loadGuestbookNew] = useLazyGetNewGuestbookRootsQuery();

  const newCount = Math.max(
    0,
    (isGuestbook
      ? guestbookCountResult.data
      : isMoment
        ? momentCountResult.data
        : postCountResult.data) ?? 0
  );

  const loadNewComments = useCallback(async () => {
    if (!enabled || afterId == null || newCount <= 0) return;
    setIsLoadingNew(true);
    try {
      const size = Math.min(50, Math.max(newCount, 20));
      const result = isGuestbook
        ? await loadGuestbookNew({ afterId, size }).unwrap()
        : isMoment
          ? await loadMomentNew({ momentId, afterId, size }).unwrap()
          : await loadPostNew({ postId, afterId, size }).unwrap();
      onPrefetchRoots(result.list);
      const maxIncoming = result.list.reduce(
        (maxId, comment) => (comment.id > maxId ? comment.id : maxId),
        afterId
      );
      setBaselineByKey((previous) => ({ ...previous, [baselineKey]: maxIncoming }));
    } finally {
      setIsLoadingNew(false);
    }
  }, [
    afterId,
    baselineKey,
    enabled,
    isGuestbook,
    isMoment,
    loadGuestbookNew,
    loadMomentNew,
    loadPostNew,
    momentId,
    newCount,
    onPrefetchRoots,
    postId,
  ]);

  return {
    newCount: enabled ? newCount : 0,
    isLoadingNew,
    loadNewComments,
  };
}
