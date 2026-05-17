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
  useGetAllTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} from "@/lib/features/tag";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAuthenticated, selectIsAdmin, selectUserRoles } from "@/lib/features/auth";
import { useMounted } from "@/hooks/use-mounted";

export default function TagTestPage() {
  const mounted = useMounted();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);
  const rolesInfo = useAppSelector(selectUserRoles);

  // Queries
  const {
    data: tags,
    isLoading: isListLoading,
    error: listError,
  } = useGetAllTagsQuery(undefined, { skip: !isAdmin });

  // Mutations
  const [createTag, { isLoading: isCreateLoading, error: createError }] = useCreateTagMutation();
  const [updateTag, { isLoading: isUpdateLoading, error: updateError }] = useUpdateTagMutation();
  const [deleteTag, { isLoading: isDeleteLoading }] = useDeleteTagMutation();

  if (!mounted) return null;

  const getErrorMessage = (error: any) => {
    return typeof error === "string" ? error : "An unexpected error occurred";
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateTag({ id: editingId, body: { name, slug } }).unwrap();
        setEditingId(null);
      } else {
        await createTag({ name, slug }).unwrap();
      }
      setName("");
      setSlug("");
    } catch (err) {}
  };

  const handleEdit = (tag: any) => {
    setEditingId(tag.id);
    setName(tag.name);
    setSlug(tag.slug);
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setSlug("");
  };

  return (
    <div className="container mx-auto p-8 flex flex-col gap-8">
      <Typography type="h1" weight="bold">
        Admin Tag Management Test Page
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
            <Alert.Description>Please login as an admin to test tag management.</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tag Form */}
          <Card className="lg:col-span-1 h-fit">
            <Card.Header>
              <Card.Title>{editingId ? "Edit Tag" : "Create New Tag"}</Card.Title>
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
                <Label>Tag Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. React"
                />
              </TextField>
              <TextField>
                <Label>Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. react"
                />
              </TextField>
              <div className="flex gap-2">
                <Button
                  color="primary"
                  className="flex-1"
                  isLoading={isCreateLoading || isUpdateLoading}
                  onPress={handleSubmit}
                >
                  {editingId ? "Update Tag" : "Create Tag"}
                </Button>
                {editingId && (
                  <Button variant="ghost" onPress={handleCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* Tags List */}
          <Card className="lg:col-span-2">
            <Card.Header>
              <Card.Title>Existing Tags</Card.Title>
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
                <p>Loading tags...</p>
              ) : (
                <Table aria-label="Tags list table">
                  <Table.ScrollContainer>
                    <Table.Content>
                      <Table.Header>
                        <Table.Column isRowHeader>NAME</Table.Column>
                        <Table.Column>SLUG</Table.Column>
                        <Table.Column>ACTIONS</Table.Column>
                      </Table.Header>
                      <Table.Body renderEmptyState={() => "No tags found."}>
                        {(tags || []).map((tag) => (
                          <Table.Row key={tag.id}>
                            <Table.Cell>{tag.name}</Table.Cell>
                            <Table.Cell>
                              <Typography.Code>{tag.slug}</Typography.Code>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="flat" onPress={() => handleEdit(tag)}>
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="flat"
                                  isLoading={isDeleteLoading}
                                  onPress={() => deleteTag(tag.id)}
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
