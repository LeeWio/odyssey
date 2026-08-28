"use client";

import { ArrowUpRight, Calendar } from "@gravity-ui/icons";
import { Card, Chip, Link, Skeleton, Typography } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";
import { useGetPublicMomentsQuery } from "@/lib/features/moment";
import { useGetFeaturedPostsQuery } from "@/lib/features/post";
import { MomentsBoard } from "@/components/home/moments-board";

const formatDate = (date?: string | null) => {
  if (!date) return "Recently";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

function FeaturedArticle({
  title,
  summary,
  slug,
  category,
  publishedAt,
}: {
  title: string;
  summary: string;
  slug: string;
  category: string;
  publishedAt?: string | null;
}) {
  return (
    <Card className="group h-full" variant="secondary">
      <Card.Header className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <Chip color="accent" size="sm" variant="soft">
            {category}
          </Chip>
          <Typography color="muted" type="body-xs" className="flex items-center gap-1">
            <Calendar aria-hidden="true" className="size-3" />
            {formatDate(publishedAt)}
          </Typography>
        </div>
        <Card.Title className="group-hover:text-accent line-clamp-2 text-xl tracking-[-0.03em] transition-colors">
          {title}
        </Card.Title>
        <Card.Description className="line-clamp-3 leading-6">{summary}</Card.Description>
      </Card.Header>
      <Card.Footer className="mt-auto pt-2">
        <Link href={`/single/${slug}`} className="text-sm no-underline">
          Read the essay
          <Link.Icon aria-hidden="true">
            <ArrowUpRight />
          </Link.Icon>
        </Link>
      </Card.Footer>
    </Card>
  );
}

export function FeaturedWriting() {
  const { data: featuredPosts, isLoading } = useGetFeaturedPostsQuery({
    page: 0,
    size: 3,
  });

  const posts = featuredPosts?.list.slice(0, 3) ?? [];

  if (!isLoading && posts.length === 0) return null;

  return (
    <section
      id="writing"
      aria-labelledby="writing-title"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-24 sm:px-10 sm:py-32"
    >
      <header className="flex flex-col items-center gap-3 text-center">
        <Chip color="accent" size="sm" variant="soft">
          From the archive
        </Chip>
        <Typography
          id="writing-title"
          type="h2"
          weight="bold"
          className="mt-1 text-[clamp(2rem,4vw,3.75rem)] tracking-[-0.04em]"
        >
          What&apos;s worth reading.
        </Typography>
        <Typography color="muted" type="body" className="max-w-xl leading-6">
          A small selection of essays shaped by the work, the questions, and the things I keep
          coming back to.
        </Typography>
        <Link className="mt-2 text-sm no-underline" href="/blog">
          Browse all writing
          <Link.Icon aria-hidden="true">
            <ArrowUpRight />
          </Link.Icon>
        </Link>
      </header>

      <div className="mt-12">
        {isLoading && posts.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Card key={index} variant="secondary">
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="mt-6 h-16 w-full rounded-md" />
                <Skeleton className="mt-3 h-10 w-full rounded-md" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {posts.map((post) => (
              <FeaturedArticle
                key={post.id}
                title={post.title}
                summary={post.summary || "A note from the archive."}
                slug={post.slug}
                category={post.category?.name ?? "Essay"}
                publishedAt={post.publishedAt}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function MomentsShowcase() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const revealInView = (delay = 0, distance = 20) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.65,
      delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  const { data: moments, isLoading } = useGetPublicMomentsQuery({
    page: 0,
    size: 6,
  });

  const recentMoments = moments?.list.slice(0, 6) ?? [];
  if (!isLoading && recentMoments.length === 0) return null;

  return (
    <section
      id="moments-showcase"
      aria-labelledby="moments-showcase-title"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-24 sm:px-10 sm:py-32"
    >
      <header className="flex flex-col items-center gap-3 text-center">
        <motion.div {...revealInView(0, 10)}>
          <Chip color="default" size="sm" variant="secondary">
            Moments
          </Chip>
        </motion.div>
        <motion.div {...revealInView(0.06)}>
          <Typography
            id="moments-showcase-title"
            type="h2"
            weight="bold"
            className="mt-1 text-[clamp(2rem,4vw,3.75rem)] tracking-[-0.04em]"
          >
            This &amp; That
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.12, 14)}>
          <Typography color="muted" type="body" className="max-w-xl leading-6">
            A little of this, a little of that.
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.16, 14)}>
          <Link className="mt-2 text-sm no-underline" href="/moments">
            See all moments
            <Link.Icon aria-hidden="true">
              <ArrowUpRight />
            </Link.Icon>
          </Link>
        </motion.div>
      </header>

      <motion.div className="mt-12" {...revealInView(0.2, 20)}>
        {isLoading && recentMoments.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <MomentsBoard moments={recentMoments} isLoading={isLoading} />
        )}
      </motion.div>
    </section>
  );
}
