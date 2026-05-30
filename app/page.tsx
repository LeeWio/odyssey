/* eslint-disable @next/next/no-img-element */
"use client";

import Galaxy from "@/components/hero/galaxy";
import { Avatar, Card, Surface, Skeleton, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { CircleChevronRight, Cloud, Key as KeyIcon, Person } from "@gravity-ui/icons";
import { ItemCard, PressableFeedback } from "@heroui-pro/react";
import { Segment } from "@heroui-pro/react";
import { Button } from "@heroui/react";

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
        className="relative z-10 mx-auto grid w-full grid-cols-1 items-stretch gap-6 p-6 md:grid-cols-2 md:p-12 md:pt-32 lg:grid-cols-3"
      >
        <Card className="flex min-h-0 w-full flex-col">
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
              valorant is a multiplayer computer game developed and published by Riot Games.Valorant is Riot Games'first-person shooter games.
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

        <Card className="flex min-h-0 w-full flex-col">
          <Card.Header className="flex flex-row items-center justify-between">
            <Card.Title>Your Statistic</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-1 flex-col items-center justify-center gap-6">
            asdfasdf
          </Card.Content>
        </Card>

        <div className="space-y-2 rounded-2xl">
          <ItemCard<"button">
            className="relative w-full cursor-pointer overflow-hidden"
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
            className="relative w-full cursor-pointer overflow-hidden"
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
            className="relative w-full cursor-pointer overflow-hidden"
            render={(props) => <button type="button" {...props} />}
          >
            <PressableFeedback.Highlight />
            <ItemCard.Icon>
              <img
                alt="Cloud sync"
                className="pointer-events-none aspect-square rounded-lg object-cover select-none"
                loading="lazy"
                src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg"
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
    </main>
  );
}
