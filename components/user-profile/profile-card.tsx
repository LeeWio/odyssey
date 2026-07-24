"use client";

import {
  Avatar,
  Button,
  Card,
  Chip,
  Badge as HeroBadge,
  Input,
  InputGroup,
  Separator,
  Skeleton,
  Tabs,
  TextArea,
  Tooltip,
  toast,
} from "@heroui/react";
import { EmptyState, ItemCard, Sheet, Timeline } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useMemo, useState } from "react";

// --- Types & Interfaces ---

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Iconify icon key, e.g. "lucide:award", "lucide:crown"
  rarity: "legendary" | "epic" | "rare" | "common";
  earnedAt: string;
  isPinned?: boolean;
}

export interface UserProfileData {
  username: string;
  nickname: string;
  avatarUrl?: string;
  bannerGradient?: string; // Tailwind gradient classes
  role: string;
  bio: string;
  location?: string;
  website?: string;
  joinDate: string;
  stats: {
    followers: number;
    views: number;
    achievements: number;
    level: number;
  };
  badges: Badge[];
}

export interface ProfileCardProps {
  user?: UserProfileData | null;
  isLoading?: boolean;
  isEmpty?: boolean;
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
  onBadgePinToggle?: (badgeId: string) => void;
  onProfileUpdate?: (updatedUser: UserProfileData) => void;
}

// --- Premium Preset Options ---

const PRESET_GRADIENTS = [
  {
    id: "nebula",
    name: "Cosmic Nebula",
    value: "bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500",
  },
  {
    id: "sunset",
    name: "Sunset Horizon",
    value: "bg-gradient-to-r from-amber-500 via-orange-600 to-rose-500",
  },
  {
    id: "mint",
    name: "Emerald Mint",
    value: "bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-500",
  },
  {
    id: "royal",
    name: "Royal Indigo",
    value: "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500",
  },
  {
    id: "steel",
    name: "Midnight Steel",
    value: "bg-gradient-to-r from-slate-700 via-slate-800 to-slate-950",
  },
];

const PRESET_AVATARS = [
  {
    id: "av-4",
    name: "Creative Architect",
    url: "https://img.heroui.chat/image/avatar?w=400&h=400&u=4",
  },
  { id: "av-3", name: "Tech Lead", url: "https://img.heroui.chat/image/avatar?w=400&h=400&u=3" },
  {
    id: "av-2",
    name: "Product Visionary",
    url: "https://img.heroui.chat/image/avatar?w=400&h=400&u=2",
  },
  {
    id: "av-1",
    name: "Community Envoy",
    url: "https://img.heroui.chat/image/avatar?w=400&h=400&u=1",
  },
  {
    id: "av-8",
    name: "Fullstack Wizard",
    url: "https://img.heroui.chat/image/avatar?w=400&h=400&u=8",
  },
];

// --- Rarity Configs ---

const RARITY_CONFIG = {
  legendary: {
    label: "Legendary",
    color: "warning" as const,
    bgClass: "bg-amber-500/10 dark:bg-amber-500/15",
    borderClass:
      "border-amber-500/30 hover:border-amber-500 dark:border-amber-400/20 dark:hover:border-amber-400",
    textClass: "text-amber-600 dark:text-amber-400",
    glowClass:
      "shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.35)]",
    iconColor: "text-amber-500",
  },
  epic: {
    label: "Epic",
    color: "danger" as const, // maps to purple/pink in heroui pro or deep red
    bgClass: "bg-purple-500/10 dark:bg-purple-500/15",
    borderClass:
      "border-purple-500/30 hover:border-purple-500 dark:border-purple-400/20 dark:hover:border-purple-400",
    textClass: "text-purple-600 dark:text-purple-400",
    glowClass:
      "shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_25px_rgba(168,85,247,0.35)]",
    iconColor: "text-purple-500",
  },
  rare: {
    label: "Rare",
    color: "accent" as const, // maps to blue
    bgClass: "bg-blue-500/10 dark:bg-blue-500/15",
    borderClass:
      "border-blue-500/30 hover:border-blue-500 dark:border-blue-400/20 dark:hover:border-blue-400",
    textClass: "text-blue-600 dark:text-blue-400",
    glowClass:
      "shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:shadow-[0_0_25px_rgba(59,130,246,0.35)]",
    iconColor: "text-blue-500",
  },
  common: {
    label: "Common",
    color: "default" as const,
    bgClass: "bg-slate-500/10 dark:bg-slate-500/15",
    borderClass:
      "border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700",
    textClass: "text-slate-600 dark:text-slate-400",
    glowClass: "hover:shadow-md",
    iconColor: "text-slate-500",
  },
};

// --- Helper: Format large numbers ---
const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    num
  );
};

// ==========================================
// 1. ProfileCard Component (Main UI)
// ==========================================

