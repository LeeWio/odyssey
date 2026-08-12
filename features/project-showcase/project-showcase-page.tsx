"use client";

import {
  ArrowRight,
  ArrowRotateLeft,
  ArrowUpRight,
  Code,
  CodeFork,
  LogoGithub,
  Star,
} from "@gravity-ui/icons";
import { EmptyState } from "@heroui-pro/react";
import { Button, Card, Chip, Skeleton, Typography, buttonVariants, cn } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";

import { getSmartColorTone, SmartColorSurface } from "@/components/background/smart-color-surface";
import { type ProjectResponse, useGetPublicProjectsQuery } from "@/lib/features/project";

function toSafeExternalUrl(value?: string | null) {
  if (!value?.trim()) return undefined;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function getTechnologyLabels(value?: string | null) {
  return (value ?? "")
    .split(",")
    .map((technology) => technology.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function ProjectSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading projects"
      className="grid gap-5 lg:grid-cols-2"
      role="status"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} variant="secondary" className="overflow-hidden p-0">
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <Card.Header className="gap-3">
            <Skeleton className="h-5 w-24 rounded-lg" />
            <Skeleton className="h-7 w-3/5 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
          </Card.Header>
          <Card.Footer className="gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </Card.Footer>
        </Card>
      ))}
    </div>
  );
}

function ProjectVisual({ project }: { project: ProjectResponse }) {
  const coverImage = toSafeExternalUrl(project.coverImage);

  if (coverImage) {
    return (
      <Image
        unoptimized
        alt={`${project.name} project cover`}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        fill
        sizes="(max-width: 1023px) 100vw, 50vw"
        src={coverImage}
      />
    );
  }

  return (
    <SmartColorSurface
      className="h-full"
      seed={`project-${project.slug}`}
      tone={getSmartColorTone({ categoryName: project.techStack, title: project.name })}
    >
      <Code aria-hidden="true" className="absolute right-6 bottom-5 size-16 text-white/28" />
    </SmartColorSurface>
  );
}

function ProjectCard({ project }: { project: ProjectResponse }) {
  const githubUrl = toSafeExternalUrl(project.githubUrl);
  const previewUrl = toSafeExternalUrl(project.previewUrl);
  const technologies = getTechnologyLabels(project.techStack);
  const starsCount = project.starsCount ?? 0;
  const forksCount = project.forksCount ?? 0;
  const hasMetrics = starsCount > 0 || forksCount > 0;

  return (
    <Card variant="secondary" className="group h-full overflow-hidden p-0">
      <div className="relative aspect-[16/9] overflow-hidden">
        <ProjectVisual project={project} />
        {project.language ? (
          <Chip
            className="absolute top-4 left-4 bg-black/28 text-white backdrop-blur-sm"
            size="sm"
            variant="soft"
          >
            {project.language}
          </Chip>
        ) : null}
      </div>
      <Card.Header className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <Card.Title className="text-xl">{project.name}</Card.Title>
          {hasMetrics ? (
            <div className="text-muted flex shrink-0 items-center gap-3 font-mono text-xs tabular-nums">
              {starsCount > 0 ? (
                <span className="flex items-center gap-1">
                  <Star aria-hidden="true" className="size-3.5" />
                  {starsCount.toLocaleString("en-US")}
                </span>
              ) : null}
              {forksCount > 0 ? (
                <span className="flex items-center gap-1">
                  <CodeFork aria-hidden="true" className="size-3.5" />
                  {forksCount.toLocaleString("en-US")}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        {project.description ? <Card.Description>{project.description}</Card.Description> : null}
        {technologies.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {technologies.map((technology) => (
              <Chip key={technology} size="sm" variant="soft">
                {technology}
              </Chip>
            ))}
          </div>
        ) : null}
      </Card.Header>
      {(githubUrl || previewUrl) && (
        <Card.Footer className="mt-auto gap-2 border-t">
          {previewUrl ? (
            <a
              className={cn(buttonVariants({ size: "sm", variant: "secondary" }), "no-underline")}
              href={previewUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open project
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          ) : null}
          {githubUrl ? (
            <a
              className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "no-underline")}
              href={githubUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <LogoGithub aria-hidden="true" className="size-4" />
              Source
            </a>
          ) : null}
        </Card.Footer>
      )}
    </Card>
  );
}

export function ProjectShowcasePage() {
  const { data: projects = [], error, isLoading, refetch } = useGetPublicProjectsQuery();

  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        <header className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
          <div className="max-w-3xl">
            <div className="text-muted flex items-center gap-2 font-mono text-xs font-semibold uppercase">
              <Code aria-hidden="true" className="size-4" />
              Built in public
            </div>
            <Typography type="h1" weight="bold" className="mt-5 leading-[1.02] text-balance">
              Things made to be used.
            </Typography>
            <Typography color="muted" type="body" className="mt-5 max-w-xl">
              Tools, experiments, and systems shaped through practical work and released into the
              open.
            </Typography>
          </div>
          <div className="border-default-200 border-l pl-5 sm:pl-6">
            <Typography className="font-mono text-3xl tabular-nums" type="body">
              {projects.length.toLocaleString("en-US")}
            </Typography>
            <Typography color="muted" type="body-sm" className="mt-1">
              published projects
            </Typography>
          </div>
        </header>

        <section aria-label="Published projects" className="mt-14">
          {isLoading ? <ProjectSkeleton /> : null}

          {!isLoading && error ? (
            <EmptyState size="lg">
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <Code aria-hidden="true" />
                </EmptyState.Media>
                <EmptyState.Title>Projects are unavailable</EmptyState.Title>
                <EmptyState.Description>
                  The project showcase could not be loaded. Please try again in a moment.
                </EmptyState.Description>
              </EmptyState.Header>
              <EmptyState.Content>
                <Button variant="outline" onPress={() => refetch()}>
                  <ArrowRotateLeft aria-hidden="true" />
                  Try again
                </Button>
              </EmptyState.Content>
            </EmptyState>
          ) : null}

          {!isLoading && !error && projects.length === 0 ? (
            <Card variant="secondary" className="p-0">
              <EmptyState size="lg">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <Code aria-hidden="true" />
                  </EmptyState.Media>
                  <EmptyState.Title>No projects published yet</EmptyState.Title>
                  <EmptyState.Description>
                    Work in progress will appear here when it is ready to share.
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            </Card>
          ) : null}

          {!isLoading && !error && projects.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : null}
        </section>

        <div className="border-default-200 mt-16 flex flex-col gap-3 border-t pt-7 sm:flex-row sm:items-center sm:justify-between">
          <Typography color="muted" type="body-sm">
            Looking for the decisions behind the work? Read the notes and essays alongside it.
          </Typography>
          <Link
            className="text-accent inline-flex items-center gap-2 text-sm font-medium no-underline"
            href="/explore"
          >
            Explore writing
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
