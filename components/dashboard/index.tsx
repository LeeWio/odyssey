"use client";

import type { Key } from "@heroui/react";

import { Sheet } from "@heroui-pro/react";
import { useHotkeys } from "react-hotkeys-hook";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { selectIsSheetOpen, toggleSheet } from "@/lib/features/ui";
import { Stocks } from "./widgets/stocks";
import { useThemeSwitch } from "../theme-switch";
import { Avatar, Button, Card, Chip, ListBox, Typography } from "@heroui/react";
import { useState } from "react";
import { Car, Sun } from "@gravity-ui/icons";
import { useRealTime } from "@/hooks/use-real-time";
import { AnimatedNumber } from "../ui/animated-number";
import { BackwardFillIcon, ForwardFillIcon, PlayFillIcon } from "../icons";

export function Dashboard() {
  const isOpen = useAppSelector(selectIsSheetOpen);
  const dispatch = useAppDispatch();

  const { ModeSwitch } = useThemeSwitch();
  const { formattedDate, hours, minutes } = useRealTime();

  // Mock real weather data - in a real app, this would come from a weather API hook
  const [weather] = useState({ tempMin: 10, tempMax: 30 });

  const [theme, setTheme] = useState<Key | null>("default");
  const [language, setLanguage] = useState<Key | null>("en");
  const [fontSize, setFontSize] = useState<Key | null>("md");

  useHotkeys(
    "mod+j",
    (e) => {
      e.preventDefault();
      dispatch(toggleSheet());
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    }
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

                <Card.Content className="flex flex-row justify-center items-center">
                  <AnimatedNumber
                    value={parseInt(hours)}
                    className="text-muted text-[6rem] font-bold leading-none tabular-nums"
                    format={{ minimumIntegerDigits: 2 }}
                  />
                  <span className="text-accent relative top-[-0.06em] text-[6rem] font-bold leading-none tabular-nums">
                    :
                  </span>
                  <AnimatedNumber
                    value={parseInt(minutes)}
                    className="text-warning text-[6rem] font-bold leading-none tabular-nums"
                    format={{ minimumIntegerDigits: 2 }}
                  />
                </Card.Content>

                <Card.Footer className="flex gap-2 justify-center items-center">
                  <Sun className="text-warning-hover size-7" />
                  <Typography className="text-2xl font-bold tracking-tight">
                    {weather.tempMin}-{weather.tempMax}°
                  </Typography>
                </Card.Footer>
              </Card>
              <Card>
                <Card.Header className="flex items-center justify-center">
                  <Avatar className="w-16 h-16 rounded-full ring-8">
                    <Avatar.Image
                      alt="Small Avatar"
                      src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg"
                    />
                    <Avatar.Fallback>SM</Avatar.Fallback>
                  </Avatar>
                </Card.Header>
                <Card.Content className="flex items-center justify-center font-extrabold text-xl">
                  Music Player
                </Card.Content>
                <Card.Footer className="flex items-center justify-center gap-4">
                  <Button isIconOnly size="lg" variant="secondary" aria-label="">
                    <BackwardFillIcon />
                  </Button>
                  <Button isIconOnly size="lg" variant="primary" aria-label="">
                    <PlayFillIcon />
                  </Button>
                  <Button isIconOnly size="lg" variant="secondary" aria-label="">
                    <ForwardFillIcon />
                  </Button>
                </Card.Footer>
              </Card>
            </Sheet.Body>
            <Sheet.Footer className="flex! flex-row! items-center justify-center">
              <ModeSwitch />
            </Sheet.Footer>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}
