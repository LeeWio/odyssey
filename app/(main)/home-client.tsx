"use client";

import { createPageReveal } from "@/lib/motion";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import {
  HOME_SECTION_CONTENT,
  HOME_SECTION_DESCRIPTION,
  HOME_SECTION_HEADER_CENTERED,
  HOME_SECTION_TITLE,
} from "@/features/home/layout";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

import { ExploreOdyssey } from "@/features/home/explore-odyssey";
import { FeaturedWriting } from "@/features/home/featured-writing";
import { FootprintsShowcase } from "@/features/home/footprints-showcase";
import { FriendLinksShowcase } from "@/features/home/friend-links-showcase";
import { GalleryShowcase } from "@/features/home/gallery-showcase";
import { HelloApple } from "@/features/home/hello-apple";
import { HomeOrientation } from "@/features/home/home-orientation";
import { LatelySection } from "@/features/home/lately-section";
import { MomentsShowcase } from "@/features/home/moments-showcase";
import type { MomentResponse } from "@/lib/features/moment";
import { ProjectsShowcase } from "@/features/home/projects-showcase";
import GuestbookBoard from "@/components/corners/guestbook-board";
import { MotionChip, MotionTypography } from "@/components/ui";
import { useState } from "react";
import {
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

const MotionAccordion = motion.create(Accordion);

const faqKeys = ["finished", "reply", "building", "desk", "trace"] as const;
const faqIcons = [
  "lucide:circle-help",
  "lucide:message-circle",
  "lucide:wand-sparkles",
  "lucide:monitor",
  "lucide:pen-line",
];

export default function Home({ moments = [] }: { moments?: MomentResponse[] }) {
  const t = useTranslations("Home");
  const mounted = useMounted();
  const shouldReduceMotion = useReducedMotionPreference();
  const [isGuestbookPopoverOpen, setIsGuestbookPopoverOpen] = useState(false);

  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const { revealInView, presence } = createPageReveal(shouldReduceMotion);

  return (
    <>
      <div className="bg-background w-full overflow-x-clip">
        <PageContainer
          as="section"
          aria-labelledby="home-hero-title"
          className="relative isolate flex min-h-[min(680px,calc(100dvh-3rem))] flex-col items-center justify-center overflow-hidden pt-24 pb-12 text-center"
        >
          <MotionChip color="accent" size="sm" variant="soft" {...presence(0, 10)}>
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
            {...presence()}
          >
            {t("page.title")}
          </MotionTypography>

          <MotionTypography
            color="muted"
            type="body"
            className="mt-4 max-w-lg leading-7"
            {...presence(0.04, 14)}
          >
            {t("page.subtitle")}
          </MotionTypography>

          <motion.div
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            {...presence(0.08, 12)}
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
              className="border-default-200/70 bg-surface text-foreground hover:bg-surface-secondary focus-visible:ring-accent inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold no-underline transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {t("page.exploreField")}
              <Icon aria-hidden="true" icon="lucide:arrow-down" className="size-4" />
            </Link>
          </motion.div>
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
        <MomentsShowcase moments={moments} />
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
                  <Accordion.Trigger className="group hover:bg-surface flex items-center gap-2 transition-transform duration-200 ease-[cubic-bezier(0.16,1.08,0.3,1)]">
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
