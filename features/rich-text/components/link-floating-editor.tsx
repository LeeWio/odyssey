// components/LinkFloatingEditor.tsx
"use client";

import { Link, Separator, Toolbar } from "@heroui/react";
import { FloatingLinkUrlInput } from "@platejs/link/react";

export interface LinkFloatingEditorProps {
  textInputProps: React.InputHTMLAttributes<HTMLInputElement>;
}

export function LinkFloatingEditor({ textInputProps }: LinkFloatingEditorProps) {
  return (
    <Toolbar isAttached>
      <div className="flex items-center">
        <div className="text-muted-foreground flex items-center pr-1 pl-2">
          <Link className="size-4" />
        </div>
        <FloatingLinkUrlInput placeholder="Paste link" data-plate-focus />
      </div>

      <Separator className="my-1" />

      <div className="flex items-center">
        <div className="text-muted-foreground flex items-center pr-1 pl-2">text</div>
        <input
          placeholder="Text to display"
          data-plate-focus
          {...textInputProps}
          className="min-w-[120px] bg-transparent outline-none"
        />
      </div>
    </Toolbar>
  );
}
