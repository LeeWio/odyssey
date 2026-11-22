"use client";

import { Button, Chip, Dropdown, Label } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLocale, useTranslations } from "next-intl";

import { useGetPublicMomentTopicsQuery } from "@/lib/features/moment";

const ALL_TOPICS = "all-topics";
const TOPIC_PREFIX = "topic:";

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
  return (
    <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2">
      <Dropdown>
        <Button size="sm" variant="secondary" isDisabled={query.isLoading}>
          {t("topics")}
          <Icon aria-hidden="true" icon="lucide:chevron-down" />
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu
            aria-label={t("topics")}
            selectedKeys={[selected ? `${TOPIC_PREFIX}${selected}` : ALL_TOPICS]}
            selectionMode="single"
            disallowEmptySelection
            onSelectionChange={(keys) => {
              if (keys === "all") return;
              const key = [...keys][0];
              if (typeof key !== "string") return;
              onSelect(key === ALL_TOPICS ? undefined : key.slice(TOPIC_PREFIX.length));
            }}
          >
            <Dropdown.Item id={ALL_TOPICS} textValue={t("allTopics")}>
              <Dropdown.ItemIndicator />
              <Label>{t("allTopics")}</Label>
            </Dropdown.Item>
            {(query.data ?? []).map(({ slug, count }) => (
              <Dropdown.Item key={slug} id={`${TOPIC_PREFIX}${slug}`} textValue={slug}>
                <Dropdown.ItemIndicator />
                <Label className="min-w-0 wrap-anywhere">{slug}</Label>
                <span className="text-muted ml-auto tabular-nums">
                  {count.toLocaleString(locale)}
                </span>
              </Dropdown.Item>
            ))}
            {query.isError ? (
              <Dropdown.Item id="unavailable" isDisabled textValue={t("topicsUnavailable")}>
                <Label>{t("topicsUnavailable")}</Label>
              </Dropdown.Item>
            ) : null}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      {selected ? (
        <div className="flex max-w-full min-w-0 items-center gap-1">
          <Chip size="sm" variant="soft" className="min-w-0">
            <Chip.Label className="truncate">{selected}</Chip.Label>
          </Chip>
          <Button size="sm" variant="ghost" className="shrink-0" onPress={() => onSelect()}>
            {t("clearTopic")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
