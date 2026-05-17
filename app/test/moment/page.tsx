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
  Switch,
} from "@heroui/react";
import {
  useGetPublicMomentsQuery,
  useGetAllMomentsQuery,
  useCreateMomentMutation,
  useDeleteMomentMutation,
  useLikeMomentMutation,
} from "@/lib/features/moment";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAdmin } from "@/lib/features/auth";
import { useMounted } from "@/hooks/use-mounted";

export default function MomentTestPage() {
  const mounted = useMounted();
  const isAdmin = useAppSelector(selectIsAdmin);

  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  // Queries
  const { data: publicMoments, isLoading: isPublicLoading } = useGetPublicMomentsQuery({
    page: 0,
    size: 10,
  });
  const { data: adminMoments, isLoading: isAdminLoading } = useGetAllMomentsQuery(
    { page: 0, size: 10 },
    { skip: !isAdmin }
  );

  // Mutations
  const [createMoment, { isLoading: isCreateLoading }] = useCreateMomentMutation();
  const [deleteMoment, { isLoading: isDeleteLoading }] = useDeleteMomentMutation();
  const [likeMoment] = useLikeMomentMutation();

  if (!mounted) return null;

  const handleCreate = async () => {
    try {
      await createMoment({ content, isPublished }).unwrap();
      setContent("");
    } catch (err) {}
  };

  return (
    <div className="container mx-auto p-8 flex flex-col gap-8">
      <Typography type="h1" weight="bold">
        Moment Module Test Page
      </Typography>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Moment Form */}
        <Card className="lg:col-span-1 h-fit">
          <Card.Header>
            <Card.Title>Create New Moment</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            <TextField>
              <Label>Content</Label>
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
              />
            </TextField>
            <div className="flex items-center justify-between">
              <span className="text-sm">Publish immediately?</span>
              <Switch isSelected={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            </div>
            <Button color="primary" isLoading={isCreateLoading} onPress={handleCreate}>
              Post Moment
            </Button>
          </Card.Content>
        </Card>

        {/* Public Timeline */}
        <Card className="lg:col-span-1">
          <Card.Header>
            <Card.Title>Public Timeline</Card.Title>
          </Card.Header>
          <Card.Content>
            {isPublicLoading ? (
              <p>Loading...</p>
            ) : (
              <div className="flex flex-col gap-4">
                {(publicMoments?.list || []).map((moment) => (
                  <div
                    key={moment.id}
                    className="p-4 border border-border rounded-xl bg-default-50"
                  >
                    <p className="text-sm">{moment.content}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <Button size="sm" variant="flat" onPress={() => likeMoment(moment.id)}>
                        ❤️ {moment.likesCount}
                      </Button>
                      <span className="text-[10px] text-muted">
                        {new Date(moment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Admin Management */}
        {isAdmin && (
          <Card className="lg:col-span-1">
            <Card.Header>
              <Card.Title>Admin Control</Card.Title>
            </Card.Header>
            <Card.Content>
              {isAdminLoading ? (
                <p>Loading...</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {(adminMoments?.list || []).map((moment) => (
                    <div
                      key={moment.id}
                      className="p-2 border border-border rounded flex justify-between items-center text-xs"
                    >
                      <span className="truncate max-w-[100px]">{moment.content}</span>
                      <div className="flex gap-1">
                        <span className={moment.isPublished ? "text-success" : "text-warning"}>
                          {moment.isPublished ? "PUB" : "DRAFT"}
                        </span>
                        <Button
                          size="sm"
                          color="danger"
                          variant="light"
                          isIconOnly
                          onPress={() => deleteMoment(moment.id)}
                          isLoading={isDeleteLoading}
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        )}
      </div>
    </div>
  );
}
