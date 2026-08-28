"use client";

import { Avatar, Chip } from "@heroui/react";
import { Sidebar } from "@heroui-pro/react";
import type { NavItem } from "./nav-items";

import { FOOTER_ITEMS, NAV_GROUPS } from "./nav-items";

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
        <Sidebar.Header>
          <div className="flex items-center gap-3 px-1 py-2">
            <Avatar color="accent" variant="soft" size="sm">
              <Avatar.Fallback className="font-semibold">O</Avatar.Fallback>
            </Avatar>
            <div className="min-w-0" data-sidebar="label">
              <p className="text-foreground truncate text-sm font-semibold">Odyssey</p>
              <p className="text-muted truncate text-xs">Personal workspace</p>
            </div>
          </div>
        </Sidebar.Header>
        <SidebarContents
          basePath={basePath}
          disableNavigation={disableNavigation}
          pathname={pathname}
        />
        <Sidebar.Footer>
          <Sidebar.Menu aria-label="Workspace actions">
            {FOOTER_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.href}
                basePath={basePath}
                disableNavigation={disableNavigation}
                idPrefix="footer-"
                item={item}
                pathname={pathname}
              />
            ))}
          </Sidebar.Menu>
        </Sidebar.Footer>
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Mobile>
        <Sidebar.Header>
          <div className="flex items-center gap-3 px-1 py-2">
            <Avatar color="accent" variant="soft" size="sm">
              <Avatar.Fallback className="font-semibold">O</Avatar.Fallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-foreground truncate text-sm font-semibold">Odyssey</p>
              <p className="text-muted truncate text-xs">Personal workspace</p>
            </div>
          </div>
        </Sidebar.Header>
        <SidebarContents
          basePath={basePath}
          disableNavigation={disableNavigation}
          idPrefix="mobile-"
          pathname={pathname}
        />
        <Sidebar.Footer>
          <Sidebar.Menu aria-label="Workspace actions">
            {FOOTER_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.href}
                basePath={basePath}
                disableNavigation={disableNavigation}
                idPrefix="mobile-footer-"
                item={item}
                pathname={pathname}
              />
            ))}
          </Sidebar.Menu>
        </Sidebar.Footer>
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
