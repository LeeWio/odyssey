export type UsesCategory = {
  name: string;
  description?: string;
  items: UsesItem[];
};

export type UsesItem = {
  name: string;
  description: string;
  tags?: string[];
  link?: string;
  image?: string;
};

export const usesData: UsesCategory[] = [
  {
    name: "Workspace",
    description: "The hardware that powers my daily workflow.",
    items: [
      {
        name: 'MacBook Pro 16"',
        description:
          "M3 Max, 64GB RAM, 2TB SSD. The ultimate machine that handles any compilation or design workload without breaking a sweat.",
        tags: ["Computing", "Apple"],
      },
      {
        name: "Studio Display",
        description:
          "27-inch 5K Retina display. The color accuracy and text clarity are unmatched for front-end engineering.",
        tags: ["Display", "Apple"],
      },
      {
        name: "Herman Miller Aeron",
        description: "Ergonomic comfort for long coding sessions. An absolute necessity.",
        tags: ["Furniture", "Comfort"],
      },
    ],
  },
  {
    name: "Coding",
    description: "Editor, terminal, and utilities.",
    items: [
      {
        name: "VS Code",
        description:
          "My editor of choice, heavily customized. I use the standard dark themes with Geist Mono for my fonts.",
        tags: ["Editor", "Software"],
      },
      {
        name: "Ghostty",
        description:
          "Fast, GPU-accelerated terminal emulator written in Zig. Incredibly responsive.",
        tags: ["Terminal", "Tool"],
      },
      {
        name: "Raycast",
        description:
          "A blazingly fast launcher that replaced Spotlight for me. I use it for everything from window management to quick scripts.",
        tags: ["Productivity", "macOS"],
      },
    ],
  },
  {
    name: "Audio & Video",
    description: "For meetings, music, and focus.",
    items: [
      {
        name: "AirPods Max",
        description:
          "Incredible noise cancellation and spatial audio. Essential for deep focus blocks.",
        tags: ["Audio", "Headphones"],
      },
      {
        name: "Shure SM7B",
        description:
          "Dynamic vocal microphone. Paired with a Focusrite Scarlett interface for crisp, broadcast-quality audio on calls.",
        tags: ["Audio", "Mic"],
      },
    ],
  },
];
