"use client";

import { Copy, Sliders } from "@gravity-ui/icons";
import { Avatar, Button, Chip, SearchField } from "@heroui/react";
import type { DataGridColumn, DataGridSortDescriptor } from "@heroui-pro/react";
import { DataGrid } from "@heroui-pro/react";
import { useCallback, useMemo, useState } from "react";
import { useGetAllUsersQuery, type UserResponse } from "@/lib/features/user/user-api";

export function UsersTable() {
  const { data: users = [], isLoading, isFetching } = useGetAllUsersQuery();

  const [search, setSearch] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "username",
    direction: "ascending",
  });

  const filteredUsers = useMemo<UserResponse[]>(() => {
    if (!search) return [...users];
    const q = search.toLowerCase();

    return users.filter(
      (user) => user.username.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  const sortedUsers = useMemo<UserResponse[]>(() => {
    if (!sortDescriptor.column) return filteredUsers;
    const column = sortDescriptor.column as keyof UserResponse;

    return [...filteredUsers].sort((a, b) => {
      const first = String(a[column] ?? "");
      const second = String(b[column] ?? "");
      const direction = sortDescriptor.direction === "descending" ? -1 : 1;

      return first.localeCompare(second) * direction;
    });
  }, [filteredUsers, sortDescriptor]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const columns = useMemo<DataGridColumn<UserResponse>[]>(
    () => [
      {
        accessorKey: "id",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex items-center gap-2">
            <span className="font-medium tabular-nums">{item.id}</span>
            <Button
              isIconOnly
              aria-label="Copy ID"
              size="sm"
              variant="ghost"
              onPress={() => navigator.clipboard.writeText(item.id.toString())}
            >
              <Copy className="text-muted size-3.5" />
            </Button>
          </div>
        ),
        header: "ID",
        id: "id",
        isRowHeader: true,
        minWidth: 100,
      },
      {
        accessorKey: "username",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <Avatar.Fallback className="bg-accent/10 text-accent text-[10px] font-bold">
                {item.username.slice(0, 2).toUpperCase()}
              </Avatar.Fallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="text-xs font-semibold">{item.username}</span>
              <span className="text-muted text-[10px]">{item.email}</span>
            </div>
          </div>
        ),
        header: "User",
        id: "username",
        minWidth: 220,
      },
      {
        accessorKey: "status",
        allowsSorting: true,
        cell: (item) => {
          const colors: Record<string, "success" | "warning" | "danger" | "default"> = {
            ACTIVE: "success",
            PENDING: "warning",
            BANNED: "danger",
            DELETED: "default",
            INACTIVE: "default",
          };
          return (
            <Chip size="sm" variant="soft" color={colors[item.status]}>
              {item.status}
            </Chip>
          );
        },
        header: "Status",
        id: "status",
        minWidth: 120,
      },
      {
        accessorKey: "roles",
        allowsSorting: false,
        cell: (item) => (
          <div className="flex flex-wrap gap-1">
            {item.roles.map((role) => (
              <Chip key={role} size="sm" variant="secondary" className="h-5 text-[10px]">
                {role.replace("ROLE_", "")}
              </Chip>
            ))}
          </div>
        ),
        header: "Roles",
        id: "roles",
        minWidth: 200,
      },
      {
        accessorKey: "createdAt",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted text-xs tabular-nums">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        ),
        header: "Joined",
        id: "createdAt",
        minWidth: 120,
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-foreground text-base font-semibold">System Users</span>
          {!isLoading && (
            <Chip size="sm" variant="soft">
              {users.length}
            </Chip>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="tertiary">
              <Sliders className="size-4" />
              Filter
            </Button>
          </div>
          <SearchField
            className="w-full sm:w-[220px]"
            name="user-search"
            onChange={handleSearchChange}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search users..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
      </div>

      <DataGrid
        aria-label="All users"
        columns={columns}
        contentClassName="min-w-[700px]"
        data={sortedUsers}
        getRowId={(item) => item.id}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        isLoadingMore={isLoading || isFetching}
      />
    </div>
  );
}
