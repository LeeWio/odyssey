"use client";

import { Icon } from "@iconify/react";
import {
  Button,
  Card,
  Chip,
  Link,
  Separator,
  Skeleton,
  Surface,
  Typography,
  buttonVariants,
  cn,
} from "@heroui/react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

import { type ProjectResponse, useGetPublicProjectsQuery } from "@/lib/features/project";

const SHOWCASE_LIMIT = 3;

function toSafeExternalUrl(value?: string | null) {
  if (!value?.trim()) return undefined;

  try {
    const url = new URL(value.trim());
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
    .slice(0, 3);
}

function ProjectMedia({ project }: { project: ProjectResponse }) {
  const coverImage = toSafeExternalUrl(project.coverImage);

  if (coverImage) {
    return (
      <Image
        unoptimized
        alt={`${project.name} project cover`}
        className="object-cover"
        fill
        sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
        src={coverImage}
      />
    );
  }

  return (
    <Surface
      className="from-accent-500 via-accent-700 to-default-900 flex h-full items-end justify-between bg-linear-to-br p-5 text-white"
      variant="tertiary"
    >
      <Typography className="max-w-[12ch] text-2xl font-semibold tracking-[-0.04em] text-white">
        {project.name}
      </Typography>
      <Icon aria-hidden="true" className="size-10 text-white/45" icon="gravity-ui:code" />
    </Surface>
  );
}

function ProjectCard({
  project,
  index,
  reducedMotion,
}: {
  project: ProjectResponse;
  index: number;
  reducedMotion: boolean;
}) {
  const previewUrl = toSafeExternalUrl(project.previewUrl);
  const githubUrl = toSafeExternalUrl(project.githubUrl);
  const technologies = getTechnologyLabels(project.techStack);

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: reducedMotion ? 0 : 0.55,
        delay: reducedMotion ? 0 : index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="h-full"
    >
      <Card className="h-full" variant="secondary">
        <Card.Content className="p-0">
          <Surface
            className="relative aspect-[16/10] overflow-hidden rounded-t-[inherit]"
            variant="tertiary"
          >
            <ProjectMedia project={project} />
            {project.language ? (
              <Chip
                className="bg-background/80 absolute top-4 left-4 backdrop-blur-md"
                size="sm"
                variant="soft"
              >
                {project.language}
              </Chip>
            ) : null}
          </Surface>
        </Card.Content>

        <Card.Header className="gap-3">
          <Card.Title className="text-xl tracking-[-0.03em]">{project.name}</Card.Title>
          <Card.Description className="line-clamp-3 leading-6">
            {project.description || "A practical experiment, released into the open."}
          </Card.Description>
          {technologies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {technologies.map((technology) => (
                <Chip key={technology} size="sm" variant="soft">
                  {technology}
                </Chip>
              ))}
            </div>
          ) : null}
        </Card.Header>

        {previewUrl || githubUrl ? (
          <Card.Footer className="mt-auto gap-2 border-t">
            {previewUrl ? (
              <a
                className={cn(buttonVariants({ size: "sm", variant: "secondary" }), "no-underline")}
                href={previewUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open project
                <Icon aria-hidden="true" className="size-4" icon="gravity-ui:arrow-up-right" />
              </a>
            ) : null}
            {githubUrl ? (
              <a
                className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "no-underline")}
                href={githubUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Icon aria-hidden="true" className="size-4" icon="gravity-ui:logo-github" />
                Source
              </a>
            ) : null}
          </Card.Footer>
        ) : null}
      </Card>
    </motion.div>
  );
}

export function ProjectsShowcase() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const {
    data: projects = [],
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetPublicProjectsQuery();
  const visibleProjects = projects.slice(0, SHOWCASE_LIMIT);

  if (!isLoading && !error && visibleProjects.length === 0) return null;

  return (
    <section
      id="projects-showcase"
      aria-labelledby="projects-showcase-title"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-24 sm:px-10 sm:py-32"
    >
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <Chip color="accent" size="sm" variant="soft">
            Built in public
          </Chip>
          <Typography
            id="projects-showcase-title"
            type="h2"
            weight="bold"
            className="mt-4 text-[clamp(2rem,4vw,3.5rem)] leading-[1.04] tracking-[-0.045em]"
          >
            Projects in the open.
          </Typography>
          <Typography color="muted" type="body" className="mt-3 max-w-lg leading-7">
            Tools, experiments, and systems shaped through practical work.
          </Typography>
        </div>
        <Link href="/projects" className="shrink-0 text-sm no-underline">
          Explore all projects
          <Link.Icon aria-hidden="true">
            <Icon icon="gravity-ui:arrow-up-right" />
          </Link.Icon>
        </Link>
      </header>

      <Separator className="mt-8" />

      <div className="mt-8">
        {isLoading ? (
          <div
            aria-busy="true"
            aria-label="Loading projects"
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            role="status"
          >
            {Array.from({ length: SHOWCASE_LIMIT }, (_, index) => (
              <Card key={index} variant="secondary">
                <Skeleton className="aspect-[16/10] w-full rounded-t-[inherit]" />
                <Card.Header className="gap-3">
                  <Skeleton className="h-6 w-36 rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </Card.Header>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="flex flex-col items-start gap-4 p-6" variant="secondary">
            <Card.Header className="p-0">
              <Card.Title>Projects are taking a quiet moment.</Card.Title>
              <Card.Description>They could not be loaded right now.</Card.Description>
            </Card.Header>
            <Button
              size="sm"
              variant="secondary"
              isDisabled={isFetching}
              isPending={isFetching}
              onPress={() => void refetch()}
            >
              Try again
            </Button>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                index={index}
                project={project}
                reducedMotion={shouldReduceMotion}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
