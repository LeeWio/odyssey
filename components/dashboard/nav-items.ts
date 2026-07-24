import {
  ArrowRightFromSquare,
  ChartColumn,
  CircleQuestion,
  Comment,
  Folder,
  Gear,
  House,
  ListCheck,
  Person,
  Picture,
  Receipt,
  Shield,
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

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", icon: House, label: "Dashboard" },
  { href: "/categories", icon: Folder, label: "Categories" },
  { href: "/tags", icon: Tag, label: "Tags" },
  { href: "/comments", icon: Comment, label: "Comments" },
  { href: "/moments", icon: Sparkles, label: "Moments" },
  { href: "/files", icon: Picture, label: "Materials" },
  { href: "/orders", icon: Receipt, label: "Orders" },
  { href: "/users", icon: Person, label: "Users" },
  { href: "/permissions", icon: Shield, label: "Permissions" },
  { badge: "New", href: "/tracker", icon: ListCheck, label: "Tracker" },
  { href: "/analytics", icon: ChartColumn, label: "Analytics" },
  { href: "/settings", icon: Gear, label: "Settings" },
] as const;

export const FOOTER_ITEMS: readonly NavItem[] = [
  { href: "/help", icon: CircleQuestion, label: "Help & Information" },
  { href: "/logout", icon: ArrowRightFromSquare, label: "Log out" },
] as const;
