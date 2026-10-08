"use client";

import { createPageReveal } from "@/lib/motion";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

import { HelloApple } from "@/components/home/hello-apple";
import { HomeSmoothScroll } from "@/components/home/home-smooth-scroll";
import { MotionChip, MotionSurface, MotionTypography } from "@/components/ui";
import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Skeleton,
  Typography,
  Button,
  Card,
  Link,
  Popover,
  TextArea,
  Description,
  Accordion,
  toast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMounted } from "@mantine/hooks";
import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import { getApiErrorMessage } from "@/lib/api/errors";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { usePostGuestbookEntryMutation } from "@/lib/features/comment";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

function SkeletonSectionHeader({
  centered = false,
  eyebrow = "w-24",
  title = "w-72",
  description = "w-full max-w-xl",
}: {
  centered?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className={centered ? "flex flex-col items-center text-center" : "max-w-xl"}>
      <Skeleton className={`h-5 rounded-full ${eyebrow}`} />
      <Skeleton className={`mt-5 h-12 rounded-xl ${title}`} />
      <Skeleton className={`mt-4 h-5 rounded-lg ${description}`} />
    </div>
  );
}

function SkeletonMetaLine({ className = "w-24" }: { className?: string }) {
  return <Skeleton className={`h-4 rounded-md ${className}`} />;
}

function SkeletonArticleCard() {
  return (
    <div className="bg-surface-secondary/45 flex aspect-[16/10] flex-col justify-between rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-7 w-4/5 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-3/5 rounded-md" />
      </div>
    </div>
  );
}

function SkeletonProjectCard() {
  return (
    <Card variant="secondary" className="overflow-hidden p-0">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <Card.Header className="gap-3">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-4/5 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </Card.Header>
    </Card>
  );
}

function SkeletonFriendLinkCard() {
  return (
    <Card variant="secondary" className="min-h-44 gap-4 p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-3 w-36 rounded-md" />
        </div>
        <Skeleton className="size-4 rounded-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-4/5 rounded-md" />
      </div>
    </Card>
  );
}

const GradientText = dynamic(() => import("@/components/ui/gradient-text"), {
  ssr: false,
  loading: () => <span className="contents" />,
});

const GuestbookBoard = dynamic(() => import("@/components/corners/guestbook-board"), {
  ssr: false,
  loading: () => (
    <div
      aria-busy="true"
      aria-label="Loading guestbook"
      className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-6 py-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      role="status"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <Card key={index} variant="secondary" className="flex min-h-36 flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <SkeletonMetaLine className="w-24" />
          </div>
          <SkeletonMetaLine className="w-full" />
          <SkeletonMetaLine className="w-5/6" />
        </Card>
      ))}
    </div>
  ),
});

const FeaturedWriting = dynamic(
  () => import("@/components/home/featured-writing").then((mod) => mod.FeaturedWriting),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
        <SkeletonSectionHeader centered eyebrow="w-28" title="w-72" />
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonArticleCard key={index} />
          ))}
        </div>
      </div>
    ),
  }
);

const MomentsShowcase = dynamic(
  () => import("@/components/home/moments-showcase").then((mod) => mod.MomentsShowcase),
  {
    ssr: false,
    loading: () => (
      <div className="w-full px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <SkeletonSectionHeader centered eyebrow="w-24" title="w-64" />
        <div className="mt-12 [columns:20rem] gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="mb-5 break-inside-avoid">
              <Skeleton
                className={`w-full rounded-2xl ${index % 3 === 0 ? "aspect-[4/5]" : index % 3 === 1 ? "aspect-[5/6]" : "aspect-[1/1]"}`}
              />
            </div>
          ))}
        </div>
      </div>
    ),
  }
);

const ProjectsShowcase = dynamic(
  () => import("@/components/home/projects-showcase").then((mod) => mod.ProjectsShowcase),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
        <SkeletonSectionHeader title="w-full max-w-xl" />
        <div className="bg-separator mt-8 h-px w-full" />
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonProjectCard key={index} />
          ))}
        </div>
      </div>
    ),
  }
);

const GalleryShowcase = dynamic(
  () => import("@/components/home/gallery-showcase").then((mod) => mod.GalleryShowcase),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto w-full max-w-7xl px-6 py-24 sm:px-10 sm:py-32">
        <SkeletonSectionHeader title="w-full max-w-xl" />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} variant="secondary" className="overflow-hidden p-0">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <Card.Header className="gap-2">
                <Skeleton className="h-6 w-2/3 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </Card.Header>
            </Card>
          ))}
        </div>
      </div>
    ),
  }
);

