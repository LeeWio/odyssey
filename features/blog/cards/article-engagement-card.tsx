"use client";

import { Button, Card, Form, Input, Link, TextField, Tooltip, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import Grainient from "@/components/background/grainient";
import { useLikePostMutation, useUnlikePostMutation } from "@/features/blog/api/blog-api";
import { setLoginOpen } from "@/lib/features/ui";
import { usePublishCommentMutation } from "@/lib/features/comment";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { Icon } from "@iconify/react";

export interface ArticleEngagementCardPost {
  id?: number;
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  commentsCount?: number;
  likesCount?: number;
}

function getGrainientProps(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash >>>= 0;

  return {
    blendAngle: (hash % 300) - 150,
    grainAmount: 0,
    grainAnimated: false,
    rotationAmount: 240 + ((hash % 11) / 11) * 460,
    timeSpeed: 0.1 + ((hash % 5) / 5) * 0.07,
    warpFrequency: 3.5 + ((hash % 9) / 9) * 4,
    warpSpeed: 1 + ((hash % 7) / 7) * 1.4,
    warpStrength: 0.75 + ((hash % 8) / 8) * 1.1,
    zoom: 0.78 + ((hash % 5) / 5) * 0.3,
  };
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `article-comment-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ArticleEngagementCard({ post }: { post: ArticleEngagementCardPost }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [likePost, { isLoading: isLiking }] = useLikePostMutation();
  const [unlikePost, { isLoading: isUnliking }] = useUnlikePostMutation();
  const [publishComment, { isLoading: isPublishingComment }] = usePublishCommentMutation();
  const [comment, setComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? 0);

  const title = post.title?.trim() || "Untitled story";
  const href = post.slug ? `/single/${post.slug}` : "/single";
  const canInteract = Boolean(post.id);

  const requestAuthentication = () => {
    toast.warning("Sign in to join the conversation.");
    dispatch(setLoginOpen(true));
  };

  const handleLike = async () => {
    if (!post.id) return;
    if (!isAuthenticated) {
      requestAuthentication();
      return;
    }

    try {
      const interaction = await (isLiked ? unlikePost(post.id) : likePost(post.id)).unwrap();
      setIsLiked(interaction.liked);
      setLikesCount(interaction.likesCount);
    } catch {
      toast.danger("Couldn't update your reaction. Try again in a moment.");
    }
  };

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = comment.trim();
    if (!content || !post.id) return;
    if (!isAuthenticated) {
      requestAuthentication();
      return;
    }

    try {
      await publishComment({
        content,
        idempotencyKey: createIdempotencyKey(),
        postId: post.id,
      }).unwrap();
      setComment("");
    } catch {
      // The shared mutation already surfaces the API error through HeroUI toast.
    }
  };

  return (
    <Card
      className="relative mx-auto flex w-full max-w-2xs flex-col"
      role="article"
      variant="default"
    >
      <div className="relative">
        <div className="relative aspect-4/3 overflow-hidden rounded-2xl">
          <Grainient {...getGrainientProps(post.slug || title)} className="absolute inset-0" />
        </div>

        <div className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 translate-y-1/2 items-center gap-3">
          <Button
            aria-label={isLiked ? "Unlike article" : "Like article"}
            isDisabled={!canInteract}
            isPending={isLiking || isUnliking}
            onPress={() => void handleLike()}
            variant="secondary"
            size="lg"
          >
            <Icon icon="gravity-ui:heart-fill" aria-hidden="true" className="text-danger" />
            <span className="tabular-nums">{likesCount.toLocaleString("en-US")}</span>
          </Button>
          <Button
            aria-label="Open article comments"
            onPress={() => router.push(`${href}?comments=1`)}
            variant="secondary"
            size="lg"
          >
            <Icon icon="gravity-ui:comment-fill" aria-hidden="true" className="text-warning" />
            <span className="tabular-nums">
              {(post.commentsCount ?? 0).toLocaleString("en-US")}
            </span>
          </Button>
        </div>
      </div>

      <Card.Header className="mt-8">
        <Link className="w-fit no-underline" href={href}>
          <Card.Title className="line-clamp-1 text-2xl tracking-[-0.03em]">{title}</Card.Title>
        </Link>
      </Card.Header>

      <Card.Content>
        <Card.Description className="line-clamp-3 leading-relaxed">
          {post.summary?.trim() || "A note from the archive."}
        </Card.Description>
      </Card.Content>

      <Card.Footer>
        <Form
          aria-label={`Leave a comment on ${title}`}
          className="flex w-full items-center gap-2"
          onSubmit={(event) => void handleCommentSubmit(event)}
        >
          <TextField
            fullWidth
            aria-label="Leave a comment"
            isDisabled={!canInteract || isPublishingComment}
            name="comment"
            onChange={setComment}
            value={comment}
          >
            <Input maxLength={1000} placeholder="Leave a comment..." variant="secondary" />
          </TextField>
          <Tooltip delay={0}>
            <Button
              aria-label="Post comment"
              isDisabled={!comment.trim() || !canInteract}
              isIconOnly
              isPending={isPublishingComment}
              type="submit"
            >
              <Icon icon="gravity-ui:paper-plane" aria-hidden="true" />
            </Button>
            <Tooltip.Content>Post comment</Tooltip.Content>
          </Tooltip>
        </Form>
      </Card.Footer>
    </Card>
  );
}
