"use client";

import { toast, Tooltip } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { ReactionButton } from "@/components/ui/reaction-button";
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
  const [override, setOverride] = useState<{
    id: number;
    liked: boolean;
    count: number;
  } | null>(null);
  const inFlight = useRef(false);
  const isLiked = override?.id === article.id ? override.liked : Boolean(article.isLiked);
  const likesCount = override?.id === article.id ? override.count : article.likesCount;
  const isPending = isLiking || isUnliking;
  useReport("like", isPending, report);

  const toggle = (next: boolean) => {
    if (inFlight.current) return false;
    if (!isAuthenticated) {
      dispatch(setLoginOpen(true));
      toast.danger(t("loginToLike"));
      return false;
    }

    const previous = { liked: isLiked, count: likesCount };
    inFlight.current = true;
    setOverride({
      id: article.id,
      liked: next,
      count: Math.max(0, likesCount + (next ? 1 : -1)),
    });
    void (async () => {
      try {
        const interaction = await (next ? like(article.id) : unlike(article.id)).unwrap();
        setOverride({
          id: article.id,
          liked: interaction.liked,
          count: interaction.likesCount,
        });
      } catch {
        setOverride({ id: article.id, ...previous });
        toast.danger(t("loginToLike"));
      } finally {
        inFlight.current = false;
      }
    })();
    return true;
  };

  const label = isLiked ? t("unlike") : t("like");

  return (
    <Tooltip delay={100}>
      <ReactionButton
        size="sm"
        icon="heart"
        selected={isLiked}
        count={likesCount}
        showCount="positive"
        idleVariant="ghost"
        idleColor="inherit"
        selectedVariant="danger-soft"
        selectedColor="danger"
        isPending={isPending}
        label={label}
        onSelectedChange={toggle}
      />
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}
