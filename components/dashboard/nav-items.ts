import {
  ArrowRightFromSquare,
  Calendar,
  ChartColumn,
  CircleQuestion,
  ClockArrowRotateLeft,
  Comment,
  Book,
  Folder,
  Gear,
  House,
  FileText,
  Key,
  Link,
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
import type { ComponentType } from "react";

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
      { href: "/schedule", icon: Calendar, label: "Schedule" },
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
      { href: "/links", icon: Link, label: "Friend Links" },
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
    items: [{ href: "/settings", icon: Gear, label: "Settings" }],
  },
] as const;

export const FOOTER_ITEMS: readonly NavItem[] = [
  { href: "/help", icon: CircleQuestion, label: "Help & Information" },
  { href: "/logout", icon: ArrowRightFromSquare, label: "Log out" },
] as const;
