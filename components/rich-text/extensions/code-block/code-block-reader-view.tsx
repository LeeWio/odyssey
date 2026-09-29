"use client";

import { Icon } from "@iconify/react";
import { Button, toast } from "@heroui/react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useTranslations } from "next-intl";

export function CodeBlockReaderView({ node }: NodeViewProps) {
  const t = useTranslations("Article");
  const language = typeof node.attrs.language === "string" ? node.attrs.language : "";

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(node.textContent);
      toast.success(t("codeCopied"));
    } catch {
      toast.danger(t("codeCopyFailed"));
    }
  };

  return (
    <NodeViewWrapper className="group bg-default-100 relative my-6 overflow-hidden rounded-xl [&>pre]:max-h-[min(70vh,48rem)] [&>pre]:overflow-auto [&>pre]:p-4 [&>pre]:font-mono [&>pre]:text-sm [&>pre]:leading-6 [&>pre]:outline-none">
      <div className="border-default-200 flex items-center justify-between gap-3 border-b px-3 py-2">
        <span className="text-muted min-w-0 truncate font-mono text-xs uppercase">
          {language || t("code")}
        </span>
        <Button
          isIconOnly
          aria-label={t("copyCode")}
          className="shrink-0"
          size="sm"
          variant="ghost"
          onPress={() => void copyCode()}
        >
          <Icon icon="lucide:copy" aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </NodeViewWrapper>
  );
}
