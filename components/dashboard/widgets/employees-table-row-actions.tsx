"use client";

import type { Selection } from "react-aria-components";

import { Eye, Pencil, TrashBin } from "@gravity-ui/icons";
import {
  AlertDialog,
  Button,
  Description,
  Dropdown,
  Header,
  Label,
  Modal,
  Spinner,
  toast,
} from "@heroui/react";
import { useMemo, useState } from "react";

import { useGetAllRolesQuery } from "@/lib/features/role";
import {
  useUpdateUserRolesMutation,
  useUpdateUserStatusMutation,
  type UserResponse,
} from "@/lib/features/user";

import { IconButton } from "../icon-button";
import { useSheetPortal } from "../use-sheet-portal";

export interface RowActionsProps {
  user: UserResponse;
}

export function RowActions({ user }: RowActionsProps) {
  const portalContainer = useSheetPortal();
  const { data: rolesList = [] } = useGetAllRolesQuery();
  const [updateStatus, { isLoading: isStatusUpdating }] = useUpdateUserStatusMutation();
  const [updateRoles, { isLoading: isRolesUpdating }] = useUpdateUserRolesMutation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRolesOpen, setIsRolesOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const isActive = user.status === "ACTIVE";
  const userRoleIds = useMemo(
    () =>
      new Set(
        user.roles
          .map((code) => rolesList.find((role) => role.code === code)?.id)
          .filter((id): id is number => id !== undefined)
          .map(String)
      ),
    [rolesList, user.roles]
  );

  const saveRoles = async (keys: Selection) => {
    if (keys === "all") return;
    const roleIds = [...keys].map(Number);
    if (roleIds.length === 0) {
      toast.warning("A user must have at least one role.");
      return;
    }
    await updateRoles({ id: user.id, roleIds }).unwrap();
    setIsRolesOpen(false);
  };

  return (
    <div className="flex items-center justify-end gap-0.5">
      <IconButton label="View" size="sm" variant="tertiary" onPress={() => setIsProfileOpen(true)}>
        <Eye className="size-4" />
      </IconButton>
      <Dropdown isOpen={isRolesOpen} onOpenChange={setIsRolesOpen}>
        <IconButton isDisabled={isRolesUpdating} label="Edit roles" size="sm" variant="tertiary">
          {isRolesUpdating ? <Spinner size="sm" /> : <Pencil className="size-4" />}
        </IconButton>
        <Dropdown.Popover
          placement="bottom end"
          UNSTABLE_portalContainer={portalContainer || undefined}
        >
          <Dropdown.Menu
            selectedKeys={userRoleIds}
            selectionMode="multiple"
            onSelectionChange={(keys) => void saveRoles(keys)}
          >
            <Dropdown.Section>
              <Header>Assign Roles</Header>
              {rolesList.map((role) => (
                <Dropdown.Item key={role.id} id={String(role.id)} textValue={role.name}>
                  <Dropdown.ItemIndicator />
                  <Label>{role.name.replace("ROLE_", "")}</Label>
                </Dropdown.Item>
              ))}
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      <IconButton
        isDisabled={isStatusUpdating || user.status === "DELETED"}
        label={isActive ? "Deactivate" : "Activate"}
        size="sm"
        variant="danger-soft"
        onPress={() => setIsStatusOpen(true)}
      >
        <TrashBin className="size-4" />
      </IconButton>

      <Modal>
        <Modal.Backdrop
          isOpen={isProfileOpen}
          UNSTABLE_portalContainer={portalContainer || undefined}
          onOpenChange={setIsProfileOpen}
        >
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>{user.nickname || user.username}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <Description>{user.email}</Description>
                <dl className="grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
                  <dt className="text-muted">Username</dt>
                  <dd>{user.username}</dd>
                  <dt className="text-muted">Status</dt>
                  <dd>{user.status}</dd>
                  <dt className="text-muted">Roles</dt>
                  <dd>
                    {user.roles.map((role) => role.replace("ROLE_", "")).join(", ") || "None"}
                  </dd>
                  <dt className="text-muted">Joined</dt>
                  <dd>
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </dd>
                </dl>
              </Modal.Body>
              <Modal.Footer>
                <Button size="sm" variant="tertiary" onPress={() => setIsProfileOpen(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <AlertDialog>
        <AlertDialog.Backdrop
          isOpen={isStatusOpen}
          UNSTABLE_portalContainer={portalContainer || undefined}
          onOpenChange={setIsStatusOpen}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-md">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status={isActive ? "danger" : "success"} />
                <AlertDialog.Heading>
                  {isActive ? "Deactivate this member?" : "Activate this member?"}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {user.nickname || user.username} will be marked {isActive ? "inactive" : "active"}.
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" size="sm" variant="tertiary">
                  Cancel
                </Button>
                <Button
                  isDisabled={isStatusUpdating}
                  size="sm"
                  variant={isActive ? "danger" : "primary"}
                  onPress={async () => {
                    await updateStatus({
                      id: user.id,
                      status: isActive ? "INACTIVE" : "ACTIVE",
                    }).unwrap();
                    setIsStatusOpen(false);
                  }}
                >
                  {isActive ? "Deactivate" : "Activate"}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}
