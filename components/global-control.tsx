"use client";

import { DashboardSheet } from "@/components/dashboard";
import { RichTextModal } from "@/components/rich-text";
import { Cockpit } from "@/components/cockpit";

export function GlobalControl() {
  return (
    <>
      <Cockpit />
      <DashboardSheet />
      <RichTextModal />
    </>
  );
}
