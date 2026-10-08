"use client";

import { Icon } from "@iconify/react";
import { Button, Spinner, Tooltip } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

import { selectCurrentUser, selectIsAuthenticated } from "@/lib/features/auth";
import {
  useAddToReadingListMutation,
  useRemoveFromReadingListMutation,
} from "@/lib/features/library";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

interface ReadingListButtonProps {
  postId: number;
  isSaved: boolean;
  isRefreshing?: boolean;
}

export function ReadingListButton(props: ReadingListButtonProps) {
  const username = useAppSelector(selectCurrentUser);
  return <ReadingListAction key={`${username ?? "guest"}:${props.postId}`} {...props} />;
}

function ReadingListAction({ postId, isSaved, isRefreshing = false }: ReadingListButtonProps) {
  const t = useTranslations("Article");
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const inFlight = useRef(false);
  const [add, { isLoading: isAdding }] = useAddToReadingListMutation();
  const [remove, { isLoading: isRemoving }] = useRemoveFromReadingListMutation();
  const saved = isAuthenticated && isSaved;
  const pending = isAdding || isRemoving;
  const busy = pending || (isAuthenticated && isRefreshing);
  const label = saved ? t("savedForLater") : t("saveForLater");

  const toggle = async () => {
    if (!isAuthenticated) {
      dispatch(setLoginOpen(true));
      return;
    }
    if (inFlight.current || pending || isRefreshing) return;
    inFlight.current = true;
    try {
      await (saved ? remove(postId) : add(postId)).unwrap();
    } catch {
      // API mutations own feedback; keep displaying the authoritative server state.
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <Tooltip>
      <Button
        isIconOnly
        aria-label={label}
        aria-pressed={saved}
        aria-busy={busy}
        isDisabled={busy}
        onPress={() => void toggle()}
        size="sm"
        variant={saved ? "secondary" : "ghost"}
      >
        {pending ? (
          <Spinner color="current" size="sm" />
        ) : (
          <Icon
            aria-hidden="true"
            icon="lucide:bookmark"
            className={saved ? "size-4 fill-current" : "size-4"}
          />
        )}
      </Button>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}
