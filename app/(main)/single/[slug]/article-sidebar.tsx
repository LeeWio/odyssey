"use client";

import { getSmartColorTone, SmartColorSurface } from "@/components/background/smart-color-surface";
import {
  type PostDigestResponse,
  useGetFeaturedPostsQuery,
  useGetRelatedPostsQuery,
} from "@/features/blog";
import { Book, Flame, Sparkles } from "@gravity-ui/icons";
import { EmptyState } from "@heroui-pro/react";
import {
  Card,
  Chip,
  Description,
  Label,
  ListBox,
  ScrollShadow,
  Skeleton,
  Tabs,
} from "@heroui/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TabId = "related" | "featured";

export interface ArticleSidebarProps {
  slug?: string;
}

function isTabId(value: string | null): value is TabId {
  return value === "related" || value === "featured";
}

function formatPostDate(value?: string | null) {
  if (!value) return "Recently published";

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getEstimatedReadingMinutes(post: PostDigestResponse) {
  const source = `${post.title} ${post.summary ?? ""}`.trim();
  return Math.max(2, Math.ceil(source.length / 180));
}

function ArticleListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading article suggestions" role="status">
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} variant="transparent" className="flex-row items-center gap-3 p-3">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <Card.Content className="min-w-0 flex-1 gap-2 p-0">
            <Skeleton className="h-4 w-4/5 rounded-lg" />
            <Skeleton className="h-3 w-2/3 rounded-lg" />
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

function ArticleListEmpty({ type }: { type: TabId }) {
  const isRelated = type === "related";

  return (
    <EmptyState size="sm" className="py-10">
      <EmptyState.Header>
        <EmptyState.Media variant="icon">
          {isRelated ? <Sparkles aria-hidden="true" /> : <Flame aria-hidden="true" />}
        </EmptyState.Media>
        <EmptyState.Title>
          {isRelated ? "No related articles yet" : "No featured articles yet"}
        </EmptyState.Title>
        <EmptyState.Description>
          {isRelated
            ? "More connected writing will appear as the archive grows."
            : "Editor selections will appear here when they are ready."}
        </EmptyState.Description>
      </EmptyState.Header>
    </EmptyState>
  );
}

function ArticleList({
  ariaLabel,
  currentSlug,
  posts,
}: {
  ariaLabel: string;
  currentSlug?: string;
  posts: PostDigestResponse[];
}) {
  const router = useRouter();

  return (
    <ScrollShadow hideScrollBar className="max-h-[420px]">
      <ListBox
        aria-label={ariaLabel}
        selectionMode="none"
        onAction={(key) => router.push(`/single/${String(key)}`)}
      >
        {posts.map((post) => {
          const isCurrent = post.slug === currentSlug;
          const description = [post.category?.name, formatPostDate(post.publishedAt)]
            .filter(Boolean)
            .join(", ");

          return (
            <ListBox.Item
              key={post.id}
              id={post.slug}
              textValue={post.title}
              aria-current={isCurrent ? "page" : undefined}
            >
              <SmartColorSurface
                className="size-10 shrink-0 rounded-xl"
                seed={`rail-${post.slug}`}
                tone={getSmartColorTone({
                  categoryName: post.category?.name,
                  title: post.title,
                })}
              >
                <span aria-hidden="true" className="block size-full" />
              </SmartColorSurface>

              <div className="min-w-0 flex-1">
                <Label className="line-clamp-2 leading-5">{post.title}</Label>
                <Description className="line-clamp-1">{description}</Description>
              </div>

              <Chip size="sm" variant={isCurrent ? "soft" : "tertiary"}>
                {getEstimatedReadingMinutes(post)} min
              </Chip>
            </ListBox.Item>
          );
        })}
      </ListBox>
    </ScrollShadow>
  );
}

export function ArticleSidebar({ slug }: ArticleSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const selectedTab: TabId = isTabId(requestedTab) ? requestedTab : "related";
  const { data: relatedData = [], isLoading: isRelatedLoading } = useGetRelatedPostsQuery(
    slug || "",
    { skip: !slug }
  );
  const { data: featuredData, isLoading: isFeaturedLoading } = useGetFeaturedPostsQuery({
    page: 0,
    size: 5,
  });
  const relatedPosts = relatedData.filter((post) => post.slug !== slug).slice(0, 5);
  const featuredPosts = (featuredData?.list ?? []).filter((post) => post.slug !== slug).slice(0, 5);

  const handleSelectionChange = (key: React.Key) => {
    const nextTab = String(key);
    if (!isTabId(nextTab)) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <aside className="sticky top-24 hidden h-fit min-w-0 lg:block">
      <Card variant="secondary" className="gap-5 p-5">
        <Book aria-hidden="true" className="text-muted size-5" />
        <Card.Header>
          <Card.Title>Continue Reading</Card.Title>
          <Card.Description>
            Connected essays and editor selections from the archive.
          </Card.Description>
        </Card.Header>

        <Card.Content className="p-0">
          <Tabs
            selectedKey={selectedTab}
            variant="secondary"
            onSelectionChange={handleSelectionChange}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Article suggestions">
                <Tabs.Tab id="related">
                  Related
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="featured">
                  Featured
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            <Tabs.Panel id="related" className="pt-3">
              {isRelatedLoading ? (
                <ArticleListSkeleton />
              ) : relatedPosts.length > 0 ? (
                <ArticleList ariaLabel="Related articles" currentSlug={slug} posts={relatedPosts} />
              ) : (
                <ArticleListEmpty type="related" />
              )}
            </Tabs.Panel>

            <Tabs.Panel id="featured" className="pt-3">
              {isFeaturedLoading ? (
                <ArticleListSkeleton />
              ) : featuredPosts.length > 0 ? (
                <ArticleList
                  ariaLabel="Featured articles"
                  currentSlug={slug}
                  posts={featuredPosts}
                />
              ) : (
                <ArticleListEmpty type="featured" />
              )}
            </Tabs.Panel>
          </Tabs>
        </Card.Content>
      </Card>
    </aside>
  );
}
