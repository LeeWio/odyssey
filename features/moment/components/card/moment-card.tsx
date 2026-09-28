"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, Skeleton, toast, AlertDialog, Button, Typography } from "@heroui/react";
import type { JSONContent } from "@tiptap/core";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { selectCurrentUser, selectIsAuthenticated, selectIsAdmin } from "@/lib/features/auth";
import { readMomentBookmarks, toggleMomentBookmark } from "@/lib/features/moment";
import { setLoginOpen } from "@/lib/features/ui";
import { useGetCurrentUserQuery } from "@/lib/features/user/user-api";
import {
  type MomentResponse,
  useGetPublicMomentsQuery,
  useDeleteMomentMutation,
} from "@/lib/features/moment";
import { useRelativeTime } from "@/lib/relative-time";
import { useTranslations } from "next-intl";

import { parseMomentContent } from "../../utils/content-parser";
import { useMomentLike } from "../../hooks/use-moment-like";
import { CardHeader } from "./card-header";
import { CardContent } from "./card-content";
import { CardFooter } from "./card-footer";

const CommentSheet = dynamic(() => import("@/components/comment").then((mod) => mod.CommentSheet), {
  ssr: false,
});

const CarouselModal = dynamic(
  () => import("../gallery/carousel-modal").then((mod) => mod.CarouselModal),
  { ssr: false }
);

// Default content for fallback
const defaultContent: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Took a quiet walk after work and ended up taking way too many photos of light, shadows, and empty streets. Nothing special, but somehow these small moments stayed with me.",
        },
      ],
    },
  ],
};

interface MomentCardProps {
  moment?: MomentResponse;
  isLoading?: boolean;
  enableComments?: boolean;
}

