"use client";

import { createPageReveal } from "@/lib/motion";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

import { HelloApple } from "@/components/home/hello-apple";
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

import { getApiErrorMessage } from "@/lib/api/errors";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { usePostGuestbookEntryMutation } from "@/lib/features/comment";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

const GradientText = dynamic(() => import("@/components/ui/gradient-text"), {
  ssr: false,
  loading: () => <span className="contents" />,
});

const GuestbookBoard = dynamic(() => import("@/components/corners/guestbook-board"), {
  ssr: false,
  loading: () => <Skeleton className="min-h-64 w-full rounded-3xl" />,
});

const FeaturedWriting = dynamic(
  () => import("@/components/home/featured-writing").then((mod) => mod.FeaturedWriting),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
        <Skeleton className="mx-auto h-10 w-48 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-12 w-72 rounded-2xl" />
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[16/10] w-full rounded-3xl" />
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
      <div className="mx-auto w-full max-w-7xl px-6 py-24 sm:py-32">
        <Skeleton className="mx-auto h-10 w-40 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-12 w-64 rounded-2xl" />
        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[4/5] w-full rounded-2xl" />
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
        <Skeleton className="h-10 w-40 rounded-full" />
        <Skeleton className="mt-6 h-12 w-full max-w-xl rounded-2xl" />
        <div className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="min-h-[29rem] rounded-3xl" />
          <div className="grid gap-4">
            <Skeleton className="min-h-56 rounded-3xl" />
            <Skeleton className="min-h-56 rounded-3xl" />
          </div>
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
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="mt-6 h-12 w-full max-w-xl rounded-2xl" />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[4/3] w-full rounded-3xl" />
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
        <Skeleton className="h-10 w-36 rounded-full" />
        <Skeleton className="mt-6 h-12 w-full max-w-xl rounded-2xl" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="min-h-44 rounded-3xl" />
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
        <Skeleton className="mx-6 h-12 w-72 rounded-2xl sm:mx-10" />
        <Skeleton className="mx-6 mt-3 h-6 w-full max-w-xl rounded-xl sm:mx-10" />
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
        <Skeleton className="mx-auto h-10 w-32 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-12 w-80 rounded-2xl" />
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

const MotionAccordion = motion.create(Accordion);

const faqItems = [
  {
    title: "Is This Website Finished?",
    subtitle: "Probably never — and that’s the point",
    content:
      "This site is an ongoing experiment. I’m constantly refining interactions, adding new ideas, and occasionally breaking things while trying something new.",
    iconUrl: "/icons/rocket.png",
  },
  {
    title: "How Fast Do You Reply?",
    subtitle: "Usually within a few days",
    content:
      "I read every message myself. Replies may take a little time, but I’ll usually get back to you within a few days.",
    iconUrl: "/icons/mail.png",
  },
  {
    title: "What Do You Like Building?",
    subtitle: "Design, technology, and everything in between",
    content:
      "I’m drawn to digital experiences where thoughtful design, technology, and storytelling come together — especially ideas that leave room for experimentation.",
    iconUrl: "https://img.icons8.com/3d-fluency/94/adobe-animate.png",
  },
  {
    title: "What’s on the Desk?",
    subtitle: "One stack, fewer adapters",
    content:
      "Apple is the whole desk — Mac, iPhone, AirPods. Quiet is a tool. Chat noise waits; a closed door is how the work gets finished.",
    iconUrl: "https://img.icons8.com/3d-fluency/94/imac.png",
  },
  {
    title: "How Do I Leave a Trace?",
    subtitle: "Sign the guestbook",
    content:
      "Reading is open to everyone. If you want to mark your visit, sign in and leave a short note on the guestbook wall — I read every message.",
    iconUrl: "/icons/mail.png",
  },
];

export default function Home() {
  const mounted = useMounted();
  const shouldReduceMotion = useReducedMotionPreference();
  const [isGuestbookPopoverOpen, setIsGuestbookPopoverOpen] = useState(false);

  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const { reveal, revealInView } = createPageReveal(shouldReduceMotion);

  return (
    <div className="bg-background w-full overflow-x-clip">
      <section
        aria-labelledby="home-hero-title"
        className="mx-auto flex min-h-[100dvh] w-full flex-col items-center justify-center px-6 pt-24 pb-16 text-center sm:px-10"
      >
        <MotionChip color="accent" size="sm" variant="soft" {...reveal(0.05, 10)}>
          A personal field journal
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
          A living notebook, kept in motion.
        </MotionTypography>

        <MotionTypography color="muted" type="body" className="mt-4 max-w-xl" {...reveal(0.26, 14)}>
          Software, markets, music, and the habits that shape the work.
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
            Prologue · 01
          </Typography>
          <span className="bg-separator my-4 h-12 w-px" aria-hidden="true" />
          <Typography align="center" color="muted" type="body-sm" className="max-w-md italic">
            Begin with what is close at hand. A song still playing, a market moving, a thought not
            yet finished.
          </Typography>
          <motion.span
            aria-hidden="true"
            className="bg-foreground/55 mt-6 block size-1.5 rounded-full"
            animate={shouldReduceMotion ? undefined : { opacity: [0.28, 0.9, 0.28], y: [0, 5, 0] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
          />
        </MotionSurface>
      </section>

      <HomeOrientation />

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
                alt="Guestbook decorative animation"
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
            Guestbook
          </MotionChip>

          <motion.div className="mt-3" {...revealInView(0.04, 8)}>
            <Link href="/guestbook" className="text-sm no-underline">
              Open the guestbook
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
              {"Since you're here,"}
            </GradientText>
          </MotionTypography>

          <MotionTypography
            align="center"
            type="h3"
            className="text-center text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.08] tracking-[-0.04em] text-balance"
            {...revealInView(0.06)}
          >
            <GradientText className="pointer-events-none cursor-default !rounded-none bg-transparent !p-0 shadow-none backdrop-blur-none ![font:inherit]">
              {"tell me what's on your mind."}
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
                  <Card.Title className="text-base">Sign in to add an entry</Card.Title>
                  <Card.Description>
                    Reading is open to everyone. Sign in to leave a note or reply.
                  </Card.Description>
                </Card.Header>
                <Card.Footer>
                  <Button size="sm" onPress={() => dispatch(setLoginOpen(true))}>
                    Sign in to write
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
            FAQ
          </MotionChip>
          <MotionTypography
            id="faq-title"
            align="center"
            type="h2"
            weight="bold"
            className="mt-4 text-[clamp(2rem,4vw,3.75rem)] tracking-[-0.04em]"
            {...revealInView(0.06)}
          >
            Questions, answered.
          </MotionTypography>
          <MotionTypography
            align="center"
            type="body"
            color="muted"
            className="mt-3 max-w-xl text-balance"
            {...revealInView(0.12, 14)}
          >
            Some answers to questions that tend to come up.
          </MotionTypography>
        </header>

        <MotionAccordion
          className="bg-surface-1/10 mt-12 w-full rounded-2xl"
          variant="surface"
          {...revealInView(0.18, 20)}
        >
          {faqItems.map((item, index) => (
            <Accordion.Item
              key={index}
              className="group/item first:**:data-[slot=accordion-trigger]:rounded-t-2xl last:[&:not(:has([data-slot=accordion-trigger][aria-expanded='true']))_[data-slot=accordion-trigger]]:rounded-b-2xl"
            >
              <Accordion.Heading>
                <Accordion.Trigger className="group hover:bg-surface flex items-center gap-2 transition-none">
                  {item.iconUrl ? (
                    <Image
                      alt={item.title}
                      className="h-11 w-11 transition-[scale,rotate] duration-300 ease-out group-hover/item:scale-120 group-hover/item:-rotate-10 group-hover/item:drop-shadow-lg"
                      src={item.iconUrl}
                      width={44}
                      height={44}
                    />
                  ) : null}
                  <div className="flex flex-col gap-0 text-start">
                    <span className="leading-5 font-medium">{item.title}</span>
                    <span className="text-muted/80 leading-6 font-normal">{item.subtitle}</span>
                  </div>
                  <Accordion.Indicator className="text-muted/50 [&>svg]:size-4">
                    <Icon icon="gravity-ui:chevron-down" />
                  </Accordion.Indicator>
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body className="text-muted/80 text-start">{item.content}</Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </MotionAccordion>
      </section>
    </div>
  );
}

interface GuestbookQuickFormProps {
  onClose: () => void;
}

function GuestbookQuickForm({ onClose }: GuestbookQuickFormProps) {
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
      toast.danger(
        getApiErrorMessage(err, "Unable to post your guestbook entry. Please try again.")
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-3 text-start">
        <div className="flex items-center gap-2">
          <span className="text-accent text-base">✨</span>
          <Popover.Heading className="text-foreground text-sm font-semibold tracking-tight">
            Sign the Guestbook
          </Popover.Heading>
        </div>
        <p className="text-muted/80 text-[11px] leading-relaxed">
          Leave a message on our wall to mark your visit. Reading is open to everyone, but writing
          requires a quick sign-in.
        </p>
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
            Sign in to write
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted/80 h-8 px-3 text-xs font-medium"
            onPress={onClose}
          >
            Close
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
          Before You Go
        </Popover.Heading>
      </div>

      <div className="flex w-full flex-col gap-2">
        <TextArea
          aria-label="Guestbook message"
          placeholder="Write something for the next explorer..."
          rows={3}
          maxLength={280}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
        />
        <Description id="textarea-controlled-description">
          Characters: {content.length} / 280
        </Description>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button size="sm" fullWidth variant="ghost" onPress={onClose} isDisabled={isLoading}>
          Cancel
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
              Posting...
            </>
          ) : (
            <>
              <Icon icon="lucide:send" className="size-3.5" />
              Submit
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
