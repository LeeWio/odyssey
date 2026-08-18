"use client";

import { useState, useMemo } from "react";
import { Card, Skeleton, toast } from "@heroui/react";
import type { JSONContent } from "@tiptap/core";

import { useAppSelector } from "@/lib/hooks";
import { selectIsAuthenticated, selectIsAdmin } from "@/lib/features/auth";
import { useGetCurrentUserQuery } from "@/lib/features/user/user-api";
import {
  type MomentResponse,
  useGetPublicMomentsQuery,
  useDeleteMomentMutation,
} from "@/lib/features/moment";
import { formatRelativeTime } from "@/lib/relative-time";

import { parseMomentContent } from "../../utils/content-parser";
import { useMomentLike } from "../../hooks/use-moment-like";
import { CardHeader } from "./card-header";
import { CardContent } from "./card-content";
import { CardFooter } from "./card-footer";
import { CarouselModal } from "../gallery/carousel-modal";

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
}

export const MomentCard = ({ moment: propMoment, isLoading: propIsLoading }: MomentCardProps) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
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

  const authorName = currentUser?.nickname || currentUser?.username || "wei.li";
  const authorAvatar =
    currentUser?.avatar || "https://img.heroui.chat/image/avatar?w=400&h=400&u=3";
  const fallbackInitial = authorName.slice(0, 2).toUpperCase();

  const [deleteMoment] = useDeleteMomentMutation();
  const [isDeleting, setIsDeleting] = useState(false);

  // Gallery view Modal state
  const [activeImageIndex, setActiveIndex] = useState<number | null>(null);

  // Likes hook
  const { isLiked, likesCount, isLiking, toggleLike } = useMomentLike(
    moment?.id,
    moment?.likesCount
  );

  const handleDelete = async () => {
    if (!moment?.id) return;
    if (confirm("Are you sure you want to delete this moment?")) {
      setIsDeleting(true);
      try {
        await deleteMoment(moment.id).unwrap();
        toast.success("Moment deleted successfully.");
      } catch (err) {
        console.error("Failed to delete moment:", err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Content parsing
  const parsedContent = useMemo(() => {
    if (!moment) return defaultContent;
    return parseMomentContent(moment.content);
  }, [moment]);

  // Image URLs and structural formatting for Carousel Modal
  const imageUrls = useMemo(() => {
    return moment?.images?.map((img) => img.fileUrl) || [];
  }, [moment]);

  const carouselImages = useMemo(() => {
    return (
      moment?.images?.map((img) => ({
        src: img.fileUrl,
        alt: img.altText || "Moment Image",
      })) || []
    );
  }, [moment]);

  if (isLoading) {
    return <MomentCardSkeleton />;
  }

  const timeLabel = moment ? formatRelativeTime(moment.createdAt) : "Recently";

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
        onDelete={moment?.id ? handleDelete : undefined}
      />

      {/* 2. Card Content */}
      <CardContent
        momentId={moment?.id ?? "default"}
        parsedContent={parsedContent}
        imageUrls={imageUrls}
        onCardClick={setActiveIndex}
      />

      {/* 3. Card Footer */}
      <CardFooter
        isLiked={isLiked}
        isLiking={isLiking}
        likesCount={likesCount}
        onLikeToggle={toggleLike}
      />

      {/* 4. Shared Photo Carousel Modal */}
      {carouselImages.length > 0 && (
        <CarouselModal
          images={carouselImages}
          activeIndex={activeImageIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
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
