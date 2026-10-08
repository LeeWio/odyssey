"use client";

import { Button, Card, Chip, Spinner } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { useState } from "react";

import {
  useGetStorageInventoryQuery,
  useVerifyStorageIntegrityQuery,
} from "@/lib/features/openapi/openapi-api";

type StorageInventory = {
  providerType?: string;
  assetCount?: number;
  logicalBytes?: number;
  totalReferences?: number;
  oldestAssetAt?: string;
  newestAssetAt?: string;
};

type MissingObject = {
  assetId?: number;
  objectKind?: string;
};

type StorageIntegrity = {
  checkedAssetCount?: number;
  missingObjectCount?: number;
  totalActiveAssetCount?: number;
  totalPages?: number;
  missingObjects?: MissingObject[];
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

function formatWhen(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function StorageHealth() {
  const inventory = useGetStorageInventoryQuery();
  const [page, setPage] = useState(0);
  const integrity = useVerifyStorageIntegrityQuery({ pageable: { page, size: 100 } });
  const stock = inventory.data as StorageInventory | undefined;
  const check = integrity.data as StorageIntegrity | undefined;
  const missing = check?.missingObjects ?? [];
  const totalPages = check?.totalPages ?? 0;

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-col items-start gap-1">
        <Card.Title className="text-base">Stored assets</Card.Title>
        <Card.Description>
          Counts come from file metadata. The check compares one page of assets with the storage
          provider.
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {inventory.isLoading ? (
          <div className="flex min-h-16 items-center justify-center">
            <Spinner />
          </div>
        ) : inventory.isError ? (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Title>Inventory is unavailable</EmptyState.Title>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => inventory.refetch()} size="sm" variant="secondary">
                Try again
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Stat label="Provider" value={stock?.providerType || "—"} />
            <Stat label="Assets" value={(stock?.assetCount ?? 0).toLocaleString("en-US")} />
            <Stat label="Stored" value={formatBytes(stock?.logicalBytes ?? 0)} />
            <Stat
              label="References"
              value={(stock?.totalReferences ?? 0).toLocaleString("en-US")}
            />
            <Stat label="Oldest" value={formatWhen(stock?.oldestAssetAt)} />
            <Stat label="Newest" value={formatWhen(stock?.newestAssetAt)} />
          </dl>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Integrity</p>
            {integrity.isFetching ? <Spinner size="sm" /> : null}
          </div>
          {integrity.isError ? (
            <Button onPress={() => integrity.refetch()} size="sm" variant="secondary">
              Retry check
            </Button>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Chip
                  color={(check?.missingObjectCount ?? 0) > 0 ? "danger" : "success"}
                  size="sm"
                  variant="soft"
                >
                  {(check?.missingObjectCount ?? 0).toLocaleString("en-US")} missing
                </Chip>
                <span className="text-muted text-xs">
                  Checked {(check?.checkedAssetCount ?? 0).toLocaleString("en-US")} of{" "}
                  {(check?.totalActiveAssetCount ?? 0).toLocaleString("en-US")}
                </span>
              </div>
              {missing.length > 0 ? (
                <ul className="text-muted flex flex-col gap-1 text-xs">
                  {missing.slice(0, 8).map((item) => (
                    <li key={`${item.assetId}-${item.objectKind}`}>
                      Asset {item.assetId} · {item.objectKind || "object"}
                    </li>
                  ))}
                </ul>
              ) : null}
              {totalPages > 1 ? (
                <div className="flex gap-2">
                  <Button
                    isDisabled={page === 0 || integrity.isFetching}
                    onPress={() => setPage((current) => Math.max(0, current - 1))}
                    size="sm"
                    variant="secondary"
                  >
                    Previous
                  </Button>
                  <Button
                    isDisabled={page + 1 >= totalPages || integrity.isFetching}
                    onPress={() => setPage((current) => current + 1)}
                    size="sm"
                    variant="secondary"
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
