"use client";

import { Card, Switch } from "@heroui/react";
import { useState } from "react";
import { useGetVisitorsQuery } from "@/lib/features/dashboard";

function formatWhen(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.replace("T", " ").slice(0, 16);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function placeOf(visitor: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
}): string {
  return [visitor.city, visitor.region, visitor.country].filter(Boolean).join(" · ") || "—";
}

export function VisitorsCard() {
  const [includeOwner, setIncludeOwner] = useState(false);
  const { data, isFetching } = useGetVisitorsQuery({ days: 7, includeOwner });
  const visitors = data?.list ?? [];

  return (
    <Card>
      <Card.Header className="flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Card.Title className="text-base">Visitors</Card.Title>
          <Card.Description>
            Last 7 days · {data?.total ?? 0} visitors
            {isFetching ? " · refreshing" : ""}
          </Card.Description>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            aria-label="Include my visits"
            isSelected={includeOwner}
            onChange={setIncludeOwner}
            size="sm"
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
          <span className="text-muted text-xs">Include my visits</span>
        </div>
      </Card.Header>
      <Card.Content className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2 pr-3 font-medium">IP</th>
              <th className="py-2 pr-3 font-medium">Place</th>
              <th className="py-2 pr-3 font-medium">Client</th>
              <th className="py-2 pr-3 font-medium">Device</th>
              <th className="py-2 pr-3 font-medium">Last seen</th>
              <th className="py-2 pr-3 font-medium">Views</th>
              <th className="py-2 font-medium">Pages</th>
            </tr>
          </thead>
          <tbody>
            {visitors.length === 0 ? (
              <tr>
                <td className="text-muted py-6" colSpan={7}>
                  No reader page views in this window yet. Counts start after the page-view
                  collector is live.
                </td>
              </tr>
            ) : (
              visitors.map((visitor) => (
                <tr key={visitor.visitorHash} className="border-border/60 border-t">
                  <td className="py-2 pr-3 font-mono text-xs">{visitor.ipAddress || "—"}</td>
                  <td className="py-2 pr-3">{placeOf(visitor)}</td>
                  <td className="py-2 pr-3">
                    {visitor.clientName || "Unknown"}
                    {visitor.osName ? ` · ${visitor.osName}` : ""}
                  </td>
                  <td className="py-2 pr-3">{visitor.deviceType || "—"}</td>
                  <td className="py-2 pr-3 tabular-nums">{formatWhen(visitor.lastSeen)}</td>
                  <td className="py-2 pr-3 tabular-nums">{visitor.views}</td>
                  <td className="py-2 tabular-nums">{visitor.pages}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card.Content>
    </Card>
  );
}
