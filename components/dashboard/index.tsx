"use client";

import { Sheet } from "@heroui-pro/react";
import { useHotkeys } from "react-hotkeys-hook";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { selectIsSheetOpen, toggleSheet } from "@/lib/features/ui";
import { Stocks } from "./widgets/stocks";
import { AutoplayCarousel } from "./widgets/autoplay-carousel";

export function Dashboard() {
  const isOpen = useAppSelector(selectIsSheetOpen);
  const dispatch = useAppDispatch();

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
            <Sheet.Footer>{/* Footer actions go here */}</Sheet.Footer>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}
