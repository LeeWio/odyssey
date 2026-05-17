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
  Select,
  ListBox,
  TagGroup,
  Tag,
} from "@heroui/react";
import {
  useSearchAdminPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetPublicPostsQuery,
} from "@/lib/features/post";
import { useGetCategoriesQuery } from "@/lib/features/category";
import { useGetAllTagsQuery } from "@/lib/features/tag";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAdmin } from "@/lib/features/auth";
import { useMounted } from "@/hooks/use-mounted";
import type { Selection } from "@react-types/shared";

export default function PostTestPage() {
  const mounted = useMounted();
  const isAdmin = useAppSelector(selectIsAdmin);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<Selection>(new Set());

  // Queries
  const { data: adminPosts, isLoading: isListLoading } = useSearchAdminPostsQuery(
    { page: 0, size: 10 },
    { skip: !isAdmin }
  );
  const { data: publicPosts } = useGetPublicPostsQuery({ page: 0, size: 5 });
  const { data: categories } = useGetCategoriesQuery(undefined, { skip: !isAdmin });
  const { data: tags } = useGetAllTagsQuery(undefined, { skip: !isAdmin });

  // Mutations
  const [createPost, { isLoading: isCreateLoading, error: createError }] = useCreatePostMutation();
  const [updatePost, { isLoading: isUpdateLoading }] = useUpdatePostMutation();
  const [deletePost, { isLoading: isDeleteLoading }] = useDeletePostMutation();

  if (!mounted) return null;

  const handleStatusChange = async (post: any, newStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
    try {
      await updatePost({
        id: post.id,
        body: {
          title: post.title,
          slug: post.slug,
          content: post.content || "",
          status: newStatus,
          categoryId: post.category?.id,
          tagIds: post.tags?.map((t: any) => t.id),
        },
      }).unwrap();
    } catch (err) {
      // toast is handled in API layer
    }
  };

  const handleCreate = async () => {
    const body = {
      title,
      slug,
      content,
      status: "DRAFT" as const,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      tagIds: Array.from(selectedTagIds === "all" ? [] : selectedTagIds).map((id) =>
        parseInt(id as string)
      ),
    };

    console.log("🚀 POST REQUEST BODY:", body);

    try {
      await createPost(body).unwrap();
      setTitle("");
      setSlug("");
      setContent("");
      setCategoryId(null);
      setSelectedTagIds(new Set());
    } catch (err) {
      console.error("❌ CREATE POST FAILED:", err);
    }
  };

  return (
    <div className="container mx-auto p-8 flex flex-col gap-8">
      <Typography type="h1" weight="bold">
        Post Module Test Page
      </Typography>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Post Form */}
        <Card className="lg:col-span-1">
          <Card.Header>
            <Card.Title>Create Draft Post</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            {createError && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Failed</Alert.Title>
                  <Alert.Description>
                    {typeof createError === "string" ? createError : "Error"}
                  </Alert.Description>
                </Alert.Content>
              </Alert>
            )}
            <TextField>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </TextField>
            <TextField>
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </TextField>
            <TextField>
              <Label>Content (Markdown)</Label>
              <Input value={content} onChange={(e) => setContent(e.target.value)} />
            </TextField>

            <Select
              placeholder="Select category"
              value={categoryId}
              onChange={setCategoryId}
              aria-label="Select category"
            >
              <Label>Category</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox items={categories || []} aria-label="Category list">
                  {(cat) => (
                    <ListBox.Item id={cat.id.toString()} textValue={cat.name}>
                      {cat.name}
                    </ListBox.Item>
                  )}
                </ListBox>
              </Select.Popover>
            </Select>

            <div className="bg-default-100 p-3 rounded-lg border border-dashed border-default-300 flex flex-col gap-1">
              <p className="text-[10px] font-black uppercase text-default-500">Payload Preview</p>
              <div className="text-[11px] font-mono grid grid-cols-2 gap-x-4">
                <span className="text-primary font-bold">CAT_ID_SELECTED:</span>
                <span className="text-right font-bold text-success">{categoryId || "NONE"}</span>
                <span className="text-secondary font-bold">TAGS_COUNT:</span>
                <span className="text-right font-bold text-success">
                  {Array.from(selectedTagIds === "all" ? [] : selectedTagIds).length}
                </span>
              </div>
            </div>

            <TagGroup
              selectionMode="multiple"
              selectedKeys={selectedTagIds}
              onSelectionChange={setSelectedTagIds}
              aria-label="Article tags selection"
            >
              <Label>Tags</Label>
              <TagGroup.List items={tags || []} aria-label="Tag items">
                {(tag) => (
                  <Tag id={tag.id.toString()} key={tag.id.toString()} textValue={tag.name}>
                    {tag.name}
                  </Tag>
                )}
              </TagGroup.List>
            </TagGroup>

            <Button
              color="primary"
              isLoading={isCreateLoading}
              onPress={handleCreate}
              aria-label="Create post button"
            >
              Create Post
            </Button>
          </Card.Content>
        </Card>

        {/* Admin Posts List */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Admin Post Management</Card.Title>
          </Card.Header>
          <Card.Content>
            {isListLoading ? (
              <p>Loading...</p>
            ) : (
              <Table aria-label="Posts management table">
                <Table.ScrollContainer>
                  <Table.Content>
                    <Table.Header>
                      <Table.Column isRowHeader>TITLE</Table.Column>
                      <Table.Column>STATUS</Table.Column>
                      <Table.Column>CATEGORY</Table.Column>
                      <Table.Column>ACTIONS</Table.Column>
                    </Table.Header>
                    <Table.Body renderEmptyState={() => "No posts found."}>
                      {(adminPosts?.list || []).map((post) => (
                        <Table.Row key={post.id}>
                          <Table.Cell>{post.title}</Table.Cell>
                          <Table.Cell>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                post.status === "PUBLISHED"
                                  ? "bg-success/20 text-success"
                                  : post.status === "DRAFT"
                                    ? "bg-warning/20 text-warning"
                                    : "bg-default-200 text-default-500"
                              }`}
                            >
                              {post.status}
                            </span>
                          </Table.Cell>
                          <Table.Cell>{post.category?.name || "-"}</Table.Cell>
                          <Table.Cell>
                            <div className="flex gap-1">
                              {post.status !== "PUBLISHED" && (
                                <Button
                                  size="sm"
                                  color="success"
                                  variant="flat"
                                  className="h-7 text-[10px]"
                                  onPress={() => handleStatusChange(post, "PUBLISHED")}
                                  isLoading={isUpdateLoading}
                                >
                                  Publish
                                </Button>
                              )}
                              {post.status === "PUBLISHED" && (
                                <Button
                                  size="sm"
                                  color="warning"
                                  variant="flat"
                                  className="h-7 text-[10px]"
                                  onPress={() => handleStatusChange(post, "DRAFT")}
                                  isLoading={isUpdateLoading}
                                >
                                  To Draft
                                </Button>
                              )}
                              <Button
                                size="sm"
                                color="danger"
                                variant="light"
                                isIconOnly
                                className="h-7 w-7"
                                isLoading={isDeleteLoading}
                                onPress={() => deletePost(post.id)}
                              >
                                🗑️
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

        {/* Public Posts View */}
        <Card className="lg:col-span-3">
          <Card.Header>
            <Card.Title>Public Posts Preview (Cache Test)</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(publicPosts?.list || []).map((post) => (
                <div key={post.id} className="p-4 border border-border rounded-xl">
                  <h3 className="font-bold">{post.title}</h3>
                  <p className="text-xs text-muted">Slug: {post.slug}</p>
                  <div className="flex gap-1 mt-2">
                    {post.tags.map((t) => (
                      <span
                        key={t.id}
                        className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
