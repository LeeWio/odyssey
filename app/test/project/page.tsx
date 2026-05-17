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
  Chip,
  Switch,
} from "@heroui/react";
import {
  useGetPublicProjectsQuery,
  useGetAllProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from "@/lib/features/project";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAdmin } from "@/lib/features/auth";
import { useMounted } from "@/hooks/use-mounted";

export default function ProjectTestPage() {
  const mounted = useMounted();
  const isAdmin = useAppSelector(selectIsAdmin);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  // Queries
  const { data: publicProjects, isLoading: isPublicLoading } = useGetPublicProjectsQuery();
  const { data: adminProjects, isLoading: isAdminLoading } = useGetAllProjectsQuery(
    { page: 0, size: 10 },
    { skip: !isAdmin }
  );

  // Mutations
  const [createProject, { isLoading: isCreateLoading }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdateLoading }] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeleteLoading }] = useDeleteProjectMutation();

  if (!mounted) return null;

  const handleCreate = async () => {
    try {
      await createProject({
        name,
        description,
        techStack,
        githubUrl,
        isPublished,
      }).unwrap();
      setName("");
      setDescription("");
      setTechStack("");
      setGithubUrl("");
    } catch (err) {}
  };

  const handleTogglePublish = async (project: any) => {
    try {
      await updateProject({
        id: project.id,
        body: {
          ...project,
          isPublished: !project.isPublished,
        },
      }).unwrap();
    } catch (err) {}
  };

  return (
    <div className="container mx-auto p-8 flex flex-col gap-8">
      <Typography type="h1" weight="bold">
        Project Module Test Page
      </Typography>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Project Form */}
        <Card className="lg:col-span-1 h-fit">
          <Card.Header>
            <Card.Title>Add New Project</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            <TextField>
              <Label>Project Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Odyssey Portfolio"
              />
            </TextField>
            <TextField>
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </TextField>
            <TextField>
              <Label>Tech Stack</Label>
              <Input
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="e.g. Next.js, Redux, Tailwind"
              />
            </TextField>
            <TextField>
              <Label>GitHub URL</Label>
              <Input
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
              />
            </TextField>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Publish?</span>
              <Switch isSelected={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            </div>
            <Button color="primary" isLoading={isCreateLoading} onPress={handleCreate}>
              Create Project
            </Button>
          </Card.Content>
        </Card>

        {/* Public Showcase Preview */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Public Showcase Preview</Card.Title>
          </Card.Header>
          <Card.Content>
            {isPublicLoading ? (
              <p>Loading...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(publicProjects || []).map((project) => (
                  <div
                    key={project.id}
                    className="p-4 border border-border rounded-xl bg-default-50 flex flex-col gap-2"
                  >
                    <h3 className="font-bold text-lg">{project.name}</h3>
                    <p className="text-xs text-muted-foreground">{project.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {project.techStack?.split(",").map((t) => (
                        <Chip
                          key={t}
                          size="sm"
                          variant="flat"
                          color="secondary"
                          className="text-[9px]"
                        >
                          {t.trim()}
                        </Chip>
                      ))}
                    </div>
                    <div className="mt-auto flex justify-between items-center pt-2">
                      <div className="flex gap-3 text-[10px] font-mono">
                        <span title="Stars">⭐ {project.starsCount}</span>
                        <span title="Forks">🍴 {project.forksCount}</span>
                        <span className="text-primary font-bold">{project.language}</span>
                      </div>
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          className="text-[10px] text-blue-500 underline"
                        >
                          View Repo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {publicProjects?.length === 0 && (
                  <p className="text-sm italic">No projects published yet.</p>
                )}
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Admin Management Table */}
        {isAdmin && (
          <Card className="lg:col-span-3">
            <Card.Header>
              <Card.Title>Project Management (Admin)</Card.Title>
            </Card.Header>
            <Card.Content>
              {isAdminLoading ? (
                <p>Loading...</p>
              ) : (
                <Table aria-label="Projects management table">
                  <Table.ScrollContainer>
                    <Table.Content>
                      <Table.Header>
                        <Table.Column isRowHeader>NAME</Table.Column>
                        <Table.Column>TECH STACK</Table.Column>
                        <Table.Column>STATUS</Table.Column>
                        <Table.Column>ACTIONS</Table.Column>
                      </Table.Header>
                      <Table.Body renderEmptyState={() => "No projects found."}>
                        {(adminProjects?.list || []).map((project) => (
                          <Table.Row key={project.id}>
                            <Table.Cell>{project.name}</Table.Cell>
                            <Table.Cell>
                              <span className="text-xs">{project.techStack}</span>
                            </Table.Cell>
                            <Table.Cell>
                              <Chip
                                size="sm"
                                color={project.isPublished ? "success" : "warning"}
                                variant="flat"
                              >
                                {project.isPublished ? "Published" : "Draft"}
                              </Chip>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="flat"
                                  onPress={() => handleTogglePublish(project)}
                                  isLoading={isUpdateLoading}
                                >
                                  {project.isPublished ? "Hide" : "Publish"}
                                </Button>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="light"
                                  isIconOnly
                                  onPress={() => deleteProject(project.id)}
                                  isLoading={isDeleteLoading}
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
