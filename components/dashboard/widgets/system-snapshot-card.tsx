"use client";

import { Button, Card } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";

import { useGetSystemSnapshotQuery } from "@/lib/features/openapi/openapi-api";

type SnapshotGroup = Record<string, number>;

type SystemSnapshot = {
  jvm?: SnapshotGroup;
  http?: SnapshotGroup;
  cache?: SnapshotGroup;
  mq?: SnapshotGroup;
};

export function SystemSnapshotCard() {
  const query = useGetSystemSnapshotQuery();
  const snapshot = query.data as SystemSnapshot | undefined;

  return (
    <Card className="rounded-2xl">
      <Card.Header className="flex-col items-start gap-1">
        <Card.Title className="text-base">System snapshot</Card.Title>
        <Card.Description>JVM, HTTP, cache, and queue counters from this process.</Card.Description>
      </Card.Header>
      <Card.Content>
        {query.isLoading ? (
          <p className="text-muted text-sm">Loading the snapshot.</p>
        ) : query.isError || !snapshot ? (
          <EmptyState>
            <EmptyState.Header>
              <EmptyState.Title>Snapshot is unavailable</EmptyState.Title>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => query.refetch()} size="sm" variant="secondary">
                Try again
              </Button>
            </EmptyState.Content>
          </EmptyState>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Memory" value={memory(snapshot.jvm)} />
            <Stat label="Threads" value={number(snapshot.jvm?.liveThreads)} />
            <Stat label="HTTP requests" value={number(snapshot.http?.totalRequests)} />
            <Stat label="Avg response" value={`${number(snapshot.http?.avgResponseTimeMs)} ms`} />
            <Stat label="Cache hit rate" value={`${number(snapshot.cache?.l1HitRate)}%`} />
            <Stat label="Queue errors" value={number(snapshot.mq?.canalProcessingErrors)} />
          </dl>
        )}
      </Card.Content>
    </Card>
  );
}

function memory(jvm: SnapshotGroup | undefined) {
  if (!jvm) return "—";
  return `${number(jvm.memoryUsedMb)} / ${number(jvm.memoryMaxMb)} MB`;
}

function number(value: number | undefined) {
  return (value ?? 0).toLocaleString("en-US");
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
