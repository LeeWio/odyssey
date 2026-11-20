"use client";

import { Bell, Magnifier, PersonPlus } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { AppLayout, Navbar, Sidebar } from "@heroui-pro/react";
import { useTranslations } from "next-intl";

import { IconButton } from "./icon-button";

export interface DashboardNavbarProps {
  /** Title rendered in the navbar. Falls back to the home-page greeting. */
  title?: string;
}

export function DashboardNavbar({ title }: DashboardNavbarProps) {
  const t = useTranslations("Dashboard");

  return (
    <Navbar maxWidth="full">
      <Navbar.Header>
        <AppLayout.MenuToggle />
        <Sidebar.Trigger />
        <h1 className="text-foreground truncate text-xl font-semibold">
          {title ?? t("shell.defaultTitle")}
        </h1>
        <Navbar.Spacer />
        <div className="flex items-center gap-2">
          <IconButton label={t("shell.search")} size="sm" variant="tertiary">
            <Magnifier className="size-4" />
          </IconButton>
          <IconButton label={t("shell.notifications")} size="sm" variant="tertiary">
            <Bell className="size-4" />
          </IconButton>
          <Button size="sm">
            <PersonPlus className="size-4" />
            {t("shell.invite")}
          </Button>
        </div>
      </Navbar.Header>
    </Navbar>
  );
}
