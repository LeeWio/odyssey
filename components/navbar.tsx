"use client";

import { Kbd, Button, Avatar, Dropdown, Label } from "@heroui/react";
import { useRef, useState } from "react";
import { Navbar as HerouiNavbar } from "@heroui-pro/react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { GearIcon, SearchIcon, PersonsIcon, ArrowRightFromSquareIcon } from "./icons";
import { useMounted } from "@/hooks/use-mounted";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import {
  selectIsAuthenticated,
  selectCurrentUser,
  selectUserEmail,
  removeCredentials,
} from "@/lib/features/auth";
import { baseApi } from "@/lib/features/api/base-api";
import { SignUp } from "./auth/sign-up";
import { LogIn } from "./auth/log-in";
import { CommandPalette } from "./command-palette";

const BrandLogo = () => (
  <svg fill="none" height="22" viewBox="0 0 83 26" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0.536865 6.72737V14.2058C0.536865 14.5593 0.718555 14.8878 1.01747 15.0747L6.11609 18.2631C6.79552 18.688 7.67556 18.1977 7.67556 17.3942V11.108C7.67556 10.7463 7.86565 10.4115 8.1757 10.2271L11.2858 8.37825V24.4895C11.2858 25.2902 12.1606 25.781 12.8402 25.3616L18.1026 22.1136C18.4045 21.9273 18.5883 21.5972 18.5883 21.2415V5.77018C18.5883 4.97334 17.7212 4.48199 17.0414 4.89359L11.2858 8.37825V1.51066C11.2858 0.715978 10.4229 0.224316 9.74303 0.631596L1.03414 5.84829C0.725738 6.03305 0.536865 6.36691 0.536865 6.72737Z"
      fill="currentColor"
    />
    <path
      d="M37.8815 14.2238C37.8815 12.1031 37.0137 11.1243 35.2783 11.1243C33.2909 11.1243 31.8913 12.4565 31.8913 15.4473V22.299H28.3083V3.2666H31.8913V10.227C32.759 8.81318 34.1866 8.10627 36.146 8.10627C39.477 8.10627 41.4365 10.1454 41.4365 13.5713V22.299H37.8815V14.2238Z"
      fill="currentColor"
    />
    <path
      d="M50.3042 22.7342C45.8536 22.7342 43.0264 19.8521 43.0264 15.4203C43.0264 11.0428 45.8256 8.10645 50.3042 8.10645C55.1468 8.10645 57.778 11.5322 57.0502 16.3447H46.6093C46.8053 18.6286 48.1488 19.9337 50.3042 19.9337C52.0677 19.9337 53.1314 19.0365 53.4113 18.1392H56.9662C56.4064 20.8038 53.9431 22.7342 50.3042 22.7342ZM46.6933 13.9793H53.5792C53.5512 12.1032 52.3196 10.8253 50.2202 10.8253C48.3448 10.8253 47.0292 11.9129 46.6933 13.9793Z"
      fill="currentColor"
    />
    <path
      d="M59.0042 12.0212C59.0042 9.76449 60.2637 8.54102 62.671 8.54102H67.2618V11.4774H62.5871V22.2987H59.0042V12.0212Z"
      fill="currentColor"
    />
    <path
      d="M75.1008 22.7342C70.5662 22.7342 67.6831 19.8249 67.6831 15.4203C67.6831 11.0157 70.5662 8.10645 75.1008 8.10645C79.5793 8.10645 82.4629 11.0157 82.4629 15.4203C82.4629 19.8249 79.5793 22.7342 75.1008 22.7342ZM75.1008 19.7706C77.3403 19.7706 78.8235 18.0576 78.8235 15.4203C78.8235 12.783 77.3403 11.0428 75.1008 11.0428C72.8335 11.0428 71.3497 12.783 71.3497 15.4203C71.3497 18.0576 72.8335 19.7706 75.1008 19.7706Z"
      fill="currentColor"
    />
  </svg>
);

const navItems = [
  { href: "#docs", label: "Docs" },
  { href: "#pro", label: "Pro" },
  { href: "#blog", label: "Blog" },
];

