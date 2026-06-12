"use client";

import type { NavItem } from "./nav-items";

import { Chip } from "@heroui/react";
import { Sidebar, useSidebar } from "@heroui-pro/react";
import { Bars, LayoutSideContentLeft } from "@gravity-ui/icons";

import { NAV_ITEMS } from "./nav-items";

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
      <Sidebar className="h-auto">
        <SidebarContents
          basePath={basePath}
          disableNavigation={disableNavigation}
          pathname={pathname}
        />
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
  const { toggleSidebar, setMobileOpen } = useSidebar();

  return (
    <>
      <Sidebar.Header>{""}</Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Group>
          <Sidebar.Menu aria-label="Toggle navigation">
            <Sidebar.MenuItem
              id="toggle-menu"
              textValue="Toggle Menu"
              className="lg:hidden"
              onAction={() => setMobileOpen(true)}
            >
              <Sidebar.MenuIcon>
                <Bars className="size-4" />
              </Sidebar.MenuIcon>
              <Sidebar.MenuLabel>Menu</Sidebar.MenuLabel>
            </Sidebar.MenuItem>
            <Sidebar.MenuItem
              id="collapse-sidebar"
              textValue="Collapse Sidebar"
              className="hidden lg:flex"
              onAction={() => toggleSidebar()}
            >
              <Sidebar.MenuIcon>
                <LayoutSideContentLeft className="size-4" />
              </Sidebar.MenuIcon>
              <Sidebar.MenuLabel>Collapse Sidebar</Sidebar.MenuLabel>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
          <Sidebar.Menu aria-label="Dashboard navigation">
            {NAV_ITEMS.map((item) => (
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
