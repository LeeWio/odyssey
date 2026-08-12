"use client";

import { ArrowRotateRight, BookOpen } from "@gravity-ui/icons";
import { Button, Card, Skeleton, Typography } from "@heroui/react";
import { useGetPublicColumnsQuery } from "@/lib/features/column";
import { ColumnCard } from "./column-card";

export function ColumnsIndex() {
  const { data: columns = [], error, isLoading, refetch } = useGetPublicColumnsQuery();

  return (
    <div className="bg-background min-h-[100dvh] px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        <header className="max-w-3xl">
          <div className="text-muted flex items-center gap-2 font-mono text-xs font-semibold uppercase">
            <BookOpen aria-hidden="true" className="size-4" />
            Columns
          </div>
          <Typography type="h1" weight="bold" className="mt-5 leading-[1.02] text-balance">
            Follow an idea beyond one essay.
          </Typography>
          <Typography color="muted" type="body" className="mt-5 max-w-xl">
            Focused reading paths collecting the work, context, and questions that belong together.
          </Typography>
        </header>

        <section aria-label="Published columns" className="mt-14">
          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Card key={index} variant="secondary" className="overflow-hidden p-0">
                  <Skeleton className="aspect-[16/9] w-full rounded-none" />
                  <Card.Header>
                    <Skeleton className="h-5 w-20 rounded-lg" />
                    <Skeleton className="h-7 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-lg" />
                  </Card.Header>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card variant="secondary" className="items-start gap-4 p-7">
              <Card.Header>
                <Card.Title>Columns are unavailable</Card.Title>
                <Card.Description>Try loading this page again in a moment.</Card.Description>
              </Card.Header>
              <Button size="sm" variant="secondary" onPress={() => refetch()}>
                <ArrowRotateRight aria-hidden="true" className="size-4" />
                Retry
              </Button>
            </Card>
          ) : columns.length === 0 ? (
            <Card variant="secondary" className="items-start gap-3 p-7">
              <Card.Header>
                <Card.Title>No columns published yet</Card.Title>
                <Card.Description>
                  New reading paths will appear here when they are ready.
                </Card.Description>
              </Card.Header>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {columns.map((column) => (
                <ColumnCard key={column.id} column={column} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
