/* eslint-disable @next/next/no-img-element */
"use client";

import Galaxy from "@/components/hero/galaxy";
import {
  Avatar,
  Card,
  Surface,
  Skeleton,
  Typography,
  CloseButton,
  Chip,
  Label,
  Link,
  ListBox,
  Description,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import {
  Carousel,
  ItemCard,
  ItemCardGroup,
  NumberValue,
  PressableFeedback,
} from "@heroui-pro/react";
import { Segment } from "@heroui-pro/react";
import { Button } from "@heroui/react";
import { Cloud, Person, Key as KeyIcon } from "@gravity-ui/icons";

const tabs = [
  { icon: "fa7-solid:fire", id: "popular", label: "Popular" },
  { icon: "gravity-ui:music-note", id: "music", label: "Music" },
  { icon: "gravity-ui:volume-low", id: "game", label: "Game" },
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

export default function Home() {
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

      <Surface
        variant="transparent"
        className="relative z-10 mx-auto grid w-full grid-cols-1 items-stretch gap-6 p-6 md:grid-cols-12 md:p-12 md:pt-32"
      >
        <Card className="flex h-full min-h-0 w-full flex-col gap-4 md:col-span-12 lg:col-span-6">
          <Card.Header>
            <Segment defaultSelectedKey="popular" variant="ghost" className="w-fit">
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
          <Card.Content className="flex flex-1 flex-col gap-4">
            <Typography type="h2">Valorant</Typography>
            <Typography type="body">
              valorant is a multiplayer computer game developed and published by Riot Games.Valorant
              is Riot Games'first-person shooter games.asdfasdfasdfasdfasdfasdf
            </Typography>
          </Card.Content>

          <Card.Footer className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {users.slice(0, 3).map((user) => (
                <Avatar key={user.id} className="ring-background ring-2" size="sm">
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
              +53 Reviews
            </Button>
          </Card.Footer>
        </Card>

        <ItemCardGroup className="flex h-full min-h-0 w-full flex-col md:col-span-6 lg:col-span-3">
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
        </ItemCardGroup>

        <div className="flex w-full flex-1 flex-col justify-between md:col-span-6 lg:col-span-3">
          <ItemCard<"button">
            className="bg-surface relative w-full cursor-pointer overflow-hidden"
            render={(props) => <button type="button" {...props} />}
          >
            <PressableFeedback.Highlight />
            <ItemCard.Icon>
              <img
                alt="Indie Hackers community"
                className="pointer-events-none aspect-square rounded-lg object-cover select-none"
                loading="lazy"
                src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg"
              />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title className="font-bold">Unravel 2</ItemCard.Title>
              <ItemCard.Description>(Standard Edition + Starter Pass)</ItemCard.Description>
            </ItemCard.Content>
            <ItemCard.Action>
              <Icon icon="gravity-ui:circle-chevron-right" className="text-muted size-4" />
            </ItemCard.Action>
          </ItemCard>
          <ItemCard<"button">
            className="bg-surface relative w-full cursor-pointer overflow-hidden"
            render={(props) => <button type="button" {...props} />}
          >
            <PressableFeedback.Highlight />
            <ItemCard.Icon>
              <img
                alt="Indie Hackers community"
                className="pointer-events-none aspect-square rounded-lg object-cover select-none"
                loading="lazy"
                src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg"
              />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title className="font-bold">Unravel 2</ItemCard.Title>
              <ItemCard.Description>(Standard Edition + Starter Pass)</ItemCard.Description>
            </ItemCard.Content>
            <ItemCard.Action>
              <Icon icon="gravity-ui:circle-chevron-right" className="text-muted size-4" />
            </ItemCard.Action>
          </ItemCard>
          <ItemCard<"button">
            className="bg-surface relative w-full cursor-pointer overflow-hidden"
            render={(props) => <button type="button" {...props} />}
          >
            <PressableFeedback.Highlight />
            <ItemCard.Icon>
              <img
                alt="Indie Hackers community"
                className="pointer-events-none aspect-square rounded-lg object-cover select-none"
                loading="lazy"
                src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg"
              />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title className="font-bold">Subway Surl</ItemCard.Title>
            </ItemCard.Content>
            <ItemCard.Action>
              <Icon icon="gravity-ui:circle-chevron-right" className="text-muted size-4" />
            </ItemCard.Action>
          </ItemCard>
          <ItemCard<"button">
            className="bg-surface relative w-full cursor-pointer overflow-hidden"
            render={(props) => <button type="button" {...props} />}
          >
            <PressableFeedback.Highlight />
            <ItemCard.Icon>
              <img
                alt="Cloud sync"
                className="pointer-events-none aspect-square rounded-lg object-cover select-none"
                loading="lazy"
                src="/A Fistful of Dollars.jpeg"
              />
            </ItemCard.Icon>
            <ItemCard.Content>
              <ItemCard.Title className="font-bold">Red Dead Redemption 3</ItemCard.Title>
              <ItemCard.Description>(Preminu Pack)</ItemCard.Description>
            </ItemCard.Content>
            <ItemCard.Action>
              <Icon icon="gravity-ui:circle-chevron-right" className="text-muted size-4" />
            </ItemCard.Action>
          </ItemCard>
        </div>
      </Surface>

      <Surface
        variant="transparent"
        className="relative z-10 mx-auto grid w-full grid-cols-1 items-start gap-6 p-6 pt-0 md:grid-cols-2 md:p-12 md:pt-0 lg:grid-cols-3"
      >
        <div className="flex w-full flex-col gap-6 lg:col-span-2">
          <div className="flex w-full flex-col gap-4">
            <div className="flex items-end justify-between">
              <Typography type="h5">New Games</Typography>
              <Link href="#" className="text-muted text-xs">
                See More
              </Link>
            </div>
            <div className="w-full">
              <Carousel opts={{ align: "start" }}>
                <Carousel.Content>
                  {Array.from({ length: 8 }, (_, i) => (
                    <Carousel.Item key={i} className="basis-1/2 lg:basis-1/3">
                      <div className="p-1">
                        <Card className="select-none">
                          <Card.Content className="flex aspect-square items-center justify-center">
                            <span className="text-2xl font-semibold tabular-nums">{i + 1}</span>
                          </Card.Content>
                        </Card>
                      </div>
                    </Carousel.Item>
                  ))}
                </Carousel.Content>
                <Carousel.Next />
              </Carousel>
            </div>
          </div>

          <div className="flex w-full flex-col gap-4">
            <div className="flex items-end justify-between">
              <Typography type="h5">Last Downloads</Typography>
              <Link href="#" className="text-muted text-xs">
                See More
              </Link>
            </div>
            <Card className="from-danger/80 via-danger/30 to-surface relative flex flex-row items-center justify-between overflow-hidden bg-linear-to-r p-4 sm:p-6">
              <div className="pointer-events-none absolute inset-0 z-0 opacity-30">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="text-danger/40 absolute left-1/4 h-full w-full scale-150 fill-current"
                >
                  <path d="M0,50 C20,30 40,80 60,50 C80,20 100,60 100,60 L100,100 L0,100 Z" />
                  <path
                    d="M0,60 C30,40 50,90 70,40 C90,-10 100,50 100,50 L100,100 L0,100 Z"
                    opacity="0.5"
                  />
                </svg>
              </div>

              <div className="z-10 flex w-fit items-center gap-4">
                <div className="bg-surface flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl shadow-sm">
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
                  <Button isIconOnly variant="danger" size="lg">
                    <Icon icon="gravity-ui:play-fill" />
                  </Button>
                  <Button isIconOnly size="lg" variant="primary">
                    <Icon icon="gravity-ui:xmark" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
        <div className="flex h-full w-full flex-col gap-4 lg:col-span-1">
          <div className="flex items-end justify-between">
            <Typography type="h5">Your Statistic</Typography>
            <Link href="#" className="text-muted text-xs">
              →
            </Link>
          </div>
          <Card className="flex flex-1 flex-col">
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
          </Card>
        </div>
      </Surface>
    </main>
  );
}
