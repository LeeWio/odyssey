"use client";

import { Button, Popover, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { CreateCollectionDialog } from "@/features/library/create-collection-dialog";
import { ReadingListButton } from "@/features/library/reading-list-button";
import { selectCurrentUser, selectIsAuthenticated } from "@/lib/features/auth";
import { useAddPostToCollectionMutation, useGetPostCollectionsQuery } from "@/lib/features/library";
import { useAppSelector } from "@/lib/hooks";

import type { Target } from "./target";
import { useReport, type Report } from "./use-engagement";

export function CollectionMenu({
  article,
  isRefreshing = false,
  report,
}: {
  article: Target;
  isRefreshing?: boolean;
  report: Report;
}) {
  const t = useTranslations("Article");
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const collections = useGetPostCollectionsQuery(undefined, { skip: !isAuthenticated });
  const [addPost] = useAddPostToCollectionMutation();
  useReport("collections", isOpen || isCreating || pendingId !== null, report);

  const save = async (collectionId: number) => {
    setPendingId(collectionId);
    try {
      await addPost({ collectionId, postId: article.id }).unwrap();
    } catch {
      // The mutation displays its own failure toast.
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button aria-label={t("moreActions")} size="sm" variant="ghost">
          <Icon className="size-4" icon="gravity-ui:ellipsis" />
        </Button>
        <Popover.Content placement="top">
          <Popover.Dialog>
            <Popover.Heading>{t("moreActionsTitle")}</Popover.Heading>
            <div className="mt-3">
              <ReadingListButton
                isRefreshing={isRefreshing}
                isSaved={Boolean(article.isInReadingList)}
                postId={article.id}
              />
            </div>
            {isAuthenticated ? (
              <div className="mt-3 flex flex-col gap-1">
                <Typography className="px-2 py-1" color="muted" type="body-xs">
                  {t("saveToCollection")}
                </Typography>
                {collections.isLoading ? (
                  <Typography className="px-2 py-2" color="muted" type="body-sm">
                    {t("loadingCollections")}
                  </Typography>
                ) : (
                  <>
                    <Button fullWidth variant="ghost" onPress={() => setIsCreating(true)}>
                      {(collections.data?.length ?? 0) > 0
                        ? t("newCollection")
                        : t("createCollection")}
                    </Button>
                    {collections.data?.slice(0, 5).map((collection) => (
                      <Button
                        key={collection.id}
                        fullWidth
                        isPending={pendingId === collection.id}
                        variant="ghost"
                        onPress={() => void save(collection.id)}
                      >
                        <span className="min-w-0 flex-1 truncate text-left">{collection.name}</span>
                        <span className="text-muted text-xs tabular-nums">
                          {collection.itemCount}
                        </span>
                      </Button>
                    ))}
                  </>
                )}
              </div>
            ) : null}
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      {isCreating && isAuthenticated ? (
        <CreateCollectionDialog
          key={`${article.slug}:${article.id}:${username ?? "guest"}`}
          postId={article.id}
          onClose={() => setIsCreating(false)}
        />
      ) : null}
    </>
  );
}
