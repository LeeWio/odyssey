"use client";

import React, { useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Avatar,
  Dropdown,
  Label,
  Description,
  Header,
  Kbd,
  Badge,
  Popover,
  ListBox,
  Separator,
  Card,
} from "@heroui/react";
import { Navbar as HerouiNavbar, ItemCardGroup, ItemCard } from "@heroui-pro/react";
import { useMounted, useOs } from "@mantine/hooks";
import { useTheme } from "next-themes";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

// 导入 Iconify
import { Icon } from "@iconify/react";

// 导入图标
import { Logo, SunMaxFillIcon, MoonFillIcon, SearchIcon } from "./icons";

// 导入 Auth & Palette 关联组件
import { SignUp } from "./auth/sign-up";
import { LogIn } from "./auth/log-in";
import { CommandPalette } from "./command-palette";

// 导入 Auth Selector & Reducer
import {
  selectIsAuthenticated,
  selectCurrentUser,
  selectUserEmail,
  removeCredentials,
} from "@/lib/features/auth";
import { baseApi } from "@/lib/features/api/base-api";

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const navbarRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  // Controlled States for popovers to enable smooth animations and close actions
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isPassionsOpen, setIsPassionsOpen] = useState(false);
  const [isBuildsOpen, setIsBuildsOpen] = useState(false);
  const [isCurationsOpen, setIsCurationsOpen] = useState(false);

  const mounted = useMounted();
  const os = useOs();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
  const email = useAppSelector(selectUserEmail);

  const platformKey = mounted && (os === "macos" || os === "ios") ? "⌘" : "Ctrl";

  // Derived current active item from actual pathname to keep routes perfectly synchronized
  const currentItem = pathname || "/";

  const handleSwitchToSignUp = () => {
    setIsLoginOpen(false);
    setTimeout(() => setIsSignUpOpen(true), 300);
  };

  const handleSwitchToLogIn = () => {
    setIsSignUpOpen(false);
    setTimeout(() => setIsLoginOpen(true), 300);
  };

  // GSAP Entrance Choreography with Reduced Motion Support
  useGSAP(
    () => {
      if (!mounted || reduceMotion) return;

      gsap.fromTo(
        navbarRef.current,
        { y: -30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" }
      );

      gsap.fromTo(
        ".nav-stagger",
        { y: -8, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.5,
          stagger: 0.04,
          ease: "power2.out",
          delay: 0.15,
          clearProps: "all",
        }
      );
    },
    { scope: navbarRef, dependencies: [mounted, reduceMotion] }
  );

  // Inclusive Design: Motion Safeguards for Vestibular Disorders
  const itemMotionVariants = reduceMotion
    ? ({
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.1 } },
      } as const)
    : ({
        hidden: { y: 12, opacity: 0 },
        visible: {
          y: 0,
          opacity: 1,
          transition: { type: "spring" as const, stiffness: 350, damping: 25 },
        },
      } as const);

  const dividerMotionVariants = reduceMotion
    ? ({
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.1 } },
      } as const)
    : ({
        hidden: { scaleX: 0.9, opacity: 0 },
        visible: { scaleX: 1, opacity: 1, transition: { duration: 0.3 } },
      } as const);

  return (
    <>
      <HerouiNavbar
        ref={navbarRef as React.RefObject<HTMLDivElement>}
        position="floating"
        maxWidth="xl"
        navigate={router.push}
        className="mt-4 transition-shadow duration-300 md:mt-6"
      >
        <HerouiNavbar.Header>
          <HerouiNavbar.MenuToggle
            className="nav-stagger md:hidden"
            srLabel="Toggle navigation menu"
          />

          {/* Premium Brand Logo Section with Micro-interaction */}
          <HerouiNavbar.Brand className="nav-stagger">
            <Link
              href="/"
              className="group flex items-center gap-2.5 transition-all duration-150 active:scale-95"
              aria-label="Odyssey Home"
            >
              <div className="rounded-full bg-zinc-950 p-1 text-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:rotate-12 dark:bg-white dark:text-zinc-950">
                <Logo size={14} />
              </div>
              <span className="hidden bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 bg-clip-text text-base font-bold tracking-tight text-transparent sm:block dark:from-white dark:via-white/90 dark:to-white/60">
                Odyssey
              </span>
            </Link>
          </HerouiNavbar.Brand>

          <HerouiNavbar.Content className="absolute left-1/2 hidden -translate-x-1/2 gap-2 md:flex">
            {/* 1. Explore Redesign: Split Panel Megamenu Popover */}
            <Popover isOpen={isExploreOpen} onOpenChange={setIsExploreOpen}>
              <Popover.Trigger>
                <Button
                  variant="ghost"
                  className="nav-stagger"
                  aria-label="Toggle Explore categories"
                >
                  Explore
                </Button>
              </Popover.Trigger>
              <Popover.Content className="min-w-[460px] p-3">
                <Popover.Dialog className="grid grid-cols-12 gap-4">
                  {/* Left Side: Featured Postcard */}
                  <Card
                    className="col-span-5 flex flex-col justify-between p-3 select-none"
                    variant="secondary"
                  >
                    <Card.Header className="flex-col items-start gap-1 p-0">
                      <div className="flex items-center gap-1.5">
                        <Icon
                          icon="lucide:sparkles"
                          className="text-primary size-4 animate-pulse"
                        />
                        <span className="text-primary/80 text-[9px] font-bold tracking-widest uppercase">
                          Featured
                        </span>
                      </div>
                      <Card.Title className="mt-1 text-xs leading-tight font-bold">
                        The Odyssey of Life
                      </Card.Title>
                    </Card.Header>
                    <Card.Content className="mt-auto p-0 pt-4">
                      <Card.Description className="text-[10px] leading-relaxed italic">
                        &ldquo;A lifelong journey of mapping passions, creations &amp;
                        setups.&rdquo;
                      </Card.Description>
                    </Card.Content>
                  </Card>

                  {/* Right Side: Accessible ListBox */}
                  <div className="col-span-7">
                    <ListBox
                      aria-label="Explore Archive Categories"
                      selectionMode="none"
                      onAction={(key) => {
                        setIsExploreOpen(false);
                        if (key === "blog") router.push("/");
                        else if (key === "travel") router.push("/test/moment");
                        else if (key === "exhibition") router.push("/test/file");
                      }}
                    >
                      <ListBox.Item id="blog" textValue="Blogs">
                        <Icon
                          icon="lucide:book-open"
                          className="size-4 text-indigo-400"
                          data-slot="icon"
                        />
                        <div className="flex flex-col">
                          <Label>Blogs</Label>
                          <Description>Systematic columns & structured blogs</Description>
                        </div>
                      </ListBox.Item>

                      <ListBox.Item id="travel" textValue="Travelogue">
                        <Icon
                          icon="lucide:map"
                          className="size-4 text-emerald-500"
                          data-slot="icon"
                        />
                        <div className="flex flex-col">
                          <Label>Travelogue</Label>
                          <Description>Photogenic travelogues & adventure logs</Description>
                        </div>
                      </ListBox.Item>

                      <ListBox.Item id="exhibition" textValue="Exhibitions">
                        <Icon
                          icon="lucide:camera"
                          className="size-4 text-sky-400"
                          data-slot="icon"
                        />
                        <div className="flex flex-col">
                          <Label>Exhibitions</Label>
                          <Description>High-resolution photography & visual portfolio</Description>
                        </div>
                      </ListBox.Item>
                    </ListBox>
                  </div>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>

            {/* 2. Passions Redesign: Standard Clean Dropdown List */}
            <Dropdown isOpen={isPassionsOpen} onOpenChange={setIsPassionsOpen}>
              <Button
                variant="ghost"
                className="nav-stagger"
                aria-label="Toggle Passions categories"
              >
                Passions
              </Button>
              <Dropdown.Popover className="min-w-[240px]">
                <Dropdown.Menu
                  onAction={(key) => {
                    setIsPassionsOpen(false);
                    if (
                      key === "stock" ||
                      key === "soundtrack" ||
                      key === "fitness" ||
                      key === "coding"
                    ) {
                      router.push("/test/moment");
                    }
                  }}
                >
                  <Dropdown.Section>
                    <Header>Daily & Passions</Header>
                    <Dropdown.Item id="stock" textValue="Stock Ledger">
                      <Icon
                        icon="lucide:trending-up"
                        className="size-4 text-emerald-500"
                        data-slot="icon"
                      />
                      <div className="flex flex-col">
                        <Label>Stock Ledger</Label>
                        <Description>Real-time trading logs & portfolios</Description>
                      </div>
                    </Dropdown.Item>

                    <Dropdown.Item id="soundtrack" textValue="Soundtrack">
                      <Icon icon="lucide:music" className="size-4 text-rose-400" data-slot="icon" />
                      <div className="flex flex-col">
                        <Label>Soundtrack</Label>
                        <Description>Ambient stream, playlists & notes</Description>
                      </div>
                    </Dropdown.Item>

                    <Dropdown.Item id="fitness" textValue="Fitness Hub">
                      <Icon
                        icon="lucide:dumbbell"
                        className="size-4 text-amber-500"
                        data-slot="icon"
                      />
                      <div className="flex flex-col">
                        <Label>Fitness Hub</Label>
                        <Description>Active workout logging & performance</Description>
                      </div>
                    </Dropdown.Item>

                    <Dropdown.Item id="coding" textValue="Coding Sandbox">
                      <Icon
                        icon="lucide:terminal"
                        className="size-4 text-sky-400"
                        data-slot="icon"
                      />
                      <div className="flex flex-col">
                        <Label>Coding Sandbox</Label>
                        <Description>Geek playgrounds & lab coding logs</Description>
                      </div>
                    </Dropdown.Item>
                  </Dropdown.Section>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>

            {/* 3. Builds Redesign: Horizontal Grid Popover Cards */}
            <Popover isOpen={isBuildsOpen} onOpenChange={setIsBuildsOpen}>
              <Popover.Trigger>
                <Button
                  variant="ghost"
                  className="nav-stagger"
                  aria-label="Toggle Builds categories"
                >
                  Builds
                </Button>
              </Popover.Trigger>
              <Popover.Content>
                <Popover.Dialog className="flex flex-col gap-3">
                  <Popover.Heading className="font-bold tracking-widest uppercase">
                    Creator Shipyard
                  </Popover.Heading>
                  <ItemCardGroup layout="grid" columns={3} variant="transparent">
                    <ItemCard>
                      <ItemCard.Icon>
                        <Icon icon="lucide:rocket" className="text-teal-500" />
                      </ItemCard.Icon>
                      <ItemCard.Content>
                        <ItemCard.Title className="font-semibold">Shipyard</ItemCard.Title>
                        <ItemCard.Description className="text-muted">
                          SaaS web products
                        </ItemCard.Description>
                      </ItemCard.Content>
                    </ItemCard>

                    <ItemCard>
                      <ItemCard.Icon>
                        <Icon icon="lucide:github" className="size-5 text-zinc-400" />
                      </ItemCard.Icon>
                      <ItemCard.Content>
                        <ItemCard.Title className="font-semibold">Open Source</ItemCard.Title>
                        <ItemCard.Description className="text-muted">
                          Public libraries
                        </ItemCard.Description>
                      </ItemCard.Content>
                    </ItemCard>

                    <ItemCard>
                      <ItemCard.Icon>
                        <Icon icon="lucide:flask-conical" className="size-5 text-amber-500" />
                      </ItemCard.Icon>
                      <ItemCard.Content>
                        <ItemCard.Title className="font-semibold">Labs</ItemCard.Title>
                        <ItemCard.Description className="text-muted">
                          Beta experiments
                        </ItemCard.Description>
                      </ItemCard.Content>
                    </ItemCard>
                  </ItemCardGroup>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>

            <Popover isOpen={isCurationsOpen} onOpenChange={setIsCurationsOpen}>
              <Popover.Trigger>
                <Button
                  variant="ghost"
                  className="nav-stagger"
                  aria-label="Toggle Curations categories"
                >
                  Curations
                </Button>
              </Popover.Trigger>
              <Popover.Content>
                <Popover.Dialog className="flex flex-col gap-2">
                  <Popover.Heading>Selected & Shared</Popover.Heading>
                  <ListBox
                    aria-label="Selected Goods & Media"
                    selectionMode="none"
                    onAction={(key) => {
                      setIsCurationsOpen(false);
                      if (key === "goods") router.push("/test/tag");
                      else if (key === "vault") router.push("/test/file");
                    }}
                  >
                    <ListBox.Section>
                      <ListBox.Item id="goods" textValue="Selected Goods">
                        <Icon
                          icon="lucide:sparkles"
                          className="size-4 text-violet-400"
                          data-slot="icon"
                        />
                        <div className="flex flex-col">
                          <Label>Selected Goods</Label>
                          <Description>Curated tech gear, setups & books</Description>
                        </div>
                      </ListBox.Item>

                      <ListBox.Item id="vault" textValue="Media Vault">
                        <Icon
                          icon="lucide:archive"
                          className="size-4 text-blue-500"
                          data-slot="icon"
                        />
                        <div className="flex flex-col">
                          <Label>Media Vault</Label>
                          <Description>Public file templates & download bucket</Description>
                        </div>
                      </ListBox.Item>
                      <Separator className="my-1 opacity-60" />

                      <ListBox.Item key="comments" id="comments" textValue="Symbiosis Echo">
                        <div className="flex h-8 items-start justify-center pt-px">
                          <Icon
                            icon="lucide:message-square"
                            className="size-4 text-purple-500"
                            data-slot="icon"
                          />
                        </div>

                        <div className="flex flex-col">
                          <Label className="text-accent font-bold">Symbiosis Echo</Label>
                          <Description className="max-w-55 italic">
                            &ldquo;Your articles about stock trading and fitness changed my daily
                            workflow. Thank you!&rdquo; — Priya
                          </Description>
                        </div>
                      </ListBox.Item>
                    </ListBox.Section>
                  </ListBox>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>

            {/* 5. Aviation Redesign: Sharp Administrative Cockpit Dropdown */}
            {mounted && isAuthenticated && (
              <Dropdown>
                <Button
                  variant="ghost"
                  className="nav-stagger font-bold text-teal-600 dark:text-teal-400"
                  aria-label="Toggle Aviation admin cockpit"
                >
                  Aviation
                </Button>
                <Dropdown.Popover className="min-w-[240px]">
                  <Dropdown.Menu
                    onAction={(key) => {
                      if (key === "dashboard" || key === "categories") {
                        router.push("/test/category");
                      } else if (key === "tags") {
                        router.push("/test/tag");
                      }
                    }}
                  >
                    <Dropdown.Section>
                      <Header>Aviation Control</Header>
                      <Dropdown.Item id="dashboard" textValue="Aviation Panel">
                        <Icon
                          icon="lucide:layout-dashboard"
                          className="size-4 text-teal-500"
                          data-slot="icon"
                        />
                        <div className="flex flex-col">
                          <Label>Aviation Panel</Label>
                          <Description>Full network metrics dashboard</Description>
                        </div>
                      </Dropdown.Item>

                      <Dropdown.Item id="categories" textValue="Taxonomy Star">
                        <Icon
                          icon="lucide:folder-tree"
                          className="size-4 text-pink-400"
                          data-slot="icon"
                        />
                        <div className="flex flex-col">
                          <Label>Taxonomy Star</Label>
                          <Description>Map categories & knowledge trees</Description>
                        </div>
                      </Dropdown.Item>

                      <Dropdown.Item id="tags" textValue="Keyword Index">
                        <Icon
                          icon="lucide:tags"
                          className="size-4 text-amber-500"
                          data-slot="icon"
                        />
                        <div className="flex flex-col">
                          <Label>Keyword Index</Label>
                          <Description>Micro-classification keyword tags</Description>
                        </div>
                      </Dropdown.Item>
                    </Dropdown.Section>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            )}
          </HerouiNavbar.Content>

          <HerouiNavbar.Spacer />

          {/* Right Accessories: Search, Theme toggles, and Account Panels */}
          <HerouiNavbar.Content className="hidden items-center gap-2.5 md:flex">
            {/* Global command search button */}
            <Button
              variant="secondary"
              onPress={() => setIsSearchOpen(true)}
              className="nav-stagger h-9 gap-2.5 rounded-full"
              aria-label={`Search shortcuts: press ${platformKey} K to search`}
            >
              <SearchIcon size={13} className="opacity-80" />
              <span className="text-xs font-semibold tracking-wide">Search...</span>
              <Kbd variant="light" className="ml-1" aria-hidden="true">
                <Kbd.Abbr
                  keyValue={mounted && (os === "macos" || os === "ios") ? "command" : "ctrl"}
                />
                <Kbd.Content>K</Kbd.Content>
              </Kbd>
            </Button>

            <CommandPalette isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} />

            {/* Premium Theme Switcher */}
            {mounted && (
              <Button
                isIconOnly
                variant="ghost"
                onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="nav-stagger relative size-9 overflow-hidden rounded-full"
                aria-label="Toggle dark and light mode theme"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={theme}
                    initial={reduceMotion ? { opacity: 0 } : { y: -15, rotate: -90, opacity: 0 }}
                    animate={reduceMotion ? { opacity: 1 } : { y: 0, rotate: 0, opacity: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { y: 15, rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {theme === "dark" ? <SunMaxFillIcon size={16} /> : <MoonFillIcon size={16} />}
                  </motion.div>
                </AnimatePresence>
              </Button>
            )}

            {/* Account authentication state panel - Hydration safe layout */}
            {mounted ? (
              isAuthenticated ? (
                <Dropdown>
                  <Dropdown.Trigger
                    className="nav-stagger relative rounded-full transition-all duration-150 active:scale-95"
                    aria-label="User account dashboard menu"
                  >
                    <div className="group relative cursor-pointer">
                      {/* Standard native status indicator using HeroUI Badge.Anchor */}
                      <Badge.Anchor>
                        <Avatar
                          size="sm"
                          color="default"
                          className="size-8 transition-transform hover:scale-105"
                        >
                          <Avatar.Fallback delayMs={600}>
                            {username ? username.charAt(0).toUpperCase() : "U"}
                          </Avatar.Fallback>
                        </Avatar>
                        <Badge color="success" placement="bottom-right" size="sm" />
                      </Badge.Anchor>
                    </div>
                  </Dropdown.Trigger>
                  <Dropdown.Popover className="min-w-[240px]">
                    <div className="px-3.5 pt-3.5 pb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <Badge.Anchor>
                            <Avatar size="sm" color="default" className="size-8">
                              <Avatar.Fallback delayMs={600}>
                                {username ? username.charAt(0).toUpperCase() : "U"}
                              </Avatar.Fallback>
                            </Avatar>
                            <Badge color="success" placement="bottom-right" size="sm" />
                          </Badge.Anchor>
                        </div>
                        <div className="flex min-w-0 flex-col gap-0">
                          <p className="truncate text-sm leading-5 font-bold">
                            {username || "User"}
                          </p>
                          <p className="truncate text-[10px] leading-none text-zinc-500 dark:text-zinc-400">
                            {email || "Owner Account"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Dropdown.Menu
                      className="p-1"
                      onAction={(key) => {
                        if (key === "logout") {
                          dispatch(removeCredentials());
                          dispatch(baseApi.util.resetApiState());
                        } else if (key === "dashboard") {
                          router.push("/test/category");
                        } else if (key === "profile") {
                          router.push("/test/profile");
                        }
                      }}
                    >
                      <Dropdown.Item id="dashboard" textValue="Dashboard">
                        <Label>Workspace Dashboard</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="profile" textValue="Profile">
                        <Label>Profile</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="settings" textValue="Settings">
                        <Label>Settings</Label>
                        <Icon
                          icon="lucide:settings"
                          className="text-default-500 size-3.5"
                          data-slot="icon"
                        />
                      </Dropdown.Item>
                      <Dropdown.Item id="new-project" textValue="New project">
                        <Label>Create Team</Label>
                        <Icon
                          icon="lucide:users"
                          className="text-default-500 size-3.5"
                          data-slot="icon"
                        />
                      </Dropdown.Item>
                      <Dropdown.Item id="logout" textValue="Logout" variant="danger">
                        <Label>Log Out</Label>
                        <Icon
                          icon="lucide:log-out"
                          className="text-danger size-3.5"
                          data-slot="icon"
                        />
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              ) : (
                <div className="nav-stagger ml-1 flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => setIsLoginOpen(!isLoginOpen)}
                    className="rounded-full font-semibold"
                  >
                    Log in
                  </Button>
                  <Button
                    size="sm"
                    onPress={() => setIsSignUpOpen(!isSignUpOpen)}
                    className="rounded-full font-bold"
                  >
                    Sign up
                  </Button>
                </div>
              )
            ) : (
              /* Safe Skeleton layout during hydration phase to avoid shift jitter */
              <div
                className="nav-stagger ml-1 flex items-center gap-1.5 opacity-0"
                aria-hidden="true"
              >
                <Button size="sm" variant="ghost" className="h-9 min-w-0 rounded-full px-4 text-xs">
                  Log in
                </Button>
                <Button size="sm" className="h-9 min-w-0 rounded-full px-4 text-xs">
                  Sign up
                </Button>
              </div>
            )}
          </HerouiNavbar.Content>
        </HerouiNavbar.Header>

        {/* Mobile Navigation Staggered Drawer Menu */}
        <HerouiNavbar.Menu>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={
              reduceMotion
                ? {
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { duration: 0.1 } },
                  }
                : {
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.04,
                      },
                    },
                  }
            }
            className="flex h-full w-full flex-col overflow-y-auto pb-8"
          >
            {/* 1. Explore Mobile Section */}
            <motion.div
              variants={itemMotionVariants}
              className="px-2 pt-4 pb-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase"
            >
              Explore
            </motion.div>
            <motion.div variants={itemMotionVariants}>
              <HerouiNavbar.MenuItem href="/" isCurrent={"/" === currentItem}>
                <Icon icon="lucide:book-open" className="text-indigo-400" data-slot="icon" />
                Blogs
              </HerouiNavbar.MenuItem>
            </motion.div>
            <motion.div variants={itemMotionVariants}>
              <HerouiNavbar.MenuItem href="/test/moment" isCurrent={"/test/moment" === currentItem}>
                <Icon icon="lucide:map" className="text-emerald-500" data-slot="icon" />
                Travelogue
              </HerouiNavbar.MenuItem>
            </motion.div>
            <motion.div variants={itemMotionVariants}>
              <HerouiNavbar.MenuItem href="/test/file" isCurrent={"/test/file" === currentItem}>
                <Icon icon="lucide:camera" className="text-sky-400" data-slot="icon" />
                Exhibitions
              </HerouiNavbar.MenuItem>
            </motion.div>

            <motion.div
              variants={dividerMotionVariants}
              className="my-2 border-t border-black/5 dark:border-white/5"
            />

            {/* 2. Passions Mobile Section */}
            <motion.div
              variants={itemMotionVariants}
              className="px-2 pb-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase"
            >
              Passions
            </motion.div>
            <motion.div variants={itemMotionVariants}>
              <HerouiNavbar.MenuItem href="/test/moment" isCurrent={"/test/moment" === currentItem}>
                <Icon icon="lucide:trending-up" className="text-emerald-500" data-slot="icon" />
                Stock Ledger
              </HerouiNavbar.MenuItem>
            </motion.div>
            <motion.div variants={itemMotionVariants}>
              <HerouiNavbar.MenuItem href="/test/moment" isCurrent={"/test/moment" === currentItem}>
                <Icon icon="lucide:music" className="text-rose-400" data-slot="icon" />
                Soundtrack
              </HerouiNavbar.MenuItem>
            </motion.div>
            <motion.div variants={itemMotionVariants}>
              <HerouiNavbar.MenuItem href="/test/moment" isCurrent={"/test/moment" === currentItem}>
                <Icon icon="lucide:dumbbell" className="text-amber-500" data-slot="icon" />
                Fitness Hub
              </HerouiNavbar.MenuItem>
            </motion.div>
            <motion.div variants={itemMotionVariants}>
              <HerouiNavbar.MenuItem href="/test/moment" isCurrent={"/test/moment" === currentItem}>
                <Icon icon="lucide:terminal" className="text-sky-400" data-slot="icon" />
                Coding Sandbox
              </HerouiNavbar.MenuItem>
            </motion.div>

            <motion.div
              variants={dividerMotionVariants}
              className="my-2 border-t border-black/5 dark:border-white/5"
            />

            <motion.div
              variants={itemMotionVariants}
              className="px-2 pb-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase"
            >
              Builds
            </motion.div>
            <motion.div variants={itemMotionVariants}>
              <HerouiNavbar.MenuItem href="/" isCurrent={"/" === currentItem}>
                <Icon icon="lucide:rocket" className="text-teal-500" data-slot="icon" />
                Shipyard
              </HerouiNavbar.MenuItem>
            </motion.div>
            <motion.div variants={itemMotionVariants}>
              <HerouiNavbar.MenuItem href="/" isCurrent={"/" === currentItem}>
                <Icon icon="lucide:github" className="text-zinc-400" data-slot="icon" />
                Open Source
              </HerouiNavbar.MenuItem>
            </motion.div>
            <motion.div variants={itemMotionVariants}>
              <HerouiNavbar.MenuItem href="/" isCurrent={"/" === currentItem}>
                <Icon icon="lucide:flask-conical" className="text-amber-500" data-slot="icon" />
                Labs
              </HerouiNavbar.MenuItem>
            </motion.div>

            <motion.div
              variants={dividerMotionVariants}
              className="my-2 border-t border-black/5 dark:border-white/5"
            />

            {/* 4. Curations Mobile Section */}
            <motion.div
              variants={itemMotionVariants}
              className="px-2 pb-1.5 text-[10px] font-bold tracking-widest text-zinc-500 uppercase"
            >
              Curations
            </motion.div>
            <motion.div variants={itemMotionVariants}>
              <HerouiNavbar.MenuItem href="/test/tag" isCurrent={"/test/tag" === currentItem}>
                <Icon icon="lucide:sparkles" className="text-violet-400" data-slot="icon" />
                Selected Goods
              </HerouiNavbar.MenuItem>
            </motion.div>
            <motion.div variants={itemMotionVariants}>
              <HerouiNavbar.MenuItem href="/test/file" isCurrent={"/test/file" === currentItem}>
                <Icon icon="lucide:archive" className="text-blue-500" data-slot="icon" />
                Media Vault
              </HerouiNavbar.MenuItem>
            </motion.div>
            <motion.div variants={itemMotionVariants}>
              <HerouiNavbar.MenuItem
                href="/test/comment"
                isCurrent={"/test/comment" === currentItem}
              >
                <Icon icon="lucide:message-square" className="text-purple-500" data-slot="icon" />
                Symbiosis Echo
              </HerouiNavbar.MenuItem>
            </motion.div>

            {/* 5. Aviation Mobile Section (Only shown when logged in) */}
            {mounted && isAuthenticated && (
              <>
                <motion.div
                  variants={dividerMotionVariants}
                  className="my-2 border-t border-black/5 dark:border-white/5"
                />
                <motion.div
                  variants={itemMotionVariants}
                  className="px-2 pb-1.5 text-[10px] font-bold tracking-widest text-teal-600 uppercase dark:text-teal-400"
                >
                  Aviation
                </motion.div>
                <motion.div variants={itemMotionVariants}>
                  <HerouiNavbar.MenuItem
                    href="/test/category"
                    isCurrent={"/test/category" === currentItem}
                  >
                    <Icon
                      icon="lucide:layout-dashboard"
                      className="text-teal-500"
                      data-slot="icon"
                    />
                    Aviation Panel
                  </HerouiNavbar.MenuItem>
                </motion.div>
                <motion.div variants={itemMotionVariants}>
                  <HerouiNavbar.MenuItem
                    href="/test/category"
                    isCurrent={"/test/category" === currentItem}
                  >
                    <Icon icon="lucide:folder-tree" className="text-pink-400" data-slot="icon" />
                    Taxonomy Star
                  </HerouiNavbar.MenuItem>
                </motion.div>
                <motion.div variants={itemMotionVariants}>
                  <HerouiNavbar.MenuItem href="/test/tag" isCurrent={"/test/tag" === currentItem}>
                    <Icon icon="lucide:tags" className="text-amber-500" data-slot="icon" />
                    Keyword Index
                  </HerouiNavbar.MenuItem>
                </motion.div>
              </>
            )}
          </motion.div>
        </HerouiNavbar.Menu>
      </HerouiNavbar>

      <SignUp
        isOpen={isSignUpOpen}
        onOpenChange={setIsSignUpOpen}
        onSwitchToLogIn={handleSwitchToLogIn}
      />
      <LogIn
        isOpen={isLoginOpen}
        onOpenChange={setIsLoginOpen}
        onSwitchToSignUp={handleSwitchToSignUp}
      />
    </>
  );
};
