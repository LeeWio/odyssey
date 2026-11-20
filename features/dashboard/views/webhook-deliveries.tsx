"use client";

import { Button, Chip, Modal, Spinner } from "@heroui/react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { getApiErrorMessage } from "@/lib/api";
import {
  useGetAdminWebhookLogsQuery,
  useRetryAdminWebhookDeliveryMutation,
  useSendAdminWebhookTestMutation,
  type Webhook,
} from "@/lib/features/dashboard/webhook-api";

export function WebhookDeliveries({
  webhook,
  close,
  portal,
}: {
  webhook: Webhook;
  close: () => void;
  portal: HTMLElement;
}) {
  const t = useTranslations("Webhooks");
  const format = useFormatter();
  const [page, setPage] = useState(0);
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryStatus, setRetryStatus] = useState("");
  const [retryDelivery] = useRetryAdminWebhookDeliveryMutation();
  const [send, sending] = useSendAdminWebhookTestMutation();
  const logs = useGetAdminWebhookLogsQuery(
    { id: webhook.id, page },
    { pollingInterval: polling ? 2000 : 0, refetchOnMountOrArgChange: true }
  );
  const data = logs.currentData;
  const testResult = deliveryId
    ? data?.list.find((entry) => entry.deliveryId === deliveryId)
    : undefined;

  useEffect(() => {
    if (!polling) return;
    const timer = window.setTimeout(
      () => setPolling(false),
      testResult && !testResult.inProgress ? 0 : 30000
    );
    return () => window.clearTimeout(timer);
  }, [polling, deliveryId, testResult]);

  async function sendTest() {
    if (sending.isLoading || polling || retryingId) return;
    setError("");
    setRetryStatus("");
    try {
      const receipt = await send(webhook.id).unwrap();
      setPage(0);
      setDeliveryId(receipt.deliveryId);
      setPolling(true);
    } catch (failure) {
      setError(getApiErrorMessage(failure, t("testFailed")));
    }
  }

  async function retry(deliveryId: string, attemptCount: number) {
    if (retryingId) return;
    setRetryingId(deliveryId);
    setRetryStatus("");
    setError("");
    setDeliveryId(null);
    setPolling(false);
    try {
      const result = await retryDelivery({ deliveryId, attemptCount }).unwrap();
      setRetryStatus(result.isSuccess ? t("retryDelivered") : t("retryDeliveryFailed"));
    } catch (failure) {
      const changed =
        typeof failure === "object" &&
        failure !== null &&
        "status" in failure &&
        failure.status === 409;
      setError(t(changed ? "deliveryChanged" : "retryFailed"));
    } finally {
      await logs.refetch();
      setRetryingId(null);
    }
  }

  const busy = sending.isLoading || retryingId !== null;
  const lastPage = Math.max(0, (data?.totalPages ?? 1) - 1);

  return (
    <Modal>
      <Modal.Backdrop
        isOpen
        onOpenChange={(open) => {
          if (!open && !busy) close();
        }}
        isDismissable={!busy}
        isKeyboardDismissDisabled={busy}
        UNSTABLE_portalContainer={portal}
      >
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{t("deliveriesFor", { name: webhook.name })}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  isPending={sending.isLoading}
                  isDisabled={!webhook.isActive || polling || retryingId !== null}
                  onPress={() => void sendTest()}
                >
                  {t("sendTest")}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={logs.isFetching || retryingId !== null}
                  onPress={() => void logs.refetch()}
                >
                  {t("refresh")}
                </Button>
              </div>
              {!webhook.isActive ? <p className="text-muted text-sm">{t("enableToTest")}</p> : null}
              {deliveryId && page === 0 ? (
                <p role="status" className="text-sm">
                  {testResult && !testResult.inProgress
                    ? testResult.isSuccess
                      ? t("testDelivered")
                      : t("testDeliveryFailed")
                    : polling
                      ? t("testQueued")
                      : t("testWaiting")}
                </p>
              ) : null}
              {retryStatus ? (
                <p role="status" className="text-sm">
                  {retryStatus}
                </p>
              ) : null}
              {error ? (
                <p role="alert" className="text-danger text-sm">
                  {error}
                </p>
              ) : null}
              {logs.isError ? (
                <p role="alert" className="text-danger text-sm">
                  {t("logsFailed")}
                </p>
              ) : !data ? (
                <Spinner aria-label={t("loadingDeliveries")} />
              ) : data.list.length === 0 ? (
                <p className="text-muted text-sm">{t("noDeliveries")}</p>
              ) : (
                <ul className="divide-separator divide-y">
                  {data.list.map((entry) => {
                    const attemptCount = entry.attemptCount;
                    return (
                      <li
                        key={entry.deliveryId}
                        className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                      >
                        <div className="flex flex-col gap-1">
                          <span>{entry.event === "ping" ? t("testEvent") : entry.event}</span>
                          {attemptCount != null ? (
                            <span className="text-muted">
                              {t("attempts", { count: attemptCount })}
                            </span>
                          ) : null}
                          <time className="text-muted" dateTime={entry.createdAt}>
                            {format.dateTime(new Date(entry.createdAt), {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </time>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {entry.responseCode ? <span>HTTP {entry.responseCode}</span> : null}
                          <Chip
                            size="sm"
                            color={
                              entry.inProgress ? "default" : entry.isSuccess ? "success" : "danger"
                            }
                            variant="soft"
                          >
                            {entry.inProgress
                              ? t("inProgress")
                              : entry.isSuccess
                                ? t("delivered")
                                : t("failed")}
                          </Chip>
                          {webhook.isActive &&
                          !entry.isSuccess &&
                          !entry.inProgress &&
                          attemptCount != null ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              isPending={retryingId === entry.deliveryId}
                              isDisabled={
                                (retryingId !== null && retryingId !== entry.deliveryId) ||
                                sending.isLoading ||
                                polling
                              }
                              onPress={() => void retry(entry.deliveryId, attemptCount)}
                            >
                              {t("retryDelivery")}
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {lastPage > 0 ? (
                <nav
                  aria-label={t("deliveries")}
                  className="flex items-center justify-between gap-2"
                >
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={page === 0 || logs.isFetching || polling || retryingId !== null}
                    onPress={() => setPage(page - 1)}
                  >
                    {t("previous")}
                  </Button>
                  <span className="text-muted text-sm">{t("page", { page: page + 1 })}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={
                      page >= lastPage || logs.isFetching || polling || retryingId !== null
                    }
                    onPress={() => setPage(page + 1)}
                  >
                    {t("next")}
                  </Button>
                </nav>
              ) : null}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" isDisabled={busy} onPress={close}>
                {t("close")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
