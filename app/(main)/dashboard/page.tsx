"use client";

import { DashboardPage } from "@/components/dashboard/views/dashboard-page";
import { useMounted } from "@mantine/hooks";
import { Skeleton } from "@heroui/react";
import { PageContainer } from "@/components/layout/page-container";

export default function DedicatedDashboardRoute() {
  const mounted = useMounted();

  if (!mounted) {
    return (
      <PageContainer aria-busy="true" className="flex flex-col gap-6 pt-28 pb-10">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </PageContainer>
    );
  }

  return (
    <div className="bg-background min-h-[100dvh] w-full pt-20 pb-16">
      <DashboardPage />
    </div>
  );
}
