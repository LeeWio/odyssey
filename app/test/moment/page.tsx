"use client";

import { useMemo, useState, FormEvent, useCallback } from "react";
import {
  Button,
  Form,
  TextField,
  Label,
  TextArea,
  AlertDialog,
  Spinner,
  Chip,
  Tabs,
  Switch,
  Modal,
} from "@heroui/react";
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";

import {
  useGetPublicMomentsQuery,
  useLikeMomentMutation,
  useGetAllMomentsQuery,
  useCreateMomentMutation,
  useUpdateMomentMutation,
  useDeleteMomentMutation,
  type MomentResponse,
} from "@/lib/features/moment/moment-api";

// --- 单个时间线节点组件 ---
interface TimelineItemProps {
  moment: MomentResponse;
  onLike: (id: number) => void;
  isLiking: boolean;
}

function TimelineItem({ moment, onLike, isLiking }: TimelineItemProps) {
  const [localLiked, setLocalLiked] = useState(false);

  const handleLikeClick = () => {
    setLocalLiked((prev) => !prev);
    onLike(moment.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex gap-6 pl-1"
    >
      {/* 轴线上的圆点标记 */}
      <div className="relative flex flex-col items-center">
        <div className="bg-primary/10 border-primary/40 bg-surface ring-background z-10 flex size-9 items-center justify-center rounded-full border-2 shadow-sm ring-4">
          <Icon icon="gravity-ui:chat" className="text-primary size-4" aria-hidden="true" />
        </div>
        <div className="bg-border absolute top-9 bottom-0 -mb-10 w-0.5 last:hidden" />
      </div>

      {/* 消息气泡卡片 */}
      <div className="bg-surface border-border flex flex-1 flex-col gap-4 rounded-3xl border p-5 shadow-sm transition-all duration-350 hover:shadow-md md:p-6">
        <div className="border-border/60 flex items-center justify-between border-b pb-3">
          <span className="text-muted text-xs font-semibold tracking-tight uppercase">
            MOMENT #{moment.id}
          </span>
          <span className="text-muted text-xs tabular-nums">
            {new Date(moment.createdAt).toLocaleString()}
          </span>
        </div>

        <div className="text-foreground/95 text-sm leading-relaxed whitespace-pre-wrap md:text-base">
          {moment.content}
        </div>

        {/* 交互工具栏 */}
        <div className="border-border/40 flex items-center gap-2 border-t pt-3">
          <Button
            size="sm"
            variant="ghost"
            className={`gap-1.5 rounded-full px-4 text-xs ${
              localLiked ? "text-danger bg-danger-soft/10" : "text-muted"
            }`}
            onPress={handleLikeClick}
            isDisabled={isLiking}
          >
            <motion.div
              animate={{ scale: localLiked ? [1, 1.35, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Icon
                icon={localLiked ? "gravity-ui:heart-fill" : "gravity-ui:heart"}
                className={`size-4 ${localLiked ? "text-danger" : ""}`}
                aria-hidden="true"
              />
            </motion.div>
            <span className="font-semibold tabular-nums">
              {moment.likesCount + (localLiked ? 1 : 0)}
            </span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function MomentTestPage() {
  const [activeTab, setActiveTab] = useState<string>("public");

  // --- 公共时间线数据 ---
  const { data: publicData, isLoading: isPublicLoading } = useGetPublicMomentsQuery({
    page: 0,
    size: 50,
  });
  const publicMoments = publicData?.list || [];
  const [likeMoment, { isLoading: isLiking }] = useLikeMomentMutation();

  // --- 管理控制台数据 ---
  const { data: adminData, isLoading: isAdminLoading } = useGetAllMomentsQuery({
    page: 0,
    size: 50,
  });

  const [createMoment, { isLoading: isCreating }] = useCreateMomentMutation();
  const [updateMoment, { isLoading: isUpdating }] = useUpdateMomentMutation();
  const [deleteMoment, { isLoading: isDeleting }] = useDeleteMomentMutation();

  // --- 表单与对话框状态 ---
  const [isFormOpen, setIsFormFormOpen] = useState(false);
  const [momentToEdit, setMomentToEdit] = useState<MomentResponse | null>(null);
  const [momentToDelete, setMomentToDelete] = useState<MomentResponse | null>(null);

  // 表单字段
  const [formContent, setFormContent] = useState("");
  const [formIsPublished, setFormIsPublished] = useState(true);

  const [adminSort, setAdminSort] = useState<DataGridSortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });

  const handleCreateOpen = () => {
    setMomentToEdit(null);
    setFormContent("");
    setFormIsPublished(true);
    setIsFormFormOpen(true);
  };

  const handleEditClick = useCallback((moment: MomentResponse) => {
    setMomentToEdit(moment);
    setFormContent(moment.content);
    setFormIsPublished(moment.isPublished);
    setIsFormFormOpen(true);
  }, []);

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) return;

    const body = {
      content: formContent.trim(),
      isPublished: formIsPublished,
    };

    try {
      if (momentToEdit) {
        await updateMoment({ id: momentToEdit.id, body }).unwrap();
      } else {
        await createMoment(body).unwrap();
      }
      setIsFormFormOpen(false);
    } catch {
      // 报错提示在 RTK 拦截中已全局处理
    }
  };

  const handleDeleteConfirm = async () => {
    if (momentToDelete) {
      await deleteMoment(momentToDelete.id).unwrap();
      setMomentToDelete(null);
    }
  };

  const sortedAdminMoments = useMemo(() => {
    const list = adminData?.list || [];
    const col = adminSort.column as keyof MomentResponse;
    return [...list].sort((a, b) => {
      const first = a[col] ?? "";
      const second = b[col] ?? "";
      let cmp = 0;
      if (typeof first === "number" && typeof second === "number") {
        cmp = first - second;
      } else {
        cmp = String(first).localeCompare(String(second));
      }
      return adminSort.direction === "descending" ? -cmp : cmp;
    });
  }, [adminData?.list, adminSort]);

  const adminColumns = useMemo<DataGridColumn<MomentResponse>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        id: "id",
        minWidth: 80,
        cell: (item) => <span className="font-medium tabular-nums">{item.id}</span>,
      },
      {
        accessorKey: "content",
        header: "内容",
        id: "content",
        minWidth: 320,
        cell: (item) => <span className="line-clamp-2 text-sm">{item.content}</span>,
      },
      {
        accessorKey: "isPublished",
        header: "状态",
        id: "isPublished",
        minWidth: 120,
        cell: (item) => (
          <Chip size="sm" variant="soft" color={item.isPublished ? "success" : "warning"}>
            {item.isPublished ? "已发布" : "草稿"}
          </Chip>
        ),
      },
      {
        accessorKey: "likesCount",
        header: "获赞数",
        id: "likesCount",
        minWidth: 100,
        cell: (item) => <span className="font-medium tabular-nums">{item.likesCount}</span>,
      },
      {
        accessorKey: "createdAt",
        allowsSorting: true,
        header: "发布时间",
        id: "createdAt",
        minWidth: 180,
        cell: (item) => (
          <span className="text-muted text-sm tabular-nums">
            {new Date(item.createdAt).toLocaleString()}
          </span>
        ),
      },
      {
        align: "end",
        header: "操作",
        id: "actions",
        minWidth: 160,
        cell: (item) => (
          <div className="flex items-center justify-end gap-2">
            <Button isIconOnly size="sm" variant="tertiary" onPress={() => handleEditClick(item)}>
              <Icon icon="gravity-ui:pencil" className="size-4" aria-hidden="true" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="danger-soft"
              onPress={() => setMomentToDelete(item)}
            >
              <Icon icon="gravity-ui:trash-bin" className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ),
      },
    ],
    [handleEditClick]
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
      {/* 头部标题区 */}
      <div className="border-border flex flex-col gap-2 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-foreground text-2xl font-bold tracking-tight">微语 / 动态管理</h1>
            {!isPublicLoading && (
              <Chip size="sm" variant="soft">
                {publicMoments.length} 条动态
              </Chip>
            )}
          </div>
          <p className="text-muted mt-1 text-sm">
            提供独立测试通道以验证微语发布、时间线级联刷新和后台草稿管理。
          </p>
        </div>
        <Button size="md" onPress={handleCreateOpen}>
          <Icon icon="gravity-ui:circle-plus" className="size-4" aria-hidden="true" />
          新增微语
        </Button>
      </div>

      {/* 标签栏选择 */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Moment views">
            <Tabs.Tab id="public">
              公共时间线 View
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="admin">
              后台管理 Console
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {/* 公共展示 Tab */}
      {activeTab === "public" && (
        <div className="mx-auto w-full max-w-2xl">
          {isPublicLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : publicMoments.length === 0 ? (
            <div className="bg-surface border-border flex flex-col items-center justify-center rounded-2xl border p-12 text-center shadow-sm">
              <Icon
                icon="gravity-ui:circle-exclamation"
                className="text-muted mb-3 size-10"
                aria-hidden="true"
              />
              <p className="text-muted text-sm">时间线上还没有任何微语，去后台添加一条吧！</p>
            </div>
          ) : (
            <div className="relative flex flex-col gap-8 pl-4">
              {/* Timeline 左侧主轴线条 */}
              <div className="bg-border/60 absolute top-0 bottom-0 left-[21px] w-0.5" />
              {publicMoments.map((moment) => (
                <TimelineItem
                  key={moment.id}
                  moment={moment}
                  onLike={likeMoment}
                  isLiking={isLiking}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 后台管理 Tab */}
      {activeTab === "admin" && (
        <div className="bg-surface border-border overflow-hidden rounded-2xl border">
          <DataGrid
            aria-label="Admin Moments"
            columns={adminColumns}
            contentClassName="min-w-[900px]"
            data={sortedAdminMoments}
            getRowId={(item) => item.id}
            isLoadingMore={isAdminLoading}
            sortDescriptor={adminSort}
            onSortChange={setAdminSort}
          />
        </div>
      )}

      {/* 新增/编辑模态框 */}
      <Modal isOpen={isFormOpen} onOpenChange={setIsFormFormOpen}>
        <Modal.Backdrop />
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-lg">
            <Form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
              <Modal.Header>
                <div className="text-lg font-bold">{momentToEdit ? "编辑微语" : "发布新微语"}</div>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4">
                <TextField isRequired name="content" className="flex flex-col gap-1.5">
                  <Label className="text-sm font-semibold">微语内容</Label>
                  <TextArea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="说点什么吧..."
                    className="min-h-32"
                    variant="secondary"
                    maxLength={500}
                  />
                </TextField>

                <div className="pt-2">
                  <Switch isSelected={formIsPublished} onChange={setFormIsPublished}>
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      立即公开发布到时间线
                    </Switch.Content>
                  </Switch>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={() => setIsFormFormOpen(false)}>
                  取消
                </Button>
                <Button type="submit" variant="primary" isDisabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? <Spinner size="sm" /> : "确定提交"}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal>

      {/* 删除确认 AlertDialog */}
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={!!momentToDelete}
          onOpenChange={(open) => !open && setMomentToDelete(null)}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>删除微语确认</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                你确定要永久删除这条微语动态吗？此操作将无法撤销，时间线将同步下架。
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="ghost" onPress={() => setMomentToDelete(null)}>
                  取消
                </Button>
                <Button variant="danger" onPress={handleDeleteConfirm} isDisabled={isDeleting}>
                  {isDeleting ? <Spinner size="sm" className="text-white" /> : "永久删除"}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}
