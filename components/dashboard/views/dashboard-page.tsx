"use client";

import { useTranslations } from "next-intl";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";

import { DashboardToolbar } from "../widgets/dashboard-toolbar";
import { EmployeesTable } from "../widgets/employees-table";
import { KpiRow } from "../widgets/kpi-row";
import { ContentOperationsCard } from "../widgets/content-operations-card";
import { ContentWorkflowCard } from "../widgets/content-workflow-card";
import { NotificationDeliveryCard } from "../widgets/notification-delivery-card";
import { SystemSnapshotCard } from "../widgets/system-snapshot-card";

export function DashboardPage() {
  const t = useTranslations("Dashboard");

  return (
    <PageContainer className="flex flex-col gap-6 pt-8 pb-10">
      <PageHeader title={t("overview.title")} />
      <DashboardToolbar />
      <KpiRow />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ContentOperationsCard />
        <SystemSnapshotCard />
      </div>
      <NotificationDeliveryCard />
      <ContentWorkflowCard />
      <EmployeesTable />
    </PageContainer>
  );
}
