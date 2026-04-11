"use client";

import {
  Button,
  Toolbar,
  Avatar,
  Dropdown,
  Kbd,
  Separator,
  Label,
  Chip,
  Badge,
} from "@heroui/react";
import { motion, AnimatePresence } from "motion/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectIsAuthenticated,
  selectUser,
  setCredentials,
  clearCredentials,
} from "@/store/auth";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted";
import { Magnifier, Sun, Moon, ChevronDown } from "@gravity-ui/icons";
import { Logo } from "@/components/icons";

const MotionToolbar = motion.create(Toolbar);
const MotionLink = motion.create(Link);

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
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
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
      className="bg-background/50 dark:bg-background/40 fixed inset-x-0 top-4 z-50 mx-auto flex w-max items-center gap-4 border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-[1.8] dark:border-white/8 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-2 py-1.5"
    >
      {/* Left: Logo */}
      <MotionLink
        variants={itemVariants}
        href="/"
        className="flex items-center gap-2 pr-4 pl-2"
      >
        <Logo size={20} className="text-foreground" />
      </MotionLink>

      {/* Search Trigger */}
      <motion.button
        variants={itemVariants}
        className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-full bg-default/40 hover:bg-default/60 border border-border/50 text-muted transition-all duration-200"
      >
        <Magnifier width="14" height="14" />
        <span className="text-xs font-medium">Search...</span>
        <Kbd className="bg-background/50 py-0 px-1 border-none shadow-none text-[10px]">
          <Kbd.Abbr>⌘</Kbd.Abbr>K
        </Kbd>
      </motion.button>

      {/* Center: Nav */}
      <nav className="hidden items-center gap-2 md:flex px-2">
        <Dropdown>
          <Dropdown.Trigger
            variant="ghost"
            size="sm"
            className="text-muted hover:text-foreground text-sm font-medium border-none data-[pressed=true]:scale-95 transition-all h-9 px-3"
          >
            <div className="flex items-center gap-1 pointer-events-none">
              {t("features")}
              <ChevronDown width="14" height="14" className="opacity-50" />
            </div>
          </Dropdown.Trigger>
          <Dropdown.Popover className="min-w-[240px]">
            <Dropdown.Menu onAction={(key) => console.log(key)}>
              <Dropdown.Section>
                <Dropdown.Header className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted/80">Platform</Dropdown.Header>
                <Dropdown.Item id="editor" textValue="Editor" className="py-2.5">
                  <div className="flex flex-col gap-0.5 text-left w-full">
                    <Label className="font-bold text-sm flex items-center gap-2">
                      Editor <Chip size="sm" variant="soft" color="accent" className="h-4 px-1 text-[9px] uppercase">Pro</Chip>
                    </Label>
                    <span className="text-xs text-muted">Advanced rich-text capabilities.</span>
                  </div>
                </Dropdown.Item>
                <Dropdown.Item id="ai" textValue="AI Power" className="py-2.5">
                  <div className="flex flex-col gap-0.5 text-left w-full">
                    <Label className="font-bold text-sm">AI Power</Label>
                    <span className="text-xs text-muted">Generate and edit with intelligence.</span>
                  </div>
                </Dropdown.Item>
              </Dropdown.Section>
              <Separator />
              <Dropdown.Section>
                <Dropdown.Item id="collaboration" textValue="Collaboration" className="py-2.5">
                  <div className="flex flex-col gap-0.5 text-left w-full">
                    <Label className="font-bold text-sm">Collaboration</Label>
                    <span className="text-xs text-muted">Real-time multiplayer editing.</span>
                  </div>
                </Dropdown.Item>
              </Dropdown.Section>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        <MotionLink
          variants={itemVariants}
          href="/docs"
          className="text-muted hover:text-foreground text-sm font-medium transition-colors px-3 py-2"
        >
          {t("docs")}
        </MotionLink>
        <MotionLink
          variants={itemVariants}
          href="/blog"
          className="text-muted hover:text-foreground text-sm font-medium transition-colors px-3 py-2 flex items-center gap-1.5"
        >
          {t("blog")}
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
          </span>
        </MotionLink>
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 border-l border-border/50 pl-4 pr-1">
        {/* Locale Switcher */}
        <motion.button
          variants={itemVariants}
          onClick={toggleLocale}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-default/40 text-muted hover:text-foreground text-[10px] font-bold uppercase transition-all"
        >
          {locale === "en" ? "ZH" : "EN"}
        </motion.button>

        {/* Theme Toggle */}
        <motion.button
          variants={itemVariants}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-default/40 text-muted hover:text-foreground transition-all"
        >
          {mounted && (theme === "dark" ? (
            <Sun width="16" height="16" />
          ) : (
            <Moon width="16" height="16" />
          ))}
        </motion.button>

        <AnimatePresence mode="wait">
          {isAuthenticated && user ? (
            <motion.div
              key="user"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex items-center"
            >
              <Dropdown>
                <Dropdown.Trigger
                  variant="ghost"
                  className="p-0 h-auto min-w-0 border-none hover:bg-transparent data-[pressed=true]:scale-95 transition-transform rounded-full"
                >
                  <Badge.Anchor>
                    <Avatar src={user.avatar} size="sm" className="ring-2 ring-background shadow-md cursor-pointer" />
                    <Badge color="success" size="sm" className="border-2 border-background" />
                  </Badge.Anchor>
                </Dropdown.Trigger>
                <Dropdown.Popover className="min-w-[220px]">
                  <Dropdown.Menu onAction={(key) => key === "logout" && handleLogout()}>
                    <Dropdown.Section>
                      <Dropdown.Header className="flex flex-col gap-0.5 px-3 py-2 border-b border-border/50 mb-1">
                        <span className="text-xs font-bold text-foreground truncate">{user.name}</span>
                        <span className="text-[10px] text-muted truncate">{user.email}</span>
                      </Dropdown.Header>
                      <Dropdown.Item id="profile" textValue="Profile">
                        <div className="flex items-center justify-between w-full">
                          <Label className="text-sm">Profile</Label>
                          <Kbd className="bg-transparent p-0 border-none shadow-none text-[10px] text-muted">⇧P</Kbd>
                        </div>
                      </Dropdown.Item>
                      <Dropdown.Item id="settings" textValue="Settings">
                        <Label className="text-sm">Settings</Label>
                      </Dropdown.Item>
                    </Dropdown.Section>
                    <Separator />
                    <Dropdown.Item id="logout" variant="danger" textValue="Logout">
                      <Label className="text-sm font-medium">{t("logout")}</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            </motion.div>
          ) : (
            <motion.div
              key="guest"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex items-center gap-2"
            >
              <Button size="sm" variant="ghost" onPress={handleLogin} className="hidden sm:flex border-none text-muted hover:text-foreground">
                {t("login")}
              </Button>
              <Button size="sm" onPress={handleLogin} className="rounded-full bg-foreground text-background font-bold shadow-sm hover:scale-105 transition-transform px-4">
                {t("getStarted")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionToolbar>
  );
};
