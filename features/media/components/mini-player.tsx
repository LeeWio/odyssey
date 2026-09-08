"use client";

import { BroadcastSignal, MusicNote, PauseFill, PlayFill, Star, StarFill } from "@gravity-ui/icons";
import { Button, Label, Slider, Tooltip, type ButtonProps } from "@heroui/react";
import { Sheet } from "@heroui-pro/react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { selectIsMiniPlayerOpen, setMiniPlayerOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

const DEMO_TRACK = {
  title: "High Alone",
  artist: "Jackson Wang",
  cover: "/IMG_5332.JPG",
  duration: 193,
};

function formatTime(seconds: number) {
  return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
}

function Control({
  label,
  children,
  className = "",
  onPress,
  pressed,
  size = "lg",
  variant = "ghost",
}: {
  label: string;
  children: ReactNode;
  className?: string;
  onPress: () => void;
  pressed?: boolean;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}) {
  return (
    <Tooltip>
      <Button
        isIconOnly
        size={size}
        variant={variant}
        aria-label={label}
        aria-pressed={pressed}
        className={`${className}`}
        onPress={onPress}
      >
        {children}
      </Button>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}

export const MiniPlayer: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsMiniPlayerOpen);
  const [playing, setPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [position, setPosition] = useState(104);
  const [outputSelected, setOutputSelected] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);

  return (
    <Sheet
      isHandleOnly
      shouldAutoFocus
      isOpen={isOpen}
      isDetached
      onOpenChange={(open) => dispatch(setMiniPlayerOpen(open))}
    >
      <Sheet.Backdrop>
        <Sheet.Content className="mx-auto w-[calc(100%-2rem)] max-w-md">
          <Sheet.Dialog>
            <Sheet.Heading className="sr-only">Now Playing</Sheet.Heading>
            <div className="grid gap-5 p-5">
              <div className="flex min-w-0 items-center gap-4">
                <div className="bg-surface-secondary relative grid size-28 shrink-0 place-items-center overflow-hidden rounded-xl">
                  {coverFailed ? (
                    <MusicNote aria-hidden="true" />
                  ) : (
                    <Image
                      src={DEMO_TRACK.cover}
                      alt=""
                      fill
                      unoptimized
                      sizes="110px"
                      className="object-cover"
                      onError={() => setCoverFailed(true)}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-xl leading-tight font-semibold">
                      {DEMO_TRACK.title}
                    </h3>
                    <span
                      className="bg-foreground text-background grid size-7 shrink-0 place-items-center rounded text-sm font-bold"
                      aria-label="Explicit content"
                    >
                      E
                    </span>
                  </div>
                  <p className="text-muted mt-1 truncate text-sm">{DEMO_TRACK.artist}</p>
                </div>
                <span className="flex shrink-0 gap-1" aria-hidden="true">
                  {Array.from({ length: 6 }, (_, index) => (
                    <span key={index} className="bg-muted size-1 rounded-full" />
                  ))}
                </span>
              </div>

              <Slider
                aria-label="Playback position"
                value={position}
                minValue={0}
                maxValue={DEMO_TRACK.duration}
                step={1}
                onChange={(value) => setPosition(Array.isArray(value) ? value[0] : value)}
                className="flex w-full min-w-0 flex-row items-center justify-center gap-2"
              >
                <Label className="text-muted w-10 shrink-0 text-center text-xs tabular-nums">
                  {formatTime(position)}
                </Label>
                <Slider.Track className="min-w-0 flex-1">
                  <Slider.Fill />
                  <Slider.Thumb />
                </Slider.Track>
                <Slider.Output className="text-muted w-12 shrink-0 text-center text-xs tabular-nums">
                  {() => `−${formatTime(DEMO_TRACK.duration - position)}`}
                </Slider.Output>
              </Slider>

              <div className="grid grid-cols-5 items-center justify-items-center gap-2">
                <Control
                  label={saved ? "Remove from favorites" : "Add to favorites"}
                  pressed={saved}
                  className="text-muted"
                  onPress={() => setSaved(!saved)}
                >
                  {saved ? <StarFill aria-hidden="true" /> : <Star aria-hidden="true" />}
                </Control>
                <Control label="Previous track" className="" onPress={() => setPosition(0)}>
                  <PlayFill />
                </Control>
                <Control
                  label={playing ? "Pause" : "Play"}
                  size="lg"
                  variant="primary"
                  onPress={() => setPlaying(!playing)}
                >
                  {playing ? <PauseFill aria-hidden="true" /> : <PlayFill aria-hidden="true" />}
                </Control>
                <Control label="Next track" className="" onPress={() => setPosition(0)}>
                  <PlayFill />
                </Control>
                <Control
                  label="Audio output"
                  pressed={outputSelected}
                  className="text-muted"
                  onPress={() => setOutputSelected(!outputSelected)}
                >
                  <BroadcastSignal aria-hidden="true" />
                </Control>
              </div>
            </div>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
};
