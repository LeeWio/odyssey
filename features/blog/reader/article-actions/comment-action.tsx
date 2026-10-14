"use client";

import { Button, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { useReport, type Report } from "./use-engagement";

const CommentSheet = dynamic(() => import("@/components/comment").then((mod) => mod.CommentSheet), {
  ssr: false,
});

export function CommentAction({ postId, report }: { postId: number; report: Report }) {
  const t = useTranslations("Article");
  const [isOpen, setIsOpen] = useState(false);
  useReport("comments", isOpen, report);

  return (
    <>
      <Tooltip delay={100}>
        <Button
          isIconOnly
          aria-label={t("openComments")}
          size="sm"
          variant="ghost"
          onPress={() => setIsOpen(true)}
        >
          <Icon icon="gravity-ui:comment" />
        </Button>
        <Tooltip.Content>{t("comments")}</Tooltip.Content>
      </Tooltip>
      <CommentSheet isOpen={isOpen} postId={postId} onOpenChange={setIsOpen} />
    </>
  );
}
