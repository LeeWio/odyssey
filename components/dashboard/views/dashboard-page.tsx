"use client";

import { Chip } from "@heroui/react";

import { DashboardToolbar } from "../widgets/dashboard-toolbar";
import { EmployeesTable } from "../widgets/employees-table";
import { KpiRow } from "../widgets/kpi-row";
import { ContentOperationsCard } from "../widgets/content-operations-card";
import { ContentWorkflowCard } from "../widgets/content-workflow-card";
import { SystemSnapshotCard } from "../widgets/system-snapshot-card";

export function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-4 pb-10">
      <div className="flex flex-col gap-2">
        <Chip className="w-fit" size="sm" variant="soft">
          Admin overview
        </Chip>
        <p className="text-muted text-sm">
          Counts, the editorial queue, and the process snapshot come from the admin dashboard and
          observability APIs.
        </p>
      </div>
      <DashboardToolbar />
      <KpiRow />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ContentOperationsCard />
        <SystemSnapshotCard />
      </div>
      <ContentWorkflowCard />
      <EmployeesTable />
    </div>
  );
}
