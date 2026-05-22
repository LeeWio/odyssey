"use client";

import type { Key } from "@heroui/react";

import { Sheet, CellSelect } from "@heroui-pro/react";
import { useHotkeys } from "react-hotkeys-hook";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { selectIsSheetOpen, toggleSheet } from "@/lib/features/ui";
import { Stocks } from "./widgets/stocks";
import { AutoplayCarousel } from "./widgets/autoplay-carousel";
import { useThemeSwitch } from "../theme-switch";
import { ListBox } from "@heroui/react"
import { useState } from "react";


export function Dashboard() {
  const isOpen = useAppSelector(selectIsSheetOpen);
  const dispatch = useAppDispatch();

  const { ModeSwitch } = useThemeSwitch();

  const [theme, setTheme] = useState < Key | null > ("default");
  const [language, setLanguage] = useState < Key | null > ("en");
  const [fontSize, setFontSize] = useState < Key | null > ("md");


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
            <Sheet.Body className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AutoplayCarousel />
            </Sheet.Body>
            <Sheet.Footer className="flex! flex-row! items-center justify-start">
              <CellSelect aria-label="Theme" value={theme} onChange={(v) => setTheme(v as Key | null)}>
                <CellSelect.Trigger>
                  <CellSelect.Label>Theme</CellSelect.Label>
                  <CellSelect.Value />
                  <CellSelect.Indicator />
                </CellSelect.Trigger>
                <CellSelect.Popover>
                  <ListBox>
                    <ListBox.Item id="default" textValue="Default">
                      Default
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="dark" textValue="Dark">
                      Dark
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="system" textValue="System">
                      System
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </CellSelect.Popover>
              </CellSelect>
              <CellSelect aria-label="Language" value={language} onChange={(v) => setLanguage(v)}>
                <CellSelect.Trigger>
                  <CellSelect.Label>Language</CellSelect.Label>
                  <CellSelect.Value />
                  <CellSelect.Indicator />
                </CellSelect.Trigger>
                <CellSelect.Popover>
                  <ListBox>
                    <ListBox.Item id="en" textValue="English">
                      English
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="es" textValue="Spanish">
                      Spanish
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="fr" textValue="French">
                      French
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </CellSelect.Popover>
              </CellSelect>
              <CellSelect aria-label="Font size" value={fontSize} onChange={(v) => setFontSize(v)}>
                <CellSelect.Trigger>
                  <CellSelect.Label>Font size</CellSelect.Label>
                  <CellSelect.Value />
                  <CellSelect.Indicator />
                </CellSelect.Trigger>
                <CellSelect.Popover>
                  <ListBox>
                    <ListBox.Item id="sm" textValue="Small">
                      Small
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="md" textValue="Medium">
                      Medium
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="lg" textValue="Large">
                      Large
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </CellSelect.Popover>
              </CellSelect>
              <ModeSwitch />
            </Sheet.Footer>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}
