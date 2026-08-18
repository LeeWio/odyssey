import { useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAuthenticated } from "@/lib/features/auth";
import {
  useLikeMomentMutation,
  useUnlikeMomentMutation,
  useGetLikedMomentIdsQuery,
} from "@/lib/features/moment";
import { toast } from "@heroui/react";

export const useMomentLike = (momentId?: number, initialLikesCount: number = 0) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [likeMoment] = useLikeMomentMutation();
  const [unlikeMoment] = useUnlikeMomentMutation();
  const [isLiking, setIsLiking] = useState(false);

  const likedMomentsQuery = useGetLikedMomentIdsQuery([momentId ?? 0], {
    skip: !isAuthenticated || !momentId,
  });
  const isServerLiked = likedMomentsQuery.data?.includes(momentId ?? 0) ?? false;

  const [localLikeOverride, setLocalLikeOverride] = useState<boolean | null>(null);
  const isLiked = localLikeOverride !== null ? localLikeOverride : isServerLiked;

  const [localLikesCountOverride, setLocalLikesCountOverride] = useState<number | null>(null);
  const likesCount = localLikesCountOverride !== null ? localLikesCountOverride : initialLikesCount;

  // Sync state if parent moment changes (official React derived state pattern to avoid useEffect cascades)
  const [prevMomentId, setPrevMomentId] = useState<number | undefined>(momentId);
  if (momentId !== prevMomentId) {
    setPrevMomentId(momentId);
    setLocalLikeOverride(null);
    setLocalLikesCountOverride(null);
  }

  const toggleLike = async () => {
    if (!momentId) return;
    if (!isAuthenticated) {
      toast.warning("Sign in to like moments.");
      return;
    }
    if (isLiking) return;

    const nextLiked = !isLiked;
    const nextLikesCount = likesCount + (nextLiked ? 1 : -1);

    setLocalLikeOverride(nextLiked);
    setLocalLikesCountOverride(nextLikesCount);
    setIsLiking(true);

    try {
      if (nextLiked) {
        await likeMoment(momentId).unwrap();
      } else {
        await unlikeMoment(momentId).unwrap();
      }
    } catch {
      // rollback
      setLocalLikeOverride(null);
      setLocalLikesCountOverride(null);
    } finally {
      setIsLiking(false);
    }
  };

  return {
    isLiked,
    likesCount,
    isLiking,
    toggleLike,
  };
};
