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
  Tabs,
  TextField,
} from "@heroui/react";
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
import { type FormEvent, useCallback, useMemo, useState } from "react";

import {
  type FriendLinkRequest,
  type FriendLinkResponse,
  type FriendLinkStatus,
  useApplyFriendLinkMutation,
  useCreateFriendLinkMutation,
  useDeleteFriendLinkMutation,
  useGetAdminFriendLinksQuery,
  useGetPublicFriendLinksQuery,
  useModerateFriendLinkMutation,
  useUpdateFriendLinkMutation,
} from "@/lib/features/friend-link";

export default function FriendLinkTestPage() {
  const [activeTab, setActiveTab] = useState<string>("public");

  // --- API Hooks ---
  // Public
  const {
    data: publicLinks = [],
    isLoading: isPublicLoading,
    error: publicError,
  } = useGetPublicFriendLinksQuery();
  const [applyFriendLink, { isLoading: isApplying }] = useApplyFriendLinkMutation();

  // Admin
  const {
    data: adminLinksData,
    isLoading: isAdminLoading,
    error: adminError,
  } = useGetAdminFriendLinksQuery({
    page: 0,
    size: 100, // Fetch top 100 for test page client filtering/sorting
  });
  const [createFriendLink, { isLoading: isCreating }] = useCreateFriendLinkMutation();
  const [updateFriendLink, { isLoading: isUpdating }] = useUpdateFriendLinkMutation();
  const [moderateFriendLink, { isLoading: isModerating }] = useModerateFriendLinkMutation();
  const [deleteFriendLink, { isLoading: isDeleting }] = useDeleteFriendLinkMutation();

  const adminLinks = useMemo(() => adminLinksData?.list || [], [adminLinksData]);

  // --- Search & Sorting States (Admin) ---
  const [search, setSearch] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "sortOrder",
    direction: "ascending",
  });

  // --- Modal & Modal Form States ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isAdminForm, setIsAdminForm] = useState(false); // Distinction between Admin direct add/edit and Public apply

  // Selected item for Edit or Delete or Moderation
  const [selectedLink, setSelectedLink] = useState<FriendLinkResponse | null>(null);

  // --- Form Fields ---
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formAvatar, setFormAvatar] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSortOrder, setFormSortOrder] = useState<string>("0");
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formStatus, setFormStatus] = useState<FriendLinkStatus>("APPROVED");

  // --- Search Handler ---
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  // --- Filtering & Sorting Logic (Admin) ---
  const filteredLinks = useMemo(() => {
    let result = [...adminLinks];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (link) =>
          link.name.toLowerCase().includes(q) ||
          link.url.toLowerCase().includes(q) ||
          (link.description && link.description.toLowerCase().includes(q)) ||
          (link.email && link.email.toLowerCase().includes(q))
      );
    }

    return result;
  }, [adminLinks, search]);

  const sortedLinks = useMemo(() => {
    if (!sortDescriptor.column) return filteredLinks;
    const col = sortDescriptor.column as keyof FriendLinkResponse;

    return [...filteredLinks].sort((a, b) => {
      const first = a[col];
      const second = b[col];

      let cmp = 0;
      if (typeof first === "number" && typeof second === "number") {
        cmp = first - second;
      } else if (typeof first === "boolean" && typeof second === "boolean") {
        cmp = (first ? 1 : 0) - (second ? 1 : 0);
      } else {
        cmp = String(first ?? "").localeCompare(String(second ?? ""));
      }

      const direction = sortDescriptor.direction === "descending" ? -1 : 1;
      return cmp * direction;
    });
  }, [filteredLinks, sortDescriptor]);

  // --- Modal Openers ---
  // 1. Public Apply Modal
  const handlePublicApplyOpen = () => {
    setSelectedLink(null);
    setIsAdminForm(false);
    setFormName("");
    setFormUrl("");
    setFormAvatar("");
    setFormDescription("");
    setFormEmail("");
    setIsFormModalOpen(true);
  };

  // 2. Admin Create Direct Modal
  const handleAdminCreateOpen = () => {
    setSelectedLink(null);
    setIsAdminForm(true);
    setFormName("");
    setFormUrl("");
    setFormAvatar("");
    setFormDescription("");
    setFormEmail("");
    setFormSortOrder("0");
    setFormIsPublished(true);
    setFormStatus("APPROVED");
    setIsFormModalOpen(true);
  };

  // 3. Admin Edit Modal
  const handleEditClick = useCallback((link: FriendLinkResponse) => {
    setSelectedLink(link);
    setIsAdminForm(true);
    setFormName(link.name);
    setFormUrl(link.url);
    setFormAvatar(link.avatar || "");
    setFormDescription(link.description || "");
    setFormEmail(link.email || "");
    setFormSortOrder(link.sortOrder.toString());
    setFormIsPublished(link.isPublished);
    setFormStatus(link.status);
    setIsFormModalOpen(true);
  }, []);

  // 4. Admin Delete Confirmer
  const handleDeleteClick = useCallback((link: FriendLinkResponse) => {
    setSelectedLink(link);
    setIsDeleteAlertOpen(true);
  }, []);

  // --- API Mutators ---
  // A. Public Apply or Admin Create/Update Submit
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const requestBody: FriendLinkRequest = {
      name: formName.trim(),
      url: formUrl.trim(),
      avatar: formAvatar.trim() || undefined,
      description: formDescription.trim() || undefined,
      email: formEmail.trim() || undefined,
      ...(isAdminForm && {
        sortOrder: Number(formSortOrder) || 0,
        isPublished: formIsPublished,
        status: formStatus,
      }),
    };

    try {
      if (isAdminForm) {
        if (selectedLink) {
          await updateFriendLink({ id: selectedLink.id, body: requestBody }).unwrap();
        } else {
          await createFriendLink(requestBody).unwrap();
        }
      } else {
        await applyFriendLink(requestBody).unwrap();
      }
      setIsFormModalOpen(false);
    } catch {
      // Handled globally / via toast
    }
  };

  // B. Moderation Change
  const handleModerateClick = useCallback(
    async (id: number, status: FriendLinkStatus) => {
      try {
        await moderateFriendLink({ id, status }).unwrap();
      } catch {
        // Handled globally
      }
    },
    [moderateFriendLink]
  );

  // C. Deletion Confirmed
  const handleDeleteConfirm = async () => {
    if (!selectedLink) return;
    try {
      await deleteFriendLink(selectedLink.id).unwrap();
      setIsDeleteAlertOpen(false);
    } catch {
      // Handled globally
    }
  };

  // --- DataGrid Columns Setup (Admin) ---
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
            {item.avatar ? (
              <img
                src={item.avatar}
                alt={item.name}
                className="border-border/50 bg-default-50 size-8 rounded-full border object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"; // fallback avatar
                }}
              />
            ) : (
              <div className="bg-default-100 text-default-600 flex size-8 items-center justify-center rounded-full text-xs font-bold uppercase">
                {item.name.slice(0, 2)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{item.name}</span>
              {item.email && <span className="text-muted font-mono text-[10px]">{item.email}</span>}
            </div>
          </div>
        ),
        header: "Site Info",
        id: "name",
        minWidth: 180,
      },
      {
        accessorKey: "url",
        allowsSorting: true,
        cell: (item) => (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary flex items-center gap-1 font-mono text-xs hover:underline"
          >
            <Globe className="size-3" />
            <span className="line-clamp-1 max-w-[150px]">{item.url}</span>
          </a>
        ),
        header: "URL",
        id: "url",
        minWidth: 160,
      },
      {
        accessorKey: "description",
        allowsSorting: false,
        cell: (item) => (
          <span className="text-muted line-clamp-1 max-w-[200px] text-xs">
            {item.description || <span className="italic opacity-50">No description</span>}
          </span>
        ),
        header: "Description",
        id: "description",
        minWidth: 180,
      },
      {
        accessorKey: "status",
        allowsSorting: true,
        cell: (item) => {
          let variant: "warning" | "success" | "danger" | "default" = "warning";
          let label = "Pending";
          if (item.status === "APPROVED") {
            variant = "success";
            label = "Approved";
          } else if (item.status === "REJECTED") {
            variant = "danger";
            label = "Rejected";
          }
          return (
            <Chip size="sm" variant="soft" color={variant}>
              {label}
            </Chip>
          );
        },
        header: "Status",
        id: "status",
        minWidth: 100,
      },
      {
        accessorKey: "sortOrder",
        allowsSorting: true,
        cell: (item) => <span className="text-xs tabular-nums">{item.sortOrder}</span>,
        header: "Sort",
        id: "sortOrder",
        minWidth: 80,
      },
      {
        accessorKey: "isPublished",
        allowsSorting: true,
        cell: (item) => (
          <Chip size="sm" variant="soft" color={item.isPublished ? "success" : "default"}>
            {item.isPublished ? "Published" : "Draft"}
          </Chip>
        ),
        header: "Published",
        id: "isPublished",
        minWidth: 100,
      },
      {
        accessorKey: "createdAt",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted text-xs tabular-nums">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        ),
        header: "Created",
        id: "createdAt",
        minWidth: 110,
      },
      {
        align: "end",
        cell: (item) => (
          <div className="flex items-center justify-end gap-1.5">
            {/* Quick moderation buttons */}
            {item.status === "APPLYING" && (
              <>
                <Button
                  isIconOnly
                  size="sm"
                  variant="outline"
                  aria-label="Approve"
                  onPress={() => handleModerateClick(item.id, "APPROVED")}
                  isDisabled={isModerating}
                >
                  <ThumbsUp className="text-success size-3.5" />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="danger-soft"
                  aria-label="Reject"
                  onPress={() => handleModerateClick(item.id, "REJECTED")}
                  isDisabled={isModerating}
                >
                  <ThumbsDown className="text-danger size-3.5" />
                </Button>
              </>
            )}
            {item.status === "APPROVED" && (
              <Button
                isIconOnly
                size="sm"
                variant="danger-soft"
                aria-label="Revoke / Reject"
                onPress={() => handleModerateClick(item.id, "REJECTED")}
                isDisabled={isModerating}
              >
                <ThumbsDown className="text-danger size-3.5" />
              </Button>
            )}
            {item.status === "REJECTED" && (
              <Button
                isIconOnly
                size="sm"
                variant="outline"
                aria-label="Approve"
                onPress={() => handleModerateClick(item.id, "APPROVED")}
                isDisabled={isModerating}
              >
                <ThumbsUp className="text-success size-3.5" />
              </Button>
            )}
            <Button
              isIconOnly
              size="sm"
              variant="tertiary"
              aria-label="Edit"
              onPress={() => handleEditClick(item)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="danger-soft"
              aria-label="Delete"
              onPress={() => handleDeleteClick(item)}
              isDisabled={isDeleting}
            >
              <TrashBin className="text-danger size-3.5" />
            </Button>
          </div>
        ),
        header: "Actions",
        id: "actions",
        minWidth: 160,
      },
    ],
    [handleEditClick, handleDeleteClick, handleModerateClick, isModerating, isDeleting]
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
      {/* Header Section */}
      <div className="border-border flex flex-col gap-2 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Friend Link Portal (友情链接)
          </h1>
          <p className="text-muted mt-1 text-sm">
            Interactive playground to display approved connections, request an exchange, and
            moderate links.
          </p>
        </div>

        {activeTab === "public" ? (
          <Button size="md" onPress={handlePublicApplyOpen}>
            <CirclePlus className="size-4" />
            Apply Link
          </Button>
        ) : (
          <Button size="md" onPress={handleAdminCreateOpen}>
            <CirclePlus className="size-4" />
            Add Link (Admin)
          </Button>
        )}
      </div>

      {/* Tabs Switcher */}
      <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Friend Link Views">
            <Tabs.Tab id="public">
              Public Display (公众端展示)
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="admin">
              Admin Moderation (管理员后台)
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {/* PUBLIC VIEW TAB */}
      {activeTab === "public" && (
        <div className="flex flex-col gap-6">
          {isPublicLoading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2">
              <Spinner size="lg" />
              <p className="text-muted text-sm">Fetching link directory...</p>
            </div>
          ) : publicError ? (
            <div className="bg-danger-soft/10 border-danger/20 flex flex-col items-center justify-center rounded-2xl border p-12 text-center">
              <p className="text-danger font-semibold">Failed to load public friend links</p>
              <p className="text-muted mt-1 text-sm">
                Ensure the server is online or mock state is correctly initialized.
              </p>
            </div>
          ) : publicLinks.length === 0 ? (
            <div className="border-border/40 flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
              <Globe className="text-muted/40 size-12" />
              <p className="text-foreground mt-4 font-semibold">No Connections Yet</p>
              <p className="text-muted mt-1 max-w-sm text-sm">
                Be the first to apply! Click the &quot;Apply Link&quot; button in the top right to
                request an exchange.
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-4"
                onPress={handlePublicApplyOpen}
              >
                Apply Exchange
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {publicLinks.map((link) => (
                <div
                  key={link.id}
                  className="bg-surface hover:border-border-hover border-border relative flex flex-col gap-4 rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    {link.avatar ? (
                      <img
                        src={link.avatar}
                        alt={link.name}
                        className="border-border/50 bg-default-50 size-12 rounded-full border object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80";
                        }}
                      />
                    ) : (
                      <div className="bg-default-100 text-default-600 flex size-12 items-center justify-center rounded-full text-sm font-bold uppercase">
                        {link.name.slice(0, 2)}
                      </div>
                    )}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-default-100 hover:bg-default-200 text-default-700 flex size-8 items-center justify-center rounded-full transition-colors"
                      title={`Visit ${link.name}`}
                    >
                      <Globe className="size-4" />
                    </a>
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3 className="text-foreground text-sm font-bold tracking-tight">
                      {link.name}
                    </h3>
                    <p className="text-muted line-clamp-2 min-h-[32px] text-xs">
                      {link.description || (
                        <span className="italic opacity-50">Explore beautiful content.</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADMIN CONTROL TAB */}
      {activeTab === "admin" && (
        <div className="flex flex-col gap-6">
          {/* Toolbar */}
          <div className="flex items-center justify-end">
            <SearchField
              className="w-full sm:w-[280px]"
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

          {/* Table Container */}
          {adminError ? (
            <div className="bg-danger-soft/10 border-danger/20 flex flex-col items-center justify-center rounded-2xl border p-12 text-center">
              <p className="text-danger font-semibold">Failed to load admin friend links</p>
              <p className="text-muted mt-1 text-sm">
                Ensure backend mock framework or servers on port 8080 are fully running.
              </p>
            </div>
          ) : (
            <div className="bg-surface border-border overflow-hidden rounded-2xl border">
              <DataGrid
                aria-label="Admin Friend Links Grid"
                columns={columns}
                contentClassName="min-w-[900px]"
                data={sortedLinks}
                getRowId={(item) => item.id}
                isLoadingMore={isAdminLoading}
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
              />
            </div>
          )}
        </div>
      )}

      {/* CREATE & EDIT & APPLY FORM MODAL */}
      <Modal>
        <Modal.Backdrop isOpen={isFormModalOpen} onOpenChange={setIsFormModalOpen} variant="blur">
          <Modal.Container size="sm">
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Form onSubmit={handleFormSubmit}>
                <Modal.Header>
                  <Modal.Heading className="text-lg font-bold">
                    {isAdminForm
                      ? selectedLink
                        ? "Edit Friend Link (Admin)"
                        : "Create Friend Link (Admin)"
                      : "Apply Friend Link Exchange"}
                  </Modal.Heading>
                  <p className="text-muted text-sm">
                    {isAdminForm
                      ? "Directly provision, override, or update connection properties."
                      : "Request an exchange. We will review your link's availability and content soon."}
                  </p>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4 py-4">
                  {/* Name */}
                  <TextField isRequired name="name" type="text">
                    <Label className="text-sm font-medium">Site Name (网站名称)</Label>
                    <Input
                      placeholder="e.g. Odyssey Tech"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                    <FieldError />
                  </TextField>

                  {/* URL */}
                  <TextField
                    isRequired
                    name="url"
                    type="url"
                    validate={(val) => {
                      if (!val.startsWith("http://") && !val.startsWith("https://")) {
                        return "URL must begin with http:// or https://";
                      }
                      return null;
                    }}
                  >
                    <Label className="text-sm font-medium">Site URL (网站链接)</Label>
                    <Input
                      placeholder="e.g. https://odyssey.com"
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                    />
                    <FieldError />
                  </TextField>

                  {/* Avatar URL */}
                  <TextField name="avatar" type="url">
                    <Label className="text-sm font-medium">
                      Avatar URL (Logo/头像链接) - Optional
                    </Label>
                    <Input
                      placeholder="e.g. https://odyssey.com/avatar.png"
                      value={formAvatar}
                      onChange={(e) => setFormAvatar(e.target.value)}
                    />
                    <FieldError />
                  </TextField>

                  {/* Description */}
                  <TextField name="description" type="text">
                    <Label className="text-sm font-medium">Description (网站简介) - Optional</Label>
                    <Input
                      placeholder="e.g. Deep coordinates of elegant engineering and high design."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                    <FieldError />
                  </TextField>

                  {/* Email */}
                  <TextField name="email" type="email">
                    <Label className="text-sm font-medium">
                      Contact Email (联系邮箱) - Optional
                    </Label>
                    <Input
                      placeholder="e.g. admin@odyssey.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                    />
                    <FieldError />
                  </TextField>

                  {/* Admin Specific Controls */}
                  {isAdminForm && (
                    <div className="border-border bg-default-50/20 flex flex-col gap-4 rounded-xl border p-4">
                      <p className="text-foreground text-xs font-bold tracking-wider uppercase">
                        Administrative Configurations
                      </p>

                      {/* Sort Order */}
                      <TextField name="sortOrder" type="number">
                        <Label className="text-xs font-medium">Sort Order (排序权重)</Label>
                        <Input
                          placeholder="e.g. 0"
                          value={formSortOrder}
                          onChange={(e) => setFormSortOrder(e.target.value)}
                        />
                        <FieldError />
                      </TextField>

                      {/* Status */}
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium">Moderation Status (审核状态)</Label>
                        <select
                          className="border-border bg-surface text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as FriendLinkStatus)}
                        >
                          <option value="APPLYING">Applying (审核中)</option>
                          <option value="APPROVED">Approved (已过审)</option>
                          <option value="REJECTED">Rejected (已拒绝)</option>
                        </select>
                      </div>

                      {/* Is Published Toggle */}
                      <div className="border-border/40 mt-2 flex items-center justify-between border-t pt-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold">Publish Link (公开状态)</span>
                          <span className="text-muted text-[10px]">
                            Determine if this connection displays publicly.
                          </span>
                        </div>
                        <Switch isSelected={formIsPublished} onChange={setFormIsPublished} />
                      </div>
                    </div>
                  )}
                </Modal.Body>
                <Modal.Footer className="border-border border-t pt-4">
                  <Button slot="close" variant="tertiary" size="sm">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    isDisabled={isApplying || isCreating || isUpdating}
                  >
                    {(isApplying || isCreating || isUpdating) && (
                      <Spinner size="sm" className="mr-1" />
                    )}
                    {isAdminForm
                      ? selectedLink
                        ? "Save Changes"
                        : "Create Link"
                      : "Apply Exchange"}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* DELETE CONFIRMATION ALERT DIALOG */}
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isDeleteAlertOpen}
          onOpenChange={setIsDeleteAlertOpen}
          variant="blur"
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete Connection?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  Are you sure you want to permanently sever connection with{" "}
                  <strong className="text-foreground">&quot;{selectedLink?.name}&quot;</strong>?
                  This action cannot be reversed, and the cached listing will be invalidated.
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
                  Sever Link
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}