export const Navbar = () => {
  const navbarRef = useRef<HTMLElement>(null);

  const [currentItem, setCurrentItem] = useState("#docs");
  const [isOpen, setIsOpen] = useState(false);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUprOpen, setIsSignUpOpen] = useState(false);

  const mounted = useMounted();

  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
  const email = useAppSelector(selectUserEmail);

  useGSAP(
    () => {
      if (!mounted) return;

      gsap.fromTo(
        [".navbar-brand", ".navbar-item", ".navbar-search", ".navbar-auth"],
        { autoAlpha: 0, y: -12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.06,
          ease: "power2.out",
          clearProps: "all",
        }
      );
    },
    { scope: navbarRef, dependencies: [mounted] }
  );

  const handleSwitchToSignUp = () => {
    console.log("Switching to Sign Up");
    setIsLoginOpen(false);
    setTimeout(() => setIsSignUpOpen(true), 300);
  };

  const handleSwitchToLogIn = () => {
    console.log("Switching to Log In");
    setIsSignUpOpen(false);
    setTimeout(() => setIsLoginOpen(true), 300);
  };

  return (
    <>
      <HerouiNavbar ref={navbarRef} hideOnScroll position="floating" className="mx-auto w-auto">
        <HerouiNavbar.Header>
          <HerouiNavbar.MenuToggle className="md:hidden" />
          <HerouiNavbar.Brand className="navbar-brand">
            <BrandLogo />
            <span className="sr-only">HeroUI</span>
          </HerouiNavbar.Brand>
          <HerouiNavbar.Content className="hidden gap-0 md:flex">
            {navItems.map((item) => (
              <HerouiNavbar.Item
                key={item.href}
                className="navbar-item px-2"
                href={item.href}
                isCurrent={item.href === currentItem}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentItem(item.href);
                }}
              >
                {item.label}
              </HerouiNavbar.Item>
            ))}
          </HerouiNavbar.Content>
          <HerouiNavbar.Spacer />
          <HerouiNavbar.Content className="hidden md:flex">
            <Button
              variant="tertiary"
              onPress={() => setIsOpen(true)}
              size="sm"
              className="navbar-search text-muted"
            >
              <SearchIcon />
              Search docs…
              <Kbd>
                <Kbd.Abbr keyValue="command" />
                <Kbd.Content>K</Kbd.Content>
              </Kbd>
            </Button>

            <CommandPalette isOpen={isOpen} setIsOpen={setIsOpen} />

            {mounted ? (
              isAuthenticated ? (
                <Dropdown className="navbar-auth">
                  <Dropdown.Trigger className="rounded-full">
                    <Avatar size="sm">
                      <Avatar.Fallback delayMs={600}>
                        {username ? username.charAt(0).toUpperCase() : "U"}
                      </Avatar.Fallback>
                    </Avatar>
                  </Dropdown.Trigger>
                  <Dropdown.Popover>
                    <div className="px-3 pt-3 pb-1">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <Avatar.Fallback delayMs={600}>
                            {username ? username.charAt(0).toUpperCase() : "U"}
                          </Avatar.Fallback>
                        </Avatar>
                        <div className="flex flex-col gap-0">
                          <p className="text-sm leading-5 font-medium">{username}</p>
                          <p className="text-muted text-xs leading-none">
                            {email || "User Account"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Dropdown.Menu
                      onAction={(key) => {
                        if (key === "logout") {
                          dispatch(removeCredentials());
                          dispatch(baseApi.util.resetApiState());
                        }
                      }}
                    >
                      <Dropdown.Item id="dashboard" textValue="Dashboard">
                        <Label>Dashboard</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="profile" textValue="Profile">
                        <Label>Profile</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="settings" textValue="Settings">
                        <div className="flex w-full items-center justify-between gap-2">
                          <Label>Settings</Label>
                          <GearIcon className="text-muted size-3.5" />
                        </div>
                      </Dropdown.Item>
                      <Dropdown.Item id="new-project" textValue="New project">
                        <div className="flex w-full items-center justify-between gap-2">
                          <Label>Create Team</Label>
                          <PersonsIcon className="text-muted size-3.5" />
                        </div>
                      </Dropdown.Item>
                      <Dropdown.Item id="logout" textValue="Logout" variant="danger">
                        <div className="flex w-full items-center justify-between gap-2">
                          <Label>Log Out</Label>
                          <ArrowRightFromSquareIcon className="text-danger size-3.5" />
                        </div>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              ) : (
                <div className="navbar-auth ml-2 flex items-center gap-3">
                  <Button size="sm" variant="ghost" onPress={() => setIsLoginOpen(!isLoginOpen)}>
                    Log in
                  </Button>
                  <Button size="sm" onPress={() => setIsSignUpOpen(!isSignUprOpen)}>
                    Sign up
                  </Button>
                </div>
              )
            ) : (
              <div className="navbar-auth ml-2 flex items-center gap-3 opacity-0">
                <Button size="sm" variant="ghost">
                  Log in
                </Button>
                <Button size="sm">Sign up</Button>
              </div>
            )}
          </HerouiNavbar.Content>
        </HerouiNavbar.Header>
        <HerouiNavbar.Menu>
          {navItems.map((item) => (
            <HerouiNavbar.MenuItem
              key={item.href}
              href={item.href}
              isCurrent={item.href === currentItem}
              onClick={(e) => {
                e.preventDefault();
                setCurrentItem(item.href);
              }}
            >
              {item.label}
            </HerouiNavbar.MenuItem>
          ))}
        </HerouiNavbar.Menu>
      </HerouiNavbar>
      <SignUp
        isOpen={isSignUprOpen}
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
