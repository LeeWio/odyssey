"use client";

import type { NavItem } from "./nav-items";

import { LayoutSideContentLeft } from "@gravity-ui/icons";
import { Chip } from "@heroui/react";
import { Sidebar, useSidebar } from "@heroui-pro/react";
import { useTranslations } from "next-intl";

import { IconButton } from "./icon-button";

import { FOOTER_ITEMS, NAV_GROUPS } from "./nav-items";

interface DashboardSidebarProps {
  pathname: string;
  basePath: string;
  disableNavigation?: boolean;
  onNavigate?: (href: string) => void;
}

export function DashboardSidebar({
  basePath,
  disableNavigation = false,
  onNavigate,
  pathname,
}: DashboardSidebarProps) {
  return (
    <>
      <Sidebar className="bg-overlay">
        <SidebarContents
          basePath={basePath}
          disableNavigation={disableNavigation}
          onNavigate={onNavigate}
          pathname={pathname}
        />
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Mobile className="bg-overlay">
        <SidebarContents
          basePath={basePath}
          disableNavigation={disableNavigation}
          idPrefix="mobile-"
          onNavigate={onNavigate}
          pathname={pathname}
        />
      </Sidebar.Mobile>
    </>
  );
}

interface SidebarContentsProps {
  basePath: string;
  disableNavigation: boolean;
  onNavigate?: (href: string) => void;
  pathname: string;
  idPrefix?: string;
}

function SidebarContents({
  basePath,
  disableNavigation,
  idPrefix = "",
  onNavigate,
  pathname,
}: SidebarContentsProps) {
  const { isOpen, toggleSidebar } = useSidebar();
  const t = useTranslations("Dashboard");

  return (
    <>
      <Sidebar.Header>
        <div className="flex items-center px-1 py-1">
          <IconButton
            label={t(isOpen ? "shell.collapseSidebar" : "shell.expandSidebar")}
            size="sm"
            variant="tertiary"
            onPress={toggleSidebar}
          >
            <LayoutSideContentLeft className="size-4" />
          </IconButton>
        </div>
      </Sidebar.Header>
      <Sidebar.Content>
        {NAV_GROUPS.map((group) => (
          <Sidebar.Group key={group.labelKey}>
            <Sidebar.GroupLabel>{t(`nav.${group.labelKey}`)}</Sidebar.GroupLabel>
            <Sidebar.Menu aria-label={`${t(`nav.${group.labelKey}`)} navigation`}>
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  basePath={basePath}
                  disableNavigation={disableNavigation}
                  idPrefix={idPrefix}
                  item={item}
                  onNavigate={onNavigate}
                  pathname={pathname}
                />
              ))}
            </Sidebar.Menu>
          </Sidebar.Group>
        ))}
      </Sidebar.Content>
      <Sidebar.Footer>
        <Sidebar.Menu aria-label={t("shell.account")}>
          {FOOTER_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.href}
              basePath={basePath}
              disableNavigation={disableNavigation}
              idPrefix={idPrefix}
              item={item}
              onNavigate={onNavigate}
              pathname={pathname}
            />
          ))}
        </Sidebar.Menu>
      </Sidebar.Footer>
    </>
  );
}

interface SidebarNavItemProps {
  basePath: string;
  disableNavigation: boolean;
  idPrefix: string;
  item: NavItem;
  onNavigate?: (href: string) => void;
  pathname: string;
}

function SidebarNavItem({
  basePath,
  disableNavigation,
  idPrefix,
  item,
  onNavigate,
  pathname,
}: SidebarNavItemProps) {
  const Icon = item.icon;
  const t = useTranslations("Dashboard");
  const label = t(`nav.${item.labelKey}`);
  const fullHref = basePath + item.href;
  const isCurrent =
    item.href === "/"
      ? pathname === fullHref || pathname === basePath || pathname === `${basePath}/`
      : pathname === fullHref || pathname.startsWith(`${fullHref}/`);

  return (
    <Sidebar.MenuItem
      href={disableNavigation || onNavigate ? undefined : fullHref}
      id={`${idPrefix}${item.href}`}
      isCurrent={isCurrent}
      textValue={label}
      onAction={onNavigate ? () => onNavigate(item.href) : undefined}
    >
      <Sidebar.MenuIcon>
        <Icon className="size-4" />
      </Sidebar.MenuIcon>
      <Sidebar.MenuLabel>{label}</Sidebar.MenuLabel>
      {item.badge ? (
        <Sidebar.MenuChip>
          <Chip color="success" size="sm" variant="soft">
            {t(`shell.${item.badge}`)}
          </Chip>
        </Sidebar.MenuChip>
      ) : null}
    </Sidebar.MenuItem>
  );
}
