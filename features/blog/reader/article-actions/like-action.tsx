"use client";

import { Button, toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { selectIsAuthenticated } from "@/lib/features/auth";
import { useLikePostMutation, useUnlikePostMutation } from "@/lib/features/post";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

import type { Target } from "./target";
import { useReport, type Report } from "./use-engagement";

export function LikeAction({ article, report }: { article: Target; report: Report }) {
  const t = useTranslations("Article");
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [like, { isLoading: isLiking }] = useLikePostMutation();
  const [unlike, { isLoading: isUnliking }] = useUnlikePostMutation();
  const isLiked = Boolean(article.isLiked);
  const isPending = isLiking || isUnliking;
  useReport("like", isPending, report);

  const toggle = async () => {
    if (!isAuthenticated) {
      dispatch(setLoginOpen(true));
      toast.danger(t("loginToLike"));
      return;
    }

    try {
      await (isLiked ? unlike(article.id) : like(article.id)).unwrap();
    } catch {
      toast.danger(t("loginToLike"));
    }
  };

  return (
    <Button
      aria-label={isLiked ? t("unlike") : t("like")}
      isPending={isPending}
      size="sm"
      variant={isLiked ? "danger-soft" : "ghost"}
      onPress={() => void toggle()}
    >
      <Icon icon={isLiked ? "gravity-ui:heart-fill" : "gravity-ui:heart"} />
      <span className="action-bar__label tabular-nums">{article.likesCount}</span>
    </Button>
  );
}
