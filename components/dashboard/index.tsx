"use client";

import { useTheme } from "next-themes";
import React from "react";
import {
    Button,
    Input,
    Label,
    TextField,
    Select,
    SelectItem,
    Avatar,
    Chip
} from "@heroui/react";
import {
    Sheet,
    KPI,
    KPIGroup,
    TrendChip,
    Widget,
    Carousel,
    CellSwitch,
    Segment
} from "@heroui-pro/react";
import { useHotkeys } from "react-hotkeys-hook";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import {
    selectIsSheetOpen,
    toggleSheet,
    selectThemeVariant,
    setThemeVariant,
    ThemeVariant
} from "@/lib/features/ui";
import { Icon } from "@iconify/react";
import {
    Display,
    Moon,
    Sun,
} from '@gravity-ui/icons'
import { AnalyticsKpiRow } from "./analytics-kpi-row";

const sparklineUp = [{ value: 30 }, { value: 35 }, { value: 28 }, { value: 42 }, { value: 38 }, { value: 45 }, { value: 50 }];
const sparklineDown = [{ value: 65 }, { value: 60 }, { value: 62 }, { value: 55 }, { value: 58 }, { value: 52 }, { value: 50 }];

const projectImages = [
    {
        title: "Odyssey Framework",
        src: "https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/shoes/product-view/1.jpeg",
    },
    {
        title: "HeroUI Integration",
        src: "https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/shoes/product-view/2.jpeg",
    },
    {
        title: "GSAP Animations",
        src: "https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/shoes/product-view/3.jpeg",
    },
];

export function Dashboard() {
    const isOpen = useAppSelector(selectIsSheetOpen);
    const themeVariant = useAppSelector(selectThemeVariant);
    const dispatch = useAppDispatch();

    const { theme, setTheme } = useTheme();


    useHotkeys("mod+j", (e) => {
        e.preventDefault();
        dispatch(toggleSheet());
    }, {
        enableOnFormTags: true,
        enableOnContentEditable: true
    });

    const handleThemeChange = (variant: ThemeVariant) => {
        dispatch(setThemeVariant(variant));
    };

    return (
        <Sheet isOpen={isOpen} onOpenChange={() => dispatch(toggleSheet())} isDetached placement="top">
            <Sheet.Backdrop variant="blur">
                <Sheet.Content >
                    <Sheet.Dialog >
                        <Sheet.Header className="flex! flex-row! items-center justify-between gap-4 ">
                            <Sheet.Heading className="text-base font-bold">Control Center</Sheet.Heading>
                            <Segment
                                selectedKey={theme ? theme : "system"}
                                onSelectionChange={(key) => setTheme(String(key))}
                                className="gap-0"
                                defaultSelectedKey="system"
                                size="sm"
                            >
                                <Segment.Item aria-label="Light" className="size-[28px] px-0" id="light">
                                    <Sun className="size-3.5" />
                                </Segment.Item>
                                <Segment.Item aria-label="Dark" className="size-[28px] px-0" id="dark">
                                    <Moon className="size-3.5" />
                                </Segment.Item>
                                <Segment.Item aria-label="System" className="size-[28px] px-0" id="system">
                                    <Display className="size-3.5" />
                                </Segment.Item>
                            </Segment>
                        </Sheet.Header>
                        <Sheet.Body >
                            <AnalyticsKpiRow/>
                        </Sheet.Body>
                        <Sheet.Footer >
                            <p className="text-tiny text-default-400 italic">Press <kbd className="font-sans font-bold px-1 bg-default-100">Cmd+J</kbd> to jump back</p>
                        </Sheet.Footer>
                        <Sheet.Handle />
                    </Sheet.Dialog>
                </Sheet.Content>
            </Sheet.Backdrop>
        </Sheet >
    );
}
