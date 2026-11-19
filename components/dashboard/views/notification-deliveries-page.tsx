"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";

import { getApiErrorMessage } from "@/lib/api";
import {
  DELIVERY_STATUSES,
  useGetNotificationDeliveryQuery,
  useGetNotificationDeliveryRetriesQuery,
  useListNotificationDeliveriesQuery,
  useRetryNotificationDeliveryMutation,
  type DeliveryStatus,
  type NotificationDelivery,
} from "@/lib/features/notification/notification-delivery-api";
import { parseRelativeDate } from "@/lib/relative-time";

const STATUS_COLORS: Record<DeliveryStatus, "default" | "warning" | "success" | "danger"> = {
  QUEUED: "default",
  SENDING: "warning",
  FAILED: "danger",
  DELIVERED: "success",
  ABANDONED: "danger",
};

export function NotificationDeliveriesPage() {
  const t = useTranslations("NotificationDelivery");
  const format = useFormatter();
  const [status, setStatus] = useState<DeliveryStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [retryId, setRetryId] = useState<number | null>(null);
  const listQuery = useListNotificationDeliveriesQuery({
    page,
    ...(status === "ALL" ? {} : { status }),
  });
  const detailQuery = useGetNotificationDeliveryQuery(selectedId ?? 0, {
    skip: selectedId === null,
  });
  const auditQuery = useGetNotificationDeliveryRetriesQuery(
    { id: selectedId ?? 0, page: 0 },
    { skip: selectedId === null }
  );
  const selected = detailQuery.data ?? listQuery.data?.list.find((item) => item.id === selectedId);

  return (
    <section className="flex min-w-0 flex-col gap-6 px-4 pt-8 pb-10 md:px-6 xl:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-foreground text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted max-w-2xl text-sm">{t("description")}</p>
      </header>
      <Card>
        <Card.Header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Card.Title className="text-base">{t("records")}</Card.Title>
            <Card.Description>{t("privacy")}</Card.Description>
          </div>
          <Select
            aria-label={t("filter")}
            className="w-full sm:w-52"
            value={status}
            onChange={(value) => {
              setStatus((value as DeliveryStatus | "ALL") || "ALL");
              setPage(0);
            }}
          >
            <Label>{t("filter")}</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="ALL" textValue={t("allStatuses")}>
                  {t("allStatuses")}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {DELIVERY_STATUSES.map((item) => (
                  <ListBox.Item key={item} id={item} textValue={t(`status.${item}`)}>
                    {t(`status.${item}`)}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </Card.Header>
        <Card.Content>
          {listQuery.isLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Spinner aria-label={t("loading")} />
            </div>
          ) : listQuery.isError ? (
            <EmptyState>
              <EmptyState.Header>
                <EmptyState.Title>{t("loadFailed")}</EmptyState.Title>
              </EmptyState.Header>
              <EmptyState.Content>
                <Button onPress={() => void listQuery.refetch()} variant="secondary">
                  {t("retry")}
                </Button>
              </EmptyState.Content>
            </EmptyState>
          ) : !listQuery.data?.list.length ? (
            <EmptyState>
              <EmptyState.Header>
                <EmptyState.Title>{t("empty")}</EmptyState.Title>
              </EmptyState.Header>
              <EmptyState.Content>
                <p className="text-muted text-sm">{t("emptyDescription")}</p>
              </EmptyState.Content>
            </EmptyState>
          ) : (
            <div className="flex flex-col gap-3">
              <ul className="divide-separator divide-y">
                {listQuery.data.list.map((delivery) => (
                  <DeliveryRow
                    key={delivery.id}
                    delivery={delivery}
                    onOpen={() => setSelectedId(delivery.id)}
                    onRetry={() => setRetryId(delivery.id)}
                    t={t}
                    format={format}
                  />
                ))}
              </ul>
              <Pagination
                page={page}
                totalPages={listQuery.data.totalPages}
                disabled={listQuery.isFetching}
                onPageChange={setPage}
                previousLabel={t("previous")}
                nextLabel={t("next")}
                pageLabel={t("page", { page: page + 1 })}
              />
            </div>
          )}
        </Card.Content>
      </Card>
      {selectedId !== null ? (
        <DeliveryDetails
          id={selectedId}
          delivery={selected}
          isLoading={detailQuery.isLoading}
          error={detailQuery.isError ? t("loadFailed") : null}
          retries={auditQuery.data?.list ?? []}
          auditLoading={auditQuery.isLoading}
          onClose={() => setSelectedId(null)}
          onRetry={() => setRetryId(selectedId)}
          t={t}
          format={format}
        />
      ) : null}
      {retryId !== null ? (
        <RetryDialog
          deliveryId={retryId}
          close={() => setRetryId(null)}
          onComplete={() => {
            setRetryId(null);
            setSelectedId(retryId);
          }}
          t={t}
        />
      ) : null}
    </section>
  );
}

function DeliveryRow({
  delivery,
  onOpen,
  onRetry,
  t,
  format,
}: {
  delivery: NotificationDelivery;
  onOpen: () => void;
  onRetry: () => void;
  t: ReturnType<typeof useTranslations<"NotificationDelivery">>;
  format: ReturnType<typeof useFormatter>;
}) {
  const createdAt = parseRelativeDate(delivery.createdAt);
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        className="flex min-w-0 flex-col items-start gap-1 text-left"
        onClick={onOpen}
      >
        <span className="text-foreground font-medium">
          {t("deliveryNumber", { id: delivery.id })}
        </span>
        <span className="text-muted text-sm">
          {delivery.channel} · {delivery.attempts}/{delivery.maxAttempts} {t("attempts")}
        </span>
        <time className="text-muted text-xs" dateTime={delivery.createdAt}>
          {createdAt
            ? format.dateTime(createdAt, { dateStyle: "medium", timeStyle: "short" })
            : delivery.createdAt}
        </time>
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <Chip color={STATUS_COLORS[delivery.status]} size="sm" variant="soft">
          {t(`status.${delivery.status}`)}
        </Chip>
        {delivery.retryable ? (
          <Button size="sm" variant="secondary" onPress={onRetry}>
            {t("retryDelivery")}
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onPress={onOpen}>
          {t("details")}
        </Button>
      </div>
    </li>
  );
}

function DeliveryDetails({
  id,
  delivery,
  isLoading,
  error,
  retries,
  auditLoading,
  onClose,
  onRetry,
  t,
  format,
}: {
  id: number;
  delivery?: NotificationDelivery;
  isLoading: boolean;
  error: string | null;
  retries: Array<{
    id: number;
    requestedBy: string;
    reason: string;
    previousStatus: DeliveryStatus;
    previousMaxAttempts: number;
    newMaxAttempts: number;
    attemptsAtRetry: number;
    createdAt: string;
  }>;
  auditLoading: boolean;
  onClose: () => void;
  onRetry: () => void;
  t: ReturnType<typeof useTranslations<"NotificationDelivery">>;
  format: ReturnType<typeof useFormatter>;
}) {
  return (
    <Modal>
      <Modal.Backdrop
        isOpen
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{t("deliveryNumber", { id })}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-5">
              {isLoading ? (
                <Spinner aria-label={t("loading")} />
              ) : error ? (
                <p className="text-danger text-sm">{error}</p>
              ) : delivery ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip color={STATUS_COLORS[delivery.status]} variant="soft">
                      {t(`status.${delivery.status}`)}
                    </Chip>
                    <span className="text-muted text-sm">{delivery.channel}</span>
                    {delivery.retryable ? (
                      <Button size="sm" variant="secondary" onPress={onRetry}>
                        {t("retryDelivery")}
                      </Button>
                    ) : null}
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <Detail
                      label={t("attempts")}
                      value={`${delivery.attempts}/${delivery.maxAttempts}`}
                    />
                    <Detail
                      label={t("created")}
                      value={formatTimestamp(delivery.createdAt, format)}
                    />
                    <Detail
                      label={t("nextAttempt")}
                      value={formatTimestamp(delivery.nextAttemptAt, format)}
                    />
                    <Detail
                      label={t("deliveredAt")}
                      value={formatTimestamp(delivery.deliveredAt, format)}
                    />
                  </dl>
                  {delivery.lastError ? (
                    <p className="bg-danger-soft text-danger rounded-xl p-3 text-sm">
                      {delivery.lastError}
                    </p>
                  ) : null}
                  <div className="flex flex-col gap-2">
                    <h3 className="font-medium">{t("retryHistory")}</h3>
                    {auditLoading ? (
                      <Spinner aria-label={t("loading")} />
                    ) : retries.length === 0 ? (
                      <p className="text-muted text-sm">{t("noRetryHistory")}</p>
                    ) : (
                      <ul className="divide-separator divide-y text-sm">
                        {retries.map((retry) => (
                          <li key={retry.id} className="flex flex-col gap-1 py-3">
                            <span>{retry.reason}</span>
                            <span className="text-muted">
                              {retry.requestedBy} · {formatTimestamp(retry.createdAt, format)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              ) : null}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={onClose}>
                {t("close")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function RetryDialog({
  deliveryId,
  close,
  onComplete,
  t,
}: {
  deliveryId: number;
  close: () => void;
  onComplete: () => void;
  t: ReturnType<typeof useTranslations<"NotificationDelivery">>;
}) {
  const [reason, setReason] = useState("");
  const [retry, state] = useRetryNotificationDeliveryMutation();
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    if (!reason.trim() || state.isLoading) return;
    setError(null);
    try {
      await retry({
        id: deliveryId,
        requestId: crypto.randomUUID(),
        reason: reason.trim(),
      }).unwrap();
      onComplete();
    } catch (failure) {
      setError(getApiErrorMessage(failure, t("retryFailed")));
    }
  }
  return (
    <Modal>
      <Modal.Backdrop
        isOpen
        onOpenChange={(open) => {
          if (!open && !state.isLoading) close();
        }}
        isDismissable={!state.isLoading}
      >
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{t("retryTitle")}</Modal.Heading>
              <p className="text-muted text-sm">{t("retryDescription")}</p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <TextField isRequired>
                <Label>{t("reason")}</Label>
                <TextArea
                  rows={4}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </TextField>
              {error ? (
                <p role="alert" className="text-danger text-sm">
                  {error}
                </p>
              ) : null}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" isDisabled={state.isLoading} onPress={close}>
                {t("cancel")}
              </Button>
              <Button
                isPending={state.isLoading}
                isDisabled={!reason.trim()}
                onPress={() => void submit()}
              >
                {t("retryDelivery")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}
function Pagination({
  page,
  totalPages,
  disabled,
  onPageChange,
  previousLabel,
  nextLabel,
  pageLabel,
}: {
  page: number;
  totalPages: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={pageLabel} className="flex items-center justify-between gap-3">
      <Button
        size="sm"
        variant="secondary"
        isDisabled={disabled || page === 0}
        onPress={() => onPageChange(page - 1)}
      >
        {previousLabel}
      </Button>
      <span className="text-muted text-sm">{pageLabel}</span>
      <Button
        size="sm"
        variant="secondary"
        isDisabled={disabled || page >= totalPages - 1}
        onPress={() => onPageChange(page + 1)}
      >
        {nextLabel}
      </Button>
    </nav>
  );
}
function formatTimestamp(value: string | null, format: ReturnType<typeof useFormatter>) {
  if (!value) return "—";
  const date = parseRelativeDate(value);
  return date ? format.dateTime(date, { dateStyle: "medium", timeStyle: "short" }) : value;
}
