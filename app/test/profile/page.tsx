"use client";

import { useState } from "react";
import { Button, Card, Switch, Separator, toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "motion/react";
import {
  ProfileCard,
  type UserProfileData,
  type Badge,
} from "@/components/user-profile/profile-card";

// --- Mock Data ---

const INITIAL_BADGES: Badge[] = [
  {
    id: "badge-1",
    name: "First Steps",
    description:
      "Successfully configured and launched your first project inside the Odyssey workspace.",
    icon: "lucide:footprints",
    rarity: "common",
    earnedAt: "2026-05-01",
    isPinned: true,
  },
  {
    id: "badge-2",
    name: "UI Virtuoso",
    description:
      "Successfully built 10+ premium interfaces with 100% compliance on visual review & accessibility checks.",
    icon: "lucide:sparkles",
    rarity: "epic",
    earnedAt: "2026-06-18",
    isPinned: true,
  },
  {
    id: "badge-3",
    name: "Odyssey Legend",
    description:
      "Mastered all 10 core path modules and integrated a customized Designpowers workspace extension.",
    icon: "lucide:crown",
    rarity: "legendary",
    earnedAt: "2026-07-02",
    isPinned: true,
  },
  {
    id: "badge-4",
    name: "Code Crafter",
    description: "Merged 50+ pull requests with zero linter errors and robust unit test coverage.",
    icon: "lucide:code-2",
    rarity: "rare",
    earnedAt: "2026-05-20",
    isPinned: false,
  },
  {
    id: "badge-5",
    name: "Speed Demon",
    description:
      "Optimized bundle loading speed by 45% utilizing Tailwind v4 modern post-processing styles.",
    icon: "lucide:zap",
    rarity: "rare",
    earnedAt: "2026-06-05",
    isPinned: false,
  },
  {
    id: "badge-6",
    name: "Accessibility Sentry",
    description:
      "Verified 20+ interface overlays against strict WCAG screen reader and focus ring regulations.",
    icon: "lucide:shield-check",
    rarity: "epic",
    earnedAt: "2026-06-30",
    isPinned: false,
  },
];

const INITIAL_PROFILE: UserProfileData = {
  username: "weili_dev",
  nickname: "Wei Li",
  avatarUrl: "https://img.heroui.chat/image/avatar?w=400&h=400&u=4",
  bannerGradient: "bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500",
  role: "Senior UI Architect",
  bio: "Full-stack designer and software engineer. Specialized in creating beautiful, buttery-smooth React component libraries, Next.js setups, and accessible design system tokens. Currently crafting the future of Odyssey CLI plugins.",
  location: "Singapore",
  website: "https://github.com/weili-design",
  joinDate: "May 2026",
  stats: {
    followers: 1248,
    views: 8940,
    achievements: 34,
    level: 18,
  },
  badges: INITIAL_BADGES,
};

const EXTRA_BADGES_POOL: Omit<Badge, "id">[] = [
  {
    name: "Bug Hunter",
    description: "Discovered and patched a critical race condition in the async state reducer.",
    icon: "lucide:bug",
    rarity: "common",
    earnedAt: "2026-07-03",
  },
  {
    name: "Community Pillar",
    description: "Helped 100+ community members solve complex CSS and UI layouts in forums.",
    icon: "lucide:heart",
    rarity: "epic",
    earnedAt: "2026-07-03",
  },
  {
    name: "Spline Sorcerer",
    description: "Embedded a responsive 3D interactive spline viewport with zero frame drops.",
    icon: "lucide:shapes",
    rarity: "legendary",
    earnedAt: "2026-07-03",
  },
  {
    name: "Git Master",
    description: "Rebased 5 critical feature branches in parallel with no manual merge conflicts.",
    icon: "lucide:git-branch",
    rarity: "rare",
    earnedAt: "2026-07-03",
  },
];

export default function ProfileTestPage() {
  const [profile, setProfile] = useState<UserProfileData | null>(INITIAL_PROFILE);
  const [simulationState, setSimulationState] = useState<"loaded" | "loading" | "empty">("loaded");
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  // Handle badge pinning
  const handleBadgePinToggle = (badgeId: string) => {
    if (!profile) return;

    setProfile((prev) => {
      if (!prev) return null;
      const updatedBadges = prev.badges.map((b) => {
        if (b.id === badgeId) {
          const isNowPinned = !b.isPinned;
          // Guard: maximum 3 pinned badges allowed for neat design spacing
          if (isNowPinned) {
            const currentlyPinnedCount = prev.badges.filter((item) => item.isPinned).length;
            if (currentlyPinnedCount >= 3) {
              toast.warning("Maximum of 3 pinned accomplishments can be featured at once!");
              return b;
            }
            toast.success(`Pinned "${b.name}" to featured achievements!`);
          } else {
            toast.info(`Unpinned "${b.name}" from featured accomplishments.`);
          }
          return { ...b, isPinned: isNowPinned };
        }
        return b;
      });

      return {
        ...prev,
        badges: updatedBadges,
      };
    });
  };

  // Add a random badge from the pool
  const handleAddRandomBadge = () => {
    if (!profile) {
      toast.danger("Please restore/loaded the profile first to add accomplishments!");
      return;
    }

    const unearnedPool = EXTRA_BADGES_POOL.filter(
      (poolItem) => !profile.badges.some((b) => b.name === poolItem.name)
    );

    if (unearnedPool.length === 0) {
      toast.info("Wow! You have already earned all accomplishments in the mock pool!");
      return;
    }

    const randomBadge = unearnedPool[Math.floor(Math.random() * unearnedPool.length)];
    const newBadgeId = `badge-added-${Date.now()}`;
    const newBadge: Badge = {
      ...randomBadge,
      id: newBadgeId,
      isPinned: false,
    };

    setProfile((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        badges: [...prev.badges, newBadge],
      };
    });

    toast.success(`Unlocked "${newBadge.name}" Badge! Added to your wall.`);
  };

  // Clear badges
  const handleClearBadges = () => {
    if (!profile) return;
    setProfile((prev) => {
      if (!prev) return null;
      return { ...prev, badges: [] };
    });
    toast.info("Cleared all badges from the profile.");
  };

  // Reset profile to default
  const handleRestoreProfile = () => {
    setProfile(INITIAL_PROFILE);
    setSimulationState("loaded");
    toast.success("Restored original profile data & badges!");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-3xl font-extrabold tracking-tight">
            <Icon icon="lucide:award" className="text-primary size-8" />
            Profile & Badge Wall Playground
          </h1>
          <p className="text-default-400 mt-1 max-w-2xl text-sm leading-relaxed">
            Test and preview our high-end, responsive personal profile card. Simulates various
            operational loading, empty, and permission states natively with buttery-smooth framer
            animations.
          </p>
        </div>

        {/* Restore/Reset action */}
        <Button
          onClick={handleRestoreProfile}
          variant="outline"
          size="md"
          className="gap-1.5 self-start font-medium"
        >
          <Icon icon="lucide:rotate-ccw" className="size-4" />
          Reset Demo Data
        </Button>
      </div>

      {/* Control Panel Panel */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Playground Controls Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-default-100 bg-surface/30 border p-5 shadow-md backdrop-blur-md">
            <h2 className="text-foreground mb-4 flex items-center gap-1.5 text-sm font-bold tracking-wider uppercase">
              <Icon icon="lucide:sliders-horizontal" className="size-4" />
              Interactive Controls
            </h2>

            {/* 1. Simulation State Selector */}
            <div className="space-y-3.5">
              <p className="text-default-400 text-xs font-semibold">Simulation View</p>
              <div className="flex flex-col gap-2.5">
                {[
                  {
                    id: "loaded",
                    label: "Normal Loaded",
                    icon: "lucide:check-circle",
                    color: "text-success",
                  },
                  {
                    id: "loading",
                    label: "Loading Skeleton",
                    icon: "lucide:loader-2",
                    color: "text-primary",
                  },
                  {
                    id: "empty",
                    label: "Empty Profile",
                    icon: "lucide:user-x",
                    color: "text-danger",
                  },
                ].map((item) => (
                  <Button
                    key={item.id}
                    size="sm"
                    variant={simulationState === item.id ? "primary" : "outline"}
                    onClick={() => setSimulationState(item.id as "loaded" | "loading" | "empty")}
                    className="w-full justify-start gap-2.5 text-left font-medium"
                  >
                    <Icon
                      icon={item.icon}
                      className={`size-4 ${simulationState === item.id ? "text-white" : item.color} ${item.id === "loading" && simulationState === "loading" ? "animate-spin" : ""}`}
                    />
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="my-5" />

            {/* 2. Permission Mock Selector */}
            <div className="space-y-4">
              <p className="text-default-400 text-xs font-semibold">Profile Permissions</p>
              <Switch
                isSelected={isOwnProfile}
                onChange={setIsOwnProfile}
                aria-label="Toggle profile owner view"
              >
                <div className="flex flex-col gap-0.5 pl-1 text-left">
                  <span className="text-foreground text-xs font-semibold">
                    {isOwnProfile ? "Profile Owner" : "Guest Visitor"}
                  </span>
                  <span className="text-default-400 text-[10px]">
                    {isOwnProfile ? "Pin achievements & Edit info" : "Follow user & Share profile"}
                  </span>
                </div>
              </Switch>
            </div>

            <Separator className="my-5" />

            {/* 3. Live Accomplishments Injector */}
            <div className="space-y-3">
              <p className="text-default-400 text-xs font-semibold">Accomplishments Handler</p>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddRandomBadge}
                  className="w-full justify-start gap-2 font-medium"
                >
                  <Icon icon="lucide:sparkles" className="size-4 text-amber-500" />
                  Inject Random Badge
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearBadges}
                  className="text-danger hover:bg-danger/10 w-full justify-start gap-2 font-medium"
                >
                  <Icon icon="lucide:trash-2" className="text-danger size-4" />
                  Clear Current Badges
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Live Rendering Display Container */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${simulationState}-${isOwnProfile}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <ProfileCard
                user={simulationState === "empty" ? null : profile}
                isLoading={simulationState === "loading"}
                isEmpty={
                  simulationState === "empty" ||
                  (profile !== null && profile.badges.length === 0 && simulationState !== "loading")
                }
                isOwnProfile={isOwnProfile}
                onEditProfile={handleRestoreProfile}
                onBadgePinToggle={handleBadgePinToggle}
                onProfileUpdate={setProfile}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
