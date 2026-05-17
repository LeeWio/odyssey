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
  Avatar,
  Select,
  ListBox,
} from "@heroui/react";
import {
  useGetAdminCommentsQuery,
  useModerateCommentMutation,
  useDeleteCommentMutation,
  usePublishCommentMutation,
  useGetPostCommentsQuery,
  CommentResponse,
} from "@/lib/features/comment";
import { useSearchAdminPostsQuery } from "@/lib/features/post";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAdmin } from "@/lib/features/auth";
import { useMounted } from "@/hooks/use-mounted";

function CommentItem({
  comment,
  onReply,
}: {
  comment: CommentResponse;
  onReply: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 p-3 border-l-2 border-primary/20 ml-2 bg-default-50/50 rounded-r-lg">
      <div className="flex items-center gap-2">
        <Avatar
          src={comment.avatar || undefined}
          name={comment.username || "A"}
          size="sm"
          className="size-6"
        />
        <span className="font-bold text-xs">{comment.username}</span>
        <span className="text-[10px] text-muted-foreground">
          {new Date(comment.createdAt).toLocaleString()}
        </span>
      </div>
      <p className="text-sm">{comment.content}</p>
      <Button
        size="sm"
        variant="light"
        className="h-6 w-fit text-[10px]"
        onPress={() => onReply(comment.id)}
      >
        Reply
      </Button>

      {comment.children && comment.children.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          {comment.children.map((child) => (
            <CommentItem key={child.id} comment={child} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentTestPage() {
  const mounted = useMounted();
  const isAdmin = useAppSelector(selectIsAdmin);

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);

  // Queries
  const { data: adminPosts } = useSearchAdminPostsQuery({ page: 0, size: 50 }, { skip: !isAdmin });
  const { data: publicComments, isLoading: isPublicLoading } = useGetPostCommentsQuery(
    { postId: parseInt(selectedPostId || "0"), page: 0, size: 50 },
    { skip: !selectedPostId }
  );
  const { data: adminComments, isLoading: isAdminLoading } = useGetAdminCommentsQuery(
    { page: 0, size: 20 },
    { skip: !isAdmin }
  );

  // Mutations
  const [publishComment, { isLoading: isPublishing, error: publishError }] =
    usePublishCommentMutation();
  const [moderateComment] = useModerateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  if (!mounted) return null;

  const getErrorMessage = (error: any) => {
    return typeof error === "string" ? error : "An unexpected error occurred";
  };

  const handlePublish = async () => {
    if (!selectedPostId) return;
    try {
      await publishComment({
        content,
        postId: parseInt(selectedPostId),
        parentId: parentId || undefined,
      }).unwrap();
      setContent("");
      setParentId(null);
    } catch (err) {}
  };

  return (
    <div className="container mx-auto p-8 flex flex-col gap-8">
      <Typography type="h1" weight="bold">
        Comment Module Test Page
      </Typography>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Public View: Post Comments */}
        <Card>
          <Card.Header>
            <Card.Title>Post Discussions (Public)</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            <Select
              label="Select Post to View Comments"
              placeholder="Choose a post"
              value={selectedPostId}
              onChange={setSelectedPostId}
              aria-label="Select post"
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox items={adminPosts?.list || []} aria-label="Posts list">
                  {(post) => (
                    <ListBox.Item id={post.id.toString()} textValue={post.title}>
                      {post.title}
                    </ListBox.Item>
                  )}
                </ListBox>
              </Select.Popover>
            </Select>

            <Separator />

            {selectedPostId ? (
              <div className="flex flex-col gap-4">
                {publishError && (
                  <Alert status="danger">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>Submission Error</Alert.Title>
                      <Alert.Description>{getErrorMessage(publishError)}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                )}
                <div className="flex flex-col gap-2">
                  <TextField>
                    <Label>{parentId ? `Replying to ID: ${parentId}` : "New Comment"}</Label>
                    <Input
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write a comment..."
                    />
                  </TextField>
                  <div className="flex gap-2">
                    <Button
                      color="primary"
                      size="sm"
                      isLoading={isPublishing}
                      onPress={handlePublish}
                    >
                      {parentId ? "Post Reply" : "Post Comment"}
                    </Button>
                    {parentId && (
                      <Button size="sm" variant="ghost" onPress={() => setParentId(null)}>
                        Cancel Reply
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-4">
                  {isPublicLoading ? (
                    <p>Loading comments...</p>
                  ) : (
                    (publicComments?.list || []).map((comment) => (
                      <CommentItem key={comment.id} comment={comment} onReply={setParentId} />
                    ))
                  )}
                  {publicComments?.list.length === 0 && (
                    <p className="text-xs text-muted-foreground">No comments yet.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Please select a post to see discussions.
              </p>
            )}
          </Card.Content>
        </Card>

        {/* Admin View: All Comments */}
        {isAdmin && (
          <Card>
            <Card.Header>
              <Card.Title>Comment Moderation (Admin)</Card.Title>
            </Card.Header>
            <Card.Content>
              {isAdminLoading ? (
                <p>Loading...</p>
              ) : (
                <Table aria-label="Moderation table">
                  <Table.ScrollContainer>
                    <Table.Content>
                      <Table.Header>
                        <Table.Column isRowHeader>USER</Table.Column>
                        <Table.Column>CONTENT</Table.Column>
                        <Table.Column>ACTIONS</Table.Column>
                      </Table.Header>
                      <Table.Body renderEmptyState={() => "No comments to moderate."}>
                        {(adminComments?.list || []).map((c) => (
                          <Table.Row key={c.id}>
                            <Table.Cell>
                              <div className="flex items-center gap-1">
                                <Avatar size="sm" src={c.avatar || undefined} className="size-5" />
                                <span className="text-[10px] font-bold">{c.username}</span>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="max-w-[150px] truncate text-[10px]" title={c.content}>
                                {c.content}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  color="success"
                                  variant="flat"
                                  onPress={() => moderateComment({ id: c.id, status: "APPROVED" })}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  color="warning"
                                  variant="flat"
                                  onPress={() => moderateComment({ id: c.id, status: "SPAM" })}
                                >
                                  Spam
                                </Button>
                                <Button
                                  size="sm"
                                  color="danger"
                                  isIconOnly
                                  variant="light"
                                  onPress={() => deleteComment(c.id)}
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
        )}
      </div>
    </div>
  );
}
