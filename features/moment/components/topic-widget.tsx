"use client";

import { Card, Chip } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  collectMomentTopics,
  type MomentResponse,
  type MomentTopicResponse,
} from "@/lib/features/moment";

export function MomentTopicWidget({
  moments,
  selected,
  onSelect,
}: {
  moments: MomentResponse[];
  selected?: string;
  onSelect: (slug?: string) => void;
}) {
  const t = useTranslations("Moments");
  const locale = useLocale();
  const [known, setKnown] = useState<Array<MomentTopicResponse & { count: number }>>([]);
  const current = collectMomentTopics(moments);
  if (current.length > known.length) {
    setKnown(current);
  }
  const topics = known.length > 0 ? known : current;

  return (
    <Card className="w-full gap-3 p-4">
      <Card.Header className="p-0">
        <Card.Title className="text-base">{t("topicsTitle")}</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-row flex-wrap gap-2 p-0">
        <TopicChip current={!selected} label={t("allTopics")} onPress={() => onSelect(undefined)} />
        {topics.map((topic) => (
          <TopicChip
            key={topic.slug}
            count={topic.count}
            current={selected === topic.slug}
            label={topic.slug}
            locale={locale}
            onPress={() => onSelect(selected === topic.slug ? undefined : topic.slug)}
          />
        ))}
      </Card.Content>
    </Card>
  );
}

function TopicChip({
  count,
  current,
  label,
  locale,
  onPress,
}: {
  count?: number;
  current: boolean;
  label: string;
  locale?: string;
  onPress: () => void;
}) {
  return (
    <Chip
      className="w-auto max-w-full cursor-pointer"
      color={current ? "accent" : "default"}
      size="sm"
      variant={current ? "primary" : "secondary"}
      onClick={onPress}
    >
      {label}
      {count == null ? null : (
        <span className="text-muted tabular-nums">{count.toLocaleString(locale)}</span>
      )}
    </Chip>
  );
}
