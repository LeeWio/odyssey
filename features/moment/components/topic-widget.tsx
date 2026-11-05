"use client";

import { Card, Skeleton, Tag, TagGroup, Typography } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";

import { useGetPublicMomentTopicsQuery } from "@/lib/features/moment";

export function MomentTopicWidget({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (slug?: string) => void;
}) {
  const t = useTranslations("Moments");
  const locale = useLocale();
  const query = useGetPublicMomentTopicsQuery();
  const topics = query.data ?? [];

  return (
    <Card className="w-full">
      <Card.Header>
        <Card.Title className="text-base">{t("topicsTitle")}</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-row flex-wrap gap-2">
        {query.isLoading ? (
          <Skeleton className="h-6 w-16 rounded-full" />
        ) : query.isError ? (
          <Typography color="muted" type="body-sm">
            {t("topicsUnavailable")}
          </Typography>
        ) : (
          <TagGroup
            aria-label={t("topicsTitle")}
            selectedKeys={selected ? [selected] : ["all"]}
            selectionMode="single"
            size="sm"
            onSelectionChange={(keys) => {
              const key = [...keys][0];
              onSelect(key == null || key === "all" ? undefined : String(key));
            }}
          >
            <TagGroup.List className="flex-wrap">
              <Tag id="all">{t("allTopics")}</Tag>
              {topics.map((topic) => (
                <Tag key={topic.slug} id={topic.slug} textValue={topic.slug}>
                  {topic.slug}
                  {topic.count == null ? null : (
                    <span className="text-muted tabular-nums">
                      {topic.count.toLocaleString(locale)}
                    </span>
                  )}
                </Tag>
              ))}
            </TagGroup.List>
          </TagGroup>
        )}
      </Card.Content>
    </Card>
  );
}
