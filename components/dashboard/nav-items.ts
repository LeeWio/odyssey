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
  readonly label: string;
  readonly icon: ComponentType<{ className?: string }>;
  readonly badge?: string;
};

export type NavGroup = {
  readonly label: string;
  readonly items: readonly NavItem[];
};

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/", icon: House, label: "Dashboard" },
      { badge: "New", href: "/tracker", icon: ListCheck, label: "Tracker" },
      { href: "/analytics", icon: ChartColumn, label: "Analytics" },
      { href: "/schedule", icon: Calendar, label: "Editorial calendar" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/posts", icon: FileText, label: "Posts" },
      { href: "/columns", icon: Book, label: "Columns" },
      { href: "/categories", icon: Folder, label: "Categories" },
      { href: "/tags", icon: Tag, label: "Tags" },
      { href: "/comments", icon: Comment, label: "Comments" },
      { href: "/moments", icon: Sparkles, label: "Moments" },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/files", icon: Picture, label: "Materials" },
      { href: "/links", icon: LinkIcon, label: "Friend Links" },
      { href: "/broken-links", icon: LinkSlash, label: "Broken Links" },
      { href: "/orders", icon: Receipt, label: "Orders" },
    ],
  },
  {
    label: "Users & Access",
    items: [
      { href: "/users", icon: Person, label: "Users" },
      { href: "/audience", icon: Persons, label: "Audience" },
      { href: "/groups", icon: Persons, label: "Groups" },
      { href: "/roles", icon: PersonGear, label: "Roles" },
      { href: "/permissions", icon: Shield, label: "Permissions" },
      { href: "/access-policies", icon: ShieldCheck, label: "Access Policies" },
      { href: "/service-accounts", icon: Key, label: "Service Accounts" },
      { href: "/audit-logs", icon: ClockArrowRotateLeft, label: "Audit Logs" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/settings", icon: Gear, label: "Settings" },
      { href: "/webhooks", icon: Thunderbolt, label: "Webhooks" },
    ],
  },
] as const;

export const NAV_ITEMS: readonly NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export const FOOTER_ITEMS: readonly NavItem[] = [
  { href: "/help", icon: CircleQuestion, label: "Help & Information" },
  { href: "/logout", icon: ArrowRightFromSquare, label: "Log out" },
] as const;
