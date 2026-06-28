"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, Button, Checkbox, Label, Spinner, toast, ListBox, Description } from "@heroui/react";
import {
  useGetAllRolesQuery,
  useGetRoleMenuIdsQuery,
  useAssignRoleMenusMutation,
  type RoleResponse,
} from "@/lib/features/role/role-api";
import {
  useGetAdminMenuTreeQuery,
  type MenuResponse,
} from "@/lib/features/permission/permission-api";
import { Icon } from "@iconify/react";
import { usePortalContainer } from "../use-portal-container";

interface PermissionNodeProps {
  node: MenuResponse;
  checkedIds: Set<number>;
  onCheckChange: (id: number, checked: boolean) => void;
}

function PermissionNode({ node, checkedIds, onCheckChange }: PermissionNodeProps) {
  const isChecked = checkedIds.has(node.id);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 py-0.5">
        <Checkbox isSelected={isChecked} onChange={(checked) => onCheckChange(node.id, checked)}>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <Checkbox.Content>
            <Label className="text-foreground flex cursor-pointer items-center gap-1.5 text-xs font-medium select-none">
              {node.icon && <Icon icon={node.icon} className="text-default-400 size-4" />}
              <span>{node.name}</span>
              {node.permission && (
                <span className="bg-default-100 text-default-500 rounded px-1.5 py-0.5 font-mono text-[10px]">
                  {node.permission}
                </span>
              )}
            </Label>
          </Checkbox.Content>
        </Checkbox>
      </div>

      {node.children && node.children.length > 0 && (
        <div className="border-default-200 ml-3.5 flex flex-col gap-2 border-l pl-4">
          {node.children.map((child) => (
            <PermissionNode
              key={child.id}
              node={child}
              checkedIds={checkedIds}
              onCheckChange={onCheckChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const EMPTY_ROLES: RoleResponse[] = [];
const EMPTY_MENUS: MenuResponse[] = [];
const EMPTY_ROLE_MENUS: number[] = [];

export function PermissionsPage() {
  const portalContainer = usePortalContainer();

  // Query roles and entire menu structure
  const { data: roles = EMPTY_ROLES, isLoading: isRolesLoading } = useGetAllRolesQuery();
  const { data: menuTree = EMPTY_MENUS, isLoading: isTreeLoading } = useGetAdminMenuTreeQuery();

  // Selected active role state
  const [selectedRole, setSelectedRole] = useState<RoleResponse | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());

  // Auto-select first role on initial load
  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0]);
    }
  }, [roles, selectedRole]);

  // Query assigned menu IDs for the active selected role
  const { data: roleMenuIds = EMPTY_ROLE_MENUS, isFetching: isRoleMenusLoading } =
    useGetRoleMenuIdsQuery(selectedRole?.id as number, { skip: !selectedRole });

  // Sync checked IDs once fetched
  useEffect(() => {
    if (roleMenuIds) {
      setCheckedIds(new Set(roleMenuIds));
    }
  }, [roleMenuIds]);

  // Mutation to save assignment
  const [assignRoleMenus, { isLoading: isSaving }] = useAssignRoleMenusMutation();

  const handleNodeToggle = (nodeId: number, isChecked: boolean) => {
    const nextChecked = new Set(checkedIds);

    const findAndToggle = (current: MenuResponse) => {
      if (current.id === nodeId) {
        const toggleAll = (item: MenuResponse) => {
          if (isChecked) {
            nextChecked.add(item.id);
          } else {
            nextChecked.delete(item.id);
          }
          item.children?.forEach(toggleAll);
        };
        toggleAll(current);
        return true;
      }
      if (current.children) {
        for (const child of current.children) {
          if (findAndToggle(child)) return true;
        }
      }
      return false;
    };

    for (const root of menuTree) {
      if (findAndToggle(root)) break;
    }

    setCheckedIds(nextChecked);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      await assignRoleMenus({
        id: selectedRole.id,
        menuIds: Array.from(checkedIds),
      }).unwrap();
    } catch {
      // Handled globally
    }
  };

  const isDataLoading = isRolesLoading || isTreeLoading;

  if (isDataLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2">
        <Spinner size="lg" />
        <p className="text-muted text-sm">Loading security configuration...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-4 pb-10">
      <div className="flex flex-col gap-1 select-none">
        <h2 className="text-foreground text-base font-semibold">Roles & Permissions</h2>
        <p className="text-muted text-sm">
          Configure security roles and map hierarchical menu permissions.
        </p>
      </div>

      <div className="mt-2 grid grid-cols-1 items-start gap-6 md:grid-cols-[280px_1fr]">
        {/* Left Card: Roles List */}
        <Card className="shrink-0 rounded-2xl">
          <Card.Header className="border-default-100 flex flex-col items-start gap-1 border-b p-5">
            <Card.Title className="flex items-center gap-1.5 text-sm font-bold select-none">
              <Icon icon="gravity-ui:person" className="text-primary size-4" />
              Security Roles
            </Card.Title>
            <Card.Description className="text-xs">
              Select a role to bind permissions
            </Card.Description>
          </Card.Header>

          <Card.Content className="p-2">
            <ListBox
              aria-label="Security Roles"
              selectionMode="single"
              selectedKeys={selectedRole ? new Set([selectedRole.id.toString()]) : new Set()}
              onSelectionChange={(keys) => {
                const idStr = Array.from(keys)[0] as string | undefined;
                if (idStr) {
                  const role = roles.find((r) => r.id.toString() === idStr);
                  if (role) setSelectedRole(role);
                }
              }}
            >
              {roles.map((role) => (
                <ListBox.Item id={role.id.toString()} textValue={role.name} key={role.id}>
                  <div className="flex flex-col items-start gap-1 select-none">
                    <Label className="text-xs font-semibold">{role.name}</Label>
                    <Description className="text-default-400 font-mono text-[10px] leading-none">
                      {role.code}
                    </Description>
                  </div>
                </ListBox.Item>
              ))}
            </ListBox>
          </Card.Content>
        </Card>

        {/* Right Card: Permissions Tree */}
        <Card className="rounded-2xl">
          <Card.Header className="border-default-100 flex items-center justify-between border-b p-5 select-none">
            <div className="flex flex-col gap-1">
              <Card.Title className="flex items-center gap-1.5 text-sm font-bold">
                <Icon icon="gravity-ui:sliders" className="text-primary size-4" />
                Permissions Mapping
              </Card.Title>
              {selectedRole && (
                <Card.Description className="text-xs">
                  Configure active permissions for{" "}
                  <span className="text-foreground font-semibold">{selectedRole.name}</span>
                </Card.Description>
              )}
            </div>

            {selectedRole && (
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-1.5 font-semibold shadow-sm"
                onPress={handleSavePermissions}
                isDisabled={isSaving || isRoleMenusLoading}
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="gravity-ui:circle-check" className="size-4" />
                    <span>Save Permissions</span>
                  </>
                )}
              </Button>
            )}
          </Card.Header>

          <Card.Content className="relative min-h-[300px] p-6">
            {isRoleMenusLoading && (
              <div className="bg-background/50 absolute inset-0 z-10 flex items-center justify-center rounded-2xl backdrop-blur-[1px]">
                <Spinner size="md" />
              </div>
            )}

            {menuTree.length === 0 ? (
              <div className="text-default-400 flex h-48 flex-col items-center justify-center gap-2">
                <Icon icon="gravity-ui:circle-dashed" className="size-8 animate-spin" />
                <span className="text-xs">No menus mapped in the system</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {menuTree.map((root) => (
                  <PermissionNode
                    key={root.id}
                    node={root}
                    checkedIds={checkedIds}
                    onCheckChange={handleNodeToggle}
                  />
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
