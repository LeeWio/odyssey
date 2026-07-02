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
import { usePortalContainer } from "../use-portal-container";

// --- Single Timeline Node Component ---
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
      {/* Axis Marker Circle */}
      <div className="relative flex flex-col items-center">
        <div className="bg-primary/10 border-primary/40 bg-surface ring-background z-10 flex size-9 items-center justify-center rounded-full border-2 shadow-sm ring-4">
          <Icon icon="gravity-ui:chat" className="text-primary size-4" aria-hidden="true" />
        </div>
        <div className="bg-border absolute top-9 bottom-0 -mb-10 w-0.5 last:hidden" />
      </div>

      {/* Message Bubble Card */}
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

        {/* Action Bar */}
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

export function MomentsPage() {
  const portalContainer = usePortalContainer();
  const [activeTab, setActiveTab] = useState<string>("admin"); // Default to admin inside dashboard

  // --- Public Timeline State ---
  const { data: publicData, isLoading: isPublicLoading } = useGetPublicMomentsQuery({
    page: 0,
    size: 50,
  });
  const publicMoments = publicData?.list || [];
  const [likeMoment, { isLoading: isLiking }] = useLikeMomentMutation();

  // --- Management Console State ---
  const { data: adminData, isLoading: isAdminLoading } = useGetAllMomentsQuery({
    page: 0,
    size: 50,
  });

  const [createMoment, { isLoading: isCreating }] = useCreateMomentMutation();
  const [updateMoment, { isLoading: isUpdating }] = useUpdateMomentMutation();
  const [deleteMoment, { isLoading: isDeleting }] = useDeleteMomentMutation();

  // --- Dialog & Modal States ---
  const [isFormOpen, setIsFormFormOpen] = useState(false);
  const [momentToEdit, setMomentToEdit] = useState<MomentResponse | null>(null);
  const [momentToDelete, setMomentToDelete] = useState<MomentResponse | null>(null);

  // Form Fields
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
      // Handled globally
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
        header: "Content",
        id: "content",
        minWidth: 320,
        cell: (item) => <span className="line-clamp-2 text-sm">{item.content}</span>,
      },
      {
        accessorKey: "isPublished",
        header: "Status",
        id: "isPublished",
        minWidth: 120,
        cell: (item) => (
          <Chip size="sm" variant="soft" color={item.isPublished ? "success" : "warning"}>
            {item.isPublished ? "Published" : "Draft"}
          </Chip>
        ),
      },
      {
        accessorKey: "likesCount",
        header: "Likes",
        id: "likesCount",
        minWidth: 100,
        cell: (item) => <span className="font-medium tabular-nums">{item.likesCount}</span>,
      },
      {
        accessorKey: "createdAt",
        allowsSorting: true,
        header: "Created At",
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
        header: "Actions",
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
      {/* Header Title Section */}
      <div className="border-border flex flex-col gap-2 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-foreground text-2xl font-bold tracking-tight">
              Moments & Microblogs
            </h1>
            {!isPublicLoading && (
              <Chip size="sm" variant="soft">
                {publicMoments.length} Published
              </Chip>
            )}
          </div>
          <p className="text-muted mt-1 text-sm">
            Publish and manage short social updates, moments, or work logs. Supports likes tracking
            and logical deletion.
          </p>
        </div>
        <Button size="md" onPress={handleCreateOpen}>
          <Icon icon="gravity-ui:circle-plus" className="size-4" aria-hidden="true" />
          Add Moment
        </Button>
      </div>

      {/* Tabs */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Moment views">
            <Tabs.Tab id="admin">
              Management Console
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="public">
              Timeline Preview
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {/* Public Tab */}
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
              <p className="text-muted text-sm">
                No moments published on the timeline yet. Go to the Management Console to create
                one!
              </p>
            </div>
          ) : (
            <div className="relative flex flex-col gap-8 pl-4">
              {/* Timeline Vertical Axis Line */}
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

      {/* Admin Tab */}
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

      {/* Create / Edit Modal */}
      <Modal>
        <Modal.Backdrop
          isOpen={isFormOpen}
          onOpenChange={setIsFormFormOpen}
          variant="blur"
          UNSTABLE_portalContainer={portalContainer || undefined}
        >
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-lg">
              <Form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
                <Modal.Header>
                  <div className="text-lg font-bold">
                    {momentToEdit ? "Edit Moment" : "Create Moment"}
                  </div>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4">
                  <TextField isRequired name="content" className="flex flex-col gap-1.5">
                    <Label className="text-sm font-semibold">Content</Label>
                    <TextArea
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Share what's on your mind today..."
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
                        Publish immediately to the public timeline
                      </Switch.Content>
                    </Switch>
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="ghost" onPress={() => setIsFormFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isDisabled={isCreating || isUpdating}>
                    {isCreating || isUpdating ? <Spinner size="sm" /> : "Submit"}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={!!momentToDelete}
          onOpenChange={(open) => !open && setMomentToDelete(null)}
          variant="blur"
          UNSTABLE_portalContainer={portalContainer || undefined}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete Moment?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                Are you sure you want to permanently delete this moment? This action cannot be
                undone and will remove it from the timeline.
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="ghost" onPress={() => setMomentToDelete(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onPress={handleDeleteConfirm} isDisabled={isDeleting}>
                  {isDeleting ? <Spinner size="sm" className="text-white" /> : "Delete"}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}