export function ProfileCard({
  user,
  isLoading = false,
  isEmpty = false,
  isOwnProfile = true,
  onEditProfile,
  onBadgePinToggle,
  onProfileUpdate,
}: ProfileCardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isFollowing, setIsFollowing] = useState(false);

  // Search & Filter state for Badge Wall Tab
  const [badgeSearch, setBadgeSearch] = useState("");
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");

  // Edit Sheet local state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editGradient, setEditGradient] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  // Populate local edit state when opening the sheet
  const handleOpenEditSheet = () => {
    if (!user) return;
    setEditNickname(user.nickname);
    setEditUsername(user.username);
    setEditRole(user.role);
    setEditBio(user.bio);
    setEditLocation(user.location || "");
    setEditWebsite(user.website || "");
    setEditGradient(user.bannerGradient || PRESET_GRADIENTS[0].value);
    setEditAvatarUrl(user.avatarUrl || PRESET_AVATARS[0].url);
    setIsEditOpen(true);
  };

  // Save profile edits
  const handleSaveProfileEdits = () => {
    if (!user || !onProfileUpdate) return;

    if (!editNickname.trim()) {
      toast.danger("Nickname cannot be empty!");
      return;
    }
    if (!editUsername.trim()) {
      toast.danger("Username cannot be empty!");
      return;
    }

    const updatedUser: UserProfileData = {
      ...user,
      nickname: editNickname,
      username: editUsername.toLowerCase().replace(/\s+/g, ""),
      role: editRole,
      bio: editBio,
      location: editLocation || undefined,
      website: editWebsite || undefined,
      bannerGradient: editGradient,
      avatarUrl: editAvatarUrl,
    };

    onProfileUpdate(updatedUser);
    setIsEditOpen(false);
  };

  // Share profile callback
  const handleShareProfile = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied to clipboard!");
    }
  };

  // Toggle follow
  const handleFollowToggle = () => {
    setIsFollowing((prev) => !prev);
    toast.success(isFollowing ? "Unfollowed user" : "Following user successfully!");
  };

  // Pinned badges
  const pinnedBadges = useMemo(() => {
    if (!user?.badges) return [];
    return user.badges.filter((b) => b.isPinned);
  }, [user]);

  // Filtered & Sorted badges for the Badge Wall tab
  const processedBadges = useMemo(() => {
    if (!user?.badges) return [];
    let list = [...user.badges];

    // Search filter
    if (badgeSearch.trim()) {
      const q = badgeSearch.toLowerCase();
      list = list.filter(
        (b) => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q)
      );
    }

    // Rarity filter
    if (rarityFilter !== "all") {
      list = list.filter((b) => b.rarity === rarityFilter);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
      }
      if (sortBy === "date-asc") {
        return new Date(a.earnedAt).getTime() - new Date(b.earnedAt).getTime();
      }
      if (sortBy === "rarity-desc") {
        const rarityWeight = { legendary: 4, epic: 3, rare: 2, common: 1 };
        return rarityWeight[b.rarity] - rarityWeight[a.rarity];
      }
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return list;
  }, [user, badgeSearch, rarityFilter, sortBy]);

  // Loading Screen Wrapper
  if (isLoading) {
    return <ProfileCardSkeleton />;
  }

  // Empty Screen Wrapper
  if (isEmpty || !user) {
    return <ProfileCardEmpty isOwnProfile={isOwnProfile} onReset={onEditProfile} />;
  }

  const defaultBannerGradient = "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500";
  const bannerStyle = user.bannerGradient || defaultBannerGradient;

  return (
    <Card
      role="article"
      className="border-default-100 bg-surface/50 overflow-hidden border shadow-xl backdrop-blur-md"
    >
      {/* 1. Header Banner & Abstract Geometric Overlay */}
      <div className={`relative h-44 w-full ${bannerStyle} select-none`}>
        {/* Animated ambient mesh sparks */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_40%)]" />
        <div className="absolute inset-0 bg-black/10 backdrop-brightness-[0.92]" />

        {/* Level Badge in top corner */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/20 backdrop-blur-md">
          <Icon icon="lucide:flame" className="size-3.5 animate-pulse text-amber-400" />
          <span className="font-mono tracking-wider">LEVEL {user.stats.level}</span>
        </div>
      </div>

      {/* 2. Profile Summary Info & Avatar Overlay */}
      <div className="relative px-6 pt-1 pb-6">
        {/* Avatar overlapping banner */}
        <div className="absolute -top-16 left-6 z-10">
          <HeroBadge.Anchor>
            <Avatar className="border-background ring-default-50/20 size-24 border-4 shadow-xl ring-4">
              <Avatar.Image
                src={user.avatarUrl || "https://img.heroui.chat/image/avatar?w=400&h=400&u=3"}
                alt={user.nickname}
              />
              <Avatar.Fallback>
                {user.nickname?.substring(0, 2).toUpperCase() || "US"}
              </Avatar.Fallback>
            </Avatar>
            <HeroBadge
              className="border-background bg-success right-1 bottom-1 size-4 min-h-4 min-w-4 border-2 text-white"
              color="success"
              placement="bottom-right"
              size="sm"
            />
          </HeroBadge.Anchor>
        </div>

        {/* Action Buttons Container */}
        <div className="flex h-14 items-center justify-end gap-2.5">
          {isOwnProfile ? (
            <>
              <Tooltip delay={300}>
                <Tooltip.Trigger>
                  <Button
                    isIconOnly
                    size="md"
                    variant="outline"
                    aria-label="Edit Profile Settings"
                    onClick={handleOpenEditSheet}
                  >
                    <Icon icon="lucide:settings" className="text-default-500 size-4" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>Account Settings</Tooltip.Content>
              </Tooltip>

              <Button
                variant="outline"
                size="md"
                onClick={handleOpenEditSheet}
                className="gap-1.5 font-medium"
              >
                <Icon icon="lucide:pencil" className="size-4" />
                Edit Profile
              </Button>
            </>
          ) : (
            <>
              <Tooltip delay={300}>
                <Tooltip.Trigger>
                  <Button
                    isIconOnly
                    size="md"
                    variant="outline"
                    aria-label="Share Profile"
                    onClick={handleShareProfile}
                  >
                    <Icon icon="lucide:share-2" className="text-default-500 size-4" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>Share Link</Tooltip.Content>
              </Tooltip>

              <Button
                variant={isFollowing ? "outline" : "primary"}
                size="md"
                onClick={handleFollowToggle}
                className="gap-1.5 font-semibold transition-all duration-300"
              >
                <Icon
                  icon={isFollowing ? "lucide:user-minus" : "lucide:user-plus"}
                  className="size-4"
                />
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            </>
          )}
        </div>

        {/* User Identity Details */}
        <div className="mt-2.5 flex flex-col md:flex-row md:items-center md:justify-between md:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-foreground text-2xl font-bold tracking-tight">{user.nickname}</h2>
              <Chip
                size="sm"
                color="accent"
                variant="soft"
                className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase"
              >
                {user.role}
              </Chip>
              <Tooltip delay={200}>
                <Tooltip.Trigger>
                  <div
                    aria-label="Verified user icon"
                    className="flex items-center justify-center rounded-full bg-blue-500/10 p-1 dark:bg-blue-400/10"
                  >
                    <Icon
                      icon="lucide:badge-check"
                      className="size-4 text-blue-500 dark:text-blue-400"
                    />
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Content>Verified Odyssey Member</Tooltip.Content>
              </Tooltip>
            </div>
            <p className="text-default-400 mt-1 flex items-center gap-1.5 text-xs">
              <span className="text-default-300 font-mono">@{user.username}</span>
              <span className="text-default-300">•</span>
              <Icon icon="lucide:calendar" className="size-3.5" />
              <span>Joined {user.joinDate}</span>
            </p>
          </div>

          {/* Social Links / Secondary Details */}
          <div className="text-default-500 mt-3 flex items-center gap-3 text-xs md:mt-0">
            {user.location && (
              <span className="flex items-center gap-1">
                <Icon icon="lucide:map-pin" className="text-default-400 size-3.5" />
                {user.location}
              </span>
            )}
            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center gap-1 hover:underline"
              >
                <Icon icon="lucide:globe" className="size-3.5" />
                <span>Website</span>
              </a>
            )}
          </div>
        </div>

        {/* Biography Block */}
        <p className="text-default-600 dark:text-default-400 mt-4 line-clamp-3 max-w-2xl text-sm leading-relaxed">
          {user.bio}
        </p>

        {/* 3. Core Stats Metrics Row */}
        <div className="border-default-100 bg-default-50/30 mt-6 grid grid-cols-2 gap-4 rounded-xl border p-4 sm:grid-cols-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-default-400 text-xs">Followers</span>
            <span className="text-foreground font-mono text-xl font-bold tracking-tight tabular-nums">
              {formatNumber(isFollowing ? user.stats.followers + 1 : user.stats.followers)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-default-400 text-xs">Profile Views</span>
            <span className="text-foreground font-mono text-xl font-bold tracking-tight tabular-nums">
              {formatNumber(user.stats.views)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-default-400 text-xs">Total Badges</span>
            <span className="text-foreground font-mono text-xl font-bold tracking-tight tabular-nums">
              {user.badges.length}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-default-400 text-xs">Achievements</span>
            <span className="text-foreground font-mono text-xl font-bold tracking-tight tabular-nums">
              {user.stats.achievements} / 50
            </span>
          </div>
        </div>

        {/* 4. Pinned Badges Shelf (Featured Showcase) */}
        {pinnedBadges.length > 0 && (
          <div className="border-default-100 mt-6 border-t border-dashed pt-5">
            <div className="mb-3.5 flex items-center gap-1.5">
              <Icon icon="lucide:sparkles" className="size-4 animate-pulse text-amber-500" />
              <h3 className="text-foreground text-sm font-semibold">Featured Achievements</h3>
            </div>
            <div className="flex flex-wrap gap-4">
              {pinnedBadges.map((badge) => {
                const conf = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common;
                return (
                  <Tooltip key={badge.id} delay={0}>
                    <Tooltip.Trigger>
                      <motion.div
                        whileHover={{ y: -4, scale: 1.02 }}
                        className={`bg-surface flex cursor-help items-center gap-3 rounded-xl border px-4 py-2.5 transition-all duration-300 ${conf.borderClass} ${conf.glowClass}`}
                      >
                        <div
                          className={`flex size-9 items-center justify-center rounded-lg ${conf.bgClass}`}
                        >
                          <Icon icon={badge.icon} className={`size-5 ${conf.iconColor}`} />
                        </div>
                        <div className="text-left">
                          <p className="text-foreground line-clamp-1 text-xs font-semibold">
                            {badge.name}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold tracking-wider uppercase ${conf.textClass}`}
                            >
                              {conf.label}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </Tooltip.Trigger>
                    <Tooltip.Content className="border-default-100 bg-background max-w-xs overflow-hidden rounded-xl border p-0 shadow-xl">
                      <div className={`h-1.5 w-full bg-current ${conf.iconColor}`} />
                      <div className="p-3">
                        <div className="flex items-center gap-2">
                          <Icon icon={badge.icon} className={`size-4 ${conf.iconColor}`} />
                          <h4 className="text-foreground text-xs font-bold">{badge.name}</h4>
                          <span
                            className={`ml-auto text-[9px] font-bold uppercase ${conf.textClass}`}
                          >
                            {conf.label}
                          </span>
                        </div>
                        <p className="text-default-500 mt-1.5 text-xs leading-normal">
                          {badge.description}
                        </p>
                        <Separator className="my-2" />
                        <div className="text-default-400 flex items-center justify-between font-mono text-[10px]">
                          <span>Earned: {badge.earnedAt}</span>
                          <span className="flex items-center gap-0.5 text-amber-500">
                            <Icon icon="lucide:star" className="size-3 fill-current" />
                            Pinned
                          </span>
                        </div>
                      </div>
                    </Tooltip.Content>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Rich Tabbed Container */}
        <div className="border-default-100 mt-8 border-t pt-6">
          <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
            <Tabs.ListContainer>
              <Tabs.List aria-label="Profile section folders">
                <Tabs.Tab id="overview">
                  <div className="flex items-center gap-1.5">
                    <Icon icon="lucide:user" className="size-4" />
                    <span>Overview</span>
                  </div>
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="badges">
                  <div className="flex items-center gap-1.5">
                    <Icon icon="lucide:award" className="size-4" />
                    <span>Badge Wall</span>
                    <Chip
                      size="sm"
                      variant="soft"
                      color="default"
                      className="h-4 min-w-4 px-1 font-mono text-[10px]"
                    >
                      {user.badges.length}
                    </Chip>
                  </div>
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="history">
                  <div className="flex items-center gap-1.5">
                    <Icon icon="lucide:clock" className="size-4" />
                    <span>Progress History</span>
                  </div>
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>

          {/* TAB CONTENTS */}
          <div className="mt-6">
            <AnimatePresence mode="wait">
              {/* A. Overview Tab */}
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                    {/* Left Panel: Profile Detail items */}
                    <div className="space-y-4 md:col-span-4">
                      <Card
                        variant="transparent"
                        className="border-default-100 bg-default-50/10 rounded-xl border p-4"
                      >
                        <h4 className="text-default-400 mb-3 text-xs font-semibold tracking-wider uppercase">
                          Quick Details
                        </h4>
                        <div className="space-y-3.5">
                          <ItemCard variant="transparent" className="p-0">
                            <ItemCard.Icon className="bg-default-100 text-default-500 size-8 rounded-lg">
                              <Icon icon="lucide:shield" className="size-4" />
                            </ItemCard.Icon>
                            <ItemCard.Content>
                              <ItemCard.Title className="text-default-400 text-xs">
                                Account Tier
                              </ItemCard.Title>
                              <ItemCard.Description className="text-foreground text-sm font-semibold">
                                Professional Partner
                              </ItemCard.Description>
                            </ItemCard.Content>
                          </ItemCard>

                          <ItemCard variant="transparent" className="p-0">
                            <ItemCard.Icon className="bg-default-100 text-default-500 size-8 rounded-lg">
                              <Icon icon="lucide:check-circle" className="size-4" />
                            </ItemCard.Icon>
                            <ItemCard.Content>
                              <ItemCard.Title className="text-default-400 text-xs">
                                Verified Email
                              </ItemCard.Title>
                              <ItemCard.Description className="text-foreground line-clamp-1 text-sm font-semibold">
                                {user.username}@odyssey.dev
                              </ItemCard.Description>
                            </ItemCard.Content>
                          </ItemCard>

                          <ItemCard variant="transparent" className="p-0">
                            <ItemCard.Icon className="bg-default-100 text-default-500 size-8 rounded-lg">
                              <Icon icon="lucide:flame" className="size-4 text-amber-500" />
                            </ItemCard.Icon>
                            <ItemCard.Content>
                              <ItemCard.Title className="text-default-400 text-xs">
                                Activity Streak
                              </ItemCard.Title>
                              <ItemCard.Description className="text-foreground font-mono text-sm font-semibold">
                                42 Days Active
                              </ItemCard.Description>
                            </ItemCard.Content>
                          </ItemCard>
                        </div>
                      </Card>
                    </div>

                    {/* Right Panel: Showcase wall excerpt */}
                    <div className="space-y-4 md:col-span-8">
                      <div className="flex items-center justify-between">
                        <h3 className="text-foreground text-sm font-semibold">
                          Top Achievements Summary
                        </h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveTab("badges")}
                          className="text-xs"
                        >
                          View All Badges
                          <Icon icon="lucide:arrow-right" className="size-3.5" />
                        </Button>
                      </div>

                      {user.badges.length === 0 ? (
                        <Card
                          variant="transparent"
                          className="border-default-100 flex h-32 items-center justify-center border border-dashed p-4 text-center"
                        >
                          <p className="text-default-400 text-xs">
                            No achievements or badges added yet.
                          </p>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {user.badges.slice(0, 4).map((badge) => {
                            const conf = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common;
                            return (
                              <Card
                                key={badge.id}
                                className={`bg-surface/30 group flex flex-row items-start gap-3.5 border p-4 transition-all duration-300 ${conf.borderClass}`}
                              >
                                <div
                                  className={`bg-default-100 flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${conf.bgClass}`}
                                >
                                  <Icon
                                    icon={badge.icon}
                                    className={`size-5.5 ${conf.iconColor}`}
                                  />
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-foreground truncate text-xs font-bold">
                                      {badge.name}
                                    </span>
                                    <span
                                      className={`shrink-0 text-[8px] font-bold tracking-wider uppercase ${conf.textClass}`}
                                    >
                                      {conf.label}
                                    </span>
                                  </div>
                                  <p className="text-default-400 mt-1 line-clamp-1 text-xs">
                                    {badge.description}
                                  </p>
                                  <p className="text-default-300 mt-1.5 flex items-center gap-1 font-mono text-[10px]">
                                    <Icon icon="lucide:calendar-check" className="size-3" />
                                    Earned: {badge.earnedAt}
                                  </p>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* B. Badge Wall Tab with interactive filters */}
              {activeTab === "badges" && (
                <motion.div
                  key="badges"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Badge Filter Toolbar */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-sm flex-1">
                      <InputGroup variant="secondary" className="w-full">
                        <InputGroup.Prefix>
                          <Icon icon="lucide:search" className="text-default-400 size-4 shrink-0" />
                        </InputGroup.Prefix>
                        <InputGroup.Input
                          placeholder="Search badges..."
                          value={badgeSearch}
                          onChange={(e) => setBadgeSearch(e.target.value)}
                          aria-label="Search accomplishments"
                        />
                      </InputGroup>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Rarity filter tabs represented as custom buttons for premium look */}
                      <div className="bg-default-100 border-default-100 flex items-center rounded-lg border p-0.5">
                        {["all", "legendary", "epic", "rare", "common"].map((rarity) => (
                          <button
                            key={rarity}
                            onClick={() => setRarityFilter(rarity)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                              rarityFilter === rarity
                                ? "bg-background text-foreground animate-fade-in shadow-sm"
                                : "text-default-400 hover:text-default-500"
                            }`}
                          >
                            {rarity}
                          </button>
                        ))}
                      </div>

                      {/* Sorting Selection buttons */}
                      <div className="border-default-150 bg-default-50 flex items-center gap-1 rounded-lg border p-0.5">
                        {[
                          { id: "date-desc", label: "Newest", icon: "lucide:calendar-days" },
                          { id: "rarity-desc", label: "Rarity", icon: "lucide:sparkles" },
                          { id: "name-asc", label: "A-Z", icon: "lucide:sort-asc" },
                        ].map((btn) => (
                          <Button
                            key={btn.id}
                            size="sm"
                            variant={sortBy === btn.id ? "primary" : "outline"}
                            onClick={() => setSortBy(btn.id)}
                            className="h-7 px-2.5 text-xs font-semibold"
                          >
                            <Icon icon={btn.icon} className="size-3.5" />
                            {btn.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Badge Grid Wall */}
                  {processedBadges.length === 0 ? (
                    <Card className="border-default-100 flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center">
                      <Icon icon="lucide:award" className="text-default-300 mb-2 size-10" />
                      <p className="text-foreground text-sm font-semibold">
                        No Badges Match Filters
                      </p>
                      <p className="text-default-400 mt-1 max-w-xs text-xs">
                        Try searching for a different keyword or resetting your rarity selection.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setBadgeSearch("");
                          setRarityFilter("all");
                        }}
                      >
                        Reset Filters
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <AnimatePresence mode="popLayout">
                        {processedBadges.map((badge) => {
                          const conf = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common;
                          return (
                            <motion.div
                              key={badge.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Tooltip delay={0}>
                                <Tooltip.Trigger>
                                  <Card
                                    className={`bg-surface/30 group relative flex h-full cursor-help flex-col items-start border p-5 text-left transition-all duration-300 hover:-translate-y-1 ${conf.borderClass} ${conf.glowClass}`}
                                  >
                                    {/* Action button inside badge wall to let owners PIN/UNPIN badges */}
                                    {isOwnProfile && onBadgePinToggle && (
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="ghost"
                                        aria-label={
                                          badge.isPinned
                                            ? "Unpin badge from featured"
                                            : "Pin badge to featured"
                                        }
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          onBadgePinToggle(badge.id);
                                        }}
                                        className="absolute top-3 right-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                                      >
                                        <Icon
                                          icon="lucide:pin"
                                          className={`size-3.5 ${badge.isPinned ? "fill-current text-amber-500" : "text-default-400"}`}
                                        />
                                      </Button>
                                    )}

                                    {/* Badge Pin indicator icon */}
                                    {badge.isPinned && (!isOwnProfile || !onBadgePinToggle) && (
                                      <div className="absolute top-4 right-4">
                                        <Icon
                                          icon="lucide:star"
                                          className="size-3.5 fill-current text-amber-500"
                                        />
                                      </div>
                                    )}

                                    <div
                                      className={`bg-default-100 mb-4 flex size-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${conf.bgClass}`}
                                    >
                                      <Icon
                                        icon={badge.icon}
                                        className={`size-7 ${conf.iconColor}`}
                                      />
                                    </div>

                                    <h4 className="text-foreground flex items-center gap-1.5 text-sm font-bold tracking-tight">
                                      {badge.name}
                                    </h4>

                                    <p className="text-default-500 mt-1.5 line-clamp-2 flex-1 pr-2 text-xs leading-normal">
                                      {badge.description}
                                    </p>

                                    <div className="border-default-50/80 mt-4 flex w-full items-center justify-between border-t pt-3.5">
                                      <span
                                        className={`text-[9px] font-bold tracking-wider uppercase ${conf.textClass}`}
                                      >
                                        {conf.label}
                                      </span>
                                      <span className="text-default-400 font-mono text-[10px]">
                                        {badge.earnedAt}
                                      </span>
                                    </div>
                                  </Card>
                                </Tooltip.Trigger>
                                <Tooltip.Content className="border-default-100 bg-background max-w-xs overflow-hidden rounded-xl border p-0 shadow-xl">
                                  <div className={`h-1.5 w-full bg-current ${conf.iconColor}`} />
                                  <div className="p-4 text-left">
                                    <div className="flex items-center gap-2">
                                      <Icon
                                        icon={badge.icon}
                                        className={`size-5 ${conf.iconColor}`}
                                      />
                                      <div>
                                        <h4 className="text-foreground text-sm font-bold">
                                          {badge.name}
                                        </h4>
                                        <p
                                          className={`text-[9px] font-bold tracking-wider uppercase ${conf.textClass}`}
                                        >
                                          {conf.label} Achievement
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-default-500 mt-2.5 text-xs leading-relaxed">
                                      {badge.description}
                                    </p>
                                    <Separator className="my-2.5" />
                                    <div className="text-default-400 flex items-center justify-between font-mono text-[10px]">
                                      <span>Date Unlocked:</span>
                                      <span>{badge.earnedAt}</span>
                                    </div>
                                    {isOwnProfile && (
                                      <p className="text-default-400 text-primary-500 mt-2 text-center text-[9px] font-medium italic">
                                        * Hover card in wall to Pin/Unpin this badge
                                      </p>
                                    )}
                                  </div>
                                </Tooltip.Content>
                              </Tooltip>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}

              {/* C. Progress History Tab with Premium Timeline */}
              {activeTab === "history" && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <Card
                    variant="transparent"
                    className="border-default-100 bg-default-50/10 rounded-2xl border p-6"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h3 className="text-foreground text-sm font-bold">
                          Milestone Progress Timeline
                        </h3>
                        <p className="text-default-400 mt-1 text-xs">
                          Review verified accomplishments along your Odyssey career path.
                        </p>
                      </div>
                      <Icon icon="lucide:milestone" className="text-default-400 size-6" />
                    </div>

                    <Timeline density="comfortable" size="md">
                      {/* Milestone 1: Reached Level X */}
                      <Timeline.Item align="center" status="success">
                        <Timeline.Marker aria-hidden="true" className="bg-success text-white">
                          <Icon icon="lucide:check" className="size-3.5 font-bold" />
                        </Timeline.Marker>
                        <Timeline.Content>
                          <div className="flex flex-col gap-1 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-foreground text-sm leading-5 font-bold">
                                  Reached Level {user.stats.level}
                                </h4>
                                <Chip color="success" size="sm" variant="soft">
                                  Active Status
                                </Chip>
                              </div>
                              <p className="text-default-500 mt-1 text-xs leading-relaxed">
                                Successfully earned the requisite points by designing high-end
                                dashboards and verifying accessibility scores.
                              </p>
                            </div>
                            <time className="text-default-400 shrink-0 font-mono text-xs font-semibold">
                              July 3, 2026
                            </time>
                          </div>
                        </Timeline.Content>
                      </Timeline.Item>

                      {/* Milestone 2: Unlocked UI Virtuoso */}
                      <Timeline.Item align="center" status="current">
                        <Timeline.Marker aria-hidden="true" className="bg-primary text-white">
                          <Icon icon="lucide:star" className="size-3.5" />
                        </Timeline.Marker>
                        <Timeline.Content>
                          <div className="flex flex-col gap-1 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-foreground text-sm leading-5 font-bold">
                                  Unlocked &ldquo;UI Virtuoso&rdquo; Epic Badge
                                </h4>
                                <Chip color="accent" size="sm" variant="soft">
                                  Epic Achievement
                                </Chip>
                              </div>
                              <p className="text-default-500 mt-1 text-xs leading-relaxed">
                                Awarded automatically upon achieving perfect heuristic review
                                compliance across all projects.
                              </p>
                            </div>
                            <time className="text-default-400 shrink-0 font-mono text-xs font-semibold">
                              June 18, 2026
                            </time>
                          </div>
                        </Timeline.Content>
                      </Timeline.Item>

                      {/* Milestone 3: Account Creation */}
                      <Timeline.Item align="center" status="default">
                        <Timeline.Marker
                          aria-hidden="true"
                          className="bg-default-300 dark:bg-default-800 text-default-600 dark:text-default-400"
                        >
                          <Icon icon="lucide:user" className="size-3.5" />
                        </Timeline.Marker>
                        <Timeline.Content>
                          <div className="flex flex-col gap-1 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-foreground text-sm leading-5 font-bold">
                                  Created Account in Odyssey Path
                                </h4>
                                <Chip color="default" size="sm" variant="soft">
                                  Onboarding
                                </Chip>
                              </div>
                              <p className="text-default-500 mt-1 text-xs leading-relaxed">
                                Welcome onboard! Started the learning path to master advanced
                                software systems and Designpowers extensions.
                              </p>
                            </div>
                            <time className="text-default-400 shrink-0 font-mono text-xs font-semibold">
                              May 01, 2026
                            </time>
                          </div>
                        </Timeline.Content>
                      </Timeline.Item>
                    </Timeline>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ==========================================
          6. Side Drawer Edit Profile Sheet (Real Edits!)
          ========================================== */}
      <Sheet isOpen={isEditOpen} onOpenChange={setIsEditOpen} placement="right">
        <Sheet.Backdrop variant="blur">
          <Sheet.Content className="w-[450px] max-w-[95vw]">
            <Sheet.Dialog>
              <Sheet.CloseTrigger />
              <Sheet.Header className="border-default-100 border-b pb-4">
                <Sheet.Heading className="text-foreground flex items-center gap-2 text-xl font-bold">
                  <Icon icon="lucide:pencil-line" className="text-primary size-5" />
                  Customize Profile
                </Sheet.Heading>
                <p className="text-default-400 mt-1 text-xs">
                  Configure your personal branding presets. Updates will propagate immediately
                  across the workspace.
                </p>
              </Sheet.Header>

              <Sheet.Body className="space-y-6 py-5">
                {/* A. Identity Section */}
                <div className="space-y-4">
                  <h4 className="text-foreground text-default-400 flex items-center gap-1 text-xs font-bold tracking-wider uppercase">
                    <Icon icon="lucide:user" className="size-3.5" />
                    Identity Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="flex flex-col gap-1">
                      <label className="text-default-500 text-xs font-semibold">Nickname</label>
                      <Input
                        placeholder="e.g. Wei Li"
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        variant="secondary"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-default-500 text-xs font-semibold">Username</label>
                      <InputGroup variant="secondary" className="w-full">
                        <InputGroup.Prefix>
                          <span className="text-default-400 text-xs">@</span>
                        </InputGroup.Prefix>
                        <InputGroup.Input
                          placeholder="e.g. weili"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                        />
                      </InputGroup>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-default-500 text-xs font-semibold">
                      Professional Role
                    </label>
                    <Input
                      placeholder="e.g. Senior UI Architect"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      variant="secondary"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-default-500 text-xs font-semibold">Biography</label>
                    <TextArea
                      placeholder="Tell us about yourself..."
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      variant="secondary"
                      rows={4}
                    />
                  </div>
                </div>

                <Separator className="bg-default-100" />

                {/* B. Custom Avatar Picker */}
                <div className="space-y-3">
                  <h4 className="text-foreground text-default-400 flex items-center gap-1 text-xs font-bold tracking-wider uppercase">
                    <Icon icon="lucide:circle-user" className="size-3.5" />
                    Premium Avatar Style
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {PRESET_AVATARS.map((item) => {
                      const isActive = editAvatarUrl === item.url;
                      return (
                        <Tooltip key={item.id} delay={100}>
                          <Tooltip.Trigger>
                            <button
                              type="button"
                              aria-label={`Select avatar ${item.name}`}
                              onClick={() => setEditAvatarUrl(item.url)}
                              className={`relative size-12 overflow-hidden rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${
                                isActive
                                  ? "ring-primary dark:ring-offset-background scale-105 ring-4 ring-offset-2"
                                  : "opacity-60 hover:opacity-100"
                              }`}
                            >
                              <Image
                                src={item.url}
                                alt={item.name}
                                width={48}
                                height={48}
                                className="object-cover"
                              />
                              {isActive && (
                                <div className="bg-primary/20 absolute inset-0 flex items-center justify-center">
                                  <Icon
                                    icon="lucide:check"
                                    className="size-5 font-extrabold text-white drop-shadow-md"
                                  />
                                </div>
                              )}
                            </button>
                          </Tooltip.Trigger>
                          <Tooltip.Content className="bg-background border-default-100 rounded-md border p-2 text-xs">
                            {item.name}
                          </Tooltip.Content>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>

                <Separator className="bg-default-100" />

                {/* C. Premium Banner Gradients Picker */}
                <div className="space-y-3">
                  <h4 className="text-foreground text-default-400 flex items-center gap-1 text-xs font-bold tracking-wider uppercase">
                    <Icon icon="lucide:palette" className="size-3.5" />
                    Cover Brand Gradient
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {PRESET_GRADIENTS.map((item) => {
                      const isActive = editGradient === item.value;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          aria-label={`Select banner ${item.name}`}
                          onClick={() => setEditGradient(item.value)}
                          className={`relative flex h-10 w-full items-center justify-between rounded-xl px-3 text-left transition-all duration-300 hover:brightness-105 ${item.value} ${
                            isActive
                              ? "ring-foreground dark:ring-offset-background font-bold text-white shadow-lg ring-2 ring-offset-2"
                              : "text-white/90 opacity-75 hover:opacity-100"
                          }`}
                        >
                          <span className="text-xs font-semibold drop-shadow-md">{item.name}</span>
                          {isActive && (
                            <Icon
                              icon="lucide:circle-check"
                              className="size-4 shrink-0 text-white drop-shadow-md"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator className="bg-default-100" />

                {/* D. Additional Details */}
                <div className="space-y-4">
                  <h4 className="text-foreground text-default-400 flex items-center gap-1 text-xs font-bold tracking-wider uppercase">
                    <Icon icon="lucide:globe" className="size-3.5" />
                    Secondary Info
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="flex flex-col gap-1">
                      <label className="text-default-500 text-xs font-semibold">Location</label>
                      <InputGroup variant="secondary" className="w-full">
                        <InputGroup.Prefix>
                          <Icon
                            icon="lucide:map-pin"
                            className="text-default-400 size-4 shrink-0"
                          />
                        </InputGroup.Prefix>
                        <InputGroup.Input
                          placeholder="e.g. Singapore"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                        />
                      </InputGroup>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-default-500 text-xs font-semibold">Website</label>
                      <InputGroup variant="secondary" className="w-full">
                        <InputGroup.Prefix>
                          <Icon icon="lucide:link" className="text-default-400 size-4 shrink-0" />
                        </InputGroup.Prefix>
                        <InputGroup.Input
                          placeholder="e.g. https://domain.com"
                          value={editWebsite}
                          onChange={(e) => setEditWebsite(e.target.value)}
                        />
                      </InputGroup>
                    </div>
                  </div>
                </div>
              </Sheet.Body>

              <Sheet.Footer className="border-default-100 mt-auto border-t pt-4">
                <Sheet.Close>
                  <Button variant="outline">Cancel</Button>
                </Sheet.Close>
                <Button
                  variant="primary"
                  onClick={handleSaveProfileEdits}
                  className="px-5 font-semibold"
                >
                  Save Changes
                </Button>
              </Sheet.Footer>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    </Card>
  );
}

// ==========================================
// 2. ProfileCardSkeleton Component (Loading State)
// ==========================================

export function ProfileCardSkeleton() {
  return (
    <Card className="skeleton--shimmer border-default-100 bg-surface/50 overflow-hidden border shadow-xl backdrop-blur-md">
      {/* Banner Skeleton */}
      <Skeleton animationType="none" className="h-44 w-full rounded-none" />

      <div className="relative px-6 pt-1 pb-6">
        {/* Avatar Skeleton */}
        <div className="absolute -top-12 left-6 z-10">
          <Skeleton
            animationType="none"
            className="border-background size-24 rounded-full border-4"
          />
        </div>

        {/* Buttons Skeleton */}
        <div className="flex h-14 items-center justify-end gap-2.5">
          <Skeleton animationType="none" className="size-10 rounded-lg" />
          <Skeleton animationType="none" className="h-10 w-28 rounded-lg" />
        </div>

        {/* Identity Skeletons */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton animationType="none" className="h-7 w-44 rounded-md" />
            <Skeleton animationType="none" className="h-5 w-14 rounded-md" />
          </div>
          <Skeleton animationType="none" className="h-4 w-52 rounded-md" />
        </div>

        {/* Bio Skeleton */}
        <div className="mt-5 space-y-2">
          <Skeleton animationType="none" className="h-4 w-full rounded" />
          <Skeleton animationType="none" className="h-4 w-5/6 rounded" />
          <Skeleton animationType="none" className="h-4 w-4/6 rounded" />
        </div>

        {/* Stats Row Skeleton */}
        <div className="border-default-100 bg-default-50/20 mt-6 grid grid-cols-2 gap-4 rounded-xl border p-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton animationType="none" className="h-3 w-16 rounded" />
              <Skeleton animationType="none" className="h-5 w-20 rounded" />
            </div>
          ))}
        </div>

        {/* Featured Shelf Skeleton */}
        <div className="border-default-100 mt-6 border-t border-dashed pt-5">
          <Skeleton animationType="none" className="mb-4 h-4 w-36 rounded" />
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} animationType="none" className="h-[54px] w-36 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Tabs and Grid Skeletons */}
        <div className="border-default-100 mt-8 border-t pt-6">
          <div className="border-default-100 flex gap-4 border-b pb-2">
            <Skeleton animationType="none" className="h-6 w-20 rounded" />
            <Skeleton animationType="none" className="h-6 w-24 rounded" />
            <Skeleton animationType="none" className="h-6 w-28 rounded" />
          </div>

          {/* Dummy list view grid skeleton */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="border-default-100 bg-default-50/5 flex items-center gap-3 rounded-xl border p-4"
              >
                <Skeleton animationType="none" className="size-10 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton animationType="none" className="h-4 w-2/5 rounded" />
                  <Skeleton animationType="none" className="h-3 w-4/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ==========================================
// 3. ProfileCardEmpty Component (Empty State)
// ==========================================

export interface ProfileCardEmptyProps {
  isOwnProfile?: boolean;
  onReset?: () => void;
}

export function ProfileCardEmpty({ isOwnProfile = true, onReset }: ProfileCardEmptyProps) {
  return (
    <Card className="border-default-100 bg-surface/50 flex min-h-[400px] items-center justify-center border p-8 shadow-xl backdrop-blur-md">
      <EmptyState className="w-full max-w-md py-6">
        <EmptyState.Header>
          <EmptyState.Media
            variant="icon"
            className="bg-default-100 dark:bg-default-800 text-default-500 mx-auto mb-4 flex size-16 items-center justify-center rounded-full p-4 shadow-sm"
          >
            <Icon icon="lucide:user-x" className="size-8" />
          </EmptyState.Media>
          <EmptyState.Title className="text-center text-xl font-bold">
            User Profile Empty
          </EmptyState.Title>
          <EmptyState.Description className="text-default-400 mt-2 text-center text-sm leading-relaxed">
            {isOwnProfile
              ? "We couldn't locate any profile configurations or badges under your account yet. Complete your onboarding to unlock accomplishments!"
              : "This user profile has not been fully configured or does not contain any badges to display at this moment."}
          </EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {isOwnProfile && onReset && (
            <Button variant="primary" size="md" onClick={onReset} className="gap-1.5 font-semibold">
              <Icon icon="lucide:user-plus" className="size-4" />
              Configure Profile
            </Button>
          )}
          <Button
            variant="outline"
            size="md"
            onClick={() => toast.info("Guide link shared!")}
            className="gap-1.5"
          >
            <Icon icon="lucide:help-circle" className="size-4" />
            Learn About Achievements
          </Button>
        </EmptyState.Content>
      </EmptyState>
    </Card>
  );
}
