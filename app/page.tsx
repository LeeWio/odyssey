"use client";

import type { Value } from "platejs";
import { Plate, PlateContent } from "platejs/react";
import { useRichText } from "@/hooks/use-rich-text";

import { initialValue } from "./value";

export default function Home() {
  const { editor } = useRichText({ value: initialValue });

  if (!editor) {
    return null;
  }

  return (
    <Plate editor={editor}>
      <PlateContent
        style={{ padding: "16px 64px", minHeight: "100px" }}
        placeholder="Type your amazing content here..."
      />
    </Plate>
  );
}
