"use client";

import { DashboardSheet } from "@/components/dashboard";
import { RichTextModal } from "@/components/rich-text";
import { SheetPanel } from "@/components/sheet-panel";

export function GlobalControl() {
  return (
    <>
      <SheetPanel />
      <DashboardSheet />
      <RichTextModal />
    </>
  );
}
