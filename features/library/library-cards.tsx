"use client";

import {
  Button,
  Card,
  Chip,
  Link,
  ProgressBar,
  Skeleton,
  Tooltip,
  Typography,
} from "@heroui/react";
import { Icon } from "@iconify/react";

import { getSmartColorTone, SmartColorSurface } from "@/components/background/smart-color-surface";
import type {
  FavoritePostResponse,
  PostCollectionResponse,
  RecommendedPostResponse,
  ReadingHistoryResponse,
} from "@/lib/features/library";
import type { PostDigestResponse } from "@/lib/features/post";
import { getReadingPositionHref } from "@/lib/reading-position";
import { useRelativeTime } from "@/lib/relative-time";

import { formatDate } from "./library-format";

export function LibraryPostVisual({ post }: { post: PostDigestResponse }) {
  return (
    <SmartColorSurface
      className="h-full"
      seed={`library-${post.slug}`}
      tone={getSmartColorTone({ categoryName: post.category?.name, title: post.title })}
    >
      <div aria-hidden="true" className="aspect-[16/10] w-full" />
    </SmartColorSurface>
  );
}

export function RecommendedCard({
  entry,
  isHiding,
  onHide,
}: {
  entry: RecommendedPostResponse;
  isHiding: boolean;
  onHide: (postId: number) => void;
}) {
  const { post } = entry;

  return (
    <Card variant="secondary" className="h-full overflow-hidden p-0">
      <LibraryPostVisual post={post} />
      <Card.Header className="gap-3">
        <div className="flex items-center justify-between gap-3">
          {post.category?.name ? (
            <Chip size="sm" variant="soft">
              {post.category.name}
            </Chip>
          ) : (
            <span />
          )}
          <Tooltip>
            <Button
              isIconOnly
              aria-label={`Hide recommendation for ${post.title}`}
              isPending={isHiding}
              size="sm"
              variant="ghost"
              onPress={() => onHide(post.id)}
            >
              <Icon aria-hidden="true" className="size-4" icon="lucide:x" />
            </Button>
            <Tooltip.Content>Not interested</Tooltip.Content>
          </Tooltip>
        </div>
        <Link className="no-underline" href={`/single/${post.slug}`}>
          <Card.Title className="line-clamp-2 text-lg">{post.title}</Card.Title>
        </Link>
        {post.summary ? (
          <Card.Description className="line-clamp-2">{post.summary}</Card.Description>
        ) : null}
      </Card.Header>
      <Card.Footer className="mt-auto justify-between gap-3">
        <Typography color="muted" type="body-xs" className="line-clamp-1">
          {entry.reason}
        </Typography>
        <Link
          className="text-accent shrink-0 text-sm font-medium no-underline"
          href={`/single/${post.slug}`}
        >
          Read
        </Link>
      </Card.Footer>
    </Card>
  );
}

export function ReadingCard({ entry }: { entry: ReadingHistoryResponse }) {
  const formatRelativeTime = useRelativeTime();
  const { lastReadAt, post, positionAnchor, progressPercent } = entry;
  const href = getReadingPositionHref(post.slug, positionAnchor);

  return (
    <Link className="block h-full no-underline" href={href}>
      <Card variant="secondary" className="h-full overflow-hidden p-0">
        <LibraryPostVisual post={post} />
        <Card.Header className="gap-3">
          <div className="flex items-start justify-between gap-3">
            {post.category?.name ? (
              <Chip size="sm" variant="soft">
                {post.category.name}
              </Chip>
            ) : (
              <span />
            )}
            <span className="text-muted shrink-0 font-mono text-xs tabular-nums">
              {progressPercent}%
            </span>
          </div>
          <Card.Title className="line-clamp-2 text-lg">{post.title}</Card.Title>
          {post.summary ? (
            <Card.Description className="line-clamp-2">{post.summary}</Card.Description>
          ) : null}
        </Card.Header>
        <Card.Footer className="mt-auto flex-col items-stretch gap-3">
          <ProgressBar
            aria-label={`${post.title} reading progress`}
            color="accent"
            size="sm"
            value={progressPercent}
          >
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
          <div className="flex items-center justify-between gap-3">
            <Typography color="muted" type="body-xs" className="line-clamp-1">
              Read {formatRelativeTime(lastReadAt)}
            </Typography>
            <span className="text-accent inline-flex shrink-0 items-center gap-1.5 text-sm font-medium">
              Continue
              <Icon icon="gravity-ui:play" aria-hidden="true" className="size-3.5" />
            </span>
          </div>
        </Card.Footer>
      </Card>
    </Link>
  );
}

