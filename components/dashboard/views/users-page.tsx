"use client";

import {
  Avatar,
  Button,
  Chip,
  Dropdown,
  Label,
  SearchField,
  Separator,
  Spinner,
  Tooltip,
  toast,
  Header,
  type Selection,
} from "@heroui/react";
import {
  ActionBar,
  DataGrid,
  EmptyState,
  type DataGridColumn,
  type DataGridColumnSize,
  type DataGridSelection,
  type DataGridSortDescriptor,
} from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useGetAllRolesQuery } from "@/lib/features/role";
import {
  type UserResponse,
  useGetAllUsersQuery,
  useUpdateUserRolesMutation,
  useUpdateUserStatusMutation,
} from "@/lib/features/user";
import { usePortalContainer } from "../use-portal-container";

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

function formatDate(iso: string, locale: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString(locale, DATE_FORMAT_OPTIONS);
}

const STATUS_COLORS: Record<string, "success" | "warning" | "default" | "danger"> = {
  ACTIVE: "success",
  INACTIVE: "default",
  PENDING: "warning",
  BANNED: "danger",
  DELETED: "danger",
};

function UsersRowActions({ user }: { user: UserResponse }) {
  const t = useTranslations("Dashboard");
  const portalContainer = usePortalContainer();
  const { data: rolesList = [] } = useGetAllRolesQuery();
  const [updateStatus, { isLoading: isStatusUpdating }] = useUpdateUserStatusMutation();
  const [updateRoles, { isLoading: isRolesUpdating }] = useUpdateUserRolesMutation();

  const isActive = user.status === "ACTIVE";

  // Map user's role string codes back to role IDs as keys for Dropdown multi-select controlled state
  const userRoleIds = useMemo(() => {
    return new Set(
      user.roles
        .map((code) => rolesList.find((r) => r.code === code)?.id)
        .filter((id): id is number => id !== undefined)
        .map(String)
    );
  }, [user.roles, rolesList]);

  const handleStatusToggle = async () => {
    try {
      await updateStatus({ id: user.id, status: isActive ? "INACTIVE" : "ACTIVE" }).unwrap();
    } catch {
      // Handled globally
    }
  };

  const handleRolesChange = async (keys: Selection) => {
    if (keys === "all") return;
    const selectedIds = Array.from(keys as Set<string>).map(Number);
    if (selectedIds.length === 0) {
      toast.warning(t("overview.assignRoles"));
      return;
    }
    try {
      await updateRoles({ id: user.id, roleIds: selectedIds }).unwrap();
    } catch {
      // Handled globally
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5" data-user-id={user.id}>
      {/* Direct quick action for Deactivate/Activate */}
      <Tooltip delay={0}>
        <Tooltip.Trigger aria-label={isActive ? t("users.deactivate") : t("users.activate")}>
          <Button
            isIconOnly
            size="sm"
            variant={isActive ? "danger-soft" : "tertiary"}
            onPress={handleStatusToggle}
            isDisabled={isStatusUpdating}
          >
            {isStatusUpdating ? (
              <Spinner size="sm" />
            ) : isActive ? (
              <Icon icon="gravity-ui:trash-bin" className="text-danger size-4" />
            ) : (
              <Icon icon="gravity-ui:circle-play" className="text-success size-4" />
            )}
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>{isActive ? t("users.deactivate") : t("users.activate")}</Tooltip.Content>
      </Tooltip>

      {/* Dropdown for role assignments and other actions */}
      <Dropdown>
        <Tooltip delay={0}>
          <Tooltip.Trigger aria-label={t("common.actions")}>
            <Button isIconOnly size="sm" variant="tertiary">
              {isRolesUpdating ? (
                <Spinner size="sm" />
              ) : (
                <Icon icon="gravity-ui:ellipsis-vertical" className="size-4" />
              )}
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>{t("common.actions")}</Tooltip.Content>
        </Tooltip>
        <Dropdown.Popover
          placement="bottom end"
          UNSTABLE_portalContainer={portalContainer || undefined}
        >
          <Dropdown.Menu>
            <Dropdown.Section>
              <Dropdown.Item
                id="view-user"
                textValue={t("users.viewDetails")}
                onAction={() => toast.success(`User: ${user.username} (${user.email})`)}
              >
                <Icon icon="gravity-ui:eye" className="size-4" />
                <Label>{t("users.viewDetails")}</Label>
              </Dropdown.Item>
            </Dropdown.Section>

            <Dropdown.Section
              selectionMode="multiple"
              selectedKeys={userRoleIds}
              onSelectionChange={handleRolesChange}
            >
              <Header>{t("users.assignRoles")}</Header>
              {rolesList.map((role) => (
                <Dropdown.Item key={role.id} id={role.id.toString()} textValue={role.name}>
                  <Dropdown.ItemIndicator />
                  <Label>{role.name.replace("ROLE_", "")}</Label>
                </Dropdown.Item>
              ))}
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}

export function UsersPage() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const portalContainer = usePortalContainer();
  const { data: users = [], isLoading } = useGetAllUsersQuery();
  const [updateUserStatus, { isLoading: isBulkUpdating }] = useUpdateUserStatusMutation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedKeys, setSelectedKeys] = useState<DataGridSelection>(new Set());
  const [columnWidths, setColumnWidths] = useState<Map<string | number, DataGridColumnSize>>(
    () => new Map()
  );
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  // Filter users client-side
  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (user) =>
          user.username.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          user.nickname?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((user) => user.status === statusFilter);
    }

    return result;
  }, [users, search, statusFilter]);

  // Sort users client-side
  const sortedUsers = useMemo(() => {
    if (!sortDescriptor.column) return filteredUsers;
    const col =
      sortDescriptor.column === "member"
        ? "username"
        : (sortDescriptor.column as keyof UserResponse);

    return [...filteredUsers].sort((a, b) => {
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
  }, [filteredUsers, sortDescriptor]);

  const selectedIds = useMemo(() => {
    if (selectedKeys === "all") {
      return new Set(
        filteredUsers.filter((user) => user.status !== "DELETED").map((user) => user.id)
      );
    }

    return new Set(
      [...selectedKeys]
        .map((key) => Number(key))
        .filter((id) => Number.isInteger(id) && users.some((user) => user.id === id))
    );
  }, [filteredUsers, selectedKeys, users]);

  const selectedUsers = useMemo(
    () => users.filter((user) => selectedIds.has(user.id)),
    [selectedIds, users]
  );

  const handleBulkStatusChange = useCallback(
    async (status: "ACTIVE" | "INACTIVE") => {
      if (selectedIds.size === 0) return;

      try {
        await Promise.all([...selectedIds].map((id) => updateUserStatus({ id, status }).unwrap()));
        setSelectedKeys(new Set());
      } catch {
        // Individual mutation failures are reported by the shared API handler.
      }
    },
    [selectedIds, updateUserStatus]
  );

  const handleExportSelected = useCallback(() => {
    if (selectedUsers.length === 0) return;

    const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const csv = [
      "ID,Username,Email,Status,Roles,Joined",
      ...selectedUsers.map((user) =>
        [
          user.id,
          user.username,
          user.email,
          user.status,
          user.roles.join("; "),
          formatDate(user.createdAt, locale),
        ]
          .map(escapeCsv)
          .join(",")
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");

    link.download = "odyssey-users.csv";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [locale, selectedUsers]);

  const handleRowAction = useCallback(
    (key: string | number) => {
      const user = users.find((item) => item.id === Number(key));
      if (user) toast.success(`${user.username} selected`);
    },
    [users]
  );

  const columns = useMemo<DataGridColumn<UserResponse>[]>(
    () => [
      {
        accessorKey: "id",
        allowsResizing: true,
        allowsSorting: true,
        cell: (item) => <span className="font-medium tabular-nums">{item.id}</span>,
        header: t("common.id"),
        id: "id",
        minWidth: 80,
        width: columnWidths.get("id") ?? 80,
      },
      {
        accessorKey: "username",
        allowsResizing: true,
        allowsSorting: true,
        id: "member",
        header: t("users.member"),
        isRowHeader: true,
        cell: (item) => {
          const name = item.nickname || item.username;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <Avatar.Fallback>{name.substring(0, 2).toUpperCase()}</Avatar.Fallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="text-xs font-medium">{name}</span>
                <span className="text-muted text-xs">{item.email}</span>
              </div>
            </div>
          );
        },
        minWidth: 220,
        pinned: "start",
        width: columnWidths.get("member") ?? 240,
      },
      {
        accessorKey: "status",
        allowsResizing: true,
        allowsSorting: true,
        cell: (item) => (
          <Chip color={STATUS_COLORS[item.status]} size="sm" variant="soft">
            {t(`users.${item.status.toLowerCase()}`)}
          </Chip>
        ),
        header: t("users.status"),
        id: "status",
        minWidth: 120,
        width: columnWidths.get("status") ?? 120,
      },
      {
        allowsResizing: true,
        id: "roles",
        header: t("users.roles"),
        cell: (item) => (
          <div className="flex min-w-0 gap-1 overflow-hidden">
            {item.roles.map((role) => (
              <Chip key={role} size="sm" variant="soft" className="uppercase">
                {role}
              </Chip>
            ))}
          </div>
        ),
        minWidth: 160,
        width: columnWidths.get("roles") ?? 180,
      },
      {
        accessorKey: "createdAt",
        allowsResizing: true,
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted tabular-nums">{formatDate(item.createdAt, locale)}</span>
        ),
        header: t("users.joined"),
        id: "createdAt",
        minWidth: 140,
        width: columnWidths.get("createdAt") ?? 140,
      },
      {
        align: "end",
        allowsResizing: false,
        cell: (item) => <UsersRowActions user={item} />,
        header: t("users.actions"),
        id: "actions",
        pinned: "end",
        width: 140,
      },
    ],
    [columnWidths, locale, t]
  );

  const selectionCount = selectedKeys === "all" ? selectedIds.size : selectedIds.size;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-8 pb-10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-base font-semibold">{t("users.title")}</h2>
          {!isLoading && (
            <Chip size="sm" variant="soft">
              {users.length}
            </Chip>
          )}
        </div>
        <p className="text-muted text-sm">{t("users.description")}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown>
            <Button size="sm" variant="secondary">
              <Icon icon="gravity-ui:funnel" className="size-4" />
              {t("users.status")}
            </Button>
            <Dropdown.Popover UNSTABLE_portalContainer={portalContainer || undefined}>
              <Dropdown.Menu
                selectedKeys={new Set([statusFilter])}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const key = [...keys][0] as string | undefined;
                  setStatusFilter(key ?? "all");
                }}
              >
                <Dropdown.Item id="all" textValue={t("users.allStatuses")}>
                  <Label>{t("users.allStatuses")}</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
                <Dropdown.Item id="ACTIVE" textValue={t("users.active")}>
                  <Label>{t("users.active")}</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
                <Dropdown.Item id="INACTIVE" textValue={t("users.inactive")}>
                  <Label>{t("users.inactive")}</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
                <Dropdown.Item id="PENDING" textValue={t("users.pending")}>
                  <Label>{t("users.pending")}</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
                <Dropdown.Item id="BANNED" textValue={t("users.banned")}>
                  <Label>{t("users.banned")}</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
                <Dropdown.Item id="DELETED" textValue={t("users.deleted")}>
                  <Label>{t("users.deleted")}</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>

        <SearchField
          className="w-full sm:w-[240px]"
          name="users-search"
          onChange={handleSearchChange}
          value={search}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder={t("users.search")} />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      <DataGrid
        allowsColumnResize
        aria-label={t("nav.users")}
        columns={columns}
        contentClassName="min-w-[980px]"
        data={sortedUsers}
        disabledKeys={users.filter((user) => user.status === "DELETED").map((user) => user.id)}
        getRowId={(item) => item.id}
        headingHeight={40}
        renderEmptyState={() => (
          <EmptyState size="sm">
            <EmptyState.Header>
              <EmptyState.Title>{t("users.noUsers")}</EmptyState.Title>
              <EmptyState.Description>
                Adjust the search or status filter to continue.
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        )}
        rowHeight={56}
        scrollContainerClassName="max-h-[min(52vh,42rem)] overflow-y-auto"
        selectedKeys={selectedKeys}
        selectionBehavior="toggle"
        selectionMode="multiple"
        showSelectionCheckboxes
        sortDescriptor={sortDescriptor}
        variant="secondary"
        virtualized
        onColumnResizeEnd={(widths) => setColumnWidths(new Map(widths))}
        onRowAction={handleRowAction}
        onSelectionChange={setSelectedKeys}
        onSortChange={setSortDescriptor}
      />

      <ActionBar aria-label={t("users.bulkActions")} isOpen={selectionCount > 0}>
        <ActionBar.Prefix>
          <Chip className="tabular-nums" size="sm">
            {selectionCount}
          </Chip>
        </ActionBar.Prefix>
        <Separator />
        <ActionBar.Content>
          <Button
            aria-label={t("users.activate")}
            isDisabled={isBulkUpdating}
            size="sm"
            variant="ghost"
            onPress={() => void handleBulkStatusChange("ACTIVE")}
          >
            <Icon icon="gravity-ui:circle-play" className="size-4" />
            <span className="action-bar__label">{t("users.activate")}</span>
          </Button>
          <Button
            aria-label={t("users.deactivate")}
            isDisabled={isBulkUpdating}
            size="sm"
            variant="ghost"
            onPress={() => void handleBulkStatusChange("INACTIVE")}
          >
            <Icon icon="gravity-ui:trash-bin" className="size-4" />
            <span className="action-bar__label">{t("users.deactivate")}</span>
          </Button>
          <Button
            aria-label={t("users.export")}
            size="sm"
            variant="ghost"
            onPress={handleExportSelected}
          >
            <Icon icon="gravity-ui:arrow-down-to-line" className="size-4" />
            <span className="action-bar__label">{t("users.export")}</span>
          </Button>
        </ActionBar.Content>
        <Separator />
        <ActionBar.Suffix>
          <Tooltip delay={0}>
            <Tooltip.Trigger aria-label={t("users.clearSelection")}>
              <Button
                isIconOnly
                aria-label={t("users.clearSelection")}
                size="sm"
                variant="ghost"
                onPress={() => setSelectedKeys(new Set())}
              >
                <Icon icon="gravity-ui:xmark" className="size-4" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>{t("users.clearSelection")}</Tooltip.Content>
          </Tooltip>
        </ActionBar.Suffix>
      </ActionBar>
    </div>
  );
}
