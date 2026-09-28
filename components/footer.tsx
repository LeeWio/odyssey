"use client";

import { pageRevealInView } from "@/lib/motion";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

import { Card, Link, Skeleton, toast } from "@heroui/react";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import type { CarouselCard } from "@/components/card/minimal-carousel";
import { ModeSwitch } from "./theme-switch";

const MinimalCarousel = dynamic(
  () => import("@/components/card/minimal-carousel").then((mod) => mod.MinimalCarousel),
  {
    ssr: false,
    loading: () => <Skeleton className="h-40 w-full rounded-3xl" />,
  }
);

const NewsletterSubscribeForm = dynamic(
  () =>
    import("@/features/newsletter/newsletter-subscribe-form").then(
      (mod) => mod.NewsletterSubscribeForm
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-10 w-full max-w-lg rounded-xl" />,
  }
);

const footerLinks = [
  { href: "/chronicle", labelKey: "chronicle" },
  { href: "/universe", labelKey: "universe" },
  { href: "/guestbook", labelKey: "guestbook" },
] as const;

interface IdentityIconProps {
  size?: number | string;
  className?: string;
}

const GitHubIcon = ({ size, className }: IdentityIconProps) => (
  <Icon
    aria-hidden="true"
    icon="simple-icons:github"
    width={size}
    height={size}
    className={className}
  />
);

const EmailIcon = ({ size, className }: IdentityIconProps) => (
  <Icon aria-hidden="true" icon="lucide:mail" width={size} height={size} className={className} />
);

const RssIcon = ({ size, className }: IdentityIconProps) => (
  <Icon aria-hidden="true" icon="lucide:rss" width={size} height={size} className={className} />
);

const XIcon = ({ size, className }: IdentityIconProps) => (
  <Icon aria-hidden="true" icon="simple-icons:x" width={size} height={size} className={className} />
);

const identityCards: Array<
  Omit<CarouselCard, "title" | "value" | "compactValue"> & {
    titleKey: "github" | "email" | "rss" | "x";
    value?: string;
    valueKey?: "rssValue";
    compactValue?: string;
    compactValueKey?: "rssCompact";
  }
> = [
  {
    id: "github",
    titleKey: "github",
    value: "LeeWio",
    color: "success",
    icon: GitHubIcon,
  },
  {
    id: "email",
    titleKey: "email",
    value: "just.vireo@gmail.com",
    compactValue: "just.vireo",
    color: "accent",
    icon: EmailIcon,
  },
  {
    id: "rss",
    titleKey: "rss",
    valueKey: "rssValue",
    compactValueKey: "rssCompact",
    color: "warning",
    icon: RssIcon,
  },
  {
    id: "x",
    titleKey: "x",
    value: "wei.li",
    color: "danger",
    icon: XIcon,
  },
];

const identityLinks: Record<string, string> = {
  github: "https://github.com/LeeWio",
  email: "mailto:just.vireo@gmail.com",
  rss: "/rss.xml",
  x: "https://x.com/lwi1817612?s=11",
};

export function Footer() {
  const t = useTranslations("Footer");
  const shouldReduceMotion = useReducedMotionPreference();

  const reveal = (delay = 0) =>
    pageRevealInView(shouldReduceMotion, delay, 14, { duration: 0.6, margin: "-40px" });

  const cards: CarouselCard[] = identityCards.map((card) => ({
    ...card,
    title: t(card.titleKey),
    value: card.valueKey ? t(card.valueKey) : (card.value ?? ""),
    compactValue: card.compactValueKey ? t(card.compactValueKey) : card.compactValue,
  }));

  const handleCopy = async (card: CarouselCard) => {
    const value = card.id === "rss" ? `${window.location.origin}/rss.xml` : card.value;

    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("copied", { name: card.title }));
    } catch {
      toast.danger(t("copyFailed", { name: card.title }));
    }
  };

  const handleVisit = (card: CarouselCard) => {
    const href = identityLinks[card.id];

    if (href.startsWith("http")) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    window.location.assign(href);
  };

  return (
    <footer className="w-full">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pt-20 pb-8 sm:px-10 sm:pt-28">
        <motion.div {...reveal()}>
          <Card variant="secondary" className="gap-6 p-6 sm:p-8">
            <Card.Header className="max-w-xl gap-2 p-0">
              <Card.Title className="text-2xl tracking-[-0.03em]">
                {t("newsletterTitle")}
              </Card.Title>
              <Card.Description>{t("newsletterDescription")}</Card.Description>
            </Card.Header>
            <Card.Content className="p-0">
              <div className="max-w-lg">
                <NewsletterSubscribeForm variant="inline" />
              </div>
            </Card.Content>
          </Card>
        </motion.div>

        <motion.div {...reveal(0.08)} className="mx-auto w-full max-w-105">
          <MinimalCarousel
            cards={cards}
            copyLabel={t("copy")}
            actionLabel={t("visit")}
            onCopyClick={handleCopy}
            onCustomizeClick={handleVisit}
          />
        </motion.div>

        <motion.div
          {...reveal(0.16)}
          className="border-divider flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-sm">
            <p className="text-foreground text-sm font-semibold">Odyssey</p>
            <p className="text-muted mt-2 text-sm leading-6">{t("tagline")}</p>
          </div>
          <nav aria-label={t("navigation")} className="flex flex-wrap gap-x-5 gap-y-2">
            {footerLinks.map((item) => (
              <Link
                key={item.labelKey}
                className="text-sm"
                href={item.href}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                target={item.href.startsWith("http") ? "_blank" : undefined}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </motion.div>

        <motion.div
          {...reveal(0.24)}
          className="text-muted flex flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span>© 2026 Odyssey</span>
            <Link href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
              鄂ICP备2026038770号-1
            </Link>
            <Link
              className="flex items-center gap-1"
              href="https://beian.mps.gov.cn/#/query/webSearch?code=44030002016102"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                alt=""
                aria-hidden="true"
                height={16}
                src="https://beian.mps.gov.cn/web/assets/logo01.6189a29f.png"
                width={16}
              />
              粤公网安备44030002016102号
            </Link>
          </div>
          <ModeSwitch size="sm" variant="default" />
        </motion.div>
      </div>
    </footer>
  );
}
