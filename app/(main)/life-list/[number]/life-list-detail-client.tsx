"use client";

import { EmptyState } from "@heroui-pro/react";
import { Button, Chip, Input, Label, TextArea, TextField, Typography, toast } from "@heroui/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";

import { PageFrame } from "@/components/layout/page-frame";
import { StatusMeter } from "@/components/life-list/progress-meter";
import { selectIsAdmin } from "@/lib/features/auth";
import { useAppSelector } from "@/lib/hooks";
import {
  useChangeLifeListStatusMutation,
  useCreateLifeListMemoryMutation,
  useGetPublicLifeListItemQuery,
  type LifeListItemResponse,
  type LifeListVisibility,
} from "@/lib/features/life-list";

function formatDate(value: string | null, locale: string) {
  if (!value) return "";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function LifeListDetailClient({
  number,
  initialItem,
}: {
  number: number;
  initialItem: LifeListItemResponse | null;
}) {
  const t = useTranslations("LifeList");
  const locale = useLocale();
  const isAdmin = useAppSelector(selectIsAdmin);
  const query = useGetPublicLifeListItemQuery(number, { skip: initialItem != null });
  const item = query.data ?? initialItem;
  const [changeStatus, { isLoading: isCompleting }] = useChangeLifeListStatusMutation();
  const [createMemory, { isLoading: isSavingMemory }] = useCreateLifeListMemoryMutation();
  const [showMemory, setShowMemory] = useState(false);
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [visibility, setVisibility] = useState<LifeListVisibility>("private");

  if (query.isLoading && !item) {
    return (
      <PageFrame>
        <Typography color="muted">{t("pace")}</Typography>
      </PageFrame>
    );
  }

  if (!item || query.isError) {
    return (
      <PageFrame className="mx-auto max-w-3xl">
        <EmptyState>
          <EmptyState.Title>{t("notFound")}</EmptyState.Title>
          <Button variant="ghost">
            <Link href="/life-list">{t("back")}</Link>
          </Button>
        </EmptyState>
      </PageFrame>
    );
  }

  const complete = async () => {
    await changeStatus({
      id: item.id,
      body: { status: "completed", completedAt: new Date().toISOString().slice(0, 10) },
    }).unwrap();
    toast.success(t("completedToast"));
    setShowMemory(true);
  };

  const saveMemory = async (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    await createMemory({
      itemId: item.id,
      body: {
        content: content.trim(),
        location: location.trim() || null,
        occurredAt: occurredAt || null,
        visibility,
      },
    }).unwrap();
    setContent("");
    setLocation("");
    setShowMemory(false);
  };

  return (
    <PageFrame className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <Link href="/life-list" className="text-muted text-sm hover:underline">
          {t("back")}
        </Link>
        <p className="text-muted mt-6 text-sm tabular-nums">
          {t("number", { number: item.number })}
        </p>
        <Typography type="h1" className="mt-2 text-balance">
          {item.title}
        </Typography>
        <div className="mt-4 max-w-48">
          <StatusMeter label={t(`status.${item.status}`)} status={item.status} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Chip size="sm" variant="soft">
            {t(`status.${item.status}`)}
          </Chip>
          {item.category ? (
            <Chip size="sm" variant="soft">
              {item.category.name}
            </Chip>
          ) : null}
          {item.completedAt ? (
            <span className="text-muted text-sm">
              {t("completedOn", { date: formatDate(item.completedAt, locale) })}
            </span>
          ) : null}
        </div>
      </div>

      {item.description ? (
        <Typography className="text-pretty whitespace-pre-wrap">{item.description}</Typography>
      ) : null}
      {item.motivation ? (
        <section className="flex flex-col gap-2">
          <Typography type="h2" className="text-lg">
            {t("why")}
          </Typography>
          <Typography color="muted" className="whitespace-pre-wrap">
            {item.motivation}
          </Typography>
        </section>
      ) : null}

      {isAdmin && item.status !== "completed" ? (
        <div className="flex flex-wrap gap-2">
          <Button onPress={() => void complete()} isDisabled={isCompleting}>
            {t("markComplete")}
          </Button>
          <Button variant="ghost" onPress={() => setShowMemory(true)}>
            {t("addMemory")}
          </Button>
        </div>
      ) : null}

      {isAdmin && showMemory ? (
        <form onSubmit={(event) => void saveMemory(event)} className="flex flex-col gap-3">
          <Typography color="muted">{t("memoryHint")}</Typography>
          <TextField name="memory-content" value={content} onChange={setContent} isRequired>
            <Label>{t("memoryContent")}</Label>
            <TextArea required rows={4} />
          </TextField>
          <TextField name="memory-location" value={location} onChange={setLocation}>
            <Label>{t("memoryLocation")}</Label>
            <Input maxLength={160} />
          </TextField>
          <label className="flex flex-col gap-1 text-sm">
            {t("memoryDate")}
            <input
              type="date"
              className="border-border bg-background rounded-lg border px-3 py-2"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("memoryVisibility")}
            <select
              className="border-border bg-background rounded-lg border px-3 py-2"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as LifeListVisibility)}
            >
              <option value="private">{t("visibilityPrivate")}</option>
              <option value="public">{t("visibilityPublic")}</option>
            </select>
          </label>
          <Button type="submit" isDisabled={isSavingMemory || !content.trim()}>
            {isSavingMemory ? t("saving") : t("save")}
          </Button>
        </form>
      ) : null}

      <section className="flex flex-col gap-4">
        <Typography type="h2" className="text-lg">
          {t("memories")}
        </Typography>
        {item.memories.length === 0 ? (
          <Typography color="muted">{t("noMemories")}</Typography>
        ) : (
          <ol className="flex flex-col gap-6">
            {item.memories.map((memory) => (
              <li key={memory.id} className="border-border border-t pt-4">
                <div className="text-muted mb-2 flex flex-wrap gap-3 text-sm">
                  {memory.occurredAt ? <span>{formatDate(memory.occurredAt, locale)}</span> : null}
                  {memory.location ? <span>{memory.location}</span> : null}
                  {memory.visibility === "private" ? <span>{t("privateMemory")}</span> : null}
                </div>
                <p className="whitespace-pre-wrap">{memory.content}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </PageFrame>
  );
}
