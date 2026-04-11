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
  Header,
  Description,
} from "@heroui/react";
import { motion, AnimatePresence } from "motion/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectIsAuthenticated, selectUser, setCredentials, clearCredentials } from "@/store/auth";
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
  Terminal,
  Database,
  CloudGear,
  MusicNote,
  Play,
  Palette,
  PencilToSquare,
  Bulb,
  BookOpen,
  MapPin,
  Person,
  ArrowRight,
  Rocket,
  Sparkles,
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
      className="bg-background/50 dark:bg-background/40 fixed inset-x-0 top-4 z-50 mx-auto flex w-max items-center gap-4 border-white/8 px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-[1.8] dark:border-white/8 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    >
      {/* Left: Logo */}
      <MotionLink variants={itemVariants} href="/" className="flex items-center gap-2 pr-4 pl-2">
        <Logo size={20} className="text-foreground" />
      </MotionLink>

      {/* Search Trigger */}
      <motion.button
        variants={itemVariants}
        className="bg-default/40 hover:bg-default/60 border-border/50 text-muted hidden items-center gap-3 rounded-full border px-3 py-1.5 transition-all duration-200 lg:flex"
      >
        <Magnifier width="14" height="14" />
        <span className="text-muted/80 text-xs font-medium tracking-tight">Search...</span>
        <Kbd className="bg-background/50 border-none px-1 py-0 text-[10px] shadow-none">
          <Kbd.Abbr>⌘</Kbd.Abbr>K
        </Kbd>
      </motion.button>

      {/* Center: Nav */}
      <nav className="hidden items-center gap-1 px-2 md:flex">
        {/* 1. Tech Sharing - Detailed Grid with Sidebar */}
        <Dropdown>
          <Dropdown.Trigger
            variant="ghost"
            size="sm"
            className="text-muted hover:text-foreground h-9 border-none px-3 text-[11px] font-black tracking-widest uppercase transition-all data-[pressed=true]:scale-95"
          >
            <div className="pointer-events-none flex items-center gap-1 text-left">
              {t("tech")}
              <ChevronDown width="12" height="12" className="opacity-50" />
            </div>
          </Dropdown.Trigger>
          <Dropdown.Popover className="border-border/50 min-w-[560px] overflow-hidden rounded-[32px] p-0 shadow-2xl backdrop-blur-3xl">
            <div className="flex h-full text-left">
              {/* Feature Sidebar */}
              <div className="bg-default/30 border-border/50 flex w-[180px] flex-col justify-between border-r p-5 text-left">
                <div className="flex flex-col gap-3">
                  <div className="bg-accent text-accent-foreground shadow-accent/20 flex h-10 w-10 items-center justify-center rounded-xl shadow-lg">
                    <Code width="22" height="22" />
                  </div>
                  <h3 className="text-foreground text-sm leading-tight font-black tracking-tighter uppercase">
                    {t("tech")}
                  </h3>
                  <p className="text-muted text-[10px] leading-relaxed font-medium">
                    {t("techDesc")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="border-border/50 h-8 w-full rounded-full text-[10px] font-black tracking-widest uppercase"
                >
                  View All <ArrowRight width="12" height="12" className="ml-1" />
                </Button>
              </div>
              {/* Content Grid */}
              <Dropdown.Menu
                onAction={(key) => router.push(key as any)}
                className="grid flex-1 grid-cols-2 gap-1.5 p-3"
              >
                <Dropdown.Item
                  id="/tech/frontend"
                  textValue="Frontend"
                  className="hover:bg-accent/[0.03] group hover:border-accent/10 rounded-2xl border border-transparent bg-transparent p-3 transition-all"
                >
                  <div className="flex flex-col gap-2 text-left">
                    <div className="flex items-center justify-between">
                      <Code
                        width="18"
                        height="18"
                        className="text-accent transition-transform group-hover:scale-110"
                      />
                      <span className="text-accent/40 group-hover:text-accent text-[9px] font-bold tracking-widest uppercase transition-colors">
                        UI/UX
                      </span>
                    </div>
                    <div>
                      <Label className="text-foreground block text-sm font-black tracking-tight">
                        {t("frontend")}
                      </Label>
                      <p className="text-muted mt-0.5 line-clamp-1 text-[10px] font-medium">
                        React, Next.js, Framer.
                      </p>
                    </div>
                  </div>
                </Dropdown.Item>
                <Dropdown.Item
                  id="/tech/backend"
                  textValue="Backend"
                  className="hover:bg-success/[0.03] group hover:border-success/10 rounded-2xl border border-transparent bg-transparent p-3 transition-all"
                >
                  <div className="flex flex-col gap-2 text-left">
                    <div className="flex items-center justify-between">
                      <Terminal
                        width="18"
                        height="18"
                        className="text-success transition-transform group-hover:scale-110"
                      />
                      <span className="text-success/40 group-hover:text-success text-[9px] font-bold tracking-widest uppercase transition-colors">
                        Arch
                      </span>
                    </div>
                    <div>
                      <Label className="text-foreground block text-sm font-black tracking-tight">
                        {t("backend")}
                      </Label>
                      <p className="text-muted mt-0.5 line-clamp-1 text-[10px] font-medium">
                        Node, Go, Microservices.
                      </p>
                    </div>
                  </div>
                </Dropdown.Item>
                <Dropdown.Item
                  id="/tech/database"
                  textValue="Database"
                  className="hover:bg-warning/[0.03] group hover:border-warning/10 rounded-2xl border border-transparent bg-transparent p-3 transition-all"
                >
                  <div className="flex flex-col gap-2 text-left">
                    <div className="flex items-center justify-between">
                      <Database
                        width="18"
                        height="18"
                        className="text-warning transition-transform group-hover:scale-110"
                      />
                      <span className="text-warning/40 group-hover:text-warning text-[9px] font-bold tracking-widest uppercase transition-colors">
                        Data
                      </span>
                    </div>
                    <div>
                      <Label className="text-foreground block text-sm font-black tracking-tight">
                        {t("database")}
                      </Label>
                      <p className="text-muted mt-0.5 line-clamp-1 text-[10px] font-medium">
                        SQL, Redis, VectorDB.
                      </p>
                    </div>
                  </div>
                </Dropdown.Item>
                <Dropdown.Item
                  id="/tech/devops"
                  textValue="DevOps"
                  className="hover:bg-danger/[0.03] group hover:border-danger/10 rounded-2xl border border-transparent bg-transparent p-3 transition-all"
                >
                  <div className="flex flex-col gap-2 text-left">
                    <div className="flex items-center justify-between">
                      <CloudGear
                        width="18"
                        height="18"
                        className="text-danger transition-transform group-hover:scale-110"
                      />
                      <span className="text-danger/40 group-hover:text-danger text-[9px] font-bold tracking-widest uppercase transition-colors">
                        Cloud
                      </span>
                    </div>
                    <div>
                      <Label className="text-foreground block text-sm font-black tracking-tight">
                        {t("devops")}
                      </Label>
                      <p className="text-muted mt-0.5 line-clamp-1 text-[10px] font-medium">
                        CI/CD, Docker, Scaling.
                      </p>
                    </div>
                  </div>
                </Dropdown.Item>
              </Dropdown.Menu>
            </div>
          </Dropdown.Popover>
        </Dropdown>

        <Dropdown aria-label={t("being‌")}>
          <Button size="sm" variant="ghost" className="font-bold tracking-wide uppercase">
            {t("being‌")}
          </Button>
          <Dropdown.Popover>
            <Dropdown.Menu className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Dropdown.Item id="/creative/music" textValue={t("Sonic Journeys")}>
                <MusicNote width="20" height="20" className="text-indigo-500" />
                <div className="flex flex-col">
                  <Label>{t("Sonic Journeys")}</Label>
                  <Description className="">Every note tells a story</Description>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="/creative/gaming" textValue={t("Battle Arena")}>
                <Rocket width="20" height="20" className="text-green-500" />
                <div className="flex flex-col">
                  <Label>{t("Battle Arena")}</Label>
                  <Description>Step into your world</Description>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="/creative/design" textValue={t("Commit & Build")}>
                <Palette width="20" height="20" className="text-yellow-500" />
                <div className="flex flex-col">
                  <Label>{t("Commit & Build")}</Label>
                  <Description>Code is cheap. Show me the prompt.</Description>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="/creative/literature" textValue={t("Ink & Soul")}>
                <PencilToSquare width="20" height="20" className="text-pink-500" />
                <div className="flex flex-col">
                  <Label>{t("Ink & Soul")}</Label>
                  <Description>Nurture your ideas</Description>
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        <Dropdown>
          <Dropdown.Trigger
            className="text-muted hover:text-foreground h-9 border-none px-3 text-[11px] font-black tracking-widest uppercase transition-all data-[pressed=true]:scale-95"
          >
            <div className="pointer-events-none flex items-center gap-1 text-left">
              {t("essays")}
              <ChevronDown width="12" height="12" className="opacity-50" />
            </div>
          </Dropdown.Trigger>
          <Dropdown.Popover className="border-border/50 min-w-[360px] rounded-[28px] p-3 shadow-2xl backdrop-blur-3xl">
            <Header className="border-border/50 mb-2 border-b px-4 pt-2 pb-4 text-left">
              <span className="text-muted text-[10px] font-black tracking-[0.2em] uppercase">
                {t("essays")}
              </span>
            </Header>
            <Dropdown.Menu onAction={(key) => router.push(key as any)} className="gap-1">
              <Dropdown.Item
                id="/essays/thoughts"
                textValue="Thoughts"
                className="hover:bg-default/60 group rounded-2xl px-4 py-3.5"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="bg-warning/40 shadow-warning/20 h-2.5 w-2.5 rounded-full shadow-lg transition-transform group-hover:scale-125" />
                  <div className="flex flex-col text-left">
                    <Label className="text-foreground text-sm font-black tracking-tight">
                      {t("thoughts")}
                    </Label>
                    <p className="text-muted mt-0.5 text-[10px] font-medium">
                      Philosophy & Musings.
                    </p>
                  </div>
                </div>
              </Dropdown.Item>
              <Dropdown.Item
                id="/essays/reading"
                textValue="Reading"
                className="hover:bg-default/60 group rounded-2xl px-4 py-3.5"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="bg-success/40 shadow-success/20 h-2.5 w-2.5 rounded-full shadow-lg transition-transform group-hover:scale-125" />
                  <div className="flex flex-col text-left">
                    <Label className="text-foreground text-sm font-black tracking-tight">
                      {t("reading")}
                    </Label>
                    <p className="text-muted mt-0.5 text-[10px] font-medium">
                      Bibliographic Dialogues.
                    </p>
                  </div>
                </div>
              </Dropdown.Item>
              <Dropdown.Item
                id="/essays/travel"
                textValue="Travel"
                className="hover:bg-default/60 group rounded-2xl px-4 py-3.5"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="bg-accent/40 shadow-accent/20 h-2.5 w-2.5 rounded-full shadow-lg transition-transform group-hover:scale-125" />
                  <div className="flex flex-col text-left">
                    <Label className="text-foreground text-sm font-black tracking-tight">
                      {t("travel")}
                    </Label>
                    <p className="text-muted mt-0.5 text-[10px] font-medium">
                      Geographic Chronicles.
                    </p>
                  </div>
                </div>
              </Dropdown.Item>
              <Dropdown.Item
                id="/essays/daily"
                textValue="Daily"
                className="hover:bg-default/60 group rounded-2xl px-4 py-3.5"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="bg-secondary/40 shadow-secondary/20 h-2.5 w-2.5 rounded-full shadow-lg transition-transform group-hover:scale-125" />
                  <div className="flex flex-col text-left">
                    <Label className="text-foreground text-sm font-black tracking-tight">
                      {t("daily")}
                    </Label>
                    <p className="text-muted mt-0.5 text-[10px] font-medium">
                      Fragments of Routine.
                    </p>
                  </div>
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        {/* 4. About - Minimalist Link */}
        <MotionLink
          variants={itemVariants}
          href="/about"
          className="text-muted hover:text-foreground px-3 py-2 text-[11px] font-black tracking-widest uppercase transition-colors"
        >
          {t("about")}
        </MotionLink>
      </nav>

      {/* Right: Actions */}
      <div className="border-border/50 flex items-center gap-2 border-l pr-1 pl-4">
        {/* Locale Switcher */}
        <motion.button
          variants={itemVariants}
          onClick={toggleLocale}
          className="hover:bg-default/40 text-muted hover:text-foreground flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold uppercase transition-all"
        >
          {locale === "en" ? "ZH" : "EN"}
        </motion.button>

        {/* Theme Toggle */}
        <motion.button
          variants={itemVariants}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="hover:bg-default/40 text-muted hover:text-foreground flex h-8 w-8 items-center justify-center rounded-full transition-all"
        >
          {mounted &&
            (theme === "dark" ? <Sun width="16" height="16" /> : <Moon width="16" height="16" />)}
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
                  className="h-auto min-w-0 rounded-full border-none p-0 transition-transform hover:bg-transparent data-[pressed=true]:scale-95"
                >
                  <Badge.Anchor>
                    <Avatar
                      src={user.avatar}
                      size="sm"
                      className="ring-background cursor-pointer shadow-md ring-2"
                    />
                    <Badge color="success" size="sm" className="border-background border-2" />
                  </Badge.Anchor>
                </Dropdown.Trigger>
                <Dropdown.Popover className="border-border/50 min-w-[220px] rounded-[24px] shadow-2xl backdrop-blur-3xl">
                  <Dropdown.Menu
                    onAction={(key) =>
                      key === "logout" ? handleLogout() : router.push(key as any)
                    }
                  >
                    <Dropdown.Section>
                      <Header className="border-border/50 mb-1 flex flex-col gap-0.5 border-b px-3 py-2 text-left">
                        <span className="text-foreground truncate text-xs font-black tracking-tighter uppercase">
                          {user.name}
                        </span>
                        <span className="text-muted truncate text-[10px] font-medium">
                          {user.email}
                        </span>
                      </Header>
                      <Dropdown.Item id="/profile" textValue="Profile" className="rounded-xl">
                        <div className="flex w-full items-center justify-between text-left">
                          <Label className="text-foreground text-sm font-bold">Profile</Label>
                          <Kbd className="text-muted border-none bg-transparent p-0 text-[10px] shadow-none">
                            ⇧P
                          </Kbd>
                        </div>
                      </Dropdown.Item>
                      <Dropdown.Item id="/settings" textValue="Settings" className="rounded-xl">
                        <Label className="text-foreground text-foreground block w-full text-left text-sm font-bold">
                          Settings
                        </Label>
                      </Dropdown.Item>
                    </Dropdown.Section>
                    <Separator className="mx-2 my-1" />
                    <Dropdown.Item
                      id="logout"
                      variant="danger"
                      textValue="Logout"
                      className="rounded-xl"
                    >
                      <Label className="text-danger block w-full text-left text-sm font-black tracking-widest uppercase">
                        {t("logout")}
                      </Label>
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
              <Button
                size="sm"
                variant="ghost"
                onPress={handleLogin}
                className="text-muted hover:text-foreground hidden border-none text-[10px] font-black tracking-widest uppercase sm:flex"
              >
                {t("login")}
              </Button>
              <Button
                size="sm"
                onPress={handleLogin}
                className="bg-foreground text-background rounded-full px-4 text-[10px] font-black tracking-widest uppercase shadow-sm transition-transform hover:scale-105"
              >
                {t("getStarted")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionToolbar>
  );
};
