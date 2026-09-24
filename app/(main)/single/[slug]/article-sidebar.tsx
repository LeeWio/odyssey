"use client";

import { EmptyState } from "@heroui-pro/react";
import { Card, Link, Skeleton, Typography } from "@heroui/react";

import {
  type PostDigestResponse,
  useGetFeaturedPostsQuery,
  useGetRelatedPostsQuery,
} from "@/lib/features/post";

export interface ArticleSidebarProps {
  slug?: string;
}

function formatPostDate(value?: string | null) {
  if (!value) return "Recently published";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently published";

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function ArticleListSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading related stories"
      className="flex flex-col gap-3"
      role="status"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} variant="secondary">
          <Card.Content className="flex flex-col gap-2">
            <Skeleton className="h-4 w-4/5 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

function StoryList({ posts }: { posts: PostDigestResponse[] }) {
  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => (
        <Card key={post.id} variant="secondary">
          <Card.Header>
            <Card.Title className="text-sm leading-5">
              <Link
                className="text-foreground line-clamp-2 no-underline"
                href={`/single/${post.slug}`}
              >
                {post.title}
              </Link>
            </Card.Title>
            <Card.Description>
              {[post.category?.name, formatPostDate(post.publishedAt)].filter(Boolean).join(" / ")}
            </Card.Description>
          </Card.Header>
        </Card>
      ))}
    </div>
  );
}

export function ArticleSidebar({ slug }: ArticleSidebarProps) {
  const { data: relatedData = [], isLoading: isRelatedLoading } = useGetRelatedPostsQuery(
    slug || "",
    { skip: !slug }
  );
  const { data: featuredData, isLoading: isFeaturedLoading } = useGetFeaturedPostsQuery({
    page: 0,
    size: 5,
  });
  const relatedPosts = relatedData.filter((post) => post.slug !== slug).slice(0, 5);
  const featuredPosts = (featuredData?.list ?? [])
    .filter((post) => post.slug !== slug && !relatedPosts.some((related) => related.id === post.id))
    .slice(0, 4);
  const isLoading = isRelatedLoading || (relatedPosts.length === 0 && isFeaturedLoading);
  const posts = relatedPosts.length > 0 ? relatedPosts : featuredPosts;

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-28">
      <Typography type="body-sm" weight="semibold">
        More to read
      </Typography>
      {isLoading ? (
        <ArticleListSkeleton />
      ) : posts.length > 0 ? (
        <StoryList posts={posts} />
      ) : (
        <EmptyState size="sm">
          <EmptyState.Header>
            <EmptyState.Title>Nothing nearby yet</EmptyState.Title>
            <EmptyState.Description>
              Related stories will show up as the archive grows.
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      )}
    </aside>
  );
}
