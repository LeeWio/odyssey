"use client";

import { useMemo, useState } from "react";
import { Card, Button, Checkbox, Label, Spinner, ListBox, Description, Chip, Tooltip } from "@heroui/react";
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
import { motion, AnimatePresence } from "motion/react";

// --- 模块卡片组件 (一级菜单 Catalog) ---
function PermissionModuleCard({
  rootNode,
  checkedIds,
  onCheckChange,
}: {
  rootNode: MenuResponse;
  checkedIds: Set<number>;
  onCheckChange: (id: number, checked: boolean) => void;
}) {
  const isChecked = checkedIds.has(rootNode.id);
  const [isOpen, setIsOpen] = useState(true);

  // 1. 核心过滤：根节点下直属的二级 MENU 子菜单 (type !== 2) 与 直属的操作 BUTTON (type === 2)
  const menuChildren = rootNode.children?.filter((c) => c.type !== 2) || [];
  const actionChildren = rootNode.children?.filter((c) => c.type === 2) || [];

  // 辅助函数：计算当前模块已选中的子权限个数
  const getSelectionCount = (node: MenuResponse): { selected: number; total: number } => {
    let selected = 0;
    let total = 0;

    const traverse = (n: MenuResponse) => {
      total++;
      if (checkedIds.has(n.id)) {
        selected++;
      }
      n.children?.forEach(traverse);
    };

    node.children?.forEach(traverse);
    return { selected, total };
  };

  const { selected, total } = getSelectionCount(rootNode);

  return (
    <Card className="border border-border/80 rounded-3xl overflow-hidden shadow-sm bg-surface mb-5 hover:shadow-md transition-all duration-300">
      {/* 模块大头部与全局全选 */}
      <Card.Header className="bg-surface-secondary/40 border-b border-border/40 py-4 px-5 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <Checkbox
            isSelected={isChecked}
            onChange={(checked) => onCheckChange(rootNode.id, checked)}
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <span className="text-foreground text-sm font-bold flex items-center gap-2 select-none">
                {rootNode.icon && <Icon icon={rootNode.icon} className="text-primary size-5" />}
                {rootNode.name}
              </span>
            </Checkbox.Content>
          </Checkbox>
          <Chip size="sm" variant="soft" color="accent" className="font-mono text-[9px] scale-90">
            {rootNode.type === 0 ? "目录" : rootNode.type === 1 ? "菜单" : "操作"}
          </Chip>
        </div>

        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="text-muted text-xs tabular-nums font-semibold">
              已选 {selected} / {total} 项
            </span>
          )}
          <Tooltip delay={0}>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => setIsOpen(!isOpen)}
              className="size-7"
              aria-label={isOpen ? "收起模块" : "展开模块"}
            >
              <Icon
                icon="gravity-ui:chevron-down"
                className={`size-4 text-muted transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
            <Tooltip.Content>{isOpen ? "收起模块" : "展开模块"}</Tooltip.Content>
          </Tooltip>
        </div>
      </Card.Header>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card.Content className="p-5 flex flex-col gap-5">
              {/* 直属操作按钮 (如果根分类直属挂载了 BUTTON 类型) */}
              {actionChildren.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-surface-secondary/30 border border-border/20 rounded-2xl p-4 mb-2">
                  {actionChildren.map((action) => {
                    const isActionChecked = checkedIds.has(action.id);
                    return (
                      <Card key={action.id} className="bg-surface border border-border/50 hover:bg-surface-secondary/40 transition-colors duration-250 p-3.5 rounded-xl shadow-none">
                        <Checkbox
                          isSelected={isActionChecked}
                          onChange={(checked) => onCheckChange(action.id, checked)}
                          variant="secondary"
                          className="w-full"
                        >
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            <div className="flex flex-col items-start gap-1 select-none">
                              <span className="text-foreground text-xs font-bold leading-none">{action.name}</span>
                              {action.permission && (
                                <span className="text-[10px] text-default-400 font-mono leading-none mt-1">({action.permission})</span>
                              )}
                            </div>
                          </Checkbox.Content>
                        </Checkbox>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* 直属子菜单分组 (二级 MENU 子分类) */}
              {menuChildren.length > 0 ? (
                menuChildren.map((child) => (
                  <PermissionSubGroup
                    key={child.id}
                    node={child}
                    checkedIds={checkedIds}
                    onCheckChange={onCheckChange}
                  />
                ))
              ) : (
                actionChildren.length === 0 && (
                  <p className="text-muted text-xs py-4 text-center">暂无分配任何子权限</p>
                )
              )}
            </Card.Content>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// --- 子菜单/操作级权限分组组件 (二级菜单) ---
function PermissionSubGroup({
  node,
  checkedIds,
  onCheckChange,
}: {
  node: MenuResponse;
  checkedIds: Set<number>;
  onCheckChange: (id: number, checked: boolean) => void;
}) {
  const isChecked = checkedIds.has(node.id);

  // 区分操作型权限(BUTTON/叶子节点，即 type === 2) 与 嵌套子菜单(MENU，即 type !== 2)
  const menuChildren = node.children?.filter((c) => c.type !== 2) || [];
  const actionChildren = node.children?.filter((c) => c.type === 2) || [];

  return (
    <div className="bg-surface-secondary/20 border border-border/30 rounded-2xl p-4 flex flex-col gap-4">
      {/* 子菜单栏头 */}
      <div className="flex items-center justify-between border-b border-border/20 pb-2.5 select-none">
        <Checkbox
          isSelected={isChecked}
          onChange={(checked) => onCheckChange(node.id, checked)}
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <span className="text-foreground text-xs md:text-sm font-bold flex items-center gap-2 select-none">
              {node.icon && <Icon icon={node.icon} className="text-muted size-4" />}
              {node.name}
            </span>
          </Checkbox.Content>
        </Checkbox>
        <Chip size="sm" variant="soft" className="font-mono text-[8px] scale-90">
          {node.type === 0 ? "目录" : node.type === 1 ? "菜单" : "操作"}
        </Chip>
      </div>

      {/* 核心改版：操作型叶子节点权限，100% 采用官方 Checkbox + Card 网格排列 */}
      {actionChildren.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actionChildren.map((action) => {
            const isActionChecked = checkedIds.has(action.id);
            return (
              <Card key={action.id} className="transition-colors duration-250">
                <Checkbox
                  isSelected={isActionChecked}
                  onChange={(checked) => onCheckChange(action.id, checked)}
                  variant="secondary"
                  className="w-full"
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <div className="flex flex-col items-start gap-1 select-none">
                      <span className="text-foreground text-xs font-bold leading-none">{action.name}</span>
                      {action.permission && (
                        <span className="text-[10px] text-default-400 font-mono leading-none mt-1">({action.permission})</span>
                      )}
                    </div>
                  </Checkbox.Content>
                </Checkbox>
              </Card>
            );
          })}
        </div>
      )}

      {/* 如果仍然有多级层级菜单，递归渲染 */}
      {menuChildren.length > 0 && (
        <div className="flex flex-col gap-4 pl-4 border-l border-border/40">
          {menuChildren.map((subChild) => (
            <PermissionSubGroup
              key={subChild.id}
              node={subChild}
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
  // Query roles and entire menu structure
  const { data: roles = EMPTY_ROLES, isLoading: isRolesLoading } = useGetAllRolesQuery();
  const { data: menuTree = EMPTY_MENUS, isLoading: isTreeLoading } = useGetAdminMenuTreeQuery();

  // Selected active role state
  const [selectedRoleState, setSelectedRoleState] = useState<RoleResponse | null>(null);
  const selectedRole = selectedRoleState || (roles.length > 0 ? roles[0] : null);
  const setSelectedRole = setSelectedRoleState;

  // Query assigned menu IDs for the active selected role
  const { data: roleMenuIds = EMPTY_ROLE_MENUS, isFetching: isRoleMenusLoading } =
    useGetRoleMenuIdsQuery(selectedRole?.id as number, { skip: !selectedRole });

  // Sync checked IDs once fetched during rendering
  const [prevRoleMenuIds, setPrevRoleMenuIds] = useState<number[] | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());

  if (roleMenuIds !== prevRoleMenuIds) {
    setPrevRoleMenuIds(roleMenuIds);
    setCheckedIds(new Set(roleMenuIds));
  }

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
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
      {/* 头部说明 */}
      <div className="border-border flex flex-col gap-2 border-b pb-4">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">安全角色与权限配置</h1>
        <p className="text-muted mt-1 text-sm">
          设置系统安全角色并对一、二级菜单、系统级接口、按钮（BUTTON）行为进行细粒度鉴权映射。
        </p>
      </div>

      <div className="mt-2 grid grid-cols-1 items-start gap-6 md:grid-cols-[280px_1fr]">
        {/* Left Card: Roles List */}
        <Card className="shrink-0 rounded-3xl border border-border/60 shadow-sm bg-surface">
          <Card.Header className="border-border/40 flex flex-col items-start gap-1 border-b p-5 select-none">
            <Card.Title className="flex items-center gap-1.5 text-sm font-bold">
              <Icon icon="gravity-ui:person" className="text-primary size-4" />
              安全角色 (Roles)
            </Card.Title>
            <Card.Description className="text-xs">
              选择角色绑定细粒度授权
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
                <ListBox.Item id={role.id.toString()} textValue={role.name} key={role.id} className="rounded-2xl">
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

        {/* Right Panel: Permissions Modules Grid */}
        <div className="flex flex-col gap-1">
          {/* 保存全局动作按钮区 */}
          <div className="flex items-center justify-between mb-4 bg-surface border border-border/50 rounded-2xl px-5 py-3 shadow-sm select-none">
            <div className="flex flex-col gap-0.5">
              <div className="text-sm font-bold flex items-center gap-1.5">
                <Icon icon="gravity-ui:sliders" className="text-primary size-4" />
                权限映射表 (Permissions)
              </div>
              {selectedRole && (
                <span className="text-muted text-xs">
                  正在配置角色：<span className="text-foreground font-semibold">{selectedRole.name}</span>
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
                    <span>保存权限映射</span>
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
              <div className="text-default-400 bg-surface border border-border flex h-48 flex-col items-center justify-center gap-2 rounded-3xl">
                <Icon icon="gravity-ui:circle-dashed" className="size-8 animate-spin" />
                <span className="text-xs">系统当前未映射任何权限树节点</span>
              </div>
            ) : (
              <div>
                {menuTree.map((root) => (
                  <PermissionModuleCard
                    key={root.id}
                    rootNode={root}
                    checkedIds={checkedIds}
                    onCheckChange={handleNodeToggle}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
