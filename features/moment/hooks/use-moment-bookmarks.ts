"use client";

import { skipToken } from "@reduxjs/toolkit/query";
import { toast } from "@heroui/react";
import { useTranslations } from "next-intl";

import { selectCurrentUser, selectIsAuthenticated } from "@/lib/features/auth";
import {
  momentBookmarkApi,
  useGetSavedMomentIdsQuery,
} from "@/lib/features/moment/moment-bookmark-api";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppSelector, useAppStore } from "@/lib/hooks";

export function useMomentBookmarkAccount() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
  return isAuthenticated ? username : null;
}

export function useMomentBookmark(id: number | undefined) {
  const username = useMomentBookmarkAccount();
  const store = useAppStore();
  const t = useTranslations("Moments");
  const key = JSON.stringify([username, id]);
  const { saveMomentBookmark, removeMomentBookmark } = momentBookmarkApi.endpoints;
  const saveRequest = saveMomentBookmark.select(key);
  const removeRequest = removeMomentBookmark.select(key);

  const isPending = useAppSelector(
    (state) => saveRequest(state).isLoading || removeRequest(state).isLoading
  );
  const { isBookmarked, isReady, isFetching, refetch } = useGetSavedMomentIdsQuery(
    username && id !== undefined ? username : skipToken,
    {
      refetchOnFocus: true,
      refetchOnMountOrArgChange: 60,
      selectFromResult: ({ currentData, isFetching }) => ({
        isBookmarked: id !== undefined && (currentData?.includes(id) ?? false),
        isReady: currentData !== undefined,
        isFetching,
      }),
    }
  );

  const toggleBookmark = (saved: boolean) => {
    if (id === undefined) return false;
    if (!username) {
      store.dispatch(setLoginOpen(true));
      return false;
    }
    const state = store.getState();
    if (
      state.auth.username !== username ||
      saveRequest(state).isLoading ||
      removeRequest(state).isLoading
    ) {
      return false;
    }
    if (!isReady) {
      void refetch()
        .unwrap()
        .catch(() => toast.danger(t("bookmarkSyncFailed")));
      return false;
    }

    // Update just this ID, so a failed write cannot roll back a concurrent change to another card.
    const patch = (value: boolean) =>
      store.dispatch(
        momentBookmarkApi.util.updateQueryData("getSavedMomentIds", username, (ids) => {
          const index = ids.indexOf(id);
          if (value && index === -1) ids.push(id);
          if (!value && index >= 0) ids.splice(index, 1);
        })
      );

    patch(saved);
    const endpoint = saved ? saveMomentBookmark : removeMomentBookmark;
    const request = store.dispatch(endpoint.initiate({ username, id }, { fixedCacheKey: key }));
    void request
      .unwrap()
      .catch(() => {
        if (store.getState().auth.username !== username) return;
        patch(!saved);
        toast.danger(t("bookmarkUpdateFailed"));
      })
      .finally(() => request.reset());
    return true;
  };

  return { isBookmarked, isPending: isPending || (!isReady && isFetching), toggleBookmark };
}
