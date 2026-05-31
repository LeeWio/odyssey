"use client";

import { type ComponentPropsWithoutRef, useState } from "react";
import Image from "next/image";
import Galaxy from "@/components/hero/galaxy";
import { Avatar, Card, Surface, Typography, Chip, Label, Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Carousel, ItemCard, ItemCardGroup, PressableFeedback } from "@heroui-pro/react";
import { Segment } from "@heroui-pro/react";
import { Button } from "@heroui/react";
import { Cloud, Person, Key as KeyIcon } from "@gravity-ui/icons";
import { motion, AnimatePresence } from "motion/react";

const MotionSurface = motion.create(Surface);
const MotionCard = motion.create(Card);
const MotionItemCardGroup = motion.create(ItemCardGroup);
const MotionItemCard = motion.create(ItemCard);

const renderItemCardButton = (props: unknown) => (
  <button {...(props as ComponentPropsWithoutRef<"button">)} type="button" />
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const tabs = [
  { icon: "ph:fire-fill", id: "popular", label: "Popular" },
  { icon: "simple-icons:playstation", id: "ps5", label: "PS5" },
  { icon: "simple-icons:nintendoswitch", id: "switch", label: "Switch" },
];

const users = [
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

const newGames = [
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

const heroContent = {
  popular: {
    title: "League of Legends",
    description: "LEAGUE OF LEGENDS — A 5V5 MOBA WHERE TEAMS BATTLE TO DESTROY THE ENEMY NEXUS",
    reviews: "+99k Reviews",
    image: "/lol-hero.png",
    color: "bg-gradient-to-br from-surface-secondary via-surface-tertiary to-background",
    isCutout: true,
    tags: ["MOBA", "Action", "Strategy"],
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
  },
};

const heroContentItems = Object.values(heroContent);

type HeroContent = (typeof heroContent)[keyof typeof heroContent];

function HeroDetails({ content, isSizer = false }: { content: HeroContent; isSizer?: boolean }) {
  return (
    <div
      aria-hidden={isSizer || undefined}
      className={`flex h-full min-h-0 flex-col gap-4 ${isSizer ? "pointer-events-none invisible col-start-1 row-start-1" : ""}`}
    >
      <Card.Content className="flex min-h-40 flex-1 flex-col gap-4">
        <Typography type="h2" className="tracking-tight text-white drop-shadow-md">
          {content.title}
        </Typography>
        <Typography
          type="body"
          className="line-clamp-3 max-w-[90%] text-sm leading-relaxed font-light text-slate-200/90 drop-shadow-sm sm:text-base"
        >
          {content.description}
        </Typography>
        {content.tags && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {content.tags.map((tag) => (
              <Chip key={tag} size="sm" variant="soft">
                {tag}
              </Chip>
            ))}
          </div>
        )}
      </Card.Content>

      <Card.Footer className="mt-auto flex shrink-0 items-center justify-start gap-4">
        <div className="flex -space-x-3">
          {users.slice(0, 3).map((user) => (
            <Avatar key={user.id} className="ring-accent/50 ring-2" size="sm">
              <Avatar.Image alt={user.name} src={user.image} />
              <Avatar.Fallback>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Avatar.Fallback>
            </Avatar>
          ))}
        </div>
        <Button size="sm" variant="tertiary">
          <Icon icon="gravity-ui:thumbs-up-fill" />
          {content.reviews}
        </Button>
      </Card.Footer>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("popular");
  const currentContent = heroContent[activeTab as keyof typeof heroContent];

  return (
    <main className="flex min-h-screen w-full flex-col overflow-x-hidden">
      <Galaxy
        mouseRepulsion
        mouseInteraction
        density={1}
        glowIntensity={0.3}
        saturation={0}
        hueShift={140}
        twinkleIntensity={0.3}
        rotationSpeed={0.1}
        repulsionStrength={2}
        autoCenterRepulsion={0}
        starSpeed={0.5}
        speed={1}
      />

      <MotionSurface
        variant="transparent"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 mx-auto grid w-full grid-cols-1 items-stretch gap-6 p-6 md:grid-cols-12 md:p-12 md:pt-32"
      >
        <MotionCard
          variants={itemVariants}
          className={`relative flex h-full min-h-0 w-full flex-col gap-4 md:col-span-12 lg:col-span-6 ${currentContent.color || "bg-surface"} transition-colors duration-500`}
        >
          {/* Background/Cutout Image */}
          {currentContent.image && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`pointer-events-none absolute inset-y-0 right-0 z-0 ${
                  currentContent.isCutout
                    ? activeTab === "ps5"
                      ? "w-[85%] origin-bottom -translate-x-8 scale-140 lg:w-[75%] lg:-translate-x-12"
                      : activeTab === "switch"
                        ? "w-[85%] origin-bottom translate-x-8 scale-140 lg:w-[75%] lg:translate-x-23"
                        : "w-[85%] origin-bottom -translate-x-8 scale-140 lg:w-[75%] lg:-translate-x-12"
                    : "w-3/5"
                }`}
                style={
                  !currentContent.isCutout
                    ? {
                        maskImage: "linear-gradient(to right, transparent, black 40%)",
                        WebkitMaskImage: "linear-gradient(to right, transparent, black 40%)",
                      }
                    : {}
                }
              >
                <Image
                  src={currentContent.image}
                  alt={currentContent.title}
                  fill={!currentContent.isCutout}
                  width={currentContent.isCutout ? 800 : undefined}
                  height={currentContent.isCutout ? 800 : undefined}
                  className={
                    currentContent.isCutout
                      ? "h-full w-full object-contain object-bottom"
                      : "object-cover object-center"
                  }
                />
              </motion.div>
            </AnimatePresence>
          )}

          <div className="relative z-10 flex w-full flex-col sm:w-[65%]">
            <Card.Header className="pb-6">
              <Segment
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key as string)}
                variant="ghost"
                className="w-fit"
              >
                {tabs.map((tab) => (
                  <Segment.Item key={tab.id} className="w-auto" id={tab.id} style={{ gap: 0 }}>
                    {({ isSelected }) => (
                      <>
                        <Icon icon={tab.icon} />
                        <span
                          className="inline-grid transition-all duration-200 ease-out motion-reduce:transition-none"
                          style={{
                            gridTemplateColumns: isSelected ? "1fr" : "0fr",
                            minWidth: 0,
                            opacity: isSelected ? 1 : 0,
                          }}
                        >
                          <span
                            className="overflow-hidden whitespace-nowrap transition-[padding] duration-200 ease-out motion-reduce:transition-none"
                            style={{
                              minWidth: 0,
                              paddingInlineStart: isSelected ? "0.375rem" : 0,
                            }}
                          >
                            {tab.label}
                          </span>
                        </span>
                      </>
                    )}
                  </Segment.Item>
                ))}
              </Segment>
            </Card.Header>
            <div className="grid">
              {heroContentItems.map((content) => (
                <HeroDetails key={content.title} content={content} isSizer />
              ))}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="col-start-1 row-start-1 flex min-h-0 flex-col"
                >
                  <HeroDetails content={currentContent} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </MotionCard>

        <MotionItemCardGroup
          variants={itemVariants}
          className="flex h-full min-h-0 w-full flex-col md:col-span-6 lg:col-span-3"
        >
          <ItemCard className="flex-1">
            <ItemCard.Icon>
              <Person />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title>Profile</ItemCard.Title>
              <ItemCard.Description>Update your personal information</ItemCard.Description>
            </ItemCard.Content>
          </ItemCard>
          <ItemCard className="flex-1">
            <ItemCard.Icon>
              <Person />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title>Profile</ItemCard.Title>
              <ItemCard.Description>Update your personal information</ItemCard.Description>
            </ItemCard.Content>
          </ItemCard>
          <ItemCard className="flex-1">
            <ItemCard.Icon>
              <KeyIcon />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title>Security</ItemCard.Title>
              <ItemCard.Description>Manage passwords and 2FA</ItemCard.Description>
            </ItemCard.Content>
          </ItemCard>
          <ItemCard className="flex-1">
            <ItemCard.Icon>
              <Cloud />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title>Cloud sync</ItemCard.Title>
              <ItemCard.Description>Sync data across your devices</ItemCard.Description>
            </ItemCard.Content>
          </ItemCard>
        </MotionItemCardGroup>

        <motion.div className="flex w-full flex-1 flex-col gap-4 md:col-span-6 lg:col-span-3">
          <MotionItemCard
            variants={itemVariants}
            className="bg-surface relative w-full cursor-pointer overflow-hidden"
            render={renderItemCardButton}
          >
            <PressableFeedback.Highlight />
            <ItemCard.Icon>
              <Image
                alt="Indie Hackers community"
                className="pointer-events-none aspect-square rounded-lg object-cover select-none"
                src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg"
                width={64}
                height={64}
              />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title className="font-bold">Unravel 2</ItemCard.Title>
              <ItemCard.Description>(Standard Edition + Starter Pass)</ItemCard.Description>
            </ItemCard.Content>
            <ItemCard.Action>
              <Icon icon="gravity-ui:circle-chevron-right" className="text-muted size-4" />
            </ItemCard.Action>
          </MotionItemCard>
          <MotionItemCard
            variants={itemVariants}
            className="bg-surface relative w-full cursor-pointer overflow-hidden"
            render={renderItemCardButton}
          >
            <PressableFeedback.Highlight />
            <ItemCard.Icon>
              <Image
                alt="Indie Hackers community"
                className="pointer-events-none aspect-square rounded-lg object-cover select-none"
                src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg"
                width={64}
                height={64}
              />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title className="font-bold">Unravel 2</ItemCard.Title>
              <ItemCard.Description>(Standard Edition + Starter Pass)</ItemCard.Description>
            </ItemCard.Content>
            <ItemCard.Action>
              <Icon icon="gravity-ui:circle-chevron-right" className="text-muted size-4" />
            </ItemCard.Action>
          </MotionItemCard>
          <MotionItemCard
            variants={itemVariants}
            className="bg-surface relative w-full cursor-pointer overflow-hidden"
            render={renderItemCardButton}
          >
            <PressableFeedback.Highlight />
            <ItemCard.Icon>
              <Image
                alt="Indie Hackers community"
                className="pointer-events-none aspect-square rounded-lg object-cover select-none"
                src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg"
                width={64}
                height={64}
              />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title className="font-bold">Subway Surfers</ItemCard.Title>
            </ItemCard.Content>
            <ItemCard.Action>
              <Icon icon="gravity-ui:circle-chevron-right" className="text-muted size-4" />
            </ItemCard.Action>
          </MotionItemCard>
          <MotionItemCard
            variants={itemVariants}
            className="bg-surface relative w-full cursor-pointer overflow-hidden"
            render={renderItemCardButton}
          >
            <PressableFeedback.Highlight />
            <ItemCard.Icon>
              <Image
                alt="Cloud sync"
                className="pointer-events-none aspect-square rounded-lg object-cover select-none"
                src="/A Fistful of Dollars.jpeg"
                width={64}
                height={64}
              />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title className="font-bold">Red Dead Redemption 3</ItemCard.Title>
              <ItemCard.Description>(Premium Pack)</ItemCard.Description>
            </ItemCard.Content>
            <ItemCard.Action>
              <Icon icon="gravity-ui:circle-chevron-right" className="text-muted size-4" />
            </ItemCard.Action>
          </MotionItemCard>
        </motion.div>
      </MotionSurface>

      <MotionSurface
        variant="transparent"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={containerVariants}
        className="relative z-10 mx-auto grid w-full grid-cols-1 items-start gap-6 p-6 pt-0 md:grid-cols-2 md:p-12 md:pt-0 lg:grid-cols-3"
      >
        <motion.div className="flex w-full flex-col gap-6 lg:col-span-2">
          <motion.div variants={itemVariants} className="flex w-full flex-col gap-4">
            <div className="flex items-end justify-between">
              <Typography type="h5">New Games</Typography>
              <Link href="#" className="text-muted text-xs">
                See More
              </Link>
            </div>
            <div className="w-full">
              <Carousel opts={{ align: "start" }}>
                <Carousel.Content>
                  {newGames.map((game) => (
                    <Carousel.Item
                      key={game.id}
                      className="basis-full sm:basis-1/2 lg:basis-1/2 xl:basis-1/3 2xl:basis-1/4"
                    >
                      <div className="p-1">
                        <Card className="relative aspect-video overflow-hidden border-none select-none">
                          <Image alt={game.title} className="object-cover" fill src={game.image} />
                          <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/60 to-transparent p-3">
                            <Typography type="body-sm" className="font-bold text-white">
                              {game.title}
                            </Typography>
                          </div>
                        </Card>
                      </div>
                    </Carousel.Item>
                  ))}
                </Carousel.Content>
                <Carousel.Previous />
                <Carousel.Next />
              </Carousel>
            </div>
          </motion.div>

          <div className="flex w-full flex-col gap-4">
            <motion.div variants={itemVariants} className="flex items-end justify-between">
              <Typography type="h5">Last Downloads</Typography>
              <Link href="#" className="text-muted text-xs">
                See More
              </Link>
            </motion.div>
            <MotionCard
              variants={itemVariants}
              className="from-primary/20 to-surface relative flex flex-row items-center justify-between overflow-hidden bg-linear-to-r p-4 sm:p-6"
            >
              <div className="z-10 flex w-fit items-center gap-4">
                <div className="bg-surface-secondary flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl">
                  <div className="mb-1 flex h-5 w-5 items-center justify-center rounded-full bg-black">
                    <span className="text-[8px] leading-none font-bold text-white">EA</span>
                  </div>
                  <Typography
                    type="h5"
                    className="text-foreground m-0 leading-none font-black tracking-tighter italic"
                  >
                    FIFA
                  </Typography>
                  <Typography
                    type="body-xs"
                    className="text-foreground m-0 leading-none font-black tracking-tighter italic"
                  >
                    23
                  </Typography>
                </div>

                <div className="flex flex-col">
                  <Typography type="h6" className="font-bold uppercase">
                    elden ring
                  </Typography>
                  <Chip size="sm" color="default" variant="primary">
                    Bandai Namco Entertainment
                  </Chip>
                </div>
              </div>

              <div className="z-10 flex items-center gap-6">
                <div className="flex flex-col">
                  <Label htmlFor="progress" className="text-md">
                    Game progress
                  </Label>
                  <Chip id="progress" size="sm" className="w-fit">
                    <Icon icon="gravity-ui:chart-line-arrow-up" />
                    <Chip.Label className="font-bold">16%</Chip.Label>
                  </Chip>
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="played" className="text-md">
                    Played
                  </Label>
                  <Chip id="played" size="sm" className="w-fit">
                    <Icon icon="gravity-ui:chart-line-arrow-up" />
                    <Chip.Label className="font-bold">173h</Chip.Label>
                  </Chip>
                </div>
                <div className="flex items-center gap-2">
                  <Button isIconOnly variant="primary" size="lg">
                    <Icon icon="gravity-ui:play-fill" />
                  </Button>
                  <Button isIconOnly size="lg" variant="tertiary">
                    <Icon icon="gravity-ui:xmark" />
                  </Button>
                </div>
              </div>
            </MotionCard>
          </div>
        </motion.div>
        <motion.div className="flex h-full w-full flex-col gap-4 lg:col-span-1">
          <motion.div variants={itemVariants} className="flex items-end justify-between">
            <Typography type="h5">Your Statistics</Typography>
            <Link href="#" className="text-muted text-xs">
              →
            </Link>
          </motion.div>
          <MotionCard variants={itemVariants} className="flex flex-1 flex-col">
            <Card.Content className="flex flex-1 flex-col items-center justify-center gap-6">
              <div className="border-surface-tertiary relative flex h-32 w-32 items-center justify-center rounded-full border-8">
                <div className="border-border/60 border-t-foreground absolute inset-0 rounded-full border-8" />
                <div className="flex flex-col items-center">
                  <Typography type="body-xs" color="muted">
                    Total hours
                  </Typography>
                  <Typography type="h5" className="font-bold">
                    12,340h
                  </Typography>
                </div>
              </div>

              <div className="flex w-full justify-around pt-4">
                <div className="flex flex-col items-center gap-1">
                  <Avatar size="sm" className="bg-surface-tertiary" color="default">
                    <Avatar.Fallback>
                      <Icon icon="gravity-ui:gamepad" />
                    </Avatar.Fallback>
                  </Avatar>
                  <Typography type="body-xs" className="font-bold">
                    2,340h
                  </Typography>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Avatar size="sm" className="bg-surface-tertiary" color="default">
                    <Avatar.Fallback>
                      <Icon icon="gravity-ui:headphone" />
                    </Avatar.Fallback>
                  </Avatar>
                  <Typography type="body-xs" className="font-bold">
                    5,420h
                  </Typography>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Avatar size="sm" className="bg-surface-tertiary" color="default">
                    <Avatar.Fallback>
                      <Icon icon="gravity-ui:target" />
                    </Avatar.Fallback>
                  </Avatar>
                  <Typography type="body-xs" className="font-bold">
                    4,580h
                  </Typography>
                </div>
              </div>
            </Card.Content>
          </MotionCard>
        </motion.div>
      </MotionSurface>
    </main>
  );
}
