"use client";

import { CirclePlay, Eye, Funnel, Pencil, TrashBin } from "@gravity-ui/icons";
import {
  Avatar,
  Button,
  Chip,
  Dropdown,
  Label,
  SearchField,
  Spinner,
  Tooltip,
  toast,
} from "@heroui/react";
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useCallback, useMemo, useState } from "react";
import { useGetAllRolesQuery } from "@/lib/features/role/role-api";
import {
  type UserResponse,
  useGetAllUsersQuery,
  useUpdateUserRolesMutation,
  useUpdateUserStatusMutation,
} from "@/lib/features/user/user-api";
import { usePortalContainer } from "../use-portal-container";

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

function formatDate(iso: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", DATE_FORMAT_OPTIONS);
}

const STATUS_COLORS: Record<string, "success" | "warning" | "default" | "danger"> = {
  ACTIVE: "success",
  INACTIVE: "default",
  PENDING: "warning",
  BANNED: "danger",
  DELETED: "danger",
};

function UsersRowActions({ user }: { user: UserResponse }) {
  const portalContainer = usePortalContainer();
  const { data: rolesList = [] } = useGetAllRolesQuery();
  const [updateStatus, { isLoading: isStatusUpdating }] = useUpdateUserStatusMutation();
  const [updateRoles, { isLoading: isRolesUpdating }] = useUpdateUserRolesMutation();

  const isActive = user.status === "ACTIVE";
  // Support both ADMIN and ROLE_ADMIN role checks
  const isAdmin = user.roles.includes("ADMIN") || user.roles.includes("ROLE_ADMIN");

  const handleStatusToggle = async () => {
    try {
      await updateStatus({ id: user.id, status: isActive ? "INACTIVE" : "ACTIVE" }).unwrap();
    } catch {
      // Handled globally
    }
  };

  const handleRolesToggle = async () => {
    try {
      const adminRole = rolesList.find((r) => r.code === "ROLE_ADMIN" || r.code === "ADMIN");
      const userRole = rolesList.find((r) => r.code === "ROLE_USER" || r.code === "USER");

      if (!userRole || !adminRole) {
        toast.danger("Roles configuration not loaded yet");
        return;
      }

      // If they are currently Admin, demote them to just USER. If not, promote to both USER and ADMIN.
      const roleIds = isAdmin ? [userRole.id] : [userRole.id, adminRole.id];

      await updateRoles({ id: user.id, roleIds }).unwrap();
    } catch {
      // Handled globally
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5" data-user-id={user.id}>
      {/* Direct quick action for Deactivate/Activate */}
      <Tooltip delay={0}>
        <Tooltip.Trigger aria-label={isActive ? "Deactivate user" : "Activate user"}>
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
              <TrashBin className="text-danger size-4" />
            ) : (
              <CirclePlay className="text-success size-4" />
            )}
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>{isActive ? "Deactivate user" : "Activate user"}</Tooltip.Content>
      </Tooltip>

      {/* Dropdown for other role actions */}
      <Dropdown>
        <Tooltip delay={0}>
          <Tooltip.Trigger aria-label="More actions">
            <Button isIconOnly size="sm" variant="tertiary">
              <Icon icon="gravity-ui:ellipsis-vertical" className="size-4" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>More actions</Tooltip.Content>
        </Tooltip>
        <Dropdown.Popover
          placement="bottom end"
          UNSTABLE_portalContainer={portalContainer || undefined}
        >
          <Dropdown.Menu>
            <Dropdown.Item
              id="view-user"
              textValue="View details"
              onAction={() => toast.success(`User: ${user.username} (${user.email})`)}
            >
              <Eye className="size-4" />
              <Label>View Details</Label>
            </Dropdown.Item>
            <Dropdown.Item
              id="toggle-role"
              textValue={isAdmin ? "Demote from Admin" : "Promote to Admin"}
              onAction={handleRolesToggle}
              isDisabled={isRolesUpdating}
            >
              <Pencil className="size-4" />
              <Label>{isAdmin ? "Demote from Admin" : "Promote to Admin"}</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}

export function UsersPage() {
  const portalContainer = usePortalContainer();
  const { data: users = [], isLoading } = useGetAllUsersQuery();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
    const col = sortDescriptor.column as keyof UserResponse;

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

  const columns = useMemo<DataGridColumn<UserResponse>[]>(
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
        id: "member",
        header: "Member",
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
      },
      {
        accessorKey: "status",
        allowsSorting: true,
        cell: (item) => (
          <Chip color={STATUS_COLORS[item.status]} size="sm" variant="soft">
            {item.status}
          </Chip>
        ),
        header: "Status",
        id: "status",
        minWidth: 120,
      },
      {
        id: "roles",
        header: "Roles",
        cell: (item) => (
          <div className="flex flex-wrap gap-1">
            {item.roles.map((role) => (
              <Chip key={role} size="sm" variant="soft" className="text-xs uppercase">
                {role}
              </Chip>
            ))}
          </div>
        ),
        minWidth: 160,
      },
      {
        accessorKey: "createdAt",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted tabular-nums">{formatDate(item.createdAt)}</span>
        ),
        header: "Joined Date",
        id: "createdAt",
        minWidth: 140,
      },
      {
        align: "end",
        cell: (item) => <UsersRowActions user={item} />,
        header: "Actions",
        id: "actions",
        minWidth: 140,
      },
    ],
    []
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-8 pb-10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-base font-semibold">User Management</h2>
          {!isLoading && (
            <Chip size="sm" variant="soft">
              {users.length}
            </Chip>
          )}
        </div>
        <p className="text-muted text-sm">Manage your system users, roles, and statuses.</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown>
            <Button size="sm" variant="secondary">
              <Funnel className="size-4" />
              Status
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
                <Dropdown.Item id="all" textValue="All Statuses">
                  <Label>All Statuses</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
                <Dropdown.Item id="ACTIVE" textValue="Active">
                  <Label>Active</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
                <Dropdown.Item id="INACTIVE" textValue="Inactive">
                  <Label>Inactive</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
                <Dropdown.Item id="PENDING" textValue="Pending">
                  <Label>Pending</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
                <Dropdown.Item id="BANNED" textValue="Banned">
                  <Label>Banned</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
                <Dropdown.Item id="DELETED" textValue="Deleted">
                  <Label>Deleted</Label>
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
            <SearchField.Input placeholder="Search users..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      <DataGrid
        aria-label="Users"
        columns={columns}
        contentClassName="min-w-[820px]"
        data={sortedUsers}
        getRowId={(item) => item.id}
        isLoadingMore={isLoading}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      />
    </div>
  );
}
