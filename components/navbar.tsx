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
  Description
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
  Sparkles
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
        <span className="text-xs font-medium text-muted/80 tracking-tight">Search...</span>
        <Kbd className="bg-background/50 py-0 px-1 border-none shadow-none text-[10px]">
          <Kbd.Abbr>⌘</Kbd.Abbr>K
        </Kbd>
      </motion.button>

      {/* Center: Nav */}
      <nav className="hidden items-center gap-1 md:flex px-2">
        {/* 1. Tech Sharing - Detailed Grid with Sidebar */}
        <Dropdown>
          <Dropdown.Trigger
            variant="ghost"
            size="sm"
            className="text-muted hover:text-foreground text-[11px] font-black border-none uppercase tracking-widest data-[pressed=true]:scale-95 transition-all h-9 px-3"
          >
            <div className="flex items-center gap-1 pointer-events-none text-left">
              {t("tech")}
              <ChevronDown width="12" height="12" className="opacity-50" />
            </div>
          </Dropdown.Trigger>
          <Dropdown.Popover className="min-w-[560px] p-0 overflow-hidden border-border/50 shadow-2xl backdrop-blur-3xl rounded-[32px]">
            <div className="flex h-full text-left">
              {/* Feature Sidebar */}
              <div className="w-[180px] bg-default/30 p-5 border-r border-border/50 flex flex-col justify-between text-left">
                <div className="flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shadow-lg shadow-accent/20">
                    <Code width="22" height="22" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-tighter leading-tight text-foreground">{t("tech")}</h3>
                  <p className="text-[10px] text-muted leading-relaxed font-medium">{t("techDesc")}</p>
                </div>
                <Button size="sm" variant="ghost" className="w-full text-[10px] uppercase font-black tracking-widest border-border/50 rounded-full h-8">
                  View All <ArrowRight width="12" height="12" className="ml-1" />
                </Button>
              </div>
              {/* Content Grid */}
              <Dropdown.Menu onAction={(key) => router.push(key as any)} className="flex-1 p-3 grid grid-cols-2 gap-1.5">
                <Dropdown.Item id="/tech/frontend" textValue="Frontend" className="p-3 rounded-2xl bg-transparent hover:bg-accent/[0.03] transition-all group border border-transparent hover:border-accent/10">
                  <div className="flex flex-col gap-2 text-left">
                    <div className="flex items-center justify-between">
                      <Code width="18" height="18" className="text-accent group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-bold text-accent/40 group-hover:text-accent transition-colors uppercase tracking-widest">UI/UX</span>
                    </div>
                    <div>
                      <Label className="font-black text-sm block tracking-tight text-foreground">{t("frontend")}</Label>
                      <p className="text-[10px] text-muted mt-0.5 line-clamp-1 font-medium">React, Next.js, Framer.</p>
                    </div>
                  </div>
                </Dropdown.Item>
                <Dropdown.Item id="/tech/backend" textValue="Backend" className="p-3 rounded-2xl bg-transparent hover:bg-success/[0.03] transition-all group border border-transparent hover:border-success/10">
                  <div className="flex flex-col gap-2 text-left">
                    <div className="flex items-center justify-between">
                      <Terminal width="18" height="18" className="text-success group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-bold text-success/40 group-hover:text-success transition-colors uppercase tracking-widest">Arch</span>
                    </div>
                    <div>
                      <Label className="font-black text-sm block tracking-tight text-foreground">{t("backend")}</Label>
                      <p className="text-[10px] text-muted mt-0.5 line-clamp-1 font-medium">Node, Go, Microservices.</p>
                    </div>
                  </div>
                </Dropdown.Item>
                <Dropdown.Item id="/tech/database" textValue="Database" className="p-3 rounded-2xl bg-transparent hover:bg-warning/[0.03] transition-all group border border-transparent hover:border-warning/10">
                  <div className="flex flex-col gap-2 text-left">
                    <div className="flex items-center justify-between">
                      <Database width="18" height="18" className="text-warning group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-bold text-warning/40 group-hover:text-warning transition-colors uppercase tracking-widest">Data</span>
                    </div>
                    <div>
                      <Label className="font-black text-sm block tracking-tight text-foreground">{t("database")}</Label>
                      <p className="text-[10px] text-muted mt-0.5 line-clamp-1 font-medium">SQL, Redis, VectorDB.</p>
                    </div>
                  </div>
                </Dropdown.Item>
                <Dropdown.Item id="/tech/devops" textValue="DevOps" className="p-3 rounded-2xl bg-transparent hover:bg-danger/[0.03] transition-all group border border-transparent hover:border-danger/10">
                  <div className="flex flex-col gap-2 text-left">
                    <div className="flex items-center justify-between">
                      <CloudGear width="18" height="18" className="text-danger group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-bold text-danger/40 group-hover:text-danger transition-colors uppercase tracking-widest">Cloud</span>
                    </div>
                    <div>
                      <Label className="font-black text-sm block tracking-tight text-foreground">{t("devops")}</Label>
                      <p className="text-[10px] text-muted mt-0.5 line-clamp-1 font-medium">CI/CD, Docker, Scaling.</p>
                    </div>
                  </div>
                </Dropdown.Item>
              </Dropdown.Menu>
            </div>
          </Dropdown.Popover>
        </Dropdown>

        <Dropdown aria-label={t("creative")}>
          <Button size="sm" variant="ghost" className="font-bold uppercase tracking-wide">
            {t("creative")}
            <ChevronDown aria-hidden="true" />
          </Button>
          <Dropdown.Popover>
            <Dropdown.Menu className="grid grid-cols-1 gap-4 sm:grid-cols-2 ">
              <Dropdown.Item id="/creative/music" textValue={t("music")} >
                <MusicNote width="20" height="20" className="text-indigo-500" />
                <div className="flex flex-col">
                  <Label>{t("music")}</Label>
                  <Description className="">Create & explore sound</Description>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="/creative/gaming" textValue={t("gaming")}>
                <Rocket width="20" height="20" className="text-green-500" />
                <div className="flex flex-col">
                  <Label>{t("gaming")}</Label>
                  <Description>Build, play, share</Description>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="/creative/design" textValue={t("design")}>
                <Palette width="20" height="20" className="text-yellow-500" />
                <div className="flex flex-col">
                  <Label >{t("design")}</Label>
                  <Description>Shape ideas into visuals</Description>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="/creative/literature" textValue={t("literature")}  >
                <PencilToSquare width="20" height="20" className="text-pink-500" />
                <div className="flex flex-col">
                  <Label>{t("literature")}</Label>
                  <Description>Write, publish, connect</Description>
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        {/* 3. Life Essays Megamenu */}
        <Dropdown>
          <Dropdown.Trigger
            size="sm"
            className="text-muted hover:text-foreground text-[11px] font-black border-none uppercase tracking-widest data-[pressed=true]:scale-95 transition-all h-9 px-3"
          >
            <div className="flex items-center gap-1 pointer-events-none text-left">
              {t("essays")}
              <ChevronDown width="12" height="12" className="opacity-50" />
            </div>
          </Dropdown.Trigger>
          <Dropdown.Popover className="min-w-[360px] border-border/50 shadow-2xl backdrop-blur-3xl p-3 rounded-[28px]">
            <Header className="px-4 pt-2 pb-4 mb-2 border-b border-border/50 text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{t("essays")}</span>
            </Header>
            <Dropdown.Menu onAction={(key) => router.push(key as any)} className="gap-1">
              <Dropdown.Item id="/essays/thoughts" textValue="Thoughts" className="px-4 py-3.5 rounded-2xl hover:bg-default/60 group">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/40 group-hover:scale-125 transition-transform shadow-lg shadow-warning/20" />
                  <div className="flex flex-col text-left">
                    <Label className="font-black text-sm tracking-tight text-foreground">{t("thoughts")}</Label>
                    <p className="text-[10px] text-muted font-medium mt-0.5">Philosophy & Musings.</p>
                  </div>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="/essays/reading" textValue="Reading" className="px-4 py-3.5 rounded-2xl hover:bg-default/60 group">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-2.5 h-2.5 rounded-full bg-success/40 group-hover:scale-125 transition-transform shadow-lg shadow-success/20" />
                  <div className="flex flex-col text-left">
                    <Label className="font-black text-sm tracking-tight text-foreground">{t("reading")}</Label>
                    <p className="text-[10px] text-muted font-medium mt-0.5">Bibliographic Dialogues.</p>
                  </div>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="/essays/travel" textValue="Travel" className="px-4 py-3.5 rounded-2xl hover:bg-default/60 group">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent/40 group-hover:scale-125 transition-transform shadow-lg shadow-accent/20" />
                  <div className="flex flex-col text-left">
                    <Label className="font-black text-sm tracking-tight text-foreground">{t("travel")}</Label>
                    <p className="text-[10px] text-muted font-medium mt-0.5">Geographic Chronicles.</p>
                  </div>
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="/essays/daily" textValue="Daily" className="px-4 py-3.5 rounded-2xl hover:bg-default/60 group">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary/40 group-hover:scale-125 transition-transform shadow-lg shadow-secondary/20" />
                  <div className="flex flex-col text-left">
                    <Label className="font-black text-sm tracking-tight text-foreground">{t("daily")}</Label>
                    <p className="text-[10px] text-muted font-medium mt-0.5">Fragments of Routine.</p>
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
          className="text-muted hover:text-foreground text-[11px] font-black uppercase tracking-widest transition-colors px-3 py-2"
        >
          {t("about")}
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
                <Dropdown.Popover className="min-w-[220px] rounded-[24px] border-border/50 shadow-2xl backdrop-blur-3xl">
                  <Dropdown.Menu onAction={(key) => key === "logout" ? handleLogout() : router.push(key as any)}>
                    <Dropdown.Section>
                      <Header className="flex flex-col gap-0.5 px-3 py-2 border-b border-border/50 mb-1 text-left">
                        <span className="text-xs font-black text-foreground truncate uppercase tracking-tighter">{user.name}</span>
                        <span className="text-[10px] text-muted truncate font-medium">{user.email}</span>
                      </Header>
                      <Dropdown.Item id="/profile" textValue="Profile" className="rounded-xl">
                        <div className="flex items-center justify-between w-full text-left">
                          <Label className="text-sm font-bold text-foreground">Profile</Label>
                          <Kbd className="bg-transparent p-0 border-none shadow-none text-[10px] text-muted">⇧P</Kbd>
                        </div>
                      </Dropdown.Item>
                      <Dropdown.Item id="/settings" textValue="Settings" className="rounded-xl">
                        <Label className="text-sm font-bold text-foreground text-left block w-full text-foreground">Settings</Label>
                      </Dropdown.Item>
                    </Dropdown.Section>
                    <Separator className="my-1 mx-2" />
                    <Dropdown.Item id="logout" variant="danger" textValue="Logout" className="rounded-xl">
                      <Label className="text-sm font-black text-left block w-full uppercase tracking-widest text-danger">{t("logout")}</Label>
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
              <Button size="sm" variant="ghost" onPress={handleLogin} className="hidden sm:flex border-none text-muted hover:text-foreground font-black uppercase text-[10px] tracking-widest">
                {t("login")}
              </Button>
              <Button size="sm" onPress={handleLogin} className="rounded-full bg-foreground text-background font-black shadow-sm hover:scale-105 transition-transform px-4 text-[10px] uppercase tracking-widest">
                {t("getStarted")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionToolbar>
  );
};
