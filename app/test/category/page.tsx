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
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/lib/features/category";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAuthenticated, selectIsAdmin, selectUserRoles } from "@/lib/features/auth";
import { useMounted } from "@/hooks/use-mounted";

export default function CategoryTestPage() {
  const mounted = useMounted();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);
  const rolesInfo = useAppSelector(selectUserRoles);

  // Queries
  const {
    data: categories,
    isLoading: isListLoading,
    error: listError,
  } = useGetCategoriesQuery(undefined, { skip: !isAdmin });

  // Mutations
  const [createCategory, { isLoading: isCreateLoading, error: createError }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdateLoading, error: updateError }] =
    useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleteLoading }] = useDeleteCategoryMutation();

  if (!mounted) return null;

  const getErrorMessage = (error: any) => {
    return typeof error === "string" ? error : "An unexpected error occurred";
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateCategory({ id: editingId, body: { name, slug, description } }).unwrap();
        setEditingId(null);
      } else {
        await createCategory({ name, slug, description }).unwrap();
      }
      setName("");
      setSlug("");
      setDescription("");
    } catch (err) {}
  };

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
  };

  return (
    <div className="container mx-auto p-8 flex flex-col gap-8">
      <Typography type="h1" weight="bold">
        Admin Category Management Test Page
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
            <Alert.Description>
              Please login as an admin to test category management.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Category Form */}
          <Card className="lg:col-span-1 h-fit">
            <Card.Header>
              <Card.Title>{editingId ? "Edit Category" : "Create New Category"}</Card.Title>
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
                <Label>Category Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Backend Development"
                />
              </TextField>
              <TextField>
                <Label>Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. backend"
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
                  {editingId ? "Update Category" : "Create Category"}
                </Button>
                {editingId && (
                  <Button variant="ghost" onPress={handleCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* Categories List */}
          <Card className="lg:col-span-2">
            <Card.Header>
              <Card.Title>Existing Categories</Card.Title>
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
                <p>Loading categories...</p>
              ) : (
                <Table aria-label="Categories list table">
                  <Table.ScrollContainer>
                    <Table.Content>
                      <Table.Header>
                        <Table.Column isRowHeader>NAME</Table.Column>
                        <Table.Column>SLUG</Table.Column>
                        <Table.Column>DESCRIPTION</Table.Column>
                        <Table.Column>ACTIONS</Table.Column>
                      </Table.Header>
                      <Table.Body renderEmptyState={() => "No categories found."}>
                        {(categories || []).map((category) => (
                          <Table.Row key={category.id}>
                            <Table.Cell>{category.name}</Table.Cell>
                            <Table.Cell>
                              <Typography.Code>{category.slug}</Typography.Code>
                            </Table.Cell>
                            <Table.Cell>{category.description || "-"}</Table.Cell>
                            <Table.Cell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="flat"
                                  onPress={() => handleEdit(category)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="flat"
                                  isLoading={isDeleteLoading}
                                  onPress={() => deleteCategory(category.id)}
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
