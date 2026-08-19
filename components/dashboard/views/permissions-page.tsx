"use client";

import {
  Accordion,
  Button,
  Card,
  Checkbox,
  Description,
  Label,
  ListBox,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { type MenuResponse, useGetAdminMenuTreeQuery } from "@/lib/features/permission";
import {
  type RoleResponse,
  useAssignRoleMenusMutation,
  useGetAllRolesQuery,
  useGetRoleMenuIdsQuery,
} from "@/lib/features/role";

export function PermissionsPage() {
  // Query roles and entire menu structure
  const { data: roles = [], isLoading: isRolesLoading } = useGetAllRolesQuery();
  const { data: menuTree = [], isLoading: isTreeLoading } = useGetAdminMenuTreeQuery();

  // Selected active role state
  const [selectedRoleState, setSelectedRoleState] = useState<RoleResponse | null>(null);
  const selectedRole = selectedRoleState || (roles.length > 0 ? roles[0] : null);
  const setSelectedRole = setSelectedRoleState;

  // Query assigned menu IDs for the active selected role
  const { data: roleMenuIds = [], isFetching: isRoleMenusLoading } = useGetRoleMenuIdsQuery(
    selectedRole?.id as number,
    { skip: !selectedRole }
  );

  // Sync checked IDs once fetched during rendering
  const [prevRoleMenuIds, setPrevRoleMenuIds] = useState<number[] | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());

  if (roleMenuIds !== prevRoleMenuIds) {
    setPrevRoleMenuIds(roleMenuIds);
    setCheckedIds(new Set(roleMenuIds));
  }

  // Mutation to save assignment
  const [assignRoleMenus, { isLoading: isSaving }] = useAssignRoleMenusMutation();

  // Helper: toggle a node and recursively toggle all of its descendant children
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
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
      {/* Header Description */}
      <div className="border-border flex flex-col gap-2 border-b pb-4">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">安全角色与权限配置</h1>
        <p className="text-muted mt-1 text-sm">
          通过为不同的安全角色勾选菜单、功能页或细粒度按钮行为（Create、Edit、Delete），实现全站精细化权限控制。
        </p>
      </div>

      <div className="mt-2 grid grid-cols-1 items-start gap-6 md:grid-cols-[280px_1fr]">
        {/* Left Side: Roles list card */}
        <Card className="border-border/60 bg-surface shrink-0 rounded-3xl border shadow-sm">
          <Card.Header className="border-border/40 flex flex-col items-start gap-1 border-b p-5 select-none">
            <Card.Title className="flex items-center gap-1.5 text-sm font-bold">
              <Icon icon="gravity-ui:person" className="text-primary size-4" />
              安全角色 (Roles)
            </Card.Title>
            <Card.Description className="text-xs">选择角色并配置其专属权限</Card.Description>
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
                <ListBox.Item
                  id={role.id.toString()}
                  textValue={role.name}
                  key={role.id}
                  className="rounded-2xl"
                >
                  <div className="flex flex-col items-start gap-1 select-none">
                    <Label className="text-xs font-bold">{role.name}</Label>
                    <Description className="text-default-400 font-mono text-[9px] leading-none">
                      {role.code}
                    </Description>
                  </div>
                </ListBox.Item>
              ))}
            </ListBox>
          </Card.Content>
        </Card>

        {/* Right Side: Permissions Mapping (100% native HeroUI Accordion structure) */}
        <div className="flex flex-col gap-1">
          {/* Action Header bar */}
          <div className="bg-surface border-border/50 mb-4 flex items-center justify-between rounded-2xl border px-5 py-3 shadow-sm select-none">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-sm font-bold">
                <Icon icon="gravity-ui:sliders" className="text-primary size-4" />
                权限绑定菜单数 (Menus & Actions)
              </div>
              {selectedRole && (
                <span className="text-muted text-xs">
                  当前选中角色：
                  <span className="text-foreground font-semibold">{selectedRole.name}</span>
                </span>
              )}
            </div>

            {selectedRole && (
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-1.5 font-bold shadow-sm"
                onPress={handleSavePermissions}
                isDisabled={isSaving || isRoleMenusLoading}
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" />
                    <span>正在保存...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="gravity-ui:circle-check" className="size-4" />
                    <span>保存权限配置</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="relative min-h-[300px]">
            {isRoleMenusLoading && (
              <div className="bg-background/40 absolute inset-0 z-25 flex items-center justify-center rounded-3xl backdrop-blur-[1px]">
                <Spinner size="md" />
              </div>
            )}

            {menuTree.length === 0 ? (
              <div className="text-default-400 bg-surface border-border flex h-56 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed p-6 text-center">
                <Icon icon="gravity-ui:circle-dashed" className="text-accent size-8 animate-spin" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-foreground text-sm font-semibold">
                    系统当前未映射任何权限树节点
                  </span>
                  <span className="text-muted-foreground text-xs">
                    请在数据库 sys_menu 表中初始化种子菜单数据。
                  </span>
                </div>
              </div>
            ) : (
              /* 100% Native HeroUI Accordion */
              <Accordion
                variant="surface"
                allowsMultipleExpanded
                className="flex flex-col gap-3 p-0"
              >
                {menuTree.map((root) => {
                  const isChecked = checkedIds.has(root.id);
                  const subMenus = root.children?.filter((c) => c.type !== 2) || [];

                  return (
                    <Accordion.Item key={root.id} id={root.id.toString()}>
                      <Accordion.Heading>
                        <Accordion.Trigger>
                          <div
                            className="flex items-center gap-3 select-none"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              isSelected={isChecked}
                              onChange={(checked) => handleNodeToggle(root.id, checked)}
                            >
                              <span className="text-foreground flex items-center gap-1.5 text-sm font-bold">
                                {root.icon && (
                                  <Icon icon={root.icon} className="text-primary size-4" />
                                )}
                                {root.name}
                              </span>
                            </Checkbox>
                          </div>
                          <Accordion.Indicator />
                        </Accordion.Trigger>
                      </Accordion.Heading>
                      <Accordion.Panel>
                        <Accordion.Body className="flex flex-col gap-4 px-1 py-2">
                          {subMenus.length > 0 ? (
                            subMenus.map((subMenu) => {
                              const isSubChecked = checkedIds.has(subMenu.id);
                              const actions = subMenu.children?.filter((c) => c.type === 2) || [];

                              return (
                                <Card
                                  key={subMenu.id}
                                  className="bg-default-50/50 border-default-100 rounded-xl border p-4 shadow-none"
                                >
                                  <Card.Header className="border-default-100 flex items-center justify-between border-b p-0 pb-2 select-none">
                                    <Checkbox
                                      isSelected={isSubChecked}
                                      onChange={(checked) => handleNodeToggle(subMenu.id, checked)}
                                    >
                                      <span className="text-foreground flex items-center gap-1.5 text-xs font-bold md:text-sm">
                                        {subMenu.icon && (
                                          <Icon
                                            icon={subMenu.icon}
                                            className="text-muted-foreground size-3.5"
                                          />
                                        )}
                                        {subMenu.name}
                                      </span>
                                    </Checkbox>
                                  </Card.Header>
                                  <Card.Content>
                                    <div className="flex flex-wrap gap-x-5 gap-y-3 pt-3">
                                      {actions.length > 0 ? (
                                        actions.map((action) => {
                                          const isActionChecked = checkedIds.has(action.id);
                                          return (
                                            <Checkbox
                                              key={action.id}
                                              isSelected={isActionChecked}
                                              onChange={(checked) =>
                                                handleNodeToggle(action.id, checked)
                                              }
                                              className="select-none"
                                            >
                                              <div className="flex flex-col items-start gap-0.5">
                                                <span className="text-foreground text-xs font-semibold">
                                                  {action.name}
                                                </span>
                                                {action.permission && (
                                                  <span className="text-muted-foreground font-mono text-[9px] leading-none">
                                                    {action.permission}
                                                  </span>
                                                )}
                                              </div>
                                            </Checkbox>
                                          );
                                        })
                                      ) : (
                                        <span className="text-muted-foreground text-xs">
                                          无额外页面操作动作
                                        </span>
                                      )}
                                    </div>
                                  </Card.Content>
                                </Card>
                              );
                            })
                          ) : (
                            <p className="text-muted-foreground py-2 text-center text-xs">
                              暂无分配任何子菜单
                            </p>
                          )}
                        </Accordion.Body>
                      </Accordion.Panel>
                    </Accordion.Item>
                  );
                })}
              </Accordion>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
