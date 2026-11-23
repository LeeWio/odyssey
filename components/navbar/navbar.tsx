"use client";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

import { Button, Dropdown, Kbd, Label, Link as HeroLink, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useHotkeys, useMounted, useOs } from "@mantine/hooks";
import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectUserEmail,
  useLogoutMutation,
} from "@/lib/features/auth";
import { useGetCurrentUserQuery } from "@/lib/features/user";
import { useGetUnreadNotificationCountQuery } from "@/lib/features/notification";
import { UserAvatar } from "@/components/user-avatar";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { selectAuthMode, setAuthMode } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useDashboardNavigation } from "@/lib/hooks/use-dashboard-navigation";
import { commentDebug } from "@/lib/comment-debug";
import { SearchIcon } from "../icons";

import { getVisibleFocusableElements } from "./focus";
import { MegaPanelContent } from "./mega-panel-content";
import { MobileNavigation } from "./mobile-navigation";
import { activeIndicatorSpring, enterEase, exitEase, navigationSpring } from "./motion";
import { DESKTOP_NAVIGATION_MEDIA, getNavigationItem } from "./navigation-data";
import type { NavigationId } from "./types";

const AuthDialog = dynamic(() => import("../auth").then((mod) => mod.AuthDialog), {
  ssr: false,
});

const CommandPalette = dynamic(
  () => import("../command-palette").then((mod) => mod.CommandPalette),
  { ssr: false }
);

const NotificationPopover = dynamic(
  () =>
    import("@/features/notification/notification-popover").then((mod) => mod.NotificationPopover),
  { ssr: false }
);

