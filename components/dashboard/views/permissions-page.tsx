"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, Button, Checkbox, Label, Spinner, toast, ListBox, Description } from "@heroui/react";
import { useGetAllRolesQuery, useGetRoleMenuIdsQuery, useAssignRoleMenusMutation, type RoleResponse } from "@/lib/features/role/role-api";
import { useGetAdminMenuTreeQuery, type MenuResponse } from "@/lib/features/permission/permission-api";
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
        <Checkbox
          isSelected={isChecked}
          onChange={(checked) => onCheckChange(node.id, checked)}
        >
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <Checkbox.Content>
            <Label className="text-xs font-medium cursor-pointer flex items-center gap-1.5 select-none text-foreground">
              {node.icon && <Icon icon={node.icon} className="size-4 text-default-400" />}
              <span>{node.name}</span>
              {node.permission && (
                <span className="text-[10px] font-mono bg-default-100 px-1.5 py-0.5 rounded text-default-500">
                  {node.permission}
                </span>
              )}
            </Label>
          </Checkbox.Content>
        </Checkbox>
      </div>

      {node.children && node.children.length > 0 && (
        <div className="flex flex-col gap-2 ml-3.5 pl-4 border-l border-default-200">
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
  const { data: roleMenuIds = EMPTY_ROLE_MENUS, isFetching: isRoleMenusLoading } = useGetRoleMenuIdsQuery(
    selectedRole?.id as number,
    { skip: !selectedRole }
  );

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
        <p className="text-muted text-sm">Configure security roles and map hierarchical menu permissions.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr] items-start mt-2">
        
        {/* Left Card: Roles List */}
        <Card className="rounded-2xl shrink-0">
          <Card.Header className="flex flex-col items-start gap-1 p-5 border-b border-default-100">
            <Card.Title className="text-sm font-bold flex items-center gap-1.5 select-none">
              <Icon icon="gravity-ui:person" className="text-primary size-4" />
              Security Roles
            </Card.Title>
            <Card.Description className="text-xs">Select a role to bind permissions</Card.Description>
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
                    <Description className="text-[10px] font-mono leading-none text-default-400">
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
          <Card.Header className="flex items-center justify-between p-5 border-b border-default-100 select-none">
            <div className="flex flex-col gap-1">
              <Card.Title className="text-sm font-bold flex items-center gap-1.5">
                <Icon icon="gravity-ui:sliders" className="text-primary size-4" />
                Permissions Mapping
              </Card.Title>
              {selectedRole && (
                <Card.Description className="text-xs">
                  Configure active permissions for <span className="font-semibold text-foreground">{selectedRole.name}</span>
                </Card.Description>
              )}
            </div>

            {selectedRole && (
              <Button
                variant="primary"
                size="sm"
                className="font-semibold shadow-sm flex items-center gap-1.5"
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

          <Card.Content className="p-6 relative min-h-[300px]">
            {isRoleMenusLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
                <Spinner size="md" />
              </div>
            )}

            {menuTree.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-default-400">
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
