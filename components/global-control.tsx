"use client";

import dynamic from "next/dynamic";
import { useHotkeys } from "@mantine/hooks";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { selectIsAdmin } from "@/lib/features/auth";
import {
  selectIsMomentPublisherOpen,
  selectIsRichTextOpen,
  selectIsSheetOpen,
  setMomentPublisherOpen,
  toggleSheet,
} from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

const Cockpit = dynamic(() => import("@/components/cockpit").then((mod) => mod.Cockpit), {
  ssr: false,
});

const DashboardSheet = dynamic(
  () => import("@/features/dashboard").then((mod) => mod.DashboardSheet),
  { ssr: false }
);

const MomentPublisher = dynamic(
  () => import("@/features/moment/components/publisher").then((mod) => mod.MomentPublisher),
  { ssr: false }
);

const RichTextModal = dynamic(
  () => import("@/components/rich-text/rich-text-modal").then((mod) => mod.RichTextModal),
  { ssr: false }
);

/** Latch: once active, keep the heavy chunk mounted so close animations still run. */
function useLoadOnce(active: boolean) {
  const [loaded, setLoaded] = useState(false);
  if (active && !loaded) {
    setLoaded(true);
  }
  return loaded || active;
}

function CockpitGate() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsSheetOpen);
  const loaded = useLoadOnce(isOpen);

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

  if (!loaded) return null;
  return <Cockpit />;
}

function DashboardGate() {
  const isAdmin = useAppSelector(selectIsAdmin);
  const locale = useLocale();
  const [readyLocale, setReadyLocale] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    void import("@/features/dashboard")
      .then((module) => module.preloadDashboardMessages(locale))
      .then(() => {
        if (!cancelled) setReadyLocale(locale);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, locale]);

  // Mount while closed. Opening on the same frame as the first mount replays the
  // entrance and looks like the dashboard flashes.
  if (!isAdmin || readyLocale !== locale) return null;
  return <DashboardSheet />;
}

function MomentPublisherGate() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsMomentPublisherOpen);
  const loaded = useLoadOnce(isOpen);

  if (!loaded) return null;
  return (
    <MomentPublisher
      isOpen={isOpen}
      onOpenChange={(open) => dispatch(setMomentPublisherOpen(open))}
    />
  );
}

function RichTextGate() {
  const isOpen = useAppSelector(selectIsRichTextOpen);
  const loaded = useLoadOnce(isOpen);

  if (!loaded) return null;
  return <RichTextModal />;
}

export function GlobalControl() {
  return (
    <>
      <CockpitGate />
      <DashboardGate />
      <RichTextGate />
      <MomentPublisherGate />
    </>
  );
}
