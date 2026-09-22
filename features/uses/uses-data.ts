export type UsesCategoryName = "Workspace" | "Coding" | "Design" | "Audio & Focus" | "Daily";

export type UsesCategory = {
  name: UsesCategoryName;
  description: string;
  icon: string;
  items: UsesItem[];
};

export type UsesItem = {
  name: string;
  description: string;
  tags?: string[];
  link?: string;
  note?: string;
};

export const usesData: UsesCategory[] = [
  {
    name: "Workspace",
    description: "One Apple desk. Fewer adapters, less drift.",
    icon: "gravity-ui:display",
    items: [
      {
        name: 'MacBook Pro 16"',
        description:
          "M3 Max with 64GB RAM. Compiles, design work, and browser tabs stay on one machine.",
        tags: ["Computing", "Apple"],
        link: "https://www.apple.com/macbook-pro/",
        note: "Daily driver",
      },
      {
        name: "Studio Display",
        description: "27-inch 5K panel for readable type and color-stable UI work.",
        tags: ["Display", "Apple"],
        link: "https://www.apple.com/studio-display/",
      },
      {
        name: "Herman Miller Aeron",
        description: "Long sessions without fighting the chair.",
        tags: ["Furniture"],
        link: "https://www.hermanmiller.com/products/seating/office-chairs/aeron-chairs/",
      },
      {
        name: "iPhone",
        description: "Camera, Music, and quick notes that stay inside the same stack.",
        tags: ["Mobile", "Apple"],
        link: "https://www.apple.com/iphone/",
      },
    ],
  },
  {
    name: "Coding",
    description: "Editor, terminal, and the tools that ship Odyssey.",
    icon: "gravity-ui:terminal",
    items: [
      {
        name: "VS Code",
        description: "Primary editor with Geist Mono and a quiet dark theme.",
        tags: ["Editor"],
        link: "https://code.visualstudio.com/",
        note: "Daily driver",
      },
      {
        name: "Ghostty",
        description: "GPU-accelerated terminal. Fast enough that latency stops being a topic.",
        tags: ["Terminal"],
        link: "https://ghostty.org/",
      },
      {
        name: "Bun",
        description: "Install, scripts, and local tooling for this repository.",
        tags: ["Runtime", "Package manager"],
        link: "https://bun.sh/",
      },
      {
        name: "Next.js",
        description: "App Router for the site shell, routes, and production builds.",
        tags: ["Framework"],
        link: "https://nextjs.org/",
      },
      {
        name: "Raycast",
        description: "Launcher, window moves, and short scripts without leaving the keyboard.",
        tags: ["Productivity", "macOS"],
        link: "https://www.raycast.com/",
      },
    ],
  },
  {
    name: "Design",
    description: "Components, motion, and the visual baseline for the site.",
    icon: "gravity-ui:palette",
    items: [
      {
        name: "HeroUI",
        description: "Default component system for pages, forms, and interactive surfaces.",
        tags: ["UI", "Design system"],
        link: "https://www.heroui.com/",
        note: "Baseline",
      },
      {
        name: "HeroUI Pro",
        description: "Charts, empty states, maps, and denser product patterns when needed.",
        tags: ["UI", "Pro"],
        link: "https://www.heroui.pro/",
      },
      {
        name: "Motion",
        description: "Page reveals and component transitions, gated by reduced-motion preferences.",
        tags: ["Animation"],
        link: "https://motion.dev/",
      },
      {
        name: "Figma",
        description: "Layout drafts and spacing checks before they harden into components.",
        tags: ["Design"],
        link: "https://www.figma.com/",
      },
    ],
  },
  {
    name: "Audio & Focus",
    description: "Meetings, music, and the quiet required to finish work.",
    icon: "gravity-ui:headphones",
    items: [
      {
        name: "AirPods Max",
        description: "Noise cancellation for deep focus blocks and long calls.",
        tags: ["Headphones", "Apple"],
        link: "https://www.apple.com/airpods-max/",
      },
      {
        name: "AirPods Pro",
        description: "Light carry headphones for walks and shorter sessions.",
        tags: ["Headphones", "Apple"],
        link: "https://www.apple.com/airpods-pro/",
      },
      {
        name: "Shure SM7B",
        description: "Dynamic mic for clearer calls, paired with a Focusrite interface.",
        tags: ["Microphone"],
        link: "https://www.shure.com/en-US/products/microphones/sm7b",
      },
    ],
  },
  {
    name: "Daily",
    description: "Apps that stay open because they earn the slot.",
    icon: "gravity-ui:clock",
    items: [
      {
        name: "Apple Music",
        description: "The listening library that stayed after other apps came and went.",
        tags: ["Music", "Apple"],
        link: "https://www.apple.com/apple-music/",
        note: "Only library",
      },
      {
        name: "Safari",
        description: "Default browser for reading and light research on macOS.",
        tags: ["Browser", "Apple"],
        link: "https://www.apple.com/safari/",
      },
      {
        name: "Notes",
        description: "Scratchpad for short ideas before they become commits or essays.",
        tags: ["Writing", "Apple"],
      },
    ],
  },
];

export function getUsesCategories(): readonly UsesCategory[] {
  return usesData;
}

export function getUsesItemCount(categories: readonly UsesCategory[] = usesData): number {
  return categories.reduce((total, category) => total + category.items.length, 0);
}

export function toSafeExternalUrl(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function matchesUsesItem(item: UsesItem, query: string, categoryName: string): boolean {
  if (!query) return true;

  const haystack = [item.name, item.description, item.note, categoryName, ...(item.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();

  return haystack.includes(query);
}

export function filterUsesCategories(
  categories: readonly UsesCategory[],
  options: { query?: string; category?: string | null } = {}
): UsesCategory[] {
  const normalizedQuery = options.query?.trim().toLocaleLowerCase() ?? "";
  const selectedCategory = options.category?.trim() || null;

  return categories
    .filter((category) => !selectedCategory || category.name === selectedCategory)
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => matchesUsesItem(item, normalizedQuery, category.name)),
    }))
    .filter((category) => category.items.length > 0);
}
