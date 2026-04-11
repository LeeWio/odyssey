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
import { 
  Magnifier, 
  Sun, 
  Moon, 
  ChevronDown,
  Code,
  Briefcase,
  Layers,
  Bulb,
  MusicNote,
  Play,
  Gear,
  SquareArticle
} from "@gravity-ui/icons";
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
      className="bg-background/50 dark:bg-background/40 fixed inset-x-0 top-4 z-50 mx-auto flex w-max items-center gap-4 border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-[1.8] dark:border-white/8 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
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
      <nav className="hidden items-center gap-1 md:flex px-2">
        {/* 1. Journey - Grid 2 Column Layout */}
        <Dropdown>
          <Dropdown.Trigger
            variant="ghost"
            size="sm"
            className="text-muted hover:text-foreground text-sm font-medium border-none data-[pressed=true]:scale-95 transition-all h-9 px-3"
          >
            <div className="flex items-center gap-1 pointer-events-none uppercase tracking-wider text-[11px] font-bold">
              {t("journey")}
              <ChevronDown width="12" height="12" className="opacity-50" />
            </div>
          </Dropdown.Trigger>
          <Dropdown.Popover className="min-w-[400px]">
            <Dropdown.Menu 
              onAction={(key) => router.push(key as any)}
              className="grid grid-cols-2 gap-2 p-2"
            >
              <Dropdown.Item id="/projects" textValue="Projects" className="p-3 bg-default/40 hover:bg-default/80 rounded-xl transition-all">
                <div className="flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    <Code width="18" height="18" />
                  </div>
                  <div>
                    <Label className="font-bold text-sm block">{t("projects")}</Label>
                    <span className="text-[10px] text-muted leading-tight block mt-0.5">My open-source ecosystem.</span>
                  </div>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="/experience" textValue="Experience" className="p-3 bg-default/40 hover:bg-default/80 rounded-xl transition-all">
                <div className="flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                    <Briefcase width="18" height="18" />
                  </div>
                  <div>
                    <Label className="font-bold text-sm block">{t("experience")}</Label>
                    <span className="text-[10px] text-muted leading-tight block mt-0.5">Career path & expertise.</span>
                  </div>
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        {/* 2. Writings - magazine style with sectioning */}
        <Dropdown>
          <Dropdown.Trigger
            variant="ghost"
            size="sm"
            className="text-muted hover:text-foreground text-sm font-medium border-none data-[pressed=true]:scale-95 transition-all h-9 px-3"
          >
            <div className="flex items-center gap-1 pointer-events-none uppercase tracking-wider text-[11px] font-bold">
              {t("writings")}
              <ChevronDown width="12" height="12" className="opacity-50" />
            </div>
          </Dropdown.Trigger>
          <Dropdown.Popover className="min-w-[280px]">
            <Dropdown.Menu onAction={(key) => router.push(key as any)} className="p-1.5">
              <Dropdown.Section>
                <Dropdown.Header className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted/50">Intellectual Space</Dropdown.Header>
                <Dropdown.Item id="/tech" textValue="Technical" className="py-2.5 rounded-lg group">
                  <div className="flex items-center gap-3">
                    <SquareArticle width="16" height="16" className="text-muted group-hover:text-accent transition-colors" />
                    <div className="flex flex-col">
                      <Label className="font-bold text-sm">{t("technical")}</Label>
                      <span className="text-[10px] text-muted">Code & Systems Architecture.</span>
                    </div>
                  </div>
                </Dropdown.Item>
                <Dropdown.Item id="/columns" textValue="Columns" className="py-2.5 rounded-lg group">
                  <div className="flex items-center gap-3">
                    <Layers width="16" height="16" className="text-muted group-hover:text-accent transition-colors" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Label className="font-bold text-sm">{t("columns")}</Label>
                        <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                      </div>
                      <span className="text-[10px] text-muted">Deep dive series & tutorials.</span>
                    </div>
                  </div>
                </Dropdown.Item>
              </Dropdown.Section>
              <Separator className="my-1 mx-2" />
              <Dropdown.Item id="/reflections" textValue="Reflections" className="py-2.5 rounded-lg group italic">
                <div className="flex items-center gap-3">
                  <Bulb width="16" height="16" className="text-muted group-hover:text-warning transition-colors" />
                  <Label className="font-medium text-sm text-muted/90 group-hover:text-foreground">“{t("reflections")}”</Label>
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        {/* 3. Culture - App Launcher Grid Style */}
        <Dropdown>
          <Dropdown.Trigger
            variant="ghost"
            size="sm"
            className="text-muted hover:text-foreground text-sm font-medium border-none data-[pressed=true]:scale-95 transition-all h-9 px-3"
          >
            <div className="flex items-center gap-1 pointer-events-none uppercase tracking-wider text-[11px] font-bold">
              {t("culture")}
              <ChevronDown width="12" height="12" className="opacity-50" />
            </div>
          </Dropdown.Trigger>
          <Dropdown.Popover className="min-w-[320px]">
            <Dropdown.Menu 
              onAction={(key) => router.push(key as any)}
              className="grid grid-cols-3 gap-1 p-2"
            >
              <Dropdown.Item id="/music" textValue="Music" className="flex flex-col items-center justify-center p-4 rounded-2xl hover:bg-success/5 group text-center border border-transparent hover:border-success/10">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success mb-2 group-hover:scale-110 transition-transform relative">
                  <MusicNote width="20" height="20" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                  </span>
                </div>
                <Label className="text-[11px] font-bold">{t("music")}</Label>
              </Dropdown.Item>
              <Dropdown.Item id="/gaming" textValue="Gaming" className="flex flex-col items-center justify-center p-4 rounded-2xl hover:bg-accent/5 group text-center border border-transparent hover:border-accent/10">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-2 group-hover:scale-110 transition-transform">
                  <Play width="20" height="20" />
                </div>
                <Label className="text-[11px] font-bold">{t("gaming")}</Label>
              </Dropdown.Item>
              <Dropdown.Item id="/gear" textValue="Gear" className="flex flex-col items-center justify-center p-4 rounded-2xl hover:bg-warning/5 group text-center border border-transparent hover:border-warning/10">
                <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning mb-2 group-hover:scale-110 transition-transform">
                  <Gear width="20" height="20" />
                </div>
                <Label className="text-[11px] font-bold">{t("gear")}</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        {/* 4. Moments - Single Direct Link */}
        <MotionLink
          variants={itemVariants}
          href="/moments"
          className="text-muted hover:text-foreground text-[11px] font-bold uppercase tracking-wider transition-colors px-3 py-2"
        >
          {t("moments")}
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
                  <Dropdown.Menu onAction={(key) => key === "logout" ? handleLogout() : router.push(key as any)}>
                    <Dropdown.Section>
                      <Dropdown.Header className="flex flex-col gap-0.5 px-3 py-2 border-b border-border/50 mb-1">
                        <span className="text-xs font-bold text-foreground truncate">{user.name}</span>
                        <span className="text-[10px] text-muted truncate">{user.email}</span>
                      </Dropdown.Header>
                      <Dropdown.Item id="/profile" textValue="Profile">
                        <div className="flex items-center justify-between w-full">
                          <Label className="text-sm">Profile</Label>
                          <Kbd className="bg-transparent p-0 border-none shadow-none text-[10px] text-muted">⇧P</Kbd>
                        </div>
                      </Dropdown.Item>
                      <Dropdown.Item id="/settings" textValue="Settings">
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
              <Button size="sm" onPress={handleLogin} className="rounded-full bg-foreground text-background font-bold shadow-sm hover:scale-105 transition-transform px-4 text-xs">
                {t("getStarted")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionToolbar>
  );
};
