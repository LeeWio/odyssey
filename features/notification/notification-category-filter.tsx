"use client";

import { Tabs } from "@heroui/react";
import { useTranslations } from "next-intl";

import { NOTIFICATION_CATEGORIES, type NotificationCategory } from "@/lib/features/notification";

export function NotificationCategoryFilter({
  category,
  onCategoryChange,
}: {
  category?: NotificationCategory;
  onCategoryChange: (category?: NotificationCategory) => void;
}) {
  const t = useTranslations("Notifications");
  const tabs: { id?: NotificationCategory; label: string }[] = [
    { label: t("all") },
    ...NOTIFICATION_CATEGORIES.map((id) => ({ id, label: t(`category.${id}`) })),
  ];

  return (
    <Tabs
      className="min-w-0"
      selectedKey={category ?? "all"}
      onSelectionChange={(key) =>
        onCategoryChange(key === "all" ? undefined : (key as NotificationCategory))
      }
    >
      <Tabs.ListContainer className="overflow-x-auto">
        <Tabs.List aria-label={t("categories")}>
          {tabs.map((tab) => (
            <Tabs.Tab key={tab.id ?? "all"} id={tab.id ?? "all"}>
              {tab.label}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}
