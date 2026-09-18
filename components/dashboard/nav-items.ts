export type NavItem = {
  readonly href: string;
  readonly label: string;
  readonly icon: string;
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
      { href: "/", icon: "gravity-ui:house", label: "Dashboard" },
      { badge: "New", href: "/tracker", icon: "gravity-ui:list-check", label: "Tracker" },
      { href: "/analytics", icon: "gravity-ui:chart-column", label: "Analytics" },
      { href: "/schedule", icon: "gravity-ui:calendar", label: "Schedule" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/posts", icon: "gravity-ui:file-text", label: "Posts" },
      { href: "/columns", icon: "gravity-ui:book", label: "Columns" },
      { href: "/categories", icon: "gravity-ui:folder", label: "Categories" },
      { href: "/tags", icon: "gravity-ui:tag", label: "Tags" },
      { href: "/comments", icon: "gravity-ui:comment", label: "Comments" },
      { href: "/moments", icon: "gravity-ui:sparkles", label: "Moments" },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/files", icon: "gravity-ui:picture", label: "Materials" },
      { href: "/links", icon: "gravity-ui:link", label: "Friend Links" },
      { href: "/orders", icon: "gravity-ui:receipt", label: "Orders" },
    ],
  },
  {
    label: "Users & Access",
    items: [
      { href: "/users", icon: "gravity-ui:person", label: "Users" },
      { href: "/audience", icon: "gravity-ui:persons", label: "Audience" },
      { href: "/groups", icon: "gravity-ui:persons", label: "Groups" },
      { href: "/roles", icon: "gravity-ui:person-gear", label: "Roles" },
      { href: "/permissions", icon: "gravity-ui:shield", label: "Permissions" },
      { href: "/access-policies", icon: "gravity-ui:shield-check", label: "Access Policies" },
      { href: "/service-accounts", icon: "gravity-ui:key", label: "Service Accounts" },
      { href: "/audit-logs", icon: "gravity-ui:clock-arrow-rotate-left", label: "Audit Logs" },
    ],
  },
  {
    label: "System",
    items: [{ href: "/settings", icon: "gravity-ui:gear", label: "Settings" }],
  },
] as const;

export const FOOTER_ITEMS: readonly NavItem[] = [
  { href: "/help", icon: "gravity-ui:circle-question", label: "Help & Information" },
  { href: "/logout", icon: "gravity-ui:arrow-right-from-square", label: "Log out" },
] as const;
