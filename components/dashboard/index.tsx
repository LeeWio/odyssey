"use client";

import { Sheet } from "@heroui-pro/react";
import { useHotkeys } from "react-hotkeys-hook";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { selectIsSheetOpen, toggleSheet } from "@/lib/features/ui";
import { Surface } from "@heroui/react";
import { Stocks } from "./widgets/stocks";

export function Dashboard() {
    const isOpen = useAppSelector(selectIsSheetOpen);
    const dispatch = useAppDispatch();

    useHotkeys("mod+j", (e) => {
        e.preventDefault();
        dispatch(toggleSheet());
    }, {
        enableOnFormTags: true,
        enableOnContentEditable: true
    });

    return (
        <Sheet isOpen={isOpen} onOpenChange={() => dispatch(toggleSheet())} isDetached placement="top">
            <Sheet.Backdrop variant="blur">
                <Sheet.Content>
                    <Sheet.Dialog>
                        <Sheet.Header className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" >
                            <Stocks />
                        </Sheet.Header>
                        <Sheet.Body>
                            {/* Dashboard content goes here */}
                        </Sheet.Body>
                        <Sheet.Footer>
                            {/* Footer actions go here */}
                        </Sheet.Footer>
                    </Sheet.Dialog>
                </Sheet.Content>
            </Sheet.Backdrop>
        </Sheet>
    );
}
