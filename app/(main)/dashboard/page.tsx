"use client";

import { DashboardPage } from "@/components/dashboard/views/dashboard-page";
import { useMounted } from "@mantine/hooks";
import { Skeleton } from "@heroui/react";

export default function DedicatedDashboardRoute() {
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 pt-28 pb-10">
        <Skeleton className="h-[200px] w-full rounded-2xl" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-[100dvh] w-full pt-20 pb-16">
      <DashboardPage />
    </div>
  );
}
