export const tabs = [
  { icon: "ph:fire-fill", id: "popular", label: "Popular" },
  { icon: "simple-icons:playstation", id: "ps5", label: "PS5" },
  { icon: "simple-icons:nintendoswitch", id: "switch", label: "Switch" },
];

export const users = [
  {
    id: 1,
    image: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg",
    name: "John Doe",
  },
  {
    id: 2,
    image: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg",
    name: "Kate Wilson",
  },
  {
    id: 3,
    image: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/purple.jpg",
    name: "Emily Chen",
  },
  {
    id: 4,
    image: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/orange.jpg",
    name: "Michael Brown",
  },
];

export const newGames = [
  {
    id: 1,
    title: "It Takes Two",
    image: "/IMG_4954.JPG",
  },
  {
    id: 2,
    title: "Elden Ring",
    image: "/IMG_2232.JPG",
  },
  {
    id: 3,
    title: "Astro's Playroom",
    image: "/IMG_4955.JPG",
  },
  {
    id: 4,
    title: "PUBG: Battlegrounds",
    image: "/IMG_4956.JPG",
  },
  {
    id: 5,
    title: "The Legend of Zelda",
    image: "/IMG_4957.JPG",
  },
  {
    id: 6,
    title: "Super Mario Bros. Wonder",
    image: "/IMG_2260.JPG",
  },
];

export const heroContent = {
  popular: {
    title: "League of Legends",
    description: "LEAGUE OF LEGENDS — A 5V5 MOBA WHERE TEAMS BATTLE TO DESTROY THE ENEMY NEXUS",
    reviews: "+99k Reviews",
    image: "/lol-hero.png",
    color: "bg-gradient-to-br from-surface-secondary via-surface-tertiary to-background",
    isCutout: true,
    tags: ["MOBA", "Action", "Strategy"],
    imageClassName: "w-[85%] origin-bottom -translate-x-8 scale-140 lg:w-[75%] lg:-translate-x-12",
  },
  ps5: {
    title: "Elden Ring",
    description:
      "Brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.",
    reviews: "+180k Reviews",
    image: "/er-hero.png",
    color: "bg-gradient-to-br from-danger/80 via-danger/10 to-background",
    isCutout: true,
    tags: ["RPG", "Soulslike", "Dark Fantasy"],
    imageClassName: "w-[85%] origin-bottom -translate-x-8 scale-140 lg:w-[75%] lg:-translate-x-12",
  },
  switch: {
    title: "The Legend of Zelda",
    description:
      "Decide your own path through the sprawling landscapes of Hyrule and harness Link's abilities to fight back.",
    reviews: "+250k Reviews",
    image: "/zelda-hero.png",
    color: "bg-gradient-to-br from-success/40 via-success/10 to-background",
    isCutout: true,
    tags: ["Action-Adventure", "Open World", "Masterpiece"],
    imageClassName: "w-[85%] origin-bottom translate-x-8 scale-140 lg:w-[75%] lg:translate-x-23",
  },
};

export const heroContentItems = Object.values(heroContent);

export type HeroContent = (typeof heroContent)[keyof typeof heroContent];

export const profileItems = [
  {
    title: "Profile",
    description: "Update your personal information",
    icon: "person",
  },
  {
    title: "Security",
    description: "Manage passwords and 2FA",
    icon: "key",
  },
  {
    title: "Cloud sync",
    description: "Sync data across your devices",
    icon: "cloud",
  },
];

export const recentGames = [
  {
    title: "Unravel 2",
    description: "(Standard Edition + Starter Pass)",
    image: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg",
  },
  {
    title: "Unravel 2",
    description: "(Standard Edition + Starter Pass)",
    image: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg",
  },
  {
    title: "Subway Surfers",
    description: "",
    image: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg",
  },
  {
    title: "Red Dead Redemption 3",
    description: "(Premium Pack)",
    image: "/A Fistful of Dollars.jpeg",
  },
];
