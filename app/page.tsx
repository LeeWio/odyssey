"use client";

import { Carousel } from "@heroui-pro/react";
import { Card, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";

import Archive from "@gravity-ui/icons/Archive";
import Comment from "@gravity-ui/icons/Comment";
import House from "@gravity-ui/icons/House";
import Video from "@gravity-ui/icons/Video";
import { Segment } from "@heroui-pro/react";

const tabs = [
  { icon: <House />, id: "home", label: "Home" },
  { icon: <Comment />, id: "chat", label: "Chat" },
  { icon: <Video />, id: "meetings", label: "Meetings" },
  { icon: <Archive />, id: "inbox", label: "Inbox" },
];

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="min-h-72">Card 1</Card>
        <Card>Card 2</Card>
        <Card>Card 3</Card>
      </div>
      <Carousel opts={{ align: "start" }}>
        <Carousel.Content>
          {Array.from({ length: 8 }, (_, i) => (
            <Carousel.Item
              key={i}
              className="basis-1/2 p-2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6 xl:basis-1/7"
            >
              <Card>
                <Card.Content className="flex cursor-pointer flex-row items-center justify-center gap-2 py-2">
                  <Icon icon="gravity-ui:picture" width={25} height={25} />
                  <span className="text-md font-medium">Trending</span>
                </Card.Content>
              </Card>
            </Carousel.Item>
          ))}
        </Carousel.Content>
        <Carousel.Previous />
        <Carousel.Next />
      </Carousel>
      <Typography type="h2">Trending in Animation</Typography>
      <Segment defaultSelectedKey="meetings" size="lg" variant="ghost" className="gap-1">
        {tabs.map((tab) => (
          <Segment.Item
            key={tab.id}
            className="w-auto"
            id={tab.id}
            style={{ gap: 0 }}
          >
            {({ isSelected }) => (
              <>
                {tab.icon}
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
    </main>
  );
}
