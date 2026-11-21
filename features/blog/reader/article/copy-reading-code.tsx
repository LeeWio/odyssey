"use client";

import { Button, toast } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

export function CopyReadingCode() {
  const t = useTranslations("Article");
  const buttonRef = useRef<HTMLButtonElement>(null);

  const copy = async () => {
    const code = buttonRef.current
      ?.closest("[data-reading-code]")
      ?.querySelector("code")?.textContent;
    if (code == null) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t("codeCopied"));
    } catch {
      toast.danger(t("codeCopyFailed"));
    }
  };

  return (
    <Button ref={buttonRef} size="sm" variant="tertiary" onPress={copy}>
      {t("copyCode")}
    </Button>
  );
}
