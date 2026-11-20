"use client";

import { Button, Chip, Spinner, toast } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { getApiErrorMessage } from "@/lib/api";
import {
  useGetAdminWebhooksQuery,
  useUpdateAdminWebhookMutation,
  type Webhook,
} from "@/lib/features/dashboard/webhook-api";

import { usePortalContainer } from "../use-portal-container";

import { WebhookDeliveries } from "./webhook-deliveries";
import { WebhookEditor } from "./webhook-editor";

type Dialog = { kind: "edit"; webhook?: Webhook } | { kind: "deliveries"; webhook: Webhook };

export function WebhooksPage() {
  const t = useTranslations("Webhooks");
  const query = useGetAdminWebhooksQuery();
  const portal = usePortalContainer();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = () => setDialog(null);

  return (
    <section
      aria-labelledby="webhooks-heading"
      className="mx-auto flex max-w-5xl flex-col gap-4 px-5 pt-8 pb-10"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 id="webhooks-heading" className="text-foreground text-2xl font-semibold">
          {t("title")}
        </h1>
        <Button onPress={() => setDialog({ kind: "edit" })}>{t("add")}</Button>
      </header>

      {query.isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Spinner aria-label={t("loading")} />
        </div>
      ) : query.isError ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("loadFailed")}</EmptyState.Title>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button onPress={() => void query.refetch()} variant="secondary">
              {t("refresh")}
            </Button>
          </EmptyState.Content>
        </EmptyState>
      ) : !query.data?.length ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>{t("empty")}</EmptyState.Title>
          </EmptyState.Header>
        </EmptyState>
      ) : (
        <ul className="divide-separator border-separator divide-y rounded-2xl border">
          {query.data.map((webhook) => (
            <WebhookRow key={webhook.id} webhook={webhook} open={setDialog} />
          ))}
        </ul>
      )}
      {portal && dialog?.kind === "edit" ? (
        <WebhookEditor webhook={dialog.webhook} close={close} portal={portal} />
      ) : null}
      {portal && dialog?.kind === "deliveries" ? (
        <WebhookDeliveries webhook={dialog.webhook} close={close} portal={portal} />
      ) : null}
    </section>
  );
}

function WebhookRow({ webhook, open }: { webhook: Webhook; open: (dialog: Dialog) => void }) {
  const t = useTranslations("Webhooks");
  const { id, name, url, events, isActive } = webhook;
  const [update, { isLoading }] = useUpdateAdminWebhookMutation();

  async function toggle() {
    if (isLoading) return;
    try {
      await update({ id, body: { name, url, events, isActive: !isActive } }).unwrap();
    } catch (error) {
      toast.danger(getApiErrorMessage(error, t("saveFailed")));
    }
  }

  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{name}</span>
        <Chip color={isActive ? "success" : "default"} size="sm" variant="soft">
          {isActive ? t("active") : t("paused")}
        </Chip>
      </div>
      <p className="text-muted text-xs break-all">{url}</p>
      <div className="flex flex-wrap gap-1">
        {events.map((event) => (
          <Chip key={event} size="sm" variant="tertiary">
            {t(`events.${event}`)}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onPress={() => open({ kind: "edit", webhook })}>
          {t("edit")}
        </Button>
        <Button size="sm" variant="secondary" isPending={isLoading} onPress={() => void toggle()}>
          {isActive ? t("pause") : t("enable")}
        </Button>
        <Button size="sm" variant="secondary" onPress={() => open({ kind: "deliveries", webhook })}>
          {t("deliveries")}
        </Button>
      </div>
    </li>
  );
}