export const MomentCard = ({
  moment: propMoment,
  isLoading: propIsLoading,
  enableComments = true,
}: MomentCardProps) => {
  const formatRelativeTime = useRelativeTime();
  const t = useTranslations("Moments");
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
  const isAdmin = useAppSelector(selectIsAdmin);

  // If no propMoment is passed, fetch the latest public moment (Self-fetching mode)
  const { data, isLoading: isQueryLoading } = useGetPublicMomentsQuery(
    { page: 0, size: 1 },
    { skip: !!propMoment }
  );

  const isLoading = propMoment ? propIsLoading : isQueryLoading;
  const moment = propMoment || data?.list?.[0];

  // User details for fallback / current logged-in user
  const { data: currentUser } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
  });

  // 1. Resolve base author details from the moment payload
  const baseAuthorName = moment?.authorName || "wei.li";
  const baseAuthorAvatar =
    moment?.authorAvatar || "https://img.heroui.chat/image/avatar?w=400&h=400&u=3";

  // 2. Real-time session enhancement: Use viewer's latest session data if the viewer is the author
  const isViewerTheAuthor =
    currentUser &&
    (currentUser.username === baseAuthorName || currentUser.nickname === baseAuthorName);

  const authorName = isViewerTheAuthor
    ? currentUser.nickname || currentUser.username || baseAuthorName
    : baseAuthorName;

  const authorAvatar = isViewerTheAuthor
    ? currentUser.avatar || baseAuthorAvatar
    : baseAuthorAvatar;

  const fallbackInitial = authorName.slice(0, 2).toUpperCase();

  const [deleteMoment] = useDeleteMomentMutation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Gallery view Modal state
  const [activeImageIndex, setActiveIndex] = useState<number | null>(null);
  const [hasOpenedCarousel, setHasOpenedCarousel] = useState(false);

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  if (activeImageIndex !== null && !hasOpenedCarousel) {
    setHasOpenedCarousel(true);
  }

  // Bookmarking state
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Likes hook
  const { isLiked, likesCount, isLiking, toggleLike } = useMomentLike(
    moment?.id,
    moment?.likesCount
  );

  useEffect(() => {
    if (!moment?.id) return;
    const bookmarks = readMomentBookmarks(isAuthenticated ? username : null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsBookmarked(bookmarks.includes(moment.id));
  }, [isAuthenticated, moment?.id, username]);

  const handleBookmarkToggle = () => {
    if (!moment?.id) return;
    if (!isAuthenticated || !username) {
      dispatch(setLoginOpen(true));
      return;
    }
    setIsBookmarked(toggleMomentBookmark(username, moment.id));
  };

  const handleDeleteConfirm = async () => {
    if (!moment?.id) return;
    setIsDeleting(true);
    try {
      await deleteMoment(moment.id).unwrap();
      toast.success(t("deleted"));
      setIsDeleteDialogOpen(false);
    } catch (err) {
      toast.danger(getApiErrorMessage(err, t("deleteFailed")));
    } finally {
      setIsDeleting(false);
    }
  };

  // Content and widget parsing
  const { parsedContent, stockSymbol } = useMemo(() => {
    if (!moment) return { parsedContent: defaultContent };
    return {
      parsedContent: parseMomentContent(moment.content),
      stockSymbol: moment.stockSymbol || undefined,
    };
  }, [moment]);

  // Image URLs and structural formatting for Carousel Modal
  const imageUrls = useMemo(() => {
    return moment?.images?.slice(0, 8).map((img) => img.fileUrl) || [];
  }, [moment]);

  const carouselImages = useMemo(() => {
    return (
      moment?.images?.slice(0, 8).map((img) => ({
        src: img.fileUrl,
        alt: img.altText || t("imageAlt"),
      })) || []
    );
  }, [moment, t]);

  if (isLoading) {
    return <MomentCardSkeleton />;
  }

  const timeLabel = moment ? formatRelativeTime(moment.createdAt) : t("recently");

  return (
    <Card className="w-full" variant="default">
      {/* 1. Card Header */}
      <CardHeader
        authorName={authorName}
        authorAvatar={authorAvatar}
        fallbackInitial={fallbackInitial}
        timeLabel={timeLabel}
        isAdmin={isAdmin}
        isDeleting={isDeleting}
        onDelete={moment?.id ? () => setIsDeleteDialogOpen(true) : undefined}
      />

      {/* 2. Card Content */}
      <CardContent
        momentId={moment?.id ?? "default"}
        parsedContent={parsedContent}
        imageUrls={imageUrls}
        topics={moment?.topics ?? []}
        onCardClick={setActiveIndex}
        stockSymbol={stockSymbol}
      />

      {/* 3. Card Footer */}
      <CardFooter
        isLiked={isLiked}
        isLiking={isLiking}
        likesCount={likesCount}
        commentsCount={enableComments ? (moment?.commentsCount ?? 0) : undefined}
        onLikeToggle={toggleLike}
        isCommentsOpen={isCommentsOpen}
        onCommentToggle={
          enableComments && moment?.id ? () => setIsCommentsOpen((open) => !open) : undefined
        }
        isBookmarked={isBookmarked}
        onBookmarkToggle={handleBookmarkToggle}
      />

      {enableComments && isCommentsOpen && moment?.id ? (
        <CommentSheet
          isOpen={isCommentsOpen}
          momentId={moment.id}
          onOpenChange={setIsCommentsOpen}
        />
      ) : null}

      {/* Shared Photo Carousel Modal — load only after first open */}
      {hasOpenedCarousel && carouselImages.length > 0 ? (
        <CarouselModal
          images={carouselImages}
          activeIndex={activeImageIndex}
          onClose={() => setActiveIndex(null)}
        />
      ) : null}

      {/* 6. Delete Confirmation AlertDialog */}
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          variant="blur"
        >
          <AlertDialog.Container size="xs">
            <AlertDialog.Dialog className="max-w-[calc(100vw-32px)] sm:max-w-md">
              <AlertDialog.Header className="mx-auto flex flex-row">
                <Icon
                  icon="gravity-ui:trash-bin"
                  className="text-danger drop-shadow-danger size-28 sm:size-32 md:size-36"
                />
              </AlertDialog.Header>
              <AlertDialog.Body className="mt-6 flex flex-col gap-2">
                <Typography type="h5" align="center" weight="bold">
                  {t("deleteTitle")}
                </Typography>

                <Typography type="body-sm" color="muted" align="center">
                  {t("deleteDescription")}
                </Typography>
              </AlertDialog.Body>
              <AlertDialog.Footer className="flex justify-end gap-2">
                <Button
                  fullWidth
                  variant="danger"
                  onPress={handleDeleteConfirm}
                  isPending={isDeleting}
                >
                  {t("delete")}
                </Button>
                <Button fullWidth variant="secondary" onPress={() => setIsDeleteDialogOpen(false)}>
                  {t("cancel")}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </Card>
  );
};

export const MomentCardSkeleton = () => {
  return (
    <Card className="w-full" variant="default">
      <Card.Header className="flex flex-row items-center justify-between">
        <div className="flex min-w-0 flex-row items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <Skeleton className="h-4 w-20 rounded-lg" />
            <Skeleton className="h-3 w-12 rounded-lg" />
          </div>
        </div>
        <Skeleton className="size-8 rounded-lg" />
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        <Skeleton className="h-4.5 w-full rounded-lg" />
        <Skeleton className="h-4.5 w-5/6 rounded-lg" />
        <Skeleton className="h-4.5 w-2/3 rounded-lg" />
      </Card.Content>
      <Card.Footer className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-1">
          <Skeleton className="h-8 w-14 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </Card.Footer>
    </Card>
  );
};
