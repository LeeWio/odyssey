"use client";

import { Sheet } from "@heroui-pro/react";
import { useHotkeys } from "@mantine/hooks";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { selectIsSheetOpen, toggleSheet } from "@/lib/features/ui";
import { Stocks } from "./widgets/stocks";
import { useThemeSwitch } from "../theme-switch";
import { Avatar, Button, Card, Chip, Toolbar, Typography } from "@heroui/react";
import { useState } from "react";
import { useRealTime } from "@/hooks/use-real-time";
import { AnimatedNumber } from "../ui/animated-number";
import { BackwardFillIcon, ForwardFillIcon, PlayFillIcon, SunMaxFillIcon } from "../icons";

export function SheetPanel() {
  const isOpen = useAppSelector(selectIsSheetOpen);
  const dispatch = useAppDispatch();

  const { ModeSwitch } = useThemeSwitch();
  const { formattedDate, day, weekdayName, hours, minutes } = useRealTime();

  const [weather] = useState({ tempMin: 10, tempMax: 30 });

  useHotkeys(
    [
      [
        "mod+j",
        () => {
          dispatch(toggleSheet());
        },
      ],
    ],
    [],
    true
  );

  return (
    <Sheet isOpen={isOpen} onOpenChange={() => dispatch(toggleSheet())} isDetached placement="top">
      <Sheet.Backdrop variant="blur">
        <Sheet.Content>
          <Sheet.Dialog>
            <Sheet.Header className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stocks />
            </Sheet.Header>
            <Sheet.Body className="flex gap-4">
              <Card className="max-w-80">
                <Card.Header className="flex items-center justify-center">
                  <Chip variant="primary" color="success" size="lg">
                    {formattedDate}
                  </Chip>
                </Card.Header>

                <Card.Content className="flex flex-row items-center justify-center">
                  <AnimatedNumber
                    value={parseInt(hours)}
                    className="text-muted text-[6rem] leading-none font-bold tabular-nums"
                    format={{ minimumIntegerDigits: 2 }}
                  />
                  <span className="text-accent relative top-[-0.06em] text-[6rem] leading-none font-bold tabular-nums">
                    :
                  </span>
                  <AnimatedNumber
                    value={parseInt(minutes)}
                    className="text-warning text-[6rem] leading-none font-bold tabular-nums"
                    format={{ minimumIntegerDigits: 2 }}
                  />
                </Card.Content>

                <Card.Footer className="flex items-center justify-center gap-2">
                  <SunMaxFillIcon className="text-warning-hover size-7" />
                  <Typography className="text-2xl font-bold tracking-tight">
                    {weather.tempMin}-{weather.tempMax}°
                  </Typography>
                </Card.Footer>
              </Card>
              <Card>
                <Card.Header className="flex items-center justify-center">
                  <Avatar className="h-16 w-16 rounded-full ring-8">
                    <Avatar.Image
                      alt="Small Avatar"
                      src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg"
                    />
                    <Avatar.Fallback>SM</Avatar.Fallback>
                  </Avatar>
                </Card.Header>
                <Card.Content className="flex items-center justify-center text-xl font-extrabold">
                  Music Player
                </Card.Content>
                <Card.Footer className="flex items-center justify-center gap-4">
                  <Button isIconOnly size="lg" variant="secondary" aria-label="Previous track">
                    <BackwardFillIcon />
                  </Button>
                  <Button isIconOnly size="lg" variant="primary" aria-label="Play">
                    <PlayFillIcon />
                  </Button>
                  <Button isIconOnly size="lg" variant="secondary" aria-label="Next track">
                    <ForwardFillIcon />
                  </Button>
                </Card.Footer>
              </Card>
            </Sheet.Body>
            <Sheet.Footer className="flex! flex-row! items-center justify-center gap-10">
              <ModeSwitch />
              <Toolbar
                isAttached
                className="bg-danger shadow-danger/20 flex aspect-square size-20 cursor-default flex-col items-center justify-center rounded-[2.2rem] border-none p-0 text-white shadow-2xl transition-transform select-none hover:scale-105 active:scale-95"
              >
                <Typography className="text-3xl leading-none font-black tabular-nums">
                  {day}
                </Typography>
                <Typography className="mt-1 text-[10px] font-black tracking-[0.2em] text-white/80 uppercase">
                  {weekdayName}
                </Typography>
              </Toolbar>
            </Sheet.Footer>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}
