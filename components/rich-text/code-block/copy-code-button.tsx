"use client";

import { Copy } from "@gravity-ui/icons";
import { Button, Tooltip, toast } from "@heroui/react";
import { useTranslations } from "next-intl";

export function CopyCodeButton({ copyText }: { copyText: string }) {
  const t = useTranslations("Article");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      toast.success(t("codeCopied"));
    } catch {
      toast.danger(t("codeCopyFailed"));
    }
  };

  return (
    <Tooltip>
      <Button aria-label={t("copyCode")} isIconOnly variant="ghost" onPress={copy}>
        <Copy aria-hidden="true" />
      </Button>
      <Tooltip.Content>{t("copyCode")}</Tooltip.Content>
    </Tooltip>
  );
}
