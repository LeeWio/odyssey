"use client";

import { Button, Chip, SearchField, Spinner } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { useState } from "react";

import { useGetOperationLogsQuery, type OperationLog } from "@/lib/features/audit-log";

const PAGE_SIZE = 20;

export function AuditLogsPage() {
  const [username, setUsername] = useState("");
  const [operation, setOperation] = useState("");
  const [page, setPage] = useState(0);
  const query = useGetOperationLogsQuery({
    username,
    operation,
    page,
    size: PAGE_SIZE,
  });
  const logs = query.data?.list ?? [];
  const totalPages = query.data?.totalPages ?? 0;

  return (
    <section
      aria-labelledby="audit-logs-heading"
      className="mx-auto flex min-h-full max-w-7xl flex-col gap-4 px-5 pt-8 pb-10"
    >
      <div className="flex flex-col gap-1">
        <h1 id="audit-logs-heading" className="text-foreground text-2xl font-semibold">
          Audit logs
        </h1>
        <p className="text-muted text-sm">
          Recorded admin operations. Status 1 succeeded and status 0 failed.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchField
          aria-label="Filter by username"
          className="w-full sm:max-w-xs"
          value={username}
          onChange={(value) => {
            setUsername(value);
            setPage(0);
          }}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Username" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <SearchField
          aria-label="Filter by operation"
          className="w-full sm:max-w-xs"
          value={operation}
          onChange={(value) => {
            setOperation(value);
            setPage(0);
          }}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Operation" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      {query.isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : query.isError ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>Audit logs are unavailable</EmptyState.Title>
            <EmptyState.Description>The operation log request failed.</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button onPress={() => query.refetch()} variant="secondary">
              Try again
            </Button>
          </EmptyState.Content>
        </EmptyState>
      ) : logs.length === 0 ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>No operations recorded</EmptyState.Title>
            <EmptyState.Description>
              Nothing matches this filter in the operation log.
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="divide-separator border-separator divide-y rounded-2xl border">
            {logs.map((log) => (
              <LogRow key={log.id} log={log} />
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted text-xs tabular-nums">
              Page {page + 1} of {Math.max(totalPages, 1)}
            </p>
            <div className="flex gap-2">
              <Button
                isDisabled={page === 0 || query.isFetching}
                onPress={() => setPage((current) => Math.max(0, current - 1))}
                size="sm"
                variant="secondary"
              >
                Previous
              </Button>
              <Button
                isDisabled={page + 1 >= totalPages || query.isFetching}
                onPress={() => setPage((current) => current + 1)}
                size="sm"
                variant="secondary"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function LogRow({ log }: { log: OperationLog }) {
  const succeeded = log.status === 1;
  const when = log.createdAt
    ? new Date(log.createdAt).toLocaleString("en-US", {
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
      })
    : "";

  return (
    <li className="flex flex-col gap-1 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-foreground text-sm font-medium">
          {log.description || log.requestUrl || "Operation"}
        </span>
        <Chip color={succeeded ? "success" : "danger"} size="sm" variant="soft">
          {succeeded ? "Succeeded" : "Failed"}
        </Chip>
      </div>
      <p className="text-muted text-xs">
        {[log.username, log.requestMethod, when].filter(Boolean).join(" · ")}
        {typeof log.duration === "number" ? ` · ${log.duration} ms` : ""}
      </p>
      {log.errorMessage ? <p className="text-danger text-xs">{log.errorMessage}</p> : null}
    </li>
  );
}
