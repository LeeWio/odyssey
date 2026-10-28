"use client";

import { Section } from "@/components/layout/section";
import {
  HOME_SECTION_CONTENT,
  HOME_SECTION_DESCRIPTION,
  HOME_SECTION_HEADER_CENTERED,
  HOME_SECTION_TITLE,
} from "./layout";

import { createPageReveal } from "@/lib/motion";

import { Avatar, Button, Card, Chip, Link, Skeleton, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import { useGetPublicFriendLinksQuery, type FriendLinkResponse } from "@/lib/features/friend-link";
import { useTranslations } from "next-intl";

const SHOWCASE_LIMIT = 6;
const FRIEND_GRID =
  "mx-auto grid max-w-6xl grid-cols-1 gap-4 @min-[37rem]/home-section:grid-cols-2 @min-[64rem]/home-section:grid-cols-3";
const FRIEND_ITEM = "min-w-0 @max-[37rem]/home-section:[&:nth-child(n+5)]:hidden";
const FRIEND_CARD = "h-full min-h-52 min-w-0 gap-4 p-5";

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

function FriendCard({ link }: { link: FriendLinkResponse }) {
  const t = useTranslations("Home");
  const url = toSafeExternalUrl(link.url);
  const avatar = toSafeExternalUrl(link.avatar);
  if (!url) return null;

  return (
    <li className={FRIEND_ITEM}>
      <Link
        aria-label={t("links.visitSite", { name: link.name })}
        className="group text-foreground focus-visible:outline-accent block h-full w-full rounded-3xl font-normal no-underline focus-visible:outline-2 focus-visible:outline-offset-4"
        href={url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <Card
          className={`${FRIEND_CARD} group-hover:bg-surface-secondary group-focus-visible:bg-surface-secondary transition-colors duration-150 motion-reduce:transition-none`}
        >
          <Card.Header className="min-h-12 flex-row items-center gap-3">
            <Avatar aria-hidden="true" className="size-12 shrink-0" variant="soft">
              {avatar ? <Avatar.Image alt="" src={avatar} /> : null}
              <Avatar.Fallback>{getInitials(link.name) || "?"}</Avatar.Fallback>
            </Avatar>
            <Card.Title className="line-clamp-2 min-w-0 text-base leading-6 [overflow-wrap:anywhere]">
              {link.name}
            </Card.Title>
          </Card.Header>
          <Card.Content className="min-h-12">
            {link.description?.trim() ? (
              <Card.Description className="line-clamp-2 leading-6 [overflow-wrap:anywhere]">
                {link.description.trim()}
              </Card.Description>
            ) : null}
          </Card.Content>
          <Card.Footer className="justify-between gap-3">
            <span className="text-muted min-w-0 truncate font-mono text-xs">
              {new URL(url).hostname}
            </span>
            <Icon
              aria-hidden="true"
              icon="lucide:arrow-up-right"
              className="text-muted group-hover:text-foreground group-focus-visible:text-foreground size-4 shrink-0"
            />
          </Card.Footer>
        </Card>
      </Link>
    </li>
  );
}

export function FriendLinksShowcase() {
  const t = useTranslations("Home");
  const shouldReduceMotion = useReducedMotionPreference();
  const { revealInView } = createPageReveal(shouldReduceMotion);
  const {
    data: friendLinks = [],
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetPublicFriendLinksQuery();
  const visibleLinks = friendLinks
    .filter((link) => Boolean(toSafeExternalUrl(link.url)))
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .slice(0, SHOWCASE_LIMIT);

  return (
    <Section id="friend-links-showcase" aria-labelledby="friend-links-showcase-title">
      <header className={HOME_SECTION_HEADER_CENTERED}>
        <motion.div {...revealInView(0, 10)}>
          <Chip color="default" size="sm" variant="secondary">
            {t("links.eyebrow")}
          </Chip>
        </motion.div>
        <motion.div {...revealInView(0.06)}>
          <Typography
            id="friend-links-showcase-title"
            type="h2"
            weight="bold"
            className={HOME_SECTION_TITLE}
          >
            <Link className="text-inherit no-underline" href="/links">
              {t("links.title")}
            </Link>
          </Typography>
        </motion.div>
        <motion.div {...revealInView(0.12, 14)}>
          <Typography color="muted" type="body" className={HOME_SECTION_DESCRIPTION}>
            {t("links.description")}
          </Typography>
        </motion.div>
      </header>

      <div className={HOME_SECTION_CONTENT}>
        {isLoading ? (
          <div
            aria-busy="true"
            aria-label={t("links.loading")}
            className={FRIEND_GRID}
            role="status"
          >
            {Array.from({ length: SHOWCASE_LIMIT }, (_, index) => (
              <div key={index} className={FRIEND_ITEM} aria-hidden="true">
                <Card className={FRIEND_CARD}>
                  <Card.Header className="min-h-12 flex-row items-center gap-3">
                    <Skeleton className="size-12 shrink-0 rounded-full" />
                    <Skeleton className="h-6 w-28 max-w-full rounded" />
                  </Card.Header>
                  <Card.Content className="min-h-12 gap-2">
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-4/5 rounded" />
                  </Card.Content>
                  <Card.Footer className="justify-between gap-3">
                    <Skeleton className="h-3 w-36 max-w-full rounded" />
                    <Skeleton className="size-4 shrink-0 rounded" />
                  </Card.Footer>
                </Card>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 py-6">
            <p className="text-muted text-sm" role="status">
              {t("links.unavailable")}
            </p>
            <Button isPending={isFetching} size="sm" variant="ghost" onPress={() => void refetch()}>
              <Icon aria-hidden="true" icon="lucide:rotate-cw" />
              {t("links.retry")}
            </Button>
          </div>
        ) : visibleLinks.length === 0 ? (
          <p className="text-muted py-6 text-center text-sm" role="status">
            {t("links.empty")}
          </p>
        ) : (
          <ul aria-label={t("links.eyebrow")} className={FRIEND_GRID} data-testid="home-links-grid">
            {visibleLinks.map((link) => (
              <FriendCard key={link.id} link={link} />
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