const FriendLinksShowcase = dynamic(
  () => import("@/components/home/friend-links-showcase").then((mod) => mod.FriendLinksShowcase),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
        <SkeletonSectionHeader title="w-full max-w-xl" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonFriendLinkCard key={index} />
          ))}
        </div>
      </div>
    ),
  }
);

const FootprintsShowcase = dynamic(
  () => import("@/components/home/footprints-showcase").then((mod) => mod.FootprintsShowcase),
  {
    ssr: false,
    loading: () => (
      <div className="w-full py-24 sm:py-32">
        <div className="flex flex-col gap-6 px-6 sm:flex-row sm:items-end sm:justify-between sm:px-10">
          <SkeletonSectionHeader title="w-72" description="w-full max-w-xl" />
          <Skeleton className="h-5 w-32 rounded-md" />
        </div>
        <Skeleton className="mt-10 h-[clamp(28rem,60svh,44rem)] w-full rounded-lg" />
      </div>
    ),
  }
);

const LatelySection = dynamic(
  () => import("@/components/home/lately-section").then((mod) => mod.LatelySection),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
        <SkeletonSectionHeader centered eyebrow="w-20" title="w-80" description="w-96" />
        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Skeleton className="min-h-[34rem] rounded-3xl lg:col-span-7" />
          <Skeleton className="min-h-[34rem] rounded-3xl lg:col-span-5" />
          <Skeleton className="min-h-[20rem] rounded-3xl lg:col-span-12" />
        </div>
      </div>
    ),
  }
);

const HomeOrientation = dynamic(
  () => import("@/components/home/home-orientation").then((mod) => mod.HomeOrientation),
  { ssr: false }
);

const ExploreOdyssey = dynamic(
  () => import("@/components/home/explore-odyssey").then((mod) => mod.ExploreOdyssey),
  { ssr: false }
);

const MotionAccordion = motion.create(Accordion);

const faqKeys = ["finished", "reply", "building", "desk", "trace"] as const;
const faqIcons = [
  "/icons/rocket.png",
  "/icons/mail.png",
  "https://img.icons8.com/3d-fluency/94/adobe-animate.png",
  "https://img.icons8.com/3d-fluency/94/imac.png",
  "/icons/mail.png",
];

