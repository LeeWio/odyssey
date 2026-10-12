"use client";

import { createPageReveal } from "@/lib/motion";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import {
  HOME_PREVIEW_GRID,
  HOME_SECTION_CONTENT,
  HOME_SECTION_DESCRIPTION,
  HOME_SECTION_HEADER_CENTERED,
  HOME_SECTION_TITLE,
} from "@/components/home/layout";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

import { HelloApple } from "@/components/home/hello-apple";
import { HomeSmoothScroll } from "@/components/home/home-smooth-scroll";
import { ShaderBackground } from "@/components/background/shader-background";
import { MotionChip, MotionTypography } from "@/components/ui";
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
      <Skeleton className={`h-5 max-w-full rounded-full ${eyebrow}`} />
      <Skeleton className={`mt-5 h-12 max-w-full rounded-xl ${title}`} />
      <Skeleton className={`mt-4 h-5 max-w-full rounded-lg ${description}`} />
    </div>
  );
}

function SkeletonMetaLine({ className = "w-24" }: { className?: string }) {
  return <Skeleton className={`h-4 rounded-md ${className}`} />;
}

function SkeletonArticleCard() {
  return (
    <div className="bg-surface-secondary/45 flex aspect-[16/10] min-h-64 flex-col justify-between rounded-3xl p-5">
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

const GuestbookBoard = dynamic(() => import("@/components/corners/guestbook-board"), {
  ssr: false,
  loading: () => (
    <div
      aria-busy="true"
      aria-label="Loading guestbook"
      className="grid w-full grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-4 py-10"
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
      <Section aria-busy="true">
        <SkeletonSectionHeader centered eyebrow="w-28" title="w-72" />
        <div className={`mt-12 ${HOME_PREVIEW_GRID}`}>
          {Array.from({ length: 12 }).map((_, index) => (
            <SkeletonArticleCard key={index} />
          ))}
        </div>
      </Section>
    ),
  }
);

const MomentsShowcase = dynamic(
  () => import("@/components/home/moments-showcase").then((mod) => mod.MomentsShowcase),
  {
    ssr: false,
    loading: () => (
      <Section aria-busy="true">
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
      </Section>
    ),
  }
);

const ProjectsShowcase = dynamic(
  () => import("@/components/home/projects-showcase").then((mod) => mod.ProjectsShowcase),
  {
    ssr: false,
    loading: () => (
      <Section aria-busy="true">
        <SkeletonSectionHeader title="w-full max-w-xl" />
        <div className="bg-separator mt-8 h-px w-full" />
        <div className={`mt-8 ${HOME_PREVIEW_GRID}`}>
          {Array.from({ length: 12 }, (_, index) => (
            <SkeletonProjectCard key={index} />
          ))}
        </div>
      </Section>
    ),
  }
);

const GalleryShowcase = dynamic(
  () => import("@/components/home/gallery-showcase").then((mod) => mod.GalleryShowcase),
  {
    ssr: false,
    loading: () => (
      <Section aria-busy="true">
        <SkeletonSectionHeader title="w-full max-w-xl" />
        <div className={`mt-10 ${HOME_PREVIEW_GRID}`}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} variant="secondary" className="overflow-hidden p-0">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <Card.Header className="gap-2">
                <Skeleton className="h-6 w-2/3 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </Card.Header>
            </Card>
          ))}
        </div>
      </Section>
    ),
  }
);

const FriendLinksShowcase = dynamic(
  () => import("@/components/home/friend-links-showcase").then((mod) => mod.FriendLinksShowcase),
  {
    ssr: false,
    loading: () => (
      <Section aria-busy="true">
        <SkeletonSectionHeader title="w-full max-w-xl" />
        <div className={`mt-10 ${HOME_PREVIEW_GRID}`}>
          {Array.from({ length: 12 }, (_, index) => (
            <SkeletonFriendLinkCard key={index} />
          ))}
        </div>
      </Section>
    ),
  }
);

const FootprintsShowcase = dynamic(
  () => import("@/components/home/footprints-showcase").then((mod) => mod.FootprintsShowcase),
  {
    ssr: false,
    loading: () => (
      <Section aria-busy="true">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SkeletonSectionHeader title="w-72" description="w-full max-w-xl" />
          <Skeleton className="h-5 w-32 rounded-md" />
        </div>
        <Skeleton className="mt-10 h-[clamp(28rem,60svh,44rem)] w-full rounded-lg" />
      </Section>
    ),
  }
);

