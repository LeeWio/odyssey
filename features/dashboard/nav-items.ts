import type { ComponentType } from "react";

import {
  ArrowRightFromSquare,
  Book,
  Calendar,
  ChartColumn,
  CircleQuestion,
  ClockArrowRotateLeft,
  Comment,
  FileText,
  Folder,
  Gear,
  House,
  Thunderbolt,
  Key,
  Link as LinkIcon,
  LinkSlash,
  ListCheck,
  Person,
  PersonGear,
  Persons,
  Picture,
  Receipt,
  Shield,
  ShieldCheck,
  Sparkles,
  Tag,
} from "@gravity-ui/icons";

export type NavItem = {
  readonly href: string;
  readonly labelKey: string;
  readonly icon: ComponentType<{ className?: string }>;
  readonly badge?: string;
};

export type NavGroup = {
  readonly labelKey: string;
  readonly items: readonly NavItem[];
};

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    labelKey: "overview",
    items: [
      { href: "/", icon: House, labelKey: "dashboard" },
      { badge: "new", href: "/tracker", icon: ListCheck, labelKey: "tracker" },
      { href: "/analytics", icon: ChartColumn, labelKey: "analytics" },
      { href: "/schedule", icon: Calendar, labelKey: "editorialCalendar" },
    ],
  },
  {
    labelKey: "content",
    items: [
      { href: "/posts", icon: FileText, labelKey: "posts" },
      { href: "/columns", icon: Book, labelKey: "columns" },
      { href: "/categories", icon: Folder, labelKey: "categories" },
      { href: "/tags", icon: Tag, labelKey: "tags" },
      { href: "/comments", icon: Comment, labelKey: "comments" },
      { href: "/moments", icon: Sparkles, labelKey: "moments" },
      { href: "/life-list", icon: ListCheck, labelKey: "lifeList" },
    ],
  },
  {
    labelKey: "resources",
    items: [
      { href: "/files", icon: Picture, labelKey: "materials" },
      { href: "/links", icon: LinkIcon, labelKey: "friendLinks" },
      { href: "/broken-links", icon: LinkSlash, labelKey: "brokenLinks" },
      { href: "/orders", icon: Receipt, labelKey: "orders" },
    ],
  },
  {
    labelKey: "usersAccess",
    items: [
      { href: "/users", icon: Person, labelKey: "users" },
      { href: "/audience", icon: Persons, labelKey: "audience" },
      { href: "/groups", icon: Persons, labelKey: "groups" },
      { href: "/roles", icon: PersonGear, labelKey: "roles" },
      { href: "/permissions", icon: Shield, labelKey: "permissions" },
      { href: "/access-policies", icon: ShieldCheck, labelKey: "accessPolicies" },
      { href: "/service-accounts", icon: Key, labelKey: "serviceAccounts" },
      { href: "/audit-logs", icon: ClockArrowRotateLeft, labelKey: "auditLogs" },
    ],
  },
  {
    labelKey: "system",
    items: [
      { href: "/settings", icon: Gear, labelKey: "settings" },
      { href: "/webhooks", icon: Thunderbolt, labelKey: "webhooks" },
      { href: "/notification-deliveries", icon: Thunderbolt, labelKey: "notificationDelivery" },
    ],
  },
] as const;

export const NAV_ITEMS: readonly NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export const FOOTER_ITEMS: readonly NavItem[] = [
  { href: "/help", icon: CircleQuestion, labelKey: "help" },
  { href: "/logout", icon: ArrowRightFromSquare, labelKey: "logout" },
] as const;
