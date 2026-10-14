"use client";

import { Button, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { ShareDialog } from "./share-dialog";
import type { Target } from "./target";
import { useReport, type Report } from "./use-engagement";

export function ShareAction({ article, report }: { article: Target; report: Report }) {
  const t = useTranslations("Article");
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  useReport("share", isOpen, report);

  return (
    <>
      <Tooltip delay={100}>
        <Button
          isIconOnly
          aria-label={t("shareArticle")}
          size="sm"
          variant="ghost"
          onPress={() => {
            setUrl(window.location.href);
            setIsOpen(true);
          }}
        >
          <Icon icon="gravity-ui:nodes-right" />
        </Button>
        <Tooltip.Content>{t("shareArticle")}</Tooltip.Content>
      </Tooltip>
      {url ? (
        <ShareDialog article={article} isOpen={isOpen} url={url} onOpenChange={setIsOpen} />
      ) : null}
    </>
  );
}
