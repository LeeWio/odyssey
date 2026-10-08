"use client";

import { Section } from "@/components/layout/section";
import { HOME_PREVIEW_GRID } from "./layout";

import { pageEaseOut } from "@/lib/motion";

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
import { motion } from "motion/react";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";

import { type ProjectResponse, useGetPublicProjectsQuery } from "@/lib/features/project";
import { useTranslations } from "next-intl";

const SHOWCASE_LIMIT = 12;

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
  const t = useTranslations("Home");
  const coverImage = toSafeExternalUrl(project.coverImage);

  if (coverImage) {
    return (
      <Image
        unoptimized
        alt={t("projects.coverAlt", { name: project.name })}
        className="object-cover"
        fill
        sizes="(max-width: 639px) 100vw, (max-width: 943px) 50vw, (max-width: 1247px) 33vw, (max-width: 1551px) 25vw, (max-width: 1855px) 20vw, 17vw"
        src={coverImage}
      />
    );
  }

  return (
    <Surface
      className="from-accent-500 via-accent-700 to-default-900 flex h-full items-end justify-between bg-linear-to-br p-5 text-white"
      variant="tertiary"
    >
      <Typography className="max-w-[12ch] text-2xl font-semibold tracking-normal text-white">
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
  const t = useTranslations("Home");
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
        delay: reducedMotion ? 0 : Math.min(index * 0.04, 0.2),
        ease: pageEaseOut,
      }}
      className="h-full min-w-0"
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
          <Card.Title className="text-xl tracking-normal">{project.name}</Card.Title>
          <Card.Description className="line-clamp-3 leading-6">
            {project.description || t("projects.fallbackDescription")}
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
                {t("projects.openProject")}
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
                {t("projects.source")}
              </a>
            ) : null}
          </Card.Footer>
        ) : null}
      </Card>
    </motion.div>
  );
}

export function ProjectsShowcase() {
  const t = useTranslations("Home");
  const shouldReduceMotion = useReducedMotionPreference();
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
    <Section id="projects-showcase" aria-labelledby="projects-showcase-title">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <Chip color="accent" size="sm" variant="soft">
            {t("projects.eyebrow")}
          </Chip>
          <Typography
            id="projects-showcase-title"
            type="h2"
            weight="bold"
            className="mt-4 text-3xl leading-tight tracking-normal text-balance sm:text-4xl"
          >
            {t("projects.title")}
          </Typography>
          <Typography color="muted" type="body" className="mt-3 max-w-lg leading-7">
            {t("projects.description")}
          </Typography>
        </div>
        <Link href="/projects" className="shrink-0 text-sm no-underline">
          {t("projects.exploreAll")}
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
            aria-label={t("projects.loading")}
            className={HOME_PREVIEW_GRID}
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
              <Card.Title>{t("projects.errorTitle")}</Card.Title>
              <Card.Description>{t("projects.errorDescription")}</Card.Description>
            </Card.Header>
            <Button
              size="sm"
              variant="secondary"
              isDisabled={isFetching}
              isPending={isFetching}
              onPress={() => void refetch()}
            >
              {t("projects.retry")}
            </Button>
          </Card>
        ) : (
          <div className={HOME_PREVIEW_GRID} data-testid="home-projects-grid">
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
    </Section>
  );
}
