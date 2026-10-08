"use client";

import { Section } from "@/components/layout/section";
import { HOME_PREVIEW_GRID } from "./layout";

import { pageEaseOut } from "@/lib/motion";

import { Avatar, Button, Card, Chip, Link, Skeleton, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { useGetPublicFriendLinksQuery, type FriendLinkResponse } from "@/lib/features/friend-link";
import { useTranslations } from "next-intl";

const SHOWCASE_LIMIT = 12;

function toSafeExternalUrl(value?: string | null) {
  if (!value?.trim()) return undefined;

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function LinkPreviewCard({
  link,
  index,
  reducedMotion,
}: {
  link: FriendLinkResponse;
  index: number;
  reducedMotion: boolean;
}) {
  const t = useTranslations("Home");
  const url = toSafeExternalUrl(link.url);
  const avatar = toSafeExternalUrl(link.avatar);
  if (!url) return null;

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: reducedMotion ? 0 : 0.55,
        delay: reducedMotion ? 0 : Math.min(index * 0.04, 0.2),
        ease: pageEaseOut,
      }}
    >
      <a
        className="group focus-visible:outline-accent block h-full rounded-2xl no-underline focus-visible:outline-2 focus-visible:outline-offset-4"
        href={url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <Card className="group-hover:border-accent/25 h-full min-h-44 border border-transparent transition-[border-color,transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
          <Card.Header className="flex-row items-center gap-3">
            <Avatar className="border-default-200 shrink-0 border" size="md" variant="soft">
              {avatar ? <Avatar.Image alt={`${link.name} avatar`} src={avatar} /> : null}
              <Avatar.Fallback>{getInitials(link.name) || "O"}</Avatar.Fallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <Card.Title className="truncate text-base">{link.name}</Card.Title>
              <Typography color="muted" type="body-xs" className="mt-1 truncate font-mono">
                {new URL(url).hostname}
              </Typography>
            </div>
            <Icon
              aria-hidden="true"
              icon="lucide:arrow-up-right"
              className="text-muted size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Card.Header>
          <Card.Content className="mt-auto">
            <Typography color="muted" type="body-sm" className="line-clamp-2 leading-6">
              {link.description || t("links.fallback")}
            </Typography>
          </Card.Content>
        </Card>
      </a>
    </motion.div>
  );
}

export function FriendLinksShowcase() {
  const t = useTranslations("Home");
  const shouldReduceMotion = useReducedMotionPreference();
  const { data: friendLinks = [], error, isLoading, refetch } = useGetPublicFriendLinksQuery();
  const visibleLinks = friendLinks
    .filter((link) => Boolean(toSafeExternalUrl(link.url)))
    .slice(0, SHOWCASE_LIMIT);

  if (!isLoading && !error && visibleLinks.length === 0) return null;

  return (
    <Section aria-labelledby="friend-links-showcase-title">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <Chip color="default" size="sm" variant="secondary">
            {t("links.eyebrow")}
          </Chip>
          <Typography
            id="friend-links-showcase-title"
            type="h2"
            weight="bold"
            className="mt-4 text-3xl leading-tight tracking-normal text-balance sm:text-4xl"
          >
            {t("links.title")}
          </Typography>
          <Typography color="muted" type="body" className="mt-3 max-w-lg leading-7">
            {t("links.description")}
          </Typography>
        </div>
        <Link href="/links" className="shrink-0 text-sm no-underline">
          {t("links.visitAll")}
          <Link.Icon aria-hidden="true">
            <Icon icon="lucide:arrow-up-right" />
          </Link.Icon>
        </Link>
      </header>

      <div className="mt-10">
        {isLoading ? (
          <div
            aria-busy="true"
            aria-label={t("links.loading")}
            className={HOME_PREVIEW_GRID}
            role="status"
          >
            {Array.from({ length: SHOWCASE_LIMIT }, (_, index) => (
              <Card key={index} className="min-h-44 gap-4 p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-11 rounded-full" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-28 rounded-lg" />
                    <Skeleton className="h-3 w-36 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-4/5 rounded-lg" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="flex flex-col items-start gap-4 p-6" variant="secondary">
            <Typography type="body-sm" weight="semibold">
              The blogroll is taking a quiet moment.
            </Typography>
            <Typography color="muted" type="body-sm">
              The links could not be loaded right now.
            </Typography>
            <Button size="sm" variant="secondary" onPress={() => void refetch()}>
              Try again
            </Button>
          </Card>
        ) : (
          <div className={HOME_PREVIEW_GRID} data-testid="home-links-grid">
            {visibleLinks.map((link, index) => (
              <LinkPreviewCard
                key={link.id}
                index={index}
                link={link}
                reducedMotion={shouldReduceMotion}
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
