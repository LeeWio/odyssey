"use client";

import { CirclePlus, Globe, Pencil, ThumbsDown, ThumbsUp, TrashBin } from "@gravity-ui/icons";
import {
  AlertDialog,
  Button,
  Chip,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  SearchField,
  Spinner,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@heroui/react";
import Image from "next/image";
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
import { type FormEvent, useCallback, useMemo, useState } from "react";

import {
  type FriendLinkRequest,
  type FriendLinkResponse,
  type FriendLinkStatus,
  useCreateFriendLinkMutation,
  useDeleteFriendLinkMutation,
  useGetAdminFriendLinksQuery,
  useModerateFriendLinkMutation,
  useUpdateFriendLinkMutation,
} from "@/lib/features/friend-link";
import { usePortalContainer } from "../use-portal-container";

export function FriendLinksPage() {
  const portalContainer = usePortalContainer();

  // Pagination & Sorting State
  const [page] = useState(0);
  const [size] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });

  // Search State
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching } = useGetAdminFriendLinksQuery({
    page,
    size,
    sort: sortDescriptor.column
      ? [`${sortDescriptor.column},${sortDescriptor.direction === "descending" ? "desc" : "asc"}`]
      : undefined,
  });

  const [createLink, { isLoading: isCreating }] = useCreateFriendLinkMutation();
  const [updateLink, { isLoading: isUpdating }] = useUpdateFriendLinkMutation();
  const [deleteLink, { isLoading: isDeleting }] = useDeleteFriendLinkMutation();
  const [moderateLink, { isLoading: isModerating }] = useModerateFriendLinkMutation();

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<FriendLinkResponse | null>(null);

  // Form State
  const [formData, setFormData] = useState<FriendLinkRequest>({
    name: "",
    url: "",
    avatar: "",
    description: "",
    email: "",
    sortOrder: 0,
    isPublished: true,
    status: "APPROVED",
  });

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleCreateOpen = () => {
    setSelectedLink(null);
    setFormData({
      name: "",
      url: "",
      avatar: "",
      description: "",
      email: "",
      sortOrder: 0,
      isPublished: true,
      status: "APPROVED",
    });
    setIsFormModalOpen(true);
  };

  const handleEditClick = useCallback((link: FriendLinkResponse) => {
    setSelectedLink(link);
    setFormData({
      name: link.name,
      url: link.url,
      avatar: link.avatar || "",
      description: link.description || "",
      email: link.email || "",
      sortOrder: link.sortOrder,
      isPublished: link.isPublished,
      status: link.status,
    });
    setIsFormModalOpen(true);
  }, []);

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (selectedLink) {
        await updateLink({ id: selectedLink.id, body: formData }).unwrap();
      } else {
        await createLink(formData).unwrap();
      }
      setIsFormModalOpen(false);
    } catch {
      // Toast handled in API
    }
  };

  const handleModerate = useCallback(
    async (id: number, status: FriendLinkStatus) => {
      try {
        await moderateLink({ id, status }).unwrap();
      } catch {
        // Toast handled in API
      }
    },
    [moderateLink]
  );

  const handleDeleteConfirm = async () => {
    if (!selectedLink) return;
    try {
      await deleteLink(selectedLink.id).unwrap();
      setIsDeleteAlertOpen(true);
    } catch {
      // Toast handled in API
    }
  };

  const columns = useMemo<DataGridColumn<FriendLinkResponse>[]>(
    () => [
      {
        accessorKey: "id",
        allowsSorting: true,
        cell: (item) => <span className="font-medium tabular-nums">{item.id}</span>,
        header: "ID",
        id: "id",
        isRowHeader: true,
        minWidth: 60,
      },
      {
        accessorKey: "name",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex items-center gap-3">
            <div className="border-border/50 bg-surface-secondary relative size-8 shrink-0 overflow-hidden rounded-full border">
              {item.avatar ? (
                <Image
                  fill
                  src={item.avatar}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-muted flex h-full w-full items-center justify-center text-xs font-bold">
                  {item.name.slice(0, 1)}
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{item.name}</span>
              <span className="text-muted truncate font-mono text-xs">
                {item.email || "No email"}
              </span>
            </div>
          </div>
        ),
        header: "Site",
        id: "name",
        minWidth: 200,
      },
      {
        accessorKey: "status",
        allowsSorting: true,
        cell: (item) => {
          const colors: Record<FriendLinkStatus, "success" | "warning" | "danger"> = {
            APPROVED: "success",
            APPLYING: "warning",
            REJECTED: "danger",
          };
          return (
            <Chip size="sm" variant="soft" color={colors[item.status]}>
              {item.status}
            </Chip>
          );
        },
        header: "Status",
        id: "status",
        minWidth: 100,
      },
      {
        accessorKey: "url",
        allowsSorting: true,
        cell: (item) => (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent flex items-center gap-1.5 font-mono text-xs hover:underline"
          >
            <Globe className="size-3" />
            <span className="max-w-[140px] truncate">{item.url}</span>
          </a>
        ),
        header: "URL",
        id: "url",
        minWidth: 160,
      },
      {
        accessorKey: "sortOrder",
        allowsSorting: true,
        cell: (item) => <span className="text-sm tabular-nums">{item.sortOrder}</span>,
        header: "Sort",
        id: "sortOrder",
        minWidth: 80,
      },
      {
        accessorKey: "isPublished",
        allowsSorting: true,
        cell: (item) => (
          <Switch
            isSelected={item.isPublished}
            size="sm"
            onChange={(val) => {
              const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = item;
              updateLink({
                id: item.id,
                body: {
                  ...rest,
                  avatar: rest.avatar || undefined,
                  description: rest.description || undefined,
                  email: rest.email || undefined,
                  isPublished: val,
                },
              });
            }}
          />
        ),
        header: "Visible",
        id: "isPublished",
        minWidth: 100,
      },
      {
        align: "end",
        cell: (item) => (
          <div className="flex items-center justify-end gap-1.5">
            {item.status === "APPLYING" ? (
              <>
                <Tooltip delay={0}>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="outline"
                    onPress={() => handleModerate(item.id, "APPROVED")}
                  >
                    <ThumbsUp className="text-success size-3.5" />
                  </Button>
                  <Tooltip.Content>Approve</Tooltip.Content>
                </Tooltip>
                <Tooltip delay={0}>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="danger-soft"
                    onPress={() => handleModerate(item.id, "REJECTED")}
                  >
                    <ThumbsDown className="text-danger size-3.5" />
                  </Button>
                  <Tooltip.Content>Reject</Tooltip.Content>
                </Tooltip>
              </>
            ) : item.status === "APPROVED" ? (
              <Tooltip delay={0}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="danger-soft"
                  onPress={() => handleModerate(item.id, "REJECTED")}
                >
                  <ThumbsDown className="text-danger size-3.5" />
                </Button>
                <Tooltip.Content>Revoke Approval</Tooltip.Content>
              </Tooltip>
            ) : (
              <Tooltip delay={0}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="outline"
                  onPress={() => handleModerate(item.id, "APPROVED")}
                >
                  <ThumbsUp className="text-success size-3.5" />
                </Button>
                <Tooltip.Content>Re-approve</Tooltip.Content>
              </Tooltip>
            )}

            <Button isIconOnly size="sm" variant="tertiary" onPress={() => handleEditClick(item)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="danger-soft"
              onPress={() => {
                setSelectedLink(item);
                setIsDeleteAlertOpen(true);
              }}
            >
              <TrashBin className="size-3.5" />
            </Button>
          </div>
        ),
        header: "Actions",
        id: "actions",
        minWidth: 180,
      },
    ],
    [handleEditClick, updateLink, handleModerate]
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-8 pb-10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-base font-semibold">Friend Link Management</h2>
          {data && (
            <Chip size="sm" variant="soft">
              {data.total}
            </Chip>
          )}
        </div>
        <p className="text-muted text-sm">Moderate applications and manage public connections.</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button size="sm" onPress={handleCreateOpen}>
          <CirclePlus className="size-4" />
          Add Link
        </Button>

        <SearchField
          className="w-full sm:w-[240px]"
          name="link-search"
          onChange={handleSearchChange}
          value={search}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search links..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      <DataGrid
        aria-label="Friend Links"
        columns={columns}
        contentClassName="min-w-[1000px]"
        data={data?.list || []}
        getRowId={(item) => item.id}
        isLoadingMore={isLoading || isFetching}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      />

      {/* Create / Edit Modal */}
      <Modal>
        <Modal.Backdrop
          isOpen={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          variant="blur"
          UNSTABLE_portalContainer={portalContainer || undefined}
        >
          <Modal.Container size="sm">
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Form onSubmit={handleFormSubmit}>
                <Modal.Header>
                  <Modal.Heading className="text-lg font-bold">
                    {selectedLink ? "Edit Friend Link" : "Add Friend Link"}
                  </Modal.Heading>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4 py-4">
                  <TextField isRequired name="name">
                    <Label>Site Name</Label>
                    <Input
                      variant="secondary"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <FieldError />
                  </TextField>

                  <TextField isRequired name="url">
                    <Label>Site URL</Label>
                    <Input
                      variant="secondary"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                    <FieldError />
                  </TextField>

                  <TextField name="avatar">
                    <Label>Avatar URL</Label>
                    <Input
                      variant="secondary"
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    />
                  </TextField>

                  <TextField name="email">
                    <Label>Contact Email</Label>
                    <Input
                      variant="secondary"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </TextField>

                  <div className="grid grid-cols-2 gap-4">
                    <TextField name="sortOrder" type="number">
                      <Label>Sort Order</Label>
                      <Input
                        variant="secondary"
                        value={formData.sortOrder?.toString()}
                        onChange={(e) =>
                          setFormData({ ...formData, sortOrder: Number(e.target.value) })
                        }
                      />
                    </TextField>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Status</Label>
                      <select
                        className="border-border bg-surface w-full rounded-lg border px-3 py-2 text-sm"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value as FriendLinkStatus })
                        }
                      >
                        <option value="APPLYING">Applying</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-surface-secondary ring-border/50 flex items-center justify-between rounded-xl p-4 ring-1">
                    <div className="flex flex-col gap-0.5">
                      <Typography className="text-sm font-semibold">Publicly Visible</Typography>
                      <Typography className="text-muted text-[10px]">
                        Enable this to show the link on the public page.
                      </Typography>
                    </div>
                    <Switch
                      isSelected={formData.isPublished}
                      onChange={(val) => setFormData({ ...formData, isPublished: val })}
                    />
                  </div>
                </Modal.Body>
                <Modal.Footer className="border-border border-t pt-4">
                  <Button slot="close" variant="tertiary" size="sm">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-accent text-accent-foreground"
                    isPending={isCreating || isUpdating}
                  >
                    {({ isPending }) => (
                      <>
                        {isPending && <Spinner size="sm" color="current" />}
                        {selectedLink ? "Save Changes" : "Create Link"}
                      </>
                    )}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isDeleteAlertOpen}
          onOpenChange={setIsDeleteAlertOpen}
          variant="blur"
          UNSTABLE_portalContainer={portalContainer || undefined}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete Friend Link?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  Are you sure you want to delete{" "}
                  <strong className="text-foreground">&quot;{selectedLink?.name}&quot;</strong>?
                  This action cannot be undone.
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" variant="tertiary" size="sm">
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onPress={handleDeleteConfirm}
                  isDisabled={isDeleting}
                >
                  {isDeleting && <Spinner size="sm" className="mr-1" />}
                  Delete
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}
