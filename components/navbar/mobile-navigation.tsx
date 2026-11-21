"use client";

import { ArrowUpRight, Bars, BookOpen, Comment, Hammer, MapPin } from "@gravity-ui/icons";
import { Button, Link, Sheet, Tooltip, Typography } from "@heroui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { DestinationLink } from "@/components/ui/destination-link";

import { DESKTOP_NAVIGATION_MEDIA } from "./navigation-data";

type AuthMode = "login" | "signup";

const PRIMARY_DESTINATIONS = [
  {
    href: "/single",
    title: "items.chronicle.label",
    description: "items.chronicle.description",
    icon: BookOpen,
  },
  {
    href: "/moments",
    title: "mega.archive.moments",
    description: "mega.archive.momentsDescription",
    icon: Comment,
  },
  {
    href: "/projects",
    title: "mobile.projects",
    description: "mobile.projectsDescription",
    icon: Hammer,
  },
  {
    href: "/footprints",
    title: "mobile.footprints",
    description: "mobile.footprintsDescription",
    icon: MapPin,
  },
] as const;

const MORE_DESTINATIONS = [
  { href: "/columns", title: "mega.archive.columns" },
  { href: "/archive", title: "mega.archive.readByDate" },
  { href: "/persona", title: "items.orbit.label" },
  { href: "/gallery", title: "items.travelogue.label" },
  { href: "/uses", title: "mega.archive.uses" },
  { href: "/library", title: "readingLibrary" },
] as const;

export function MobileNavigation({
  showGuestActions,
  onOpenAuth,
}: {
  showGuestActions: boolean;
  onOpenAuth: (mode: AuthMode) => void;
}) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const pendingAuth = useRef<AuthMode | null>(null);

  useEffect(() => {
    const viewport = window.matchMedia(DESKTOP_NAVIGATION_MEDIA);
    const closeOnDesktop = ({ matches }: MediaQueryListEvent) => {
      if (matches) setIsOpen(false);
    };
    viewport.addEventListener("change", closeOnDesktop);
    return () => viewport.removeEventListener("change", closeOnDesktop);
  }, []);

  const close = () => setIsOpen(false);

  const requestAuth = (mode: AuthMode) => {
    pendingAuth.current = mode;
    close();
  };

  return (
    <div className="lg:hidden">
      <Sheet
        isOpen={isOpen}
        placement="right"
        onOpenChange={setIsOpen}
        onAnimationEnd={(open) => {
          if (open || pendingAuth.current === null) return;
          const mode = pendingAuth.current;
          pendingAuth.current = null;
          onOpenAuth(mode);
        }}
      >
        <Sheet.Trigger>
          <Tooltip>
            <Button aria-label={t("openMenu")} isIconOnly variant="ghost">
              <Bars aria-hidden="true" className="size-5" />
            </Button>
            <Tooltip.Content>{t("openMenu")}</Tooltip.Content>
          </Tooltip>
        </Sheet.Trigger>
        <Sheet.Backdrop>
          <Sheet.Content>
            <Sheet.Dialog>
              <Sheet.CloseTrigger aria-label={t("closeMenu")} />
              <Sheet.Header>
                <Sheet.Heading>{t("dialogLabel")}</Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body>
                <nav aria-label={t("sections")} className="grid gap-5">
                  <Typography color="muted" type="body-sm">
                    {t("mobile.description")}
                  </Typography>
                  <ul className="grid gap-1">
                    {PRIMARY_DESTINATIONS.map(({ href, title, description, icon: Icon }) => (
                      <li key={href}>
                        <DestinationLink
                          description={t(description)}
                          href={href}
                          icon={<Icon />}
                          isCurrent={pathname === href}
                          onNavigate={close}
                          title={t(title)}
                        />
                      </li>
                    ))}
                  </ul>
                  <div className="grid gap-3">
                    <Typography id="mobile-navigation-more" type="body-sm" weight="semibold">
                      {t("mobile.more")}
                    </Typography>
                    <ul
                      aria-labelledby="mobile-navigation-more"
                      className="grid grid-cols-2 gap-x-3 gap-y-2"
                    >
                      {MORE_DESTINATIONS.map(({ href, title }) => (
                        <li key={href} className="min-w-0">
                          <Link
                            aria-current={pathname === href ? "page" : undefined}
                            className="min-h-11"
                            href={href}
                            render={(props) =>
                              "href" in props ? (
                                <NextLink {...props} onNavigate={close} prefetch={false} />
                              ) : (
                                <span {...props} />
                              )
                            }
                          >
                            {t(title)}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link
                          aria-label={t("travellingsAria")}
                          className="min-h-11 gap-1"
                          href="https://www.travellings.cn/go.html"
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {t("travellings")}
                          <Link.Icon aria-hidden="true">
                            <ArrowUpRight />
                          </Link.Icon>
                        </Link>
                      </li>
                    </ul>
                  </div>
                </nav>
              </Sheet.Body>
              {showGuestActions ? (
                <Sheet.Footer>
                  <Button variant="secondary" onPress={() => requestAuth("login")}>
                    {t("signIn")}
                  </Button>
                  <Button onPress={() => requestAuth("signup")}>{t("createAccount")}</Button>
                </Sheet.Footer>
              ) : null}
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    </div>
  );
}
