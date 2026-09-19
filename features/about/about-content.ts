export const aboutPerson = {
  name: "Lee",
  handle: "LeeWio",
  role: "Engineer, Maker, Observer",
  initials: "L",
} as const;

export const aboutMarkers = ["INTP", "Capricorn", "Apple"] as const;

export const aboutIntro = {
  lead: "Not a resume.",
  body: "A short page of defaults: the stack I keep, the noise I drop, and the games I still play.",
} as const;

export const aboutDefaults = [
  {
    id: "stack",
    title: "One stack",
    description: "Apple is the whole desk. One machine family, fewer adapters, less drift.",
    chips: ["Mac", "iPhone", "AirPods"],
  },
  {
    id: "refuse",
    title: "No thank you",
    description: "Android and Windows stay off the desk. Not a debate. A closed list.",
    chips: ["No Android", "No Windows"],
  },
  {
    id: "quiet",
    title: "Quiet is a tool",
    description: "Chat noise waits. A closed door is how the work gets finished.",
    chips: ["Solitude"],
  },
  {
    id: "music",
    title: "This library only",
    description: "Other music apps come and go. Apple Music is the one that stays.",
    chips: ["Apple Music"],
  },
] as const;

export const playTitles = [
  { id: "zelda", label: "Zelda" },
  { id: "elden", label: "Elden Ring" },
  { id: "mario", label: "Mario" },
  { id: "lol", label: "League" },
  { id: "hok", label: "Honor of Kings" },
] as const;

export const playPlatforms = ["PS5", "Switch", "Mobile"] as const;

export const aboutPlay = {
  title: "Play",
  description: "Games are rest, and a way to feel a system from the inside.",
} as const;

export const aboutCraft = {
  title: "Less pile. More spine.",
  description: "Features get cut until the line holds. One honest can on the desk: Coke.",
  chips: ["Coke"],
} as const;

export const aboutProduct = {
  title: "A landscape, not drawers.",
  description:
    "Odyssey is meant to be walked, not filed. Pages connect instead of stacking into folders.",
  href: "/universe",
  cta: "Open universe",
} as const;

export const tasteTrail = [
  {
    id: "early",
    label: "Early",
    description: "First, collapse the tools into one stack. Variety can wait.",
    icon: "gravity-ui:layout-cells-large",
    status: "default",
  },
  {
    id: "habit",
    label: "Habit",
    description: "Fewer meetings. Finish one thing alone, then talk.",
    icon: "gravity-ui:file-text",
    status: "default",
  },
  {
    id: "play",
    label: "Play",
    description: "Play is rest, and a way to keep intuition for systems.",
    icon: "gravity-ui:sparkles",
    status: "default",
  },
  {
    id: "wire",
    label: "Wire",
    description: "Fewer lines. A harder spine.",
    icon: "gravity-ui:compass",
    status: "default",
  },
  {
    id: "build",
    label: "Build",
    description: "This site is the experiment, not a brochure for one.",
    icon: "gravity-ui:thunderbolt",
    status: "default",
  },
  {
    id: "now",
    label: "Now",
    description: "Still becoming.",
    icon: "gravity-ui:circle-check",
    status: "current",
  },
] as const;

export const aboutClose = {
  title: "Still becoming.",
  primary: { href: "/chronicle", label: "Read writing" },
  secondary: { href: "/uses", label: "See tools" },
} as const;
