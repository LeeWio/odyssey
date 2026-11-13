import { useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { selectCurrentUser, selectIsAuthenticated } from "@/lib/features/auth";
import {
  useLikeMomentMutation,
  useUnlikeMomentMutation,
  useGetLikedMomentIdsQuery,
} from "@/lib/features/moment";
import { setLoginOpen } from "@/lib/features/ui";

export const useMomentLike = (
  momentId?: number,
  initialLikesCount: number = 0,
  knownLikedMomentIds?: number[]
) => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
  const [likeMoment] = useLikeMomentMutation();
  const [unlikeMoment] = useUnlikeMomentMutation();
  const inFlight = useRef(new Set<string>());
  const scope = JSON.stringify([momentId, isAuthenticated, username]);
  const [override, setOverride] = useState<{
    scope: string;
    liked: boolean;
    count: number;
    pending: boolean;
    request: symbol;
  } | null>(null);

  const likedMomentsQuery = useGetLikedMomentIdsQuery([momentId ?? 0], {
    skip: !isAuthenticated || !momentId || knownLikedMomentIds !== undefined,
  });
  const isServerLiked =
    knownLikedMomentIds?.includes(momentId ?? 0) ??
    likedMomentsQuery.data?.includes(momentId ?? 0) ??
    false;

  const current = override?.scope === scope ? override : null;
  const isLiked = isAuthenticated && (current?.liked ?? isServerLiked);
  const likesCount = current?.count ?? initialLikesCount;
  const isLiking = current?.pending ?? false;

  const toggleLike = () => {
    if (!momentId) return false;
    if (!isAuthenticated) {
      dispatch(setLoginOpen(true));
      return false;
    }
    if (inFlight.current.has(scope)) return false;

    const nextLiked = !isLiked;
    const nextLikesCount = Math.max(0, likesCount + (nextLiked ? 1 : -1));
    const request = Symbol();
    inFlight.current.add(scope);
    setOverride({ scope, liked: nextLiked, count: nextLikesCount, pending: true, request });

    // Accept synchronously; presentation follows the optimistic state, not request completion.
    void (async () => {
      try {
        await (nextLiked ? likeMoment(momentId) : unlikeMoment(momentId)).unwrap();
      } catch {
        setOverride((value) =>
          value?.request === request ? { ...value, liked: isLiked, count: likesCount } : value
        );
      } finally {
        inFlight.current.delete(scope);
        setOverride((value) => (value?.request === request ? { ...value, pending: false } : value));
      }
    })();
    return true;
  };

  return {
    isLiked,
    likesCount,
    isLiking,
    toggleLike,
  };
};
