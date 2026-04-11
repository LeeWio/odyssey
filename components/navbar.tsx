"use client";

import { Button, Toolbar, Avatar } from "@heroui/react";
import { motion, AnimatePresence } from "motion/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectIsAuthenticated, selectUser, setCredentials, clearCredentials } from "@/store/auth";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/routing";

const MotionToolbar = motion.create(Toolbar);
const MotionLink = motion.create(Link);

// Use a highly tuned, non-bouncy spring for a very organic, Apple-like feel
const springTransition = {
  type: "spring" as const,
  stiffness: 200,
  damping: 24,
  mass: 1.2,
};

const containerVariants = {
  hidden: { y: -30, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      ...springTransition,
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 15, opacity: 0, filter: "blur(8px)" },
  visible: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { ...springTransition, duration: 0.6 },
  },
  exit: {
    y: -10,
    opacity: 0,
    filter: "blur(4px)",
    transition: { duration: 0.2 },
  },
};

export const Navbar = () => {
  const t = useTranslations("Navbar");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  const handleLogin = () => {
    dispatch(
      setCredentials({
        id: "usr_123",
        email: "demo@example.com",
        name: "Demo User",
        avatar: "https://i.pravatar.cc/150?u=demo",
      }),
    );
  };

  const handleLogout = () => {
    dispatch(clearCredentials());
  };

  const toggleLocale = () => {
    const nextLocale = locale === "en" ? "zh" : "en";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <MotionToolbar
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      aria-label="Main Navigation"
      isAttached
      className="bg-background/50 dark:bg-background/40 fixed inset-x-0 top-4 z-50 mx-auto flex w-max border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-[1.8] dark:border-white/8 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    >
      {/* Left: Logo */}
      <MotionLink variants={itemVariants} href="/" className="flex items-center gap-2.5 pr-2 pl-1">
        <div className="bg-foreground text-background flex h-8 w-8 items-center justify-center rounded-full shadow-sm">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20" />
            <path d="M2 12h20" />
            <path d="m4.93 4.93 14.14 14.14" />
            <path d="m4.93 19.07 14.14-14.14" />
          </svg>
        </div>
        <span className="text-foreground text-base font-bold tracking-tight">Odyssey</span>
      </MotionLink>

      {/* Center: Nav */}
      <nav className="hidden items-center gap-7 md:flex">
        <MotionLink
          variants={itemVariants}
          href="/features"
          className="text-muted hover:text-foreground text-sm font-medium transition-colors"
        >
          {t("features")}
        </MotionLink>
        <MotionLink
          variants={itemVariants}
          href="/docs"
          className="text-muted hover:text-foreground text-sm font-medium transition-colors"
        >
          {t("docs")}
        </MotionLink>
        <MotionLink
          variants={itemVariants}
          href="/blog"
          className="text-muted hover:text-foreground text-sm font-medium transition-colors"
        >
          {t("blog")}
        </MotionLink>
        <MotionLink
          variants={itemVariants}
          href="/pricing"
          className="text-muted hover:text-foreground text-sm font-medium transition-colors"
        >
          {t("pricing")}
        </MotionLink>
      </nav>

      {/* Right: Actions */}
      <div className="border-border/50 flex min-w-[140px] items-center justify-end gap-4 border-l pl-6">
        {/* Locale Switcher */}
        <motion.button
          variants={itemVariants}
          onClick={toggleLocale}
          className="text-muted hover:text-foreground text-xs font-bold uppercase transition-colors"
        >
          {locale === "en" ? "ZH" : "EN"}
        </motion.button>

        <AnimatePresence mode="wait">
          {isAuthenticated && user ? (
            <motion.div
              key="user"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex items-center gap-3"
            >
              <Avatar src={user.avatar} size="sm" />
              <Button size="sm" variant="flat" onPress={handleLogout}>
                {t("logout")}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="guest"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex items-center gap-4"
            >
              <button
                onClick={handleLogin}
                className="text-muted hover:text-foreground hidden text-sm font-medium transition-colors sm:block"
              >
                {t("login")}
              </button>
              <Button size="sm" onPress={handleLogin}>
                {t("getStarted")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionToolbar>
  );
};
