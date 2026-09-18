"use client";

import { AlertDialog, Button, Label, ListBox, Select, Spinner, Tabs } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";

import { CommentSystem } from "@/components/comment";
import {
  useGetCommentGovernanceOverviewQuery,
  useRepairCommentCountersMutation,
} from "@/lib/features/comment";
import { useGetPublicPostsQuery } from "@/lib/features/post";
import { CommentHighRiskPanel } from "./comments/high-risk-panel";
import { CommentLogsPanel } from "./comments/logs-panel";
import { CommentModerationPanel } from "./comments/moderation-panel";
import { CommentOverviewCards } from "./comments/overview-cards";
import { CommentReportsPanel } from "./comments/reports-panel";

export function CommentsPage() {
  const [activeTab, setActiveTab] = useState("moderation");
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [repairOpen, setRepairOpen] = useState(false);

  const { data: overview, isLoading: isOverviewLoading } = useGetCommentGovernanceOverviewQuery();
  const { data: postsData, isLoading: isPostsLoading } = useGetPublicPostsQuery({
    page: 0,
    size: 50,
  });
  const [repairCounters, { isLoading: isRepairing }] = useRepairCommentCountersMutation();
  const posts = postsData?.list ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <div className="border-border flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">Comment Governance</h1>
          <p className="text-muted text-sm">
            Moderate threads, review reports and risk, inspect logs, and repair counters.
          </p>
        </div>
        <Button size="sm" variant="secondary" onPress={() => setRepairOpen(true)}>
          <Icon icon="gravity-ui:arrow-rotate-right" className="size-4" aria-hidden="true" />
          Repair counters
        </Button>
      </div>

      <CommentOverviewCards overview={overview} isLoading={isOverviewLoading} />

      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(String(key))}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Comment governance views">
            <Tabs.Tab id="moderation">
              Moderation
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="reports">
              Reports
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="high-risk">
              High risk
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="logs">
              Logs
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="preview">
              Thread preview
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {activeTab === "moderation" ? <CommentModerationPanel /> : null}
      {activeTab === "reports" ? <CommentReportsPanel /> : null}
      {activeTab === "high-risk" ? <CommentHighRiskPanel /> : null}
      {activeTab === "logs" ? <CommentLogsPanel /> : null}

      {activeTab === "preview" ? (
        <div className="flex flex-col gap-6">
          <Select
            className="w-full sm:w-[320px]"
            placeholder={
              isPostsLoading ? "Loading posts..." : "Select a post to preview the comment thread"
            }
            isDisabled={isPostsLoading}
            value={selectedPostId?.toString() || null}
            onChange={(val) => setSelectedPostId(val ? Number(val) : null)}
          >
            <Label>Selected Post</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {posts.map((post) => (
                  <ListBox.Item key={post.id} id={post.id.toString()} textValue={post.title}>
                    {post.title}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          {selectedPostId ? (
            <CommentSystem key={selectedPostId} postId={selectedPostId}>
              {({ commentList, commentInput, totalCount, newCount, isLoadingNew, onLoadNew }) => (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold">Comment Thread</h3>
                    <span className="text-muted text-sm tabular-nums">
                      {totalCount} {totalCount === 1 ? "comment" : "comments"}
                    </span>
                  </div>
                  {newCount > 0 ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="self-start"
                      isPending={isLoadingNew}
                      onPress={onLoadNew}
                    >
                      View {newCount} new
                    </Button>
                  ) : null}
                  {commentList}
                  {commentInput}
                </div>
              )}
            </CommentSystem>
          ) : null}
        </div>
      ) : null}

      <AlertDialog>
        <AlertDialog.Backdrop isOpen={repairOpen} onOpenChange={setRepairOpen}>
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md" aria-label="Repair comment counters">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="warning" />
                <AlertDialog.Heading>Repair comment counters?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                Recalculate denormalized comment counters across the catalog. Use this only when
                counts look wrong after moderation incidents.
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="ghost" onPress={() => setRepairOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  isDisabled={isRepairing}
                  onPress={async () => {
                    await repairCounters();
                    setRepairOpen(false);
                  }}
                >
                  {isRepairing ? <Spinner size="sm" /> : "Repair"}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}
