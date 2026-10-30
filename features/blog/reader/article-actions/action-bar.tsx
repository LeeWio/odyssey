"use client";

import { ActionBar as Bar } from "@heroui-pro/react";
import { Separator } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRef, useState, type RefObject } from "react";

import { ReadingListButton } from "@/features/library/reading-list-button";

import { CollectionMenu } from "./collection-menu";
import { CommentAction } from "./comment-action";
import { LikeAction } from "./like-action";
import { BackAction, LibraryAction, ProgressAction } from "./navigation";
import { OutlineAction } from "./outline-action";
import { ShareAction } from "./share-action";
import type { Target } from "./target";
import { useEngagement } from "./use-engagement";
import { useVisibility } from "./use-visibility";

export function ArticleActionBar({
  article,
  articleEndRef,
  isRefreshing = false,
}: {
  article: Target;
  articleEndRef: RefObject<HTMLElement | null>;
  isRefreshing?: boolean;
}) {
  const t = useTranslations("Article");
  const rootRef = useRef<HTMLDivElement>(null);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const { isEngaged, report } = useEngagement();
  const { isOpen, progress } = useVisibility({
    actionBarRef: rootRef,
    articleEndRef,
    isEngaged: isEngaged || isRefreshing,
    isFocusWithin,
  });

  return (
    <div
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsFocusWithin(false);
      }}
      onFocus={() => setIsFocusWithin(true)}
    >
      <Bar aria-label={t("controls")} isOpen={isOpen}>
        <Bar.Prefix>
          <BackAction />
        </Bar.Prefix>
        <Separator orientation="vertical" />
        <Bar.Content>
          <OutlineAction report={report} />
          <LikeAction article={article} report={report} />
          <ReadingListButton
            isRefreshing={isRefreshing}
            isSaved={Boolean(article.isInReadingList)}
            postId={article.id}
          />
          <ShareAction article={article} report={report} />
          <LibraryAction />
          <CommentAction postId={article.id} report={report} />
          <CollectionMenu article={article} report={report} />
        </Bar.Content>
        <Separator orientation="vertical" />
        <Bar.Suffix>
          <ProgressAction progress={progress} />
        </Bar.Suffix>
      </Bar>
    </div>
  );
}