const LatelySection = dynamic(
  () => import("@/components/home/lately-section").then((mod) => mod.LatelySection),
  {
    ssr: false,
    loading: () => (
      <Section aria-busy="true">
        <SkeletonSectionHeader centered eyebrow="w-20" title="w-80" description="w-96" />
        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Skeleton className="min-h-[34rem] rounded-3xl lg:col-span-7" />
          <Skeleton className="min-h-[34rem] rounded-3xl lg:col-span-5" />
          <Skeleton className="min-h-[20rem] rounded-3xl lg:col-span-12" />
        </div>
      </Section>
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
  "lucide:circle-help",
  "lucide:message-circle",
  "lucide:wand-sparkles",
  "lucide:monitor",
  "lucide:pen-line",
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
        <PageContainer
          as="section"
          aria-labelledby="home-hero-title"
          className="relative isolate flex min-h-[min(680px,calc(100dvh-3rem))] flex-col items-center justify-center overflow-hidden pt-24 pb-12 text-center"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(34rem,78%)] overflow-hidden [mask-image:linear-gradient(to_bottom,black_0%,black_54%,transparent_100%)] opacity-80">
            <ShaderBackground
              aria-hidden="true"
              colors={["#243b53", "#4c7a8a", "#b9c6bd", "#d5a36b"]}
              grainOverlay={0.12}
              mixing={0.55}
              positions={3}
              rotation={214}
              speed={0.08}
              variant="static-mesh-gradient"
              waveX={0.65}
              waveXShift={0.24}
              waveY={0.78}
              waveYShift={0.56}
              className="opacity-40 saturate-75"
            />
            <div className="from-background/10 via-background/75 to-background absolute inset-0 bg-linear-to-b" />
          </div>

          <MotionChip color="accent" size="sm" variant="soft" {...reveal(0.05, 10)}>
            {t("page.eyebrow")}
          </MotionChip>

          <div className="relative mt-2 w-full max-w-2xl" aria-hidden="true">
            <HelloApple />
          </div>

          <MotionTypography
            id="home-hero-title"
            type="h1"
            weight="bold"
            className="max-w-2xl text-4xl leading-[1.05] tracking-normal text-balance break-words sm:text-5xl lg:text-6xl"
            {...reveal(0.18)}
          >
            {t("page.title")}
          </MotionTypography>

          <MotionTypography
            color="muted"
            type="body"
            className="mt-4 max-w-lg leading-7"
            {...reveal(0.26, 14)}
          >
            {t("page.subtitle")}
          </MotionTypography>

          <div
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            {...reveal(0.32, 12)}
          >
            <Link
              href="/chronicle"
              className="bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold no-underline transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {t("page.readWriting")}
              <Icon aria-hidden="true" icon="lucide:arrow-up-right" className="size-4" />
            </Link>
            <Link
              href="#explore-odyssey"
              className="border-default-200/70 bg-surface/60 text-foreground hover:bg-surface-secondary/80 focus-visible:ring-accent inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold no-underline backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {t("page.exploreField")}
              <Icon aria-hidden="true" icon="lucide:arrow-down" className="size-4" />
            </Link>
          </div>
        </PageContainer>

        <HomeOrientation />

        <div id="explore-odyssey">
          <ExploreOdyssey />
        </div>

        <LatelySection />

        <FeaturedWriting />
        <ProjectsShowcase />
        <GalleryShowcase />
        <FootprintsShowcase />
        <MomentsShowcase />
        <FriendLinksShowcase />

        <Section id="guestbook" aria-labelledby="guestbook-title" className="relative">
          <header className={HOME_SECTION_HEADER_CENTERED}>
            <Popover isOpen={isGuestbookPopoverOpen} onOpenChange={setIsGuestbookPopoverOpen}>
              <Popover.Trigger
                aria-label={t("guestbook.openComposer")}
                className="text-muted hover:text-foreground absolute top-0 right-0 inline-flex size-9 items-center justify-center rounded-full transition-colors"
              >
                <Icon aria-hidden="true" icon="lucide:pen-line" className="size-4" />
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

            <motion.div className="mt-2" {...revealInView(0.04, 8)}>
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
              className={HOME_SECTION_TITLE}
              {...revealInView(0.06)}
            >
              {t("guestbook.lineOne")} {t("guestbook.lineTwo")}
            </MotionTypography>
          </header>

          <motion.div className={`${HOME_SECTION_CONTENT} w-full`} {...revealInView(0.12, 20)}>
            <GuestbookBoard />
          </motion.div>

          <div className="mx-auto mt-12 flex w-full max-w-3xl flex-col gap-8">
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
        </Section>

        <Section
          id="faq"
          aria-labelledby="faq-title"
          className="flex flex-col items-center text-center"
        >
          <header className={HOME_SECTION_HEADER_CENTERED}>
            <MotionChip size="sm" color="default" variant="secondary" {...revealInView(0, 10)}>
              {t("faq.eyebrow")}
            </MotionChip>
            <MotionTypography
              id="faq-title"
              align="center"
              type="h2"
              weight="bold"
              className={HOME_SECTION_TITLE}
              {...revealInView(0.06)}
            >
              {t("faq.title")}
            </MotionTypography>
            <MotionTypography
              align="center"
              type="body"
              color="muted"
              className={HOME_SECTION_DESCRIPTION}
              {...revealInView(0.12, 14)}
            >
              {t("faq.description")}
            </MotionTypography>
          </header>

          <MotionAccordion
            className={`${HOME_SECTION_CONTENT} w-full max-w-3xl`}
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
                    <span className="bg-accent/10 text-accent flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <Icon aria-hidden="true" icon={faqIcons[index]} className="size-4" />
                    </span>
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
        </Section>
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
          <Popover.Heading className="text-foreground text-sm font-semibold tracking-normal">
            {t("guestbook.signTitle")}
          </Popover.Heading>
        </div>
        <p className="text-muted/80 text-[11px] leading-relaxed">{t("guestbook.signHint")}</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <Button
            size="sm"
            variant="primary"
            onPress={() => {
              onClose();
              dispatch(setLoginOpen(true));
            }}
          >
            <Icon icon="lucide:pencil-line" className="size-3.5" />
            {t("guestbook.signInToWrite")}
          </Button>
          <Button size="sm" variant="ghost" onPress={onClose}>
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
        <Popover.Heading className="text-foreground text-sm font-semibold tracking-normal">
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