export default function Home() {
  const t = useTranslations("Home");
  const mounted = useMounted();
  const shouldReduceMotion = useReducedMotionPreference();
  const [isGuestbookPopoverOpen, setIsGuestbookPopoverOpen] = useState(false);

  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const { reveal, revealInView } = createPageReveal(shouldReduceMotion);

  return (
    <>
      <HomeSmoothScroll />
      <div className="bg-background w-full overflow-x-clip">
        <section
          aria-labelledby="home-hero-title"
          className="mx-auto flex min-h-[100dvh] w-full flex-col items-center justify-center px-6 pt-24 pb-16 text-center sm:px-10"
        >
          <MotionChip color="accent" size="sm" variant="soft" {...reveal(0.05, 10)}>
            {t("page.eyebrow")}
          </MotionChip>

          <div className="mt-1 w-full max-w-3xl" aria-hidden="true">
            <HelloApple />
          </div>

          <MotionTypography
            id="home-hero-title"
            type="h1"
            weight="bold"
            className="max-w-3xl text-[clamp(2.25rem,5vw,4.25rem)] leading-[0.98] tracking-[-0.055em]"
            {...reveal(0.18)}
          >
            {t("page.title")}
          </MotionTypography>

          <MotionTypography
            color="muted"
            type="body"
            className="mt-4 max-w-xl"
            {...reveal(0.26, 14)}
          >
            {t("page.subtitle")}
          </MotionTypography>

          <MotionSurface
            variant="transparent"
            className="mt-9 flex max-w-lg flex-col items-center"
            {...reveal(0.34, 12)}
          >
            <Typography
              aria-hidden="true"
              className="font-mono tracking-[0.18em] uppercase"
              color="muted"
              type="body-xs"
            >
              {t("page.prologue")}
            </Typography>
            <span className="bg-separator my-4 h-12 w-px" aria-hidden="true" />
            <Typography align="center" color="muted" type="body-sm" className="max-w-md italic">
              {t("page.prologueBody")}
            </Typography>
            <motion.span
              aria-hidden="true"
              className="bg-foreground/55 mt-6 block size-1.5 rounded-full"
              animate={
                shouldReduceMotion ? undefined : { opacity: [0.28, 0.9, 0.28], y: [0, 5, 0] }
              }
              transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
            />
          </MotionSurface>
        </section>

        <HomeOrientation />

        <ExploreOdyssey />

        <LatelySection />

        <FeaturedWriting />
        <ProjectsShowcase />
        <GalleryShowcase />
        <FootprintsShowcase />
        <MomentsShowcase />
        <FriendLinksShowcase />

        <section
          id="guestbook"
          aria-labelledby="guestbook-title"
          className="mx-auto w-full scroll-mt-24 py-24 sm:py-32"
        >
          <header className="relative mx-auto flex flex-col items-center px-6 text-center sm:px-10">
            <Popover isOpen={isGuestbookPopoverOpen} onOpenChange={setIsGuestbookPopoverOpen}>
              <Popover.Trigger className="absolute -top-8 -right-20">
                <Image
                  alt={t("guestbook.decorationAlt")}
                  aria-hidden="true"
                  height={112}
                  src="/Animation.svg"
                  unoptimized
                  width={112}
                />
              </Popover.Trigger>
              <Popover.Content
                className="border-default-200/50 bg-surface/90 w-80 border shadow-xl backdrop-blur-md"
                placement="bottom end"
              >
                <Popover.Dialog className="p-4 outline-none">
                  <Popover.Arrow />
                  <GuestbookQuickForm onClose={() => setIsGuestbookPopoverOpen(false)} />
                </Popover.Dialog>
              </Popover.Content>
            </Popover>

            <MotionChip size="sm" variant="secondary" {...revealInView(0, 10)}>
              {t("guestbook.eyebrow")}
            </MotionChip>

            <motion.div className="mt-3" {...revealInView(0.04, 8)}>
              <Link href="/guestbook" className="text-sm no-underline">
                {t("guestbook.open")}
                <Link.Icon aria-hidden="true" />
              </Link>
            </motion.div>

            <MotionTypography
              id="guestbook-title"
              align="center"
              type="h2"
              weight="bold"
              className="mt-4 text-center text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.08] tracking-[-0.04em] text-balance"
              {...revealInView(0.06)}
            >
              <GradientText className="pointer-events-none cursor-default !rounded-none bg-transparent !p-0 shadow-none backdrop-blur-none ![font:inherit]">
                {t("guestbook.lineOne")}
              </GradientText>
            </MotionTypography>

            <MotionTypography
              align="center"
              type="h3"
              className="text-center text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.08] tracking-[-0.04em] text-balance"
              {...revealInView(0.06)}
            >
              <GradientText className="pointer-events-none cursor-default !rounded-none bg-transparent !p-0 shadow-none backdrop-blur-none ![font:inherit]">
                {t("guestbook.lineTwo")}
              </GradientText>
            </MotionTypography>
          </header>

          <motion.div className="mt-6 w-full" {...revealInView(0.12, 20)}>
            <GuestbookBoard />
          </motion.div>

          <div className="mx-auto mt-16 flex w-full max-w-3xl flex-col gap-10 px-6 sm:px-10">
            {mounted && !isAuthenticated ? (
              <motion.div className="w-full" {...revealInView(0.2, 16)}>
                <Card variant="secondary">
                  <Card.Header>
                    <Card.Title className="text-base">{t("guestbook.signInTitle")}</Card.Title>
                    <Card.Description>{t("guestbook.signInDescription")}</Card.Description>
                  </Card.Header>
                  <Card.Footer>
                    <Button size="sm" onPress={() => dispatch(setLoginOpen(true))}>
                      {t("guestbook.signInToWrite")}
                    </Button>
                  </Card.Footer>
                </Card>
              </motion.div>
            ) : null}
          </div>
        </section>

        <section
          id="faq"
          aria-labelledby="faq-title"
          className="mx-auto flex w-full max-w-4xl scroll-mt-24 flex-col items-center px-6 py-24 text-center sm:px-10 sm:py-32"
        >
          <header className="flex flex-col items-center text-center">
            <MotionChip size="sm" color="default" variant="secondary" {...revealInView(0, 10)}>
              {t("faq.eyebrow")}
            </MotionChip>
            <MotionTypography
              id="faq-title"
              align="center"
              type="h2"
              weight="bold"
              className="mt-4 text-[clamp(2rem,4vw,3.75rem)] tracking-[-0.04em]"
              {...revealInView(0.06)}
            >
              {t("faq.title")}
            </MotionTypography>
            <MotionTypography
              align="center"
              type="body"
              color="muted"
              className="mt-3 max-w-xl text-balance"
              {...revealInView(0.12, 14)}
            >
              {t("faq.description")}
            </MotionTypography>
          </header>

          <MotionAccordion
            className="bg-surface-1/10 mt-12 w-full rounded-2xl"
            variant="surface"
            {...revealInView(0.18, 20)}
          >
            {faqKeys.map((key, index) => (
              <Accordion.Item
                key={key}
                className="group/item first:**:data-[slot=accordion-trigger]:rounded-t-2xl last:[&:not(:has([data-slot=accordion-trigger][aria-expanded='true']))_[data-slot=accordion-trigger]]:rounded-b-2xl"
              >
                <Accordion.Heading>
                  <Accordion.Trigger className="group hover:bg-surface flex items-center gap-2 transition-none">
                    {faqIcons[index] ? (
                      <Image
                        alt={t(`faq.${key}.title`)}
                        className="h-11 w-11 transition-[scale,rotate] duration-300 ease-out group-hover/item:scale-120 group-hover/item:-rotate-10 group-hover/item:drop-shadow-lg"
                        src={faqIcons[index]}
                        width={44}
                        height={44}
                      />
                    ) : null}
                    <div className="flex flex-col gap-0 text-start">
                      <span className="leading-5 font-medium">{t(`faq.${key}.title`)}</span>
                      <span className="text-muted/80 leading-6 font-normal">
                        {t(`faq.${key}.subtitle`)}
                      </span>
                    </div>
                    <Accordion.Indicator className="text-muted/50 [&>svg]:size-4">
                      <Icon icon="gravity-ui:chevron-down" />
                    </Accordion.Indicator>
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body className="text-muted/80 text-start">
                    {t(`faq.${key}.content`)}
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </MotionAccordion>
        </section>
      </div>
    </>
  );
}

interface GuestbookQuickFormProps {
  onClose: () => void;
}

function GuestbookQuickForm({ onClose }: GuestbookQuickFormProps) {
  const t = useTranslations("Home");
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [content, setContent] = useState("");
  const [postEntry, { isLoading }] = usePostGuestbookEntryMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;
    try {
      await postEntry({ content: content.trim() }).unwrap();
      setContent("");
      onClose();
    } catch (err) {
      toast.danger(getApiErrorMessage(err, t("guestbook.postFailed")));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-3 text-start">
        <div className="flex items-center gap-2">
          <span className="text-accent text-base">✨</span>
          <Popover.Heading className="text-foreground text-sm font-semibold tracking-tight">
            {t("guestbook.signTitle")}
          </Popover.Heading>
        </div>
        <p className="text-muted/80 text-[11px] leading-relaxed">{t("guestbook.signHint")}</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <Button
            size="sm"
            variant="primary"
            className="bg-accent h-8 px-4 text-xs font-semibold text-white hover:brightness-105"
            onPress={() => {
              onClose();
              dispatch(setLoginOpen(true));
            }}
          >
            <Icon icon="lucide:pencil-line" className="size-3.5" />
            {t("guestbook.signInToWrite")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted/80 h-8 px-3 text-xs font-medium"
            onPress={onClose}
          >
            {t("guestbook.close")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-start">
      <div className="flex items-center gap-2">
        <span className="text-accent text-base">✨</span>
        <Popover.Heading className="text-foreground text-sm font-semibold tracking-tight">
          {t("guestbook.beforeYouGo")}
        </Popover.Heading>
      </div>

      <div className="flex w-full flex-col gap-2">
        <TextArea
          aria-label={t("guestbook.messageLabel")}
          placeholder={t("guestbook.placeholder")}
          rows={3}
          maxLength={280}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
        />
        <Description id="textarea-controlled-description">
          {t("guestbook.characters", { count: content.length })}
        </Description>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button size="sm" fullWidth variant="ghost" onPress={onClose} isDisabled={isLoading}>
          {t("guestbook.cancel")}
        </Button>
        <Button
          type="submit"
          fullWidth
          size="sm"
          variant="primary"
          isDisabled={!content.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <Icon icon="lucide:loader-2" className="size-3.5 animate-spin" />
              {t("guestbook.posting")}
            </>
          ) : (
            <>
              <Icon icon="lucide:send" className="size-3.5" />
              {t("guestbook.submit")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