export const Navbar = () => {
  const t = useTranslations("Nav");
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const os = useOs();
  const reduceMotion = useReducedMotionPreference();
  const dispatch = useAppDispatch();
  const { toggleDashboard } = useDashboardNavigation();
  const [logout] = useLogoutMutation();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const navigationContentRef = useRef<HTMLElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const compactStateRef = useRef(false);
  const brandRef = useRef<HTMLDivElement>(null);
  const navigationItemsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
  const email = useAppSelector(selectUserEmail);
  const authMode = useAppSelector(selectAuthMode);
  const { data: currentUser } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [activeNavigation, setActiveNavigation] = useState<NavigationId | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hasOpenedSearch, setHasOpenedSearch] = useState(false);
  const [hasOpenedAuth, setHasOpenedAuth] = useState(false);
  // Feature actions can open auth without passing through the navigation triggers.
  if (authMode !== null && !hasOpenedAuth) setHasOpenedAuth(true);
  const [isCompact, setIsCompact] = useState(false);
  const [navigationWidths, setNavigationWidths] = useState({
    compact: 0,
    expanded: 0,
    panel: 0,
  });
  const { data: unreadNotificationCount = 0 } = useGetUnreadNotificationCountQuery(undefined, {
    pollingInterval: 60_000,
    skip: !isAuthenticated,
  });
  const activeItem = getNavigationItem(activeNavigation, t);
  const platformKey = mounted && (os === "macos" || os === "ios") ? "⌘" : "Ctrl";

  useHotkeys(
    [
      [
        "mod+k",
        () => {
          setHasOpenedSearch(true);
          setIsSearchOpen((open) => !open);
        },
      ],
    ],
    [],
    true
  );

  const cancelClose = useCallback(() => {
    if (!closeTimer.current) return;
    clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const cancelPreview = useCallback(() => {
    if (!previewTimer.current) return;
    clearTimeout(previewTimer.current);
    previewTimer.current = null;
  }, []);

  const closeNavigation = () => {
    cancelClose();
    cancelPreview();
    setActiveNavigation(null);
    setIsLocked(false);
    window.requestAnimationFrame(() => lastTriggerRef.current?.focus());
  };

  const scheduleClose = () => {
    cancelClose();
    cancelPreview();
    if (isLocked) return;
    closeTimer.current = setTimeout(() => setActiveNavigation(null), 180);
  };

  const previewNavigation = (id: NavigationId) => {
    cancelClose();
    cancelPreview();
    if (activeNavigation === id) return;

    previewTimer.current = setTimeout(() => {
      previewTimer.current = null;
      setActiveNavigation(id);
    }, 100);
  };

  const toggleNavigation = (id: NavigationId) => {
    cancelClose();
    cancelPreview();
    if (activeNavigation === id && isLocked) {
      closeNavigation();
      return;
    }
    setActiveNavigation(id);
    setIsLocked(true);
  };

  const openNavigationFromKeyboard = (id: NavigationId, trigger: HTMLElement) => {
    cancelClose();
    cancelPreview();
    lastTriggerRef.current = trigger;
    setActiveNavigation(id);
    setIsLocked(true);
  };

  useEffect(() => {
    if (!activeNavigation) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelClose();
        cancelPreview();
        setActiveNavigation(null);
        setIsLocked(false);
        window.requestAnimationFrame(() => lastTriggerRef.current?.focus());
      }

      if (event.key !== "Tab" || !isLocked) return;
      const focusable = getVisibleFocusableElements(panelRef.current);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [activeNavigation, cancelClose, cancelPreview, isLocked]);

  useEffect(() => {
    if (!isLocked) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let focusFrame = window.requestAnimationFrame(() => {
      focusFrame = window.requestAnimationFrame(() =>
        getVisibleFocusableElements(navigationContentRef.current)[0]?.focus()
      );
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
    };
  }, [isLocked]);

  useEffect(() => {
    const viewport = window.matchMedia(DESKTOP_NAVIGATION_MEDIA);
    const closeDesktopNavigation = ({ matches }: MediaQueryListEvent) => {
      if (matches) return;
      cancelClose();
      cancelPreview();
      setActiveNavigation(null);
      setIsLocked(false);
    };
    viewport.addEventListener("change", closeDesktopNavigation);
    return () => viewport.removeEventListener("change", closeDesktopNavigation);
  }, [cancelClose, cancelPreview]);

  useEffect(
    () => () => {
      cancelClose();
      cancelPreview();
    },
    [cancelClose, cancelPreview]
  );

  useEffect(() => {
    const updateCompactState = () => {
      if (document.documentElement.style.overflow === "hidden") {
        commentDebug("navbar:scroll-ignored", { reason: "html-overflow-hidden" });
        return;
      }

      const scrollTop = window.scrollY;
      const nextCompact = compactStateRef.current ? scrollTop > 24 : scrollTop > 64;

      if (nextCompact === compactStateRef.current) return;
      compactStateRef.current = nextCompact;
      setIsCompact(nextCompact);
      commentDebug("navbar:compact-state", { nextCompact, scrollTop });
    };

    updateCompactState();
    window.addEventListener("scroll", updateCompactState, { passive: true });

    return () => window.removeEventListener("scroll", updateCompactState);
  }, []);

  useEffect(() => {
    const measureNavigation = () => {
      if (document.documentElement.style.overflow === "hidden") {
        commentDebug("navbar:measure-ignored", { reason: "html-overflow-hidden" });
        return;
      }

      const panel = panelRef.current;
      const navigation = navigationRef.current;
      if (!panel || !navigation) return;

      const brandWidth = brandRef.current?.offsetWidth ?? 0;
      const navigationItemsWidth = navigationItemsRef.current?.offsetWidth ?? 0;
      const actionsWidth = actionsRef.current?.offsetWidth ?? 0;
      const navigationStyle = window.getComputedStyle(navigation);
      const horizontalPadding =
        Number.parseFloat(navigationStyle.paddingLeft) +
        Number.parseFloat(navigationStyle.paddingRight);
      const columnGap = Number.parseFloat(navigationStyle.columnGap) || 0;
      const panelBorder = panel.offsetWidth - panel.clientWidth;
      const viewportWidth = document.documentElement.clientWidth;
      const panelWidth = Math.max(viewportWidth - 32, 0);
      const compactWidth = Math.min(
        Math.ceil(
          brandWidth +
            navigationItemsWidth +
            actionsWidth +
            horizontalPadding +
            columnGap * 2 +
            panelBorder
        ),
        panelWidth
      );
      const expandedWidth = viewportWidth;

      commentDebug("navbar:measure", { compactWidth, expandedWidth, panelWidth: panelWidth });

      setNavigationWidths((current) => {
        if (
          current.compact === compactWidth &&
          current.expanded === expandedWidth &&
          current.panel === panelWidth
        ) {
          return current;
        }

        return {
          compact: compactWidth,
          expanded: expandedWidth,
          panel: panelWidth,
        };
      });
    };

    const resizeObserver = new ResizeObserver(measureNavigation);
    // The panel animates toward these measurements. Observe the content, so that
    // intermediate widths do not feed back into the spring's destination.
    const observedElements = [brandRef.current, navigationItemsRef.current, actionsRef.current];

    observedElements.forEach((element) => {
      if (element) resizeObserver.observe(element);
    });

    const animationFrame = window.requestAnimationFrame(measureNavigation);
    window.addEventListener("resize", measureNavigation);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", measureNavigation);
      resizeObserver.disconnect();
    };
  }, []);

  const handleLogout = () => {
    void logout();
  };

  const openAuth = (mode: "login" | "signup") => {
    setHasOpenedAuth(true);
    dispatch(setAuthMode(mode));
  };

  const isNavigationOpen = Boolean(activeItem);
  const hasGlassSurface = isCompact || isNavigationOpen;
  const glassBackground =
    resolvedTheme === "light" ? "rgba(255, 255, 255, 0.34)" : "rgba(12, 10, 18, 0.22)";
  const glassBorder =
    resolvedTheme === "light" ? "rgba(17, 17, 20, 0.08)" : "rgba(255, 255, 255, 0.1)";
  const targetNavigationWidth = isNavigationOpen
    ? navigationWidths.panel
    : isCompact
      ? navigationWidths.compact
      : navigationWidths.expanded;

  useEffect(() => {
    commentDebug("navbar:render", {
      isCompact,
      isNavigationOpen,
      targetNavigationWidth,
      navigationWidths,
    });
  });

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const panel = panelRef.current;
    if (!panel) return;

    const resizeObserver = new ResizeObserver(() => {
      const bounds = panel.getBoundingClientRect();
      commentDebug("navbar:resize", {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        htmlOverflow: document.documentElement.style.overflow,
      });
    });
    resizeObserver.observe(panel);
    const mutationObserver = new MutationObserver((mutations) => {
      commentDebug("navbar:dom-mutation", {
        mutations: mutations.map((mutation) => mutation.attributeName),
        htmlOverflow: document.documentElement.style.overflow,
        bodyOverflow: document.body.style.overflow,
      });
    });
    mutationObserver.observe(panel, { attributes: true, attributeFilter: ["style", "class"] });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  // Micro-stagger orchestrator for left-hand header elements
  const textEntrance = {
    hidden: { opacity: 0, y: 6, filter: "blur(2px)" },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        delay: 0.01 + i * 0.018,
        duration: 0.15,
        ease: enterEase,
      },
    }),
  };

  return (
    <>
      <AnimatePresence>
        {isNavigationOpen && (
          <motion.button
            key="navigation-backdrop"
            type="button"
            tabIndex={-1}
            aria-label={t("closeNavigation")}
            className="fixed inset-0 z-40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: reduceMotion ? 0 : 0.12, ease: exitEase },
            }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: enterEase }}
            onClick={closeNavigation}
          />
        )}
      </AnimatePresence>

      <motion.div
        ref={panelRef}
        data-compact={isCompact}
        role={isLocked ? "dialog" : undefined}
        aria-modal={isLocked || undefined}
        aria-label={isLocked ? t("dialogLabel") : undefined}
        className="fixed inset-x-0 top-0 z-50 mx-auto w-full overflow-hidden rounded-2xl border"
        initial={false}
        animate={{
          opacity: 1,
          width: targetNavigationWidth || "100%",
          y: isNavigationOpen ? 16 : isCompact ? 12 : 0,
          backgroundColor: hasGlassSurface ? glassBackground : "rgba(0, 0, 0, 0)",
          borderColor: hasGlassSurface ? glassBorder : "rgba(0, 0, 0, 0)",
          boxShadow: hasGlassSurface ? "0 14px 40px rgba(0, 0, 0, 0.08)" : "0 0 0 rgba(0, 0, 0, 0)",
          backdropFilter: hasGlassSurface ? "blur(16px) saturate(1.2)" : "blur(0px) saturate(1)",
        }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                opacity: { duration: 0.2, ease: enterEase },
                width: navigationSpring,
                y: navigationSpring,
                backgroundColor: { duration: 0.18, ease: enterEase },
                borderColor: { duration: 0.18, ease: enterEase },
                boxShadow: { duration: 0.18, ease: enterEase },
                backdropFilter: { duration: 0.18, ease: enterEase },
              }
        }
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <motion.nav
          ref={navigationRef}
          aria-label={t("primary")}
          className="grid w-full grid-cols-[auto_1fr] items-center justify-between gap-3 px-2.5 py-0.5 lg:grid-cols-[max-content_max-content_max-content]"
        >
          <motion.div
            ref={brandRef}
            className="justify-self-start"
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          >
            <Link href="/" onClick={closeNavigation} aria-label={t("home")}>
              <Image
                src="/favicon.svg"
                alt=""
                width={30}
                height={30}
                unoptimized
                className="size-[30px]"
              />
            </Link>
          </motion.div>

          {/* Static unrolled main navigation items */}
          <motion.div ref={navigationItemsRef} className="hidden items-center gap-1 lg:flex">
            {/* Item 1: Chronicle */}
            <div
              className="relative"
              onMouseEnter={() => previewNavigation("chronicle")}
              onMouseLeave={cancelPreview}
            >
              {activeNavigation === "chronicle" && (
                <motion.div
                  layoutId="navigation-active"
                  className="bg-default absolute inset-0 rounded-xl"
                  transition={reduceMotion ? { duration: 0 } : activeIndicatorSpring}
                />
              )}
              <Button
                size="sm"
                variant="ghost"
                aria-haspopup="dialog"
                aria-expanded={activeNavigation === "chronicle"}
                aria-controls="odyssey-mega-navigation"
                onFocus={(event) => {
                  lastTriggerRef.current = event.currentTarget as HTMLElement;
                }}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowDown") return;
                  event.preventDefault();
                  openNavigationFromKeyboard("chronicle", event.currentTarget);
                }}
                onPress={() => toggleNavigation("chronicle")}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  {t("items.chronicle.label")}
                  {activeNavigation === "chronicle" && isLocked && (
                    <span className="bg-accent size-1 rounded-full" aria-hidden="true" />
                  )}
                </span>
              </Button>
            </div>

            {/* Item 2: Orbit */}
            <div
              className="relative"
              onMouseEnter={() => previewNavigation("daily")}
              onMouseLeave={cancelPreview}
            >
              {activeNavigation === "daily" && (
                <motion.div
                  layoutId="navigation-active"
                  className="bg-default absolute inset-0 rounded-xl"
                  transition={reduceMotion ? { duration: 0 } : activeIndicatorSpring}
                />
              )}
              <Button
                size="sm"
                variant="ghost"
                aria-haspopup="dialog"
                aria-expanded={activeNavigation === "daily"}
                aria-controls="odyssey-mega-navigation"
                onFocus={(event) => {
                  lastTriggerRef.current = event.currentTarget as HTMLElement;
                }}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowDown") return;
                  event.preventDefault();
                  openNavigationFromKeyboard("daily", event.currentTarget);
                }}
                onPress={() => toggleNavigation("daily")}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  {t("items.orbit.label")}
                  {activeNavigation === "daily" && isLocked && (
                    <span className="bg-accent size-1 rounded-full" aria-hidden="true" />
                  )}
                </span>
              </Button>
            </div>

            {/* Item 3: Archive */}
            <div
              className="relative"
              onMouseEnter={() => previewNavigation("more")}
              onMouseLeave={cancelPreview}
            >
              {activeNavigation === "more" && (
                <motion.div
                  layoutId="navigation-active"
                  className="bg-default absolute inset-0 rounded-xl"
                  transition={reduceMotion ? { duration: 0 } : activeIndicatorSpring}
                />
              )}
              <Button
                size="sm"
                variant="ghost"
                aria-haspopup="dialog"
                aria-expanded={activeNavigation === "more"}
                aria-controls="odyssey-mega-navigation"
                onFocus={(event) => {
                  lastTriggerRef.current = event.currentTarget as HTMLElement;
                }}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowDown") return;
                  event.preventDefault();
                  openNavigationFromKeyboard("more", event.currentTarget);
                }}
                onPress={() => toggleNavigation("more")}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  {t("items.archive.label")}
                  {activeNavigation === "more" && isLocked && (
                    <span className="bg-accent size-1 rounded-full" aria-hidden="true" />
                  )}
                </span>
              </Button>
            </div>

            <HeroLink
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm no-underline"
              href="https://www.travellings.cn/go.html"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("travellingsAria")}
            >
              <Icon aria-hidden="true" icon="lucide:train-front" className="size-4" />
              <span>{t("travellings")}</span>
            </HeroLink>
          </motion.div>

          <motion.div
            ref={actionsRef}
            className="flex shrink-0 items-center gap-1.5 justify-self-end"
          >
            <Tooltip delay={500} closeDelay={100}>
              <Button
                isIconOnly
                variant="ghost"
                className="lg:hidden"
                aria-label={t("search")}
                onPress={() => {
                  setHasOpenedSearch(true);
                  setIsSearchOpen(true);
                }}
              >
                <SearchIcon aria-hidden="true" size={16} />
              </Button>
              <Tooltip.Content placement="bottom" offset={8}>
                {t("search")}
              </Tooltip.Content>
            </Tooltip>

            <div className="hidden lg:block">
              <Button
                variant="tertiary"
                aria-label={t("searchShortcut", { key: platformKey })}
                onPress={() => {
                  setHasOpenedSearch(true);
                  setIsSearchOpen(true);
                }}
              >
                <SearchIcon aria-hidden="true" size={14} />
                <span className="text-xs font-medium">{t("search")}</span>
                <Kbd variant="light" aria-hidden="true">
                  <Kbd.Abbr keyValue={platformKey === "⌘" ? "command" : "ctrl"} />
                  <Kbd.Content>K</Kbd.Content>
                </Kbd>
              </Button>
            </div>

            <LocaleSwitcher />

            {mounted && isAuthenticated ? <NotificationPopover /> : null}

            {mounted && isAuthenticated ? (
              <Dropdown>
                <Tooltip delay={500} closeDelay={100}>
                  <Dropdown.Trigger aria-label={t("openAccount")}>
                    <UserAvatar
                      size="sm"
                      className="size-8"
                      name={username || t("user")}
                      avatar={currentUser?.avatar}
                      email={email}
                    />
                  </Dropdown.Trigger>
                  <Tooltip.Content placement="bottom" offset={8}>
                    {t("account")}
                  </Tooltip.Content>
                </Tooltip>
                <Dropdown.Popover className="min-w-[250px]">
                  <div className="px-3 pt-3 pb-2">
                    <p className="truncate text-sm font-semibold">{username || t("user")}</p>
                    <p className="text-muted truncate text-xs">{email || t("ownerAccount")}</p>
                  </div>
                  <Dropdown.Menu
                    aria-label={t("accountActions")}
                    onAction={(key) => {
                      if (key === "dashboard") toggleDashboard();
                      if (key === "library") router.push("/library");
                      if (key === "notifications") router.push("/notifications");
                      if (key === "logout") handleLogout();
                    }}
                  >
                    <Dropdown.Item id="dashboard" textValue={t("dashboard")}>
                      <Label>{t("dashboard")}</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="library" textValue={t("readingLibrary")}>
                      <Label>{t("readingLibrary")}</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="notifications" textValue={t("notifications")}>
                      <Label>
                        {t("notifications")}
                        {unreadNotificationCount > 0 ? ` (${unreadNotificationCount})` : ""}
                      </Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="logout" textValue={t("logOut")} variant="danger">
                      <Label>{t("logOut")}</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="hidden lg:flex"
                onPress={() => openAuth("login")}
              >
                {t("signIn")}
              </Button>
            )}

            <MobileNavigation
              showGuestActions={mounted && !isAuthenticated}
              onOpenAuth={openAuth}
            />
          </motion.div>
        </motion.nav>

        <AnimatePresence initial={false} propagate>
          {isNavigationOpen && (
            <motion.section
              ref={navigationContentRef}
              key="mega-navigation-content"
              id="odyssey-mega-navigation"
              aria-label={
                activeItem ? t("sectionOverview", { name: activeItem.label }) : t("sections")
              }
              className="max-h-[calc(100dvh-5.5rem)]"
              style={{ overflow: "hidden" }}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto", transitionEnd: { overflow: "auto" } }}
              exit={{
                opacity: 0,
                height: 0,
                overflow: "hidden",
                transition: { duration: reduceMotion ? 0 : 0.16, ease: exitEase },
              }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: enterEase }}
            >
              <div className="px-5 py-7 sm:px-8 md:px-12 md:py-9 xl:px-16 2xl:px-20">
                {activeItem && (
                  <AnimatePresence mode="popLayout" initial={false} propagate>
                    <motion.div
                      key={activeItem.id}
                      className="col-span-full grid gap-8 md:grid-cols-12 md:gap-10"
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, filter: "blur(2px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      exit={{
                        opacity: 0,
                        ...(reduceMotion ? {} : { filter: "blur(2px)" }),
                        transition: { duration: reduceMotion ? 0 : 0.1, ease: exitEase },
                      }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.16,
                        ease: enterEase,
                      }}
                    >
                      {/* Premium Staggered Text Column */}
                      <div className="flex flex-col items-start md:col-span-4">
                        <motion.p
                          custom={0}
                          variants={textEntrance}
                          initial={reduceMotion ? undefined : "hidden"}
                          animate="visible"
                          className="text-accent text-xs font-semibold tracking-[0.16em] uppercase"
                        >
                          {activeItem.eyebrow}
                        </motion.p>
                        <motion.h2
                          custom={1}
                          variants={textEntrance}
                          initial={reduceMotion ? undefined : "hidden"}
                          animate="visible"
                          className="mt-4 max-w-[10ch] text-[clamp(2.5rem,4.5vw,5rem)] leading-[0.94] font-semibold tracking-[-0.055em]"
                        >
                          {activeItem.title}
                        </motion.h2>
                        <motion.p
                          custom={2}
                          variants={textEntrance}
                          initial={reduceMotion ? undefined : "hidden"}
                          animate="visible"
                          className="text-muted mt-5 max-w-md text-sm leading-6 sm:text-base sm:leading-7"
                        >
                          {activeItem.description}
                        </motion.p>
                        <motion.div
                          custom={3}
                          variants={textEntrance}
                          initial={reduceMotion ? undefined : "hidden"}
                          animate="visible"
                        >
                          <Button
                            className="mt-7"
                            onPress={() => {
                              closeNavigation();
                              router.push(activeItem.href);
                            }}
                          >
                            {activeItem.cta}
                            <Icon
                              aria-hidden="true"
                              icon="lucide:arrow-up-right"
                              className="size-4"
                            />
                          </Button>
                        </motion.div>
                      </div>

                      <MegaPanelContent
                        id={activeItem.id}
                        reduceMotion={Boolean(reduceMotion)}
                        onNavigate={(href) => {
                          closeNavigation();
                          router.push(href);
                        }}
                      />
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </motion.div>

      {hasOpenedSearch ? (
        <CommandPalette isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} />
      ) : null}
      {hasOpenedAuth ? (
        <AuthDialog mode={authMode} onModeChange={(mode) => dispatch(setAuthMode(mode))} />
      ) : null}
    </>
  );
};
