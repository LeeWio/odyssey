"use client";

import { Chip } from "@heroui/react";
import { Sidebar } from "@heroui-pro/react";
import type { NavItem } from "./nav-items";

import { NAV_GROUPS } from "./nav-items";

interface DashboardSidebarProps {
  pathname: string;
  basePath: string;
  disableNavigation?: boolean;
}

export function DashboardSidebar({
  basePath,
  disableNavigation = false,
  pathname,
}: DashboardSidebarProps) {
  return (
    <>
      <Sidebar>
        <SidebarContents
          basePath={basePath}
          disableNavigation={disableNavigation}
          pathname={pathname}
        />
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Mobile>
        <SidebarContents
          basePath={basePath}
          disableNavigation={disableNavigation}
          idPrefix="mobile-"
          pathname={pathname}
        />
      </Sidebar.Mobile>
    </>
  );
}

interface SidebarContentsProps {
  basePath: string;
  disableNavigation: boolean;
  pathname: string;
  idPrefix?: string;
}

function SidebarContents({
  basePath,
  disableNavigation,
  idPrefix = "",
  pathname,
}: SidebarContentsProps) {
  return (
    <>
      <Sidebar.Header>
        <div className="flex items-center gap-3 px-1 py-2">
          <span
            aria-hidden="true"
            className="bg-accent text-accent-foreground flex size-7 shrink-0 items-center justify-center rounded-md text-sm font-semibold"
          >
            O
          </span>
          <div className="flex min-w-0 flex-col" data-sidebar="label">
            <span className="text-foreground truncate text-sm font-semibold">Odyssey</span>
            <span className="text-muted truncate text-xs">Administration</span>
          </div>
        </div>
      </Sidebar.Header>
      <Sidebar.Content>
        {NAV_GROUPS.map((group) => (
          <Sidebar.Group key={group.label}>
            <Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
            <Sidebar.Menu aria-label={`${group.label} navigation`}>
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  basePath={basePath}
                  disableNavigation={disableNavigation}
                  idPrefix={idPrefix}
                  item={item}
                  pathname={pathname}
                />
              ))}
            </Sidebar.Menu>
          </Sidebar.Group>
        ))}
      </Sidebar.Content>
    </>
  );
}

interface SidebarNavItemProps {
  basePath: string;
  disableNavigation: boolean;
  idPrefix: string;
  item: NavItem;
  pathname: string;
}

function SidebarNavItem({
  basePath,
  disableNavigation,
  idPrefix,
  item,
  pathname,
}: SidebarNavItemProps) {
  const Icon = item.icon;
  const fullHref = basePath + item.href;
  const isCurrent =
    item.href === "/"
      ? pathname === fullHref || pathname === basePath || pathname === `${basePath}/`
      : pathname === fullHref || pathname.startsWith(`${fullHref}/`);

  return (
    <Sidebar.MenuItem
      href={disableNavigation ? undefined : fullHref}
      id={`${idPrefix}${item.href}`}
      isCurrent={isCurrent}
      textValue={item.label}
      tooltip={item.label}
    >
      <Sidebar.MenuIcon>
        <Icon className="size-4" />
      </Sidebar.MenuIcon>
      <Sidebar.MenuLabel>{item.label}</Sidebar.MenuLabel>
      {item.badge ? (
        <Sidebar.MenuChip>
          <Chip color="success" size="sm" variant="soft">
            {item.badge}
          </Chip>
        </Sidebar.MenuChip>
      ) : null}
    </Sidebar.MenuItem>
  );
}
