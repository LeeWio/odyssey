"use client";

import React, { useState } from "react";
import {
  Card,
  TextField,
  Label,
  Input,
  Button,
  Separator,
  Alert,
  Typography,
  Table,
} from "@heroui/react";
import {
  useGetAllRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} from "@/lib/features/role";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAuthenticated, selectIsAdmin, selectUserRoles } from "@/lib/features/auth";
import { useMounted } from "@/hooks/use-mounted";

export default function RoleTestPage() {
  const mounted = useMounted();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);
  const rolesInfo = useAppSelector(selectUserRoles);

  // Queries
  const {
    data: roles,
    isLoading: isListLoading,
    error: listError,
  } = useGetAllRolesQuery(undefined, { skip: !isAdmin });

  // Mutations
  const [createRole, { isLoading: isCreateLoading, error: createError }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdateLoading, error: updateError }] = useUpdateRoleMutation();
  const [deleteRole, { isLoading: isDeleteLoading }] = useDeleteRoleMutation();

  if (!mounted) return null;

  const getErrorMessage = (error: any) => {
    return typeof error === "string" ? error : "An unexpected error occurred";
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateRole({ id: editingId, body: { name, code, description } }).unwrap();
        setEditingId(null);
      } else {
        await createRole({ name, code, description }).unwrap();
      }
      setName("");
      setCode("");
      setDescription("");
    } catch (err) {}
  };

  const handleEdit = (role: any) => {
    setEditingId(role.id);
    setName(role.name);
    setCode(role.code);
    setDescription(role.description || "");
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setCode("");
    setDescription("");
  };

  return (
    <div className="container mx-auto p-8 flex flex-col gap-8">
      <Typography type="h1" weight="bold">
        Admin Role Management Test Page
      </Typography>

      <div className="flex gap-4 items-center bg-default-50 p-4 rounded-xl border border-border">
        <span className="font-bold">Auth Info:</span>
        <span className="text-sm">Authenticated: {String(isAuthenticated)}</span>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-sm">Admin: {String(isAdmin)}</span>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-sm">Roles: {rolesInfo.join(", ") || "none"}</span>
      </div>

      {!isAdmin ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Access Denied</Alert.Title>
            <Alert.Description>Please login as an admin to test role management.</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Role Form */}
          <Card className="lg:col-span-1 h-fit">
            <Card.Header>
              <Card.Title>{editingId ? "Edit Role" : "Create New Role"}</Card.Title>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              {(createError || updateError) && (
                <Alert status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Operation Failed</Alert.Title>
                    <Alert.Description>
                      {getErrorMessage(createError || updateError)}
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              )}
              <TextField>
                <Label>Role Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Administrator"
                />
              </TextField>
              <TextField>
                <Label>Role Code</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. ROLE_ADMIN"
                />
              </TextField>
              <TextField>
                <Label>Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details"
                />
              </TextField>
              <div className="flex gap-2">
                <Button
                  color="primary"
                  className="flex-1"
                  isLoading={isCreateLoading || isUpdateLoading}
                  onPress={handleSubmit}
                >
                  {editingId ? "Update Role" : "Create Role"}
                </Button>
                {editingId && (
                  <Button variant="ghost" onPress={handleCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* Roles List */}
          <Card className="lg:col-span-2">
            <Card.Header>
              <Card.Title>Existing Roles</Card.Title>
            </Card.Header>
            <Card.Content>
              {listError && (
                <Alert status="danger" className="mb-4">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Fetch Failed</Alert.Title>
                    <Alert.Description>{getErrorMessage(listError)}</Alert.Description>
                  </Alert.Content>
                </Alert>
              )}
              {isListLoading ? (
                <p>Loading roles...</p>
              ) : (
                <Table aria-label="Roles list table">
                  <Table.ScrollContainer>
                    <Table.Content>
                      <Table.Header>
                        <Table.Column isRowHeader>NAME</Table.Column>
                        <Table.Column>CODE</Table.Column>
                        <Table.Column>DESCRIPTION</Table.Column>
                        <Table.Column>ACTIONS</Table.Column>
                      </Table.Header>
                      <Table.Body renderEmptyState={() => "No roles found."}>
                        {(roles || []).map((role) => (
                          <Table.Row key={role.id}>
                            <Table.Cell>{role.name}</Table.Cell>
                            <Table.Cell>
                              <Typography.Code>{role.code}</Typography.Code>
                            </Table.Cell>
                            <Table.Cell>{role.description || "-"}</Table.Cell>
                            <Table.Cell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="flat" onPress={() => handleEdit(role)}>
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="flat"
                                  isLoading={isDeleteLoading}
                                  onPress={() => deleteRole(role.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table>
              )}
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  );
}
