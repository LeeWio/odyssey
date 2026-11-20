"use client";

import {
  BarsDescendingAlignCenter,
  CirclePlus,
  Copy,
  LayoutColumns3,
  Pencil,
  Sliders,
  TrashBin,
} from "@gravity-ui/icons";
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
  TextArea,
  TextField,
} from "@heroui/react";
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
import { type FormEvent, useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import {
  type RoleRequest,
  type RoleResponse,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetAllRolesQuery,
  useUpdateRoleMutation,
} from "@/lib/features/role";
import { IconButton } from "../icon-button";
import { usePortalContainer } from "../use-portal-container";

export function RolesPage() {
  const t = useTranslations("Dashboard");
  const portalContainer = usePortalContainer();

  const { data: roles = [], isLoading, error } = useGetAllRolesQuery();
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  // Modal & Alert States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  // Editing State
  const [selectedRole, setSelectedRole] = useState<RoleResponse | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  // Filter Roles
  const filteredRoles = useMemo(() => {
    let result = [...roles];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (role) =>
          role.name.toLowerCase().includes(q) ||
          role.code.toLowerCase().includes(q) ||
          role.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [roles, search]);

  // Sort Roles
  const sortedRoles = useMemo(() => {
    if (!sortDescriptor.column) return filteredRoles;
    const col = sortDescriptor.column as keyof RoleResponse;

    return [...filteredRoles].sort((a, b) => {
      const first = a[col];
      const second = b[col];

      let cmp = 0;
      if (typeof first === "number" && typeof second === "number") {
        cmp = first - second;
      } else {
        cmp = String(first ?? "").localeCompare(String(second ?? ""));
      }

      const direction = sortDescriptor.direction === "descending" ? -1 : 1;
      return cmp * direction;
    });
  }, [filteredRoles, sortDescriptor]);

  // Open Form Modal for Create
  const handleCreateOpen = () => {
    setSelectedRole(null);
    setFormName("");
    setFormCode("");
    setFormDescription("");
    setIsFormModalOpen(true);
  };

  // Open Form Modal for Edit
  const handleEditClick = useCallback((role: RoleResponse) => {
    setSelectedRole(role);
    setFormName(role.name);
    setFormCode(role.code);
    setFormDescription(role.description || "");
    setIsFormModalOpen(true);
  }, []);

  // Open Delete Confirmation
  const handleDeleteClick = useCallback((role: RoleResponse) => {
    setSelectedRole(role);
    setIsDeleteAlertOpen(true);
  }, []);

  // Auto-generate standard Spring Security role code from name if empty
  const handleNameBlur = () => {
    if (!formCode && formName) {
      const generated =
        "ROLE_" +
        formName
          .toUpperCase()
          .replace(/[^A-Z0-9_]+/g, "_")
          .replace(/(^_|_$)/g, "");
      setFormCode(generated);
    }
  };

  // Form Submit (Create or Update)
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body: RoleRequest = {
      name: formName.trim(),
      code: formCode.trim(),
      description: formDescription.trim(),
    };

    try {
      if (selectedRole) {
        await updateRole({ id: selectedRole.id, body }).unwrap();
      } else {
        await createRole(body).unwrap();
      }
      setIsFormModalOpen(false);
    } catch {
      // Handled globally
    }
  };

  // Delete Role
  const handleDeleteConfirm = async () => {
    if (!selectedRole) return;
    try {
      await deleteRole(selectedRole.id).unwrap();
      setIsDeleteAlertOpen(false);
    } catch {
      // Handled globally
    }
  };

  const columns = useMemo<DataGridColumn<RoleResponse>[]>(
    () => [
      {
        accessorKey: "id",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex items-center gap-2">
            <span className="font-medium tabular-nums">{item.id}</span>
            <Button
              isIconOnly
              aria-label={t("common.copyId")}
              size="sm"
              variant="ghost"
              onPress={() => void navigator.clipboard.writeText(String(item.id))}
            >
              <Copy className="text-muted size-3.5" />
            </Button>
          </div>
        ),
        header: t("common.id"),
        id: "id",
        isRowHeader: true,
        minWidth: 80,
      },
      {
        accessorKey: "name",
        allowsSorting: true,
        cell: (item) => <span className="text-xs font-medium">{item.name}</span>,
        header: t("common.name"),
        id: "name",
        minWidth: 160,
      },
      {
        accessorKey: "code",
        allowsSorting: true,
        cell: (item) => item.code,
        header: t("roles.securityCode"),
        id: "code",
        minWidth: 180,
      },
      {
        accessorKey: "description",
        allowsSorting: false,
        cell: (item) => <span className="text-muted text-xs">{item.description || "-"}</span>,
        header: t("common.description"),
        id: "description",
        minWidth: 260,
      },
      {
        align: "end",
        cell: (item) => {
          // System roles such as ROLE_ADMIN or ROLE_USER should not be deleted to prevent locking out
          const isSystemRole = item.code === "ROLE_ADMIN" || item.code === "ROLE_USER";
          return (
            <div className="flex items-center justify-end gap-0.5">
              <IconButton
                label={t("roles.edit")}
                size="sm"
                variant="tertiary"
                onPress={() => handleEditClick(item)}
              >
                <Pencil className="size-4" />
              </IconButton>
              <IconButton
                isDisabled={isSystemRole}
                label={isSystemRole ? t("roles.systemProtected") : t("common.delete")}
                size="sm"
                variant="danger-soft"
                onPress={() => handleDeleteClick(item)}
              >
                <TrashBin className="size-4" />
              </IconButton>
            </div>
          );
        },
        header: t("common.actions"),
        id: "actions",
        minWidth: 120,
      },
    ],
    [handleEditClick, handleDeleteClick, t]
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-4 pb-10">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground text-base font-semibold">{t("roles.all")}</span>
            <Chip size="sm" variant="soft">
              {roles.length}
            </Chip>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="tertiary">
                <Sliders className="size-4" />
                {t("categories.filter")}
              </Button>
              <Button size="sm" variant="tertiary">
                <BarsDescendingAlignCenter className="size-4" />
                {t("categories.sort")}
              </Button>
              <Button size="sm" variant="tertiary">
                <LayoutColumns3 className="size-4" />
                {t("roles.columns")}
              </Button>
              <Button size="sm" onPress={handleCreateOpen}>
                <CirclePlus className="size-4" />
                {t("roles.add")}
              </Button>
            </div>
            <SearchField
              className="w-full sm:w-[220px]"
              name="role-search"
              value={search}
              onChange={handleSearchChange}
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder={t("roles.search")} />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-danger-soft/10 border-danger/20 mt-4 flex flex-col items-center justify-center rounded-2xl border p-12 text-center">
          <p className="text-danger font-semibold">{t("roles.failed")}</p>
        </div>
      ) : (
        <DataGrid
          aria-label={t("nav.roles")}
          columns={columns}
          contentClassName="min-w-[700px]"
          data={sortedRoles}
          getRowId={(item) => item.id}
          isLoadingMore={isLoading}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
        />
      )}

      {/* Create / Edit Form Modal */}
      <Modal>
        <Modal.Backdrop
          isOpen={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          variant="blur"
          UNSTABLE_portalContainer={portalContainer || undefined}
        >
          <Modal.Container size="sm">
            <Modal.Dialog className="sm:max-w-md" aria-label={t("roles.form")}>
              <Modal.CloseTrigger />
              <Form onSubmit={handleFormSubmit}>
                <Modal.Header>
                  <Modal.Heading>
                    {selectedRole ? t("roles.edit") : t("roles.create")}
                  </Modal.Heading>
                  <p className="text-muted text-sm">
                    {selectedRole ? t("roles.description") : t("roles.createDescription")}
                  </p>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4">
                  <TextField
                    isRequired
                    name="name"
                    type="text"
                    value={formName}
                    onChange={setFormName}
                    onBlur={handleNameBlur}
                  >
                    <Label className="text-sm font-medium">{t("roles.roleName")}</Label>
                    <Input variant="secondary" placeholder={t("roles.roleNameExample")} />
                    <FieldError />
                  </TextField>

                  <TextField
                    isRequired
                    name="code"
                    type="text"
                    value={formCode}
                    validate={(val) => {
                      if (!/^ROLE_[A-Z0-9_]+$/.test(val)) {
                        return "Code must start with 'ROLE_' followed by uppercase letters, numbers and underscores";
                      }
                      return null;
                    }}
                    onChange={setFormCode}
                  >
                    <Label className="text-sm font-medium">{t("roles.securityCode")}</Label>
                    <Input variant="secondary" placeholder="e.g. ROLE_EDITOR" />
                    <FieldError />
                  </TextField>

                  <TextField
                    name="description"
                    value={formDescription}
                    onChange={setFormDescription}
                  >
                    <Label className="text-sm font-medium">{t("common.description")}</Label>
                    <TextArea
                      variant="secondary"
                      placeholder={t("roles.descriptionPlaceholder")}
                      className="min-h-20"
                    />
                    <FieldError />
                  </TextField>
                </Modal.Body>
                <Modal.Footer>
                  <Button slot="close" variant="tertiary" size="sm">
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" size="sm" isDisabled={isCreating || isUpdating}>
                    {(isCreating || isUpdating) && <Spinner size="sm" className="mr-1" />}
                    {selectedRole ? t("common.saveChanges") : t("roles.create")}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Delete Confirmation Alert */}
      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isDeleteAlertOpen}
          onOpenChange={setIsDeleteAlertOpen}
          variant="blur"
          UNSTABLE_portalContainer={portalContainer || undefined}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md" aria-label={t("roles.deleteQuestion")}>
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>{t("roles.deleteQuestion")}</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  {t("roles.deleteDescription")}{" "}
                  <strong className="text-foreground">&quot;{selectedRole?.name}&quot;</strong>
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" variant="tertiary" size="sm">
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onPress={handleDeleteConfirm}
                  isDisabled={isDeleting}
                >
                  {isDeleting && <Spinner size="sm" className="mr-1" />}
                  {t("common.delete")}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}
