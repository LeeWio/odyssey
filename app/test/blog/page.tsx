"use client";

import { Button } from "@heroui/react";

import { openRichText } from "@/lib/features";
import { useAppDispatch } from "@/lib/hooks";

export default function BlogTestPage() {
  const dispatch = useAppDispatch();

  return (
    <div className="flex h-screen items-center justify-center">
      <Button
        onPress={() =>
          dispatch(
            openRichText({
              isReadOnly: false,
              activeId: "111",
            })
          )
        }
      >
        Open Global RichText Editor
      </Button>
    </div>
  );
}
