"use client";

import { Button, Checkbox, Form, Input, Label, Modal, TextField } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { getApiErrorMessage } from "@/lib/api";
import {
  useCreateAdminWebhookMutation,
  useUpdateAdminWebhookMutation,
  webhookEvents,
  type Webhook,
  type WebhookEvent,
} from "@/lib/features/dashboard/webhook-api";

export function WebhookEditor({
  webhook,
  close,
  portal,
}: {
  webhook?: Webhook;
  close: () => void;
  portal: HTMLElement;
}) {
  const t = useTranslations("Webhooks");
  const [name, setName] = useState(webhook?.name ?? "");
  const [url, setUrl] = useState(webhook?.url ?? "");
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState<WebhookEvent[]>(webhook?.events ?? []);
  const [isActive, setActive] = useState(webhook?.isActive ?? true);
  const [error, setError] = useState("");
  const [create, creating] = useCreateAdminWebhookMutation();
  const [update, updating] = useUpdateAdminWebhookMutation();
  const isBusy = creating.isLoading || updating.isLoading;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;
    if (events.length === 0) {
      setError(t("eventsRequired"));
      return;
    }
    setError("");
    const config = { name: name.trim(), url: url.trim(), events, isActive };
    try {
      if (webhook) {
        await update({
          id: webhook.id,
          body: secret.trim() ? { ...config, secret: secret.trim() } : config,
        }).unwrap();
      } else {
        await create({ ...config, secret: secret.trim() }).unwrap();
      }
      close();
    } catch (failure) {
      setError(getApiErrorMessage(failure, t("saveFailed")));
    }
  }

  return (
    <Modal>
      <Modal.Backdrop
        isOpen
        isDismissable={!isBusy}
        isKeyboardDismissDisabled={isBusy}
        onOpenChange={(open) => {
          if (!open && !isBusy) close();
        }}
        UNSTABLE_portalContainer={portal}
      >
        <Modal.Container>
          <Modal.Dialog>
            <Form className="flex min-h-0 flex-1 flex-col" onSubmit={save}>
              <Modal.Header>
                <Modal.Heading>{webhook ? t("edit") : t("add")}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4">
                <TextField isRequired value={name} onChange={setName}>
                  <Label>{t("name")}</Label>
                  <Input maxLength={100} />
                </TextField>
                <TextField isRequired type="url" value={url} onChange={setUrl}>
                  <Label>{t("url")}</Label>
                  <Input maxLength={500} placeholder="https://…" />
                </TextField>
                <TextField
                  isRequired={!webhook}
                  type="password"
                  value={secret}
                  onChange={setSecret}
                >
                  <Label>{t("secret")}</Label>
                  <Input autoComplete="new-password" maxLength={100} />
                  {webhook ? <span className="text-muted text-sm">{t("keepSecret")}</span> : null}
                </TextField>
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-sm font-medium">{t("subscribedEvents")}</legend>
                  {webhookEvents.map((event) => (
                    <Checkbox
                      key={event}
                      isSelected={events.includes(event)}
                      onChange={(selected) =>
                        setEvents((current) =>
                          selected
                            ? [...current, event]
                            : current.filter((value) => value !== event)
                        )
                      }
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Label>{t(`events.${event}`)}</Label>
                      </Checkbox.Content>
                    </Checkbox>
                  ))}
                </fieldset>
                <Checkbox isSelected={isActive} onChange={setActive}>
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Label>{t("enabled")}</Label>
                  </Checkbox.Content>
                </Checkbox>
                {error ? (
                  <p role="alert" className="text-danger text-sm">
                    {error}
                  </p>
                ) : null}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" isDisabled={isBusy} onPress={close}>
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  isPending={isBusy}
                  isDisabled={!name.trim() || !url.trim() || (!webhook && !secret.trim())}
                >
                  {t("save")}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
