"use client";

import { CirclePlus, Pencil, TrashBin } from "@gravity-ui/icons";
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
  Tooltip,
} from "@heroui/react";
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
import { type FormEvent, useCallback, useMemo, useState } from "react";

import {
  type RoleRequest,
  type RoleResponse,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetAllRolesQuery,
  useUpdateRoleMutation,
} from "@/lib/features/role";
import { usePortalContainer } from "../use-portal-container";

export function RolesPage() {
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
        cell: (item) => <span className="font-medium tabular-nums">{item.id}</span>,
        header: "ID",
        id: "id",
        isRowHeader: true,
        minWidth: 80,
      },
      {
        accessorKey: "name",
        allowsSorting: true,
        cell: (item) => <span className="text-sm font-semibold">{item.name}</span>,
        header: "Name",
        id: "name",
        minWidth: 160,
      },
      {
        accessorKey: "code",
        allowsSorting: true,
        cell: (item) => (
          <code className="bg-muted border-border text-accent rounded border px-1.5 py-0.5 font-mono text-xs">
            {item.code}
          </code>
        ),
        header: "Security Code",
        id: "code",
        minWidth: 180,
      },
      {
        accessorKey: "description",
        allowsSorting: false,
        cell: (item) => <span className="text-muted text-sm">{item.description || "-"}</span>,
        header: "Description",
        id: "description",
        minWidth: 260,
      },
      {
        align: "end",
        cell: (item) => {
          // System roles such as ROLE_ADMIN or ROLE_USER should not be deleted to prevent locking out
          const isSystemRole = item.code === "ROLE_ADMIN" || item.code === "ROLE_USER";
          return (
            <div className="flex items-center justify-end gap-2">
              <Tooltip delay={0}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="tertiary"
                  onPress={() => handleEditClick(item)}
                  aria-label="Edit Role"
                >
                  <Pencil className="size-4" />
                </Button>
                <Tooltip.Content>Edit Role</Tooltip.Content>
              </Tooltip>

              <Tooltip delay={0}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="danger-soft"
                  onPress={() => handleDeleteClick(item)}
                  isDisabled={isSystemRole}
                  aria-label="Delete Role"
                >
                  <TrashBin className="size-4" />
                </Button>
                <Tooltip.Content>
                  {isSystemRole ? "System protected role" : "Delete Role"}
                </Tooltip.Content>
              </Tooltip>
            </div>
          );
        },
        header: "Actions",
        id: "actions",
        minWidth: 120,
      },
    ],
    [handleEditClick, handleDeleteClick]
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-8 pb-10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-base font-semibold">Security Role Management</h2>
          {!isLoading && (
            <Chip size="sm" variant="soft">
              {roles.length}
            </Chip>
          )}
        </div>
        <p className="text-muted text-sm">
          Configure security roles to define organizational responsibilities.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button size="sm" onPress={handleCreateOpen}>
          <CirclePlus className="size-4" />
          Add Role
        </Button>

        <SearchField
          className="w-full sm:w-[240px]"
          name="role-search"
          onChange={handleSearchChange}
          value={search}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search roles..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      {error ? (
        <div className="bg-danger-soft/10 border-danger/20 mt-4 flex flex-col items-center justify-center rounded-2xl border p-12 text-center">
          <p className="text-danger font-semibold">Failed to load roles</p>
        </div>
      ) : (
        <DataGrid
          aria-label="Roles"
          columns={columns}
          contentClassName="min-w-[800px]"
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
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Form onSubmit={handleFormSubmit}>
                <Modal.Header>
                  <Modal.Heading className="text-lg font-bold">
                    {selectedRole ? "Edit Role" : "Create Role"}
                  </Modal.Heading>
                  <p className="text-muted text-sm">
                    {selectedRole
                      ? "Update the role attributes. The code must be compliant with Security standards."
                      : "Define a new security role to bundle permissions."}
                  </p>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4 py-4">
                  <TextField isRequired name="name" type="text">
                    <Label className="text-sm font-medium">Role Name</Label>
                    <Input
                      variant="secondary"
                      placeholder="e.g. Content Editor"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      onBlur={handleNameBlur}
                    />
                    <FieldError />
                  </TextField>

                  <TextField
                    isRequired
                    name="code"
                    type="text"
                    validate={(val) => {
                      if (!/^ROLE_[A-Z0-9_]+$/.test(val)) {
                        return "Code must start with 'ROLE_' followed by uppercase letters, numbers and underscores";
                      }
                      return null;
                    }}
                  >
                    <Label className="text-sm font-medium">Security Code</Label>
                    <Input
                      variant="secondary"
                      placeholder="e.g. ROLE_EDITOR"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                    />
                    <FieldError />
                  </TextField>

                  <TextField name="description">
                    <Label className="text-sm font-medium">Description</Label>
                    <TextArea
                      variant="secondary"
                      placeholder="e.g. Bundles publishing, drafting and editing rights."
                      className="min-h-20"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                    <FieldError />
                  </TextField>
                </Modal.Body>
                <Modal.Footer className="border-border border-t pt-4">
                  <Button slot="close" variant="tertiary" size="sm">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" isDisabled={isCreating || isUpdating}>
                    {(isCreating || isUpdating) && <Spinner size="sm" className="mr-1" />}
                    {selectedRole ? "Save Changes" : "Create"}
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
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete Role?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm">
                  Are you sure you want to delete the role{" "}
                  <strong className="text-foreground">&quot;{selectedRole?.name}&quot;</strong>?
                  This will revoke this role from all assigned users and groups.
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
