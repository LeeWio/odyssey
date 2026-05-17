"use client";

import React, { useState } from "react";
import {
  Card,
  Separator,
  Alert,
  Typography,
  Table,
  Chip,
  Avatar,
  TextField,
  Label,
  Input,
  Select,
  ListBox,
  Button,
} from "@heroui/react";
import {
  useGetCurrentUserMenusQuery,
  useGetAdminMenuTreeQuery,
  useCreateMenuMutation,
  MenuResponse,
} from "@/lib/features/permission";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAdmin, selectUserPermissions } from "@/lib/features/auth";
import { useMounted } from "@/hooks/use-mounted";

function MenuNode({ menu }: { menu: MenuResponse }) {
  const typeLabel = menu.type === 0 ? "DIR" : menu.type === 1 ? "MENU" : "BTN";
  const typeColor = menu.type === 0 ? "primary" : menu.type === 1 ? "success" : "warning";

  return (
    <div className="flex flex-col gap-1 p-2 border-l-2 border-default-200 ml-4 bg-default-50/30 rounded-r-lg">
      <div className="flex items-center gap-2">
        <Chip size="sm" variant="flat" color={typeColor as any} className="h-5 text-[9px]">
          {typeLabel}
        </Chip>
        <span className="font-bold text-xs">{menu.name}</span>
        {menu.permission && (
          <Typography.Code className="text-[9px] bg-default-200">{menu.permission}</Typography.Code>
        )}
      </div>
      {menu.path && <p className="text-[10px] text-muted-foreground italic ml-1">{menu.path}</p>}

      {menu.children && menu.children.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          {menu.children.map((child) => (
            <MenuNode key={child.id} menu={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PermissionTestPage() {
  const mounted = useMounted();
  const isAdmin = useAppSelector(selectIsAdmin);
  const activePermissions = useAppSelector(selectUserPermissions) || [];

  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [permission, setPermission] = useState("");
  const [type, setType] = useState<string>("1");

  // Queries
  const { data: myMenus, isLoading: isMyMenusLoading } = useGetCurrentUserMenusQuery(undefined, {
    skip: !isAdmin,
  });
  const { data: fullTree, isLoading: isFullTreeLoading } = useGetAdminMenuTreeQuery(undefined, {
    skip: !isAdmin,
  });

  // Mutations
  const [createMenu, { isLoading: isCreateLoading }] = useCreateMenuMutation();

  if (!mounted) return null;

  const handleCreate = async () => {
    try {
      await createMenu({
        name,
        path,
        permission,
        type: parseInt(type),
        isVisible: true,
        isPublic: false,
      }).unwrap();
      setName("");
      setPath("");
      setPermission("");
    } catch (err) {}
  };

  return (
    <div className="container mx-auto p-8 flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <Typography type="h1" weight="bold">
          Permission & Menu Test Page
        </Typography>
        <p className="text-muted-foreground text-sm">
          Validating hierarchical authorization context.
        </p>
      </header>

      {!isAdmin ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Access Denied</Alert.Title>
            <Alert.Description>
              Please login as an admin to test permission systems.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Create Menu Form */}
          <Card className="lg:col-span-1 h-fit">
            <Card.Header>
              <Card.Title>Add New Menu/Permission</Card.Title>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              <TextField>
                <Label>Menu Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dashboard"
                />
              </TextField>
              <TextField>
                <Label>Path</Label>
                <Input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="e.g. /dashboard"
                />
              </TextField>
              <TextField>
                <Label>Permission Code</Label>
                <Input
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                  placeholder="e.g. dashboard:view"
                />
              </TextField>
              <Select label="Type" value={type} onChange={setType} aria-label="Select menu type">
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox aria-label="Menu types">
                    <ListBox.Item id="0" textValue="Directory">
                      Directory
                    </ListBox.Item>
                    <ListBox.Item id="1" textValue="Menu">
                      Menu
                    </ListBox.Item>
                    <ListBox.Item id="2" textValue="Button">
                      Button
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
              <Button color="primary" isLoading={isCreateLoading} onPress={handleCreate}>
                Create Item
              </Button>
            </Card.Content>
          </Card>

          {/* Active Permissions List */}
          <Card className="lg:col-span-1 h-fit">
            <Card.Header>
              <Card.Title>Active Permission Codes</Card.Title>
            </Card.Header>
            <Card.Content className="flex flex-wrap gap-2">
              {activePermissions.length > 0 ? (
                activePermissions.map((code) => (
                  <Chip key={code} size="sm" variant="dot" color="primary">
                    {code}
                  </Chip>
                ))
              ) : (
                <p className="text-xs italic text-muted-foreground">
                  No dynamic permissions loaded yet.
                </p>
              )}
            </Card.Content>
          </Card>

          {/* Current User Menu Tree */}
          <Card className="lg:col-span-1">
            <Card.Header>
              <Card.Title>My Menu Tree</Card.Title>
              <p className="text-[10px] text-muted-foreground">
                Based on your specific role/permissions
              </p>
            </Card.Header>
            <Card.Content>
              {isMyMenusLoading ? (
                <p>Loading...</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {(myMenus || []).map((menu) => (
                    <MenuNode key={menu.id} menu={menu} />
                  ))}
                  {myMenus?.length === 0 && <p className="text-xs italic">No menus assigned.</p>}
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Full System Tree */}
          <Card className="lg:col-span-1">
            <Card.Header>
              <Card.Title>Full System Tree</Card.Title>
              <p className="text-[10px] text-muted-foreground">
                Management view of all possible routes
              </p>
            </Card.Header>
            <Card.Content>
              {isFullTreeLoading ? (
                <p>Loading...</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {(fullTree || []).map((menu) => (
                    <MenuNode key={menu.id} menu={menu} />
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  );
}
