"use client";

import { HelloApple } from "@/components/home/hello-apple";
import { MotionChip, MotionItemCard, MotionKPI, MotionTypography } from "@/components/ui";
import { ChatAttachmentInput, ItemCard, KPI, PromptInput, TrendChip } from "@heroui-pro/react";
import Image from "next/image";
import { MediaPlayButton } from "@/features/media/components/media-play-button";
import { MediaItem } from "@/features/media/types";
import { ArrowUp, Paperclip, Target } from "@gravity-ui/icons";
import { useState } from "react";

const sparklineUp = [
  { value: 30 },
  { value: 35 },
  { value: 28 },
  { value: 42 },
  { value: 38 },
  { value: 45 },
  { value: 50 },
  { value: 48 },
  { value: 55 },
  { value: 60 },
  { value: 58 },
  { value: 65 },
];

const mockSong: MediaItem = {
  id: "1",
  title: "老歌",
  description: "安泊猜想",
  cover: "/IMG_5332.JPG",
  type: "track",
  tracks: [
    {
      id: "track-1",
      title: "老歌",
      artist: "安泊猜想",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
      id: "track-2",
      title: "Example Song 2",
      artist: "Artist 2",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    },
    {
      id: "track-3",
      title: "Example Song 3",
      artist: "Artist 3",
      src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    },
  ],
};

export default function Home() {
  const [value] = useState("");

  return (
    <main className="bg-background relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6">
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
        <HelloApple />
      </div>

      <section className="relative mt-[clamp(5rem,10vw,10rem)] flex min-h-[700px] w-full flex-col items-center gap-2 px-[clamp(1rem,4vw,4rem)] pb-[clamp(5rem,12vw,12rem)]">
        <MotionChip
          size="md"
          color="default"
          variant="primary"
          initial={{
            opacity: 0,
            y: 12,
            filter: "blur(8px)",
          }}
          whileInView={{
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
          }}
          viewport={{
            once: true,
            amount: 0.4,
          }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          RECENTLY
        </MotionChip>
        <MotionTypography
          align="center"
          type="h1"
          weight="bold"
          color="default"
          className="text-[clamp(2.25rem,5vw,4rem)] leading-[1.1] tracking-[-0.03em]"
          initial={{
            opacity: 0,
            y: 18,
            filter: "blur(10px)",
          }}
          whileInView={{
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
          }}
          viewport={{
            once: true,
            amount: 0.4,
          }}
          transition={{
            duration: 0.8,
            delay: 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          What I&apos;ve been up to
        </MotionTypography>

        <MotionTypography
          align="center"
          type="body"
          color="muted"
          weight="normal"
          className="text-[clamp(0.875rem,1.5vw,1.125rem)] leading-relaxed tracking-[-0.01em]"
          initial={{
            opacity: 0,
            y: 12,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.4,
          }}
          transition={{
            duration: 0.7,
            delay: 0.18,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          Things I enjoy lately.
        </MotionTypography>

        <MotionItemCard
          initial={{
            opacity: 0,
            y: 30,
            scale: 0.96,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.6,
          }}
          className="absolute top-[35%] left-[15%] w-75 rotate-[-8deg]"
        >
          <ItemCard.Icon role="img">
            <div className="relative size-9 overflow-hidden rounded-lg">
              <Image
                src="/IMG_5332.JPG"
                alt="Album cover"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </ItemCard.Icon>
          <ItemCard.Content>
            <ItemCard.Title>老歌</ItemCard.Title>
            <ItemCard.Description>安泊猜想</ItemCard.Description>
          </ItemCard.Content>
          <ItemCard.Action>
            <MediaPlayButton media={mockSong} shuffle={true} size="sm" variant="tertiary" />
          </ItemCard.Action>
        </MotionItemCard>

        <MotionKPI
          initial={{
            opacity: 0,
            x: 30,
            y: 10,
            scale: 0.96,
            filter: "blur(8px)",
          }}
          whileInView={{
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
          }}
          viewport={{
            once: true,
            amount: 0.3,
          }}
          transition={{
            duration: 0.8,
            delay: 0.12,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute top-[28%] right-[12%] rotate-[8deg]"
        >
          <KPI.Header>
            <Target className="text-muted size-4" />
            <KPI.Title>NASDAQ</KPI.Title>
          </KPI.Header>
          <KPI.Content className="w-92 grid-cols-[1fr_1fr] items-end">
            <div className="flex flex-col gap-1">
              <KPI.Value className="text-3xl" maximumFractionDigits={2} value={25373.85} />
              <div className="flex items-center gap-1.5">
                <TrendChip trend="up" variant="tertiary">
                  3.5%
                  <TrendChip.Suffix>last 30d</TrendChip.Suffix>
                </TrendChip>
              </div>
            </div>
            <KPI.Chart
              color="var(--color-accent)"
              data={sparklineUp}
              height={60}
              strokeWidth={1.5}
            />
          </KPI.Content>
        </MotionKPI>

        <PromptInput value={value} className="absolute top-[50%] max-w-110">
          <ChatAttachmentInput disabled onFilesSelected={() => {}}>
            <ChatAttachmentInput.Dropzone
              render={(dropzoneProps) => (
                <PromptInput.Shell {...dropzoneProps}>
                  <PromptInput.Content>
                    <PromptInput.TextArea placeholder="What do you want to know?" />
                  </PromptInput.Content>
                  <PromptInput.Toolbar>
                    <PromptInput.ToolbarStart>
                      <ChatAttachmentInput.Trigger
                        render={(triggerProps) => (
                          <PromptInput.Action
                            {...triggerProps}
                            aria-label="Attach file"
                            tooltip="Attach file"
                          >
                            <Paperclip className="size-4" />
                          </PromptInput.Action>
                        )}
                      />
                    </PromptInput.ToolbarStart>
                    <PromptInput.ToolbarEnd>
                      <PromptInput.Send>
                        <ArrowUp className="size-4" />
                      </PromptInput.Send>
                    </PromptInput.ToolbarEnd>
                  </PromptInput.Toolbar>
                </PromptInput.Shell>
              )}
            />
          </ChatAttachmentInput>
        </PromptInput>
      </section>
    </main>
  );
}
