"use client";

import { useState } from "react";
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
  buttonVariants,
  cn,
} from "@heroui/react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectIsAuthenticated, selectUser, setCredentials, clearCredentials } from "@/store/auth";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted";
import {
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
  Gear,
  Persons,
  ArrowRightFromSquare,
} from "@gravity-ui/icons";
import { Logo } from "@/components/icons";

const MotionToolbar = motion.create(Toolbar);
const MotionLink = motion.create(Link);
const MotionButton = motion.create(Button);
const MotionAvatar = motion.create(Avatar);

const springTransition = {
  type: "spring" as const,
  stiffness: 200,
  damping: 24,
  mass: 1.2,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04, // 紧凑的间隔
      delayChildren: 0.1, // 更快的首个元素响应
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 }, // 稍微减小位移
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4, // 更短的时间，更利落
      ease: [0.16, 1, 0.3, 1], // 保持高级曲线
    },
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

  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  });

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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      aria-label="Main Navigation"
      layout
      className={cn(
        "fixed inset-x-0 z-50 backdrop-blur-xl backdrop-saturate-[1.8] transition-all duration-500 ease-in-out",
        isScrolled
          ? "bg-background/50 dark:bg-background/40 top-4 mx-auto flex w-max items-center gap-4 rounded-full border border-white/8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:border-white/8 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          : "top-0 flex w-full items-center justify-center gap-8 bg-transparent",
      )}
    >
      <div
        className={cn(
          "flex items-center transition-all duration-500",
          isScrolled ? "gap-4" : "w-full max-w-7xl justify-between gap-8",
        )}
      >
        <motion.div variants={itemVariants} layout className="flex items-center">
          <Logo size={isScrolled ? 20 : 24} />
        </motion.div>

        <div className={cn("flex items-center", isScrolled ? "gap-2" : "gap-6")}>
          <Dropdown>
            <MotionButton
              variants={itemVariants}
              layout
              size={isScrolled ? "sm" : "md"}
              variant="ghost"
              className="font-bold tracking-wide uppercase"
            >
              {t("tech")}
            </MotionButton>

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
            <MotionButton
              variants={itemVariants}
              layout
              size={isScrolled ? "sm" : "md"}
              variant="ghost"
              className="font-bold tracking-wide uppercase"
            >
              {t("being‌")}
            </MotionButton>
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
            <MotionButton
              variants={itemVariants}
              layout
              size={isScrolled ? "sm" : "md"}
              variant="ghost"
              className="font-bold tracking-wide uppercase"
            >
              {t("essays")}
            </MotionButton>
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

          <MotionLink
            variants={itemVariants}
            layout
            href="/about"
            className={cn(
              buttonVariants({ size: isScrolled ? "sm" : "md", variant: "ghost" }),
              "font-bold tracking-wide uppercase",
            )}
          >
            {t("about")}
          </MotionLink>

          <Dropdown>
            <Dropdown.Trigger className="rounded-full">
              <MotionAvatar layout size={isScrolled ? "sm" : "md"} variants={itemVariants}>
                <Avatar.Image
                  alt="Junior Garcia"
                  src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/orange.jpg"
                />
                <Avatar.Fallback delayMs={600}>JD</Avatar.Fallback>
              </MotionAvatar>
            </Dropdown.Trigger>
            <Dropdown.Popover>
              <div className="px-3 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    <Avatar.Image
                      alt="Jane"
                      src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/orange.jpg"
                    />
                    <Avatar.Fallback delayMs={600}>JD</Avatar.Fallback>
                  </Avatar>
                  <div className="flex flex-col gap-0">
                    <p className="text-sm leading-5 font-medium">Jane Doe</p>
                    <p className="text-muted text-xs leading-none">jane@example.com</p>
                  </div>
                </div>
              </div>
              <Dropdown.Menu>
                <Dropdown.Item id="dashboard" textValue="Dashboard">
                  <Label>Dashboard</Label>
                </Dropdown.Item>
                <Dropdown.Item id="profile" textValue="Profile">
                  <Label>Profile</Label>
                </Dropdown.Item>
                <Dropdown.Item id="settings" textValue="Settings">
                  <div className="flex w-full items-center justify-between gap-2">
                    <Label>Settings</Label>
                    <Gear className="text-muted size-3.5" />
                  </div>
                </Dropdown.Item>
                <Dropdown.Item id="new-project" textValue="New project">
                  <div className="flex w-full items-center justify-between gap-2">
                    <Label>Create Team</Label>
                    <Persons className="text-muted size-3.5" />
                  </div>
                </Dropdown.Item>
                <Dropdown.Item id="logout" textValue="Logout" variant="danger">
                  <div className="flex w-full items-center justify-between gap-2">
                    <Label>Log Out</Label>
                    <ArrowRightFromSquare className="text-danger size-3.5" />
                  </div>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>
    </motion.div>
  );
};
