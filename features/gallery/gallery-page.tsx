import { EmptyState } from "@heroui-pro/react";
import { Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import { PageFrame } from "@/components/layout/page-frame";

interface GalleryPageProps {
  compact?: boolean;
}

export function GalleryPage({ compact = false }: GalleryPageProps) {
  const t = useTranslations("Gallery");

  return (
    <PageFrame className={compact ? "min-h-0 w-full p-0" : "w-full"}>
      <EmptyState className="min-h-[min(32rem,70dvh)]" size="lg">
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <Icon aria-hidden="true" className="size-6" icon="lucide:construction" />
          </EmptyState.Media>
          <Chip color="accent" size="sm" variant="soft">
            {t("eyebrow")}
          </Chip>
          <EmptyState.Title>{t("title")}</EmptyState.Title>
          <EmptyState.Description className="max-w-md text-pretty">
            {t("description")}
          </EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
    </PageFrame>
  );
}