export function FavoriteCard({ entry }: { entry: FavoritePostResponse }) {
  const { post } = entry;

  return (
    <Link className="block h-full no-underline" href={`/single/${post.slug}`}>
      <Card variant="secondary" className="h-full overflow-hidden p-0">
        <LibraryPostVisual post={post} />
        <Card.Header className="gap-3">
          <div className="flex items-center justify-between gap-3">
            {post.category?.name ? (
              <Chip size="sm" variant="soft">
                {post.category.name}
              </Chip>
            ) : (
              <span />
            )}
            <Icon
              icon="gravity-ui:heart"
              aria-hidden="true"
              className="text-danger size-4 shrink-0"
            />
          </div>
          <Card.Title className="line-clamp-2 text-lg">{post.title}</Card.Title>
          {post.summary ? (
            <Card.Description className="line-clamp-2">{post.summary}</Card.Description>
          ) : null}
        </Card.Header>
        <Card.Footer className="mt-auto justify-between gap-3">
          <Typography color="muted" type="body-xs">
            Saved {formatDate(entry.favoritedAt)}
          </Typography>
          <span className="text-accent text-sm font-medium">Read</span>
        </Card.Footer>
      </Card>
    </Link>
  );
}

export function FollowingCard({ post }: { post: PostDigestResponse }) {
  return (
    <Link className="block h-full no-underline" href={`/single/${post.slug}`}>
      <Card variant="secondary" className="h-full overflow-hidden p-0">
        <LibraryPostVisual post={post} />
        <Card.Header className="gap-3">
          {post.category?.name ? (
            <Chip size="sm" variant="soft">
              {post.category.name}
            </Chip>
          ) : null}
          <Card.Title className="line-clamp-2 text-lg">{post.title}</Card.Title>
          {post.summary ? (
            <Card.Description className="line-clamp-2">{post.summary}</Card.Description>
          ) : null}
        </Card.Header>
        <Card.Footer className="mt-auto justify-between gap-3">
          <Typography color="muted" type="body-xs">
            {formatDate(post.publishedAt)}
          </Typography>
          <Typography
            color="muted"
            type="body-xs"
            className="flex shrink-0 items-center gap-1.5 tabular-nums"
          >
            <Icon icon="gravity-ui:eye" aria-hidden="true" className="size-3.5" />
            {post.views.toLocaleString("en-US")}
          </Typography>
        </Card.Footer>
      </Card>
    </Link>
  );
}

export function LibrarySkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading library"
      className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
      role="status"
    >
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} variant="secondary" className="overflow-hidden p-0">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <Card.Header>
            <Skeleton className="h-5 w-20 rounded-lg" />
            <Skeleton className="h-6 w-4/5 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
          </Card.Header>
        </Card>
      ))}
    </div>
  );
}

export function EmptyLibrarySection({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <Card variant="secondary" className="items-start gap-2 p-7">
      <Card.Header>
        <Card.Title>{title}</Card.Title>
        <Card.Description>{description}</Card.Description>
      </Card.Header>
    </Card>
  );
}

export function CollectionCard({
  collection,
  isSelected,
  onDelete,
  onEdit,
  onSelect,
}: {
  collection: PostCollectionResponse;
  isSelected: boolean;
  onDelete: (collection: PostCollectionResponse) => void;
  onEdit: (collection: PostCollectionResponse) => void;
  onSelect: (collectionId: number) => void;
}) {
  return (
    <Card
      variant={isSelected ? "tertiary" : "secondary"}
      className="h-full gap-4 p-5 transition-colors"
    >
      <Card.Header className="gap-2 p-0">
        <div className="flex items-start justify-between gap-3">
          <Chip size="sm" variant="soft">
            {collection.itemCount} {collection.itemCount === 1 ? "article" : "articles"}
          </Chip>
          <div className="flex shrink-0 gap-1">
            <Tooltip>
              <Button
                isIconOnly
                aria-label={`Edit ${collection.name}`}
                size="sm"
                variant="ghost"
                onPress={() => onEdit(collection)}
              >
                <Icon icon="gravity-ui:pencil" aria-hidden="true" className="size-3.5" />
              </Button>
              <Tooltip.Content>Edit collection</Tooltip.Content>
            </Tooltip>
            <Tooltip>
              <Button
                isIconOnly
                aria-label={`Delete ${collection.name}`}
                size="sm"
                variant="ghost"
                onPress={() => onDelete(collection)}
              >
                <Icon icon="gravity-ui:trash-bin" aria-hidden="true" className="size-3.5" />
              </Button>
              <Tooltip.Content>Delete collection</Tooltip.Content>
            </Tooltip>
          </div>
        </div>
        <Card.Title className="line-clamp-2 text-lg">{collection.name}</Card.Title>
        {collection.description ? (
          <Card.Description className="line-clamp-2">{collection.description}</Card.Description>
        ) : null}
      </Card.Header>
      <Card.Footer className="mt-auto justify-end p-0">
        <Button
          aria-label={`View collection: ${collection.name}`}
          aria-pressed={isSelected}
          size="sm"
          variant={isSelected ? "secondary" : "ghost"}
          onPress={() => onSelect(collection.id)}
        >
          {isSelected ? "Viewing" : "View collection"}
        </Button>
      </Card.Footer>
    </Card>
  );
}
