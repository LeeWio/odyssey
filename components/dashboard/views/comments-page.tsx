"use client";

import { AlertDialog, Button, Label, ListBox, Select, Spinner, Tabs } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("Dashboard");
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
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            {t("comments.title")}
          </h1>
          <p className="text-muted text-sm">{t("comments.description")}</p>
        </div>
        <Button size="sm" variant="secondary" onPress={() => setRepairOpen(true)}>
          <Icon icon="gravity-ui:arrow-rotate-right" className="size-4" aria-hidden="true" />
          {t("comments.repair")}
        </Button>
      </div>

      <CommentOverviewCards overview={overview} isLoading={isOverviewLoading} />

      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(String(key))}>
        <Tabs.ListContainer>
          <Tabs.List aria-label={t("comments.views")}>
            <Tabs.Tab id="moderation">
              {t("comments.moderation")}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="reports">
              {t("comments.reports")}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="high-risk">
              {t("comments.highRisk")}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="logs">
              {t("comments.logs")}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="preview">
              {t("comments.threadPreview")}
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
            placeholder={isPostsLoading ? t("comments.loadingPosts") : t("comments.selectPost")}
            isDisabled={isPostsLoading}
            value={selectedPostId?.toString() || null}
            onChange={(val) => setSelectedPostId(val ? Number(val) : null)}
          >
            <Label>{t("comments.selectedPost")}</Label>
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
                    <h3 className="text-lg font-bold">{t("comments.thread")}</h3>
                    <span className="text-muted text-sm tabular-nums">
                      {totalCount}{" "}
                      {totalCount === 1 ? t("comments.comment") : t("comments.comments")}
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
                      {t("comments.viewNew", { count: newCount })}
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
            <AlertDialog.Dialog className="sm:max-w-md" aria-label={t("comments.repairQuestion")}>
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="warning" />
                <AlertDialog.Heading>{t("comments.repairQuestion")}</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>{t("comments.repairDescription")}</AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="ghost" onPress={() => setRepairOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="primary"
                  isDisabled={isRepairing}
                  onPress={async () => {
                    await repairCounters();
                    setRepairOpen(false);
                  }}
                >
                  {isRepairing ? <Spinner size="sm" /> : t("comments.repairAction")}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}
