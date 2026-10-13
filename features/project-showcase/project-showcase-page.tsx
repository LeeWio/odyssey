"use client";

import { Icon } from "@iconify/react";
import { ProjectShader } from "@/components/project/project-shader";

import { EmptyState } from "@heroui-pro/react";
import {
  Button,
  Card,
  Chip,
  Label,
  ListBox,
  SearchField,
  Select,
  Skeleton,
  Tag,
  TagGroup,
  Typography,
  buttonVariants,
  cn,
} from "@heroui/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useDeferredValue, useMemo, useState } from "react";

import { PageFrame } from "@/components/layout/page-frame";
import { type ProjectResponse, useGetPublicProjectsQuery } from "@/lib/features/project";

type ProjectAvailability = "all" | "preview" | "source";
type ProjectSort = "featured" | "most-starred" | "alphabetical";

const PROJECT_GRID = "grid grid-cols-[repeat(auto-fill,minmax(min(100%,22rem),1fr))] gap-5";

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
    .slice(0, 4);
}

function matchesProject(project: ProjectResponse, query: string) {
  if (!query) return true;

  return [
    project.name,
    project.slug,
    project.description,
    project.language,
    project.techStack,
  ].some((value) => value?.toLocaleLowerCase().includes(query));
}

function ProjectSkeleton() {
  const t = useTranslations("Projects");
  return (
    <div aria-busy="true" aria-label={t("loading")} className={PROJECT_GRID} role="status">
      {Array.from({ length: 6 }, (_, index) => (
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
  return (
    <div className="relative h-full overflow-hidden">
      <ProjectShader seed={`project-${project.slug}`} />
      <div className="absolute inset-0 bg-linear-to-br from-black/5 via-transparent to-black/35" />
      <Icon
        icon="gravity-ui:code"
        aria-hidden="true"
        className="absolute right-6 bottom-5 size-16 text-white/40"
      />
    </div>
  );
}

function ProjectCard({
  project,
  featured = false,
}: {
  project: ProjectResponse;
  featured?: boolean;
}) {
  const t = useTranslations("Projects");
  const locale = useLocale();
  const githubUrl = toSafeExternalUrl(project.githubUrl);
  const previewUrl = toSafeExternalUrl(project.previewUrl);
  const technologies = getTechnologyLabels(project.techStack);
  const starsCount = project.starsCount ?? 0;
  const forksCount = project.forksCount ?? 0;
  const hasMetrics = starsCount > 0 || forksCount > 0;

  return (
    <Card
      variant="secondary"
      className={cn(
        "group h-full overflow-hidden p-0",
        featured && "lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.7fr)]"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          featured ? "aspect-[16/9] min-h-72 lg:aspect-auto lg:min-h-[26rem]" : "aspect-[16/9]"
        )}
      >
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
      <Card.Header className={cn("gap-3", featured && "justify-end p-6 sm:p-8")}>
        <div className="flex items-start justify-between gap-4">
          <Card.Title
            className={cn("min-w-0 break-words", featured ? "text-3xl sm:text-4xl" : "text-xl")}
          >
            {project.name}
          </Card.Title>
          {hasMetrics ? (
            <div className="text-muted flex shrink-0 items-center gap-3 font-mono text-xs tabular-nums">
              {starsCount > 0 ? (
                <span className="flex items-center gap-1">
                  <Icon icon="gravity-ui:star" aria-hidden="true" className="size-3.5" />
                  {starsCount.toLocaleString(locale)}
                </span>
              ) : null}
              {forksCount > 0 ? (
                <span className="flex items-center gap-1">
                  <Icon icon="gravity-ui:code-fork" aria-hidden="true" className="size-3.5" />
                  {forksCount.toLocaleString(locale)}
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
              {t("openProject")}
              <Icon icon="gravity-ui:arrow-up-right" aria-hidden="true" className="size-4" />
            </a>
          ) : null}
          {githubUrl ? (
            <a
              className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "no-underline")}
              href={githubUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon icon="gravity-ui:logo-github" aria-hidden="true" className="size-4" />
              {t("source")}
            </a>
          ) : null}
        </Card.Footer>
      )}
    </Card>
  );
}

export function ProjectShowcasePage() {
  const t = useTranslations("Projects");
  const locale = useLocale();
  const { data: projects = [], error, isLoading, refetch } = useGetPublicProjectsQuery();
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState<ProjectAvailability>("all");
  const [sort, setSort] = useState<ProjectSort>("featured");
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase());

  const visibleProjects = useMemo(() => {
    const filtered = projects.filter((project) => {
      const matchesAvailability =
        availability === "all" ||
        (availability === "preview"
          ? Boolean(toSafeExternalUrl(project.previewUrl))
          : Boolean(toSafeExternalUrl(project.githubUrl)));

      return matchesAvailability && matchesProject(project, deferredSearch);
    });

    return [...filtered].sort((first, second) => {
      if (sort === "most-starred") {
        return (
          (second.starsCount ?? 0) - (first.starsCount ?? 0) ||
          (second.forksCount ?? 0) - (first.forksCount ?? 0) ||
          first.name.localeCompare(second.name)
        );
      }
      if (sort === "alphabetical") return first.name.localeCompare(second.name);

      return first.sortOrder - second.sortOrder || first.name.localeCompare(second.name);
    });
  }, [availability, deferredSearch, projects, sort]);

  const previewCount = projects.filter((project) =>
    Boolean(toSafeExternalUrl(project.previewUrl))
  ).length;
  const sourceCount = projects.filter((project) =>
    Boolean(toSafeExternalUrl(project.githubUrl))
  ).length;

  const clearFilters = () => {
    setSearch("");
    setAvailability("all");
  };

  const handleAvailabilityChange = (keys: "all" | Set<React.Key>) => {
    if (keys === "all") return;

    const [key] = Array.from(keys);
    if (key === "all" || key === "preview" || key === "source") {
      setAvailability(key);
    }
  };

  return (
    <PageFrame className="bg-background">
      <div className="w-full">
        <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-xl">
            <Chip color="accent" size="sm" variant="soft">
              {t("eyebrow")}
            </Chip>
            <Typography
              type="h1"
              weight="bold"
              className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.045em] text-balance break-words"
            >
              {t("title")}
            </Typography>
            <Typography color="muted" type="body" className="mt-4 max-w-xl leading-7">
              {t("description")}
            </Typography>
          </div>
          <div className="lg:border-default-200 grid grid-cols-3 gap-4 lg:border-l lg:pl-6">
            <div className="min-w-0">
              <Typography className="font-mono text-2xl tabular-nums" type="body">
                {projects.length.toLocaleString(locale)}
              </Typography>
              <Typography color="muted" type="body-xs" className="mt-1 leading-5">
                {t("publishedCount")}
              </Typography>
            </div>
            <div className="min-w-0">
              <Typography className="font-mono text-2xl tabular-nums" type="body">
                {previewCount.toLocaleString(locale)}
              </Typography>
              <Typography color="muted" type="body-xs" className="mt-1 leading-5">
                {t("livePreview")}
              </Typography>
            </div>
            <div className="min-w-0">
              <Typography className="font-mono text-2xl tabular-nums" type="body">
                {sourceCount.toLocaleString(locale)}
              </Typography>
              <Typography color="muted" type="body-xs" className="mt-1 leading-5">
                {t("sourceAvailable")}
              </Typography>
            </div>
          </div>
        </header>

        <section aria-label={t("section")} className="mt-12">
          {isLoading ? <ProjectSkeleton /> : null}

          {!isLoading && error ? (
            <EmptyState size="lg">
              <EmptyState.Header>
                <EmptyState.Media variant="icon">
                  <Icon icon="gravity-ui:code" aria-hidden="true" />
                </EmptyState.Media>
                <EmptyState.Title>{t("unavailable")}</EmptyState.Title>
                <EmptyState.Description>{t("unavailableHint")}</EmptyState.Description>
              </EmptyState.Header>
              <EmptyState.Content>
                <Button variant="outline" onPress={() => refetch()}>
                  <Icon icon="gravity-ui:arrow-rotate-left" aria-hidden="true" />
                  {t("tryAgain")}
                </Button>
              </EmptyState.Content>
            </EmptyState>
          ) : null}

          {!isLoading && !error && projects.length === 0 ? (
            <Card variant="secondary" className="p-0">
              <EmptyState size="lg">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <Icon icon="gravity-ui:code" aria-hidden="true" />
                  </EmptyState.Media>
                  <EmptyState.Title>{t("empty")}</EmptyState.Title>
                  <EmptyState.Description>{t("emptyHint")}</EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            </Card>
          ) : null}

          {!isLoading && !error && projects.length > 0 ? (
            <>
              <div className="border-default-200 grid gap-5 border-t border-b py-5 lg:grid-cols-[minmax(0,1fr)_13rem] lg:items-end">
                <div className="min-w-0">
                  <SearchField fullWidth name="project-search" value={search} onChange={setSearch}>
                    <Label className="sr-only">{t("searchLabel")}</Label>
                    <SearchField.Group>
                      <SearchField.SearchIcon />
                      <SearchField.Input placeholder={t("searchPlaceholder")} />
                      <SearchField.ClearButton aria-label={t("clearSearch")} />
                    </SearchField.Group>
                  </SearchField>
                  <TagGroup
                    aria-label={t("filterAvailability")}
                    selectedKeys={new Set([availability])}
                    selectionMode="single"
                    size="sm"
                    variant="surface"
                    className="mt-4"
                    onSelectionChange={handleAvailabilityChange}
                  >
                    <TagGroup.List className="flex-wrap">
                      <Tag id="all" textValue={t("allProjects")}>
                        {t("allProjects")}
                        <span className="text-muted text-xs tabular-nums">{projects.length}</span>
                      </Tag>
                      <Tag id="preview" textValue={t("livePreviewValue")}>
                        {t("livePreview")}
                        <span className="text-muted text-xs tabular-nums">{previewCount}</span>
                      </Tag>
                      <Tag id="source" textValue={t("sourceAvailable")}>
                        {t("sourceAvailable")}
                        <span className="text-muted text-xs tabular-nums">{sourceCount}</span>
                      </Tag>
                    </TagGroup.List>
                  </TagGroup>
                </div>
                <Select
                  fullWidth
                  value={sort}
                  variant="secondary"
                  onChange={(value) => {
                    if (
                      value === "featured" ||
                      value === "most-starred" ||
                      value === "alphabetical"
                    ) {
                      setSort(value);
                    }
                  }}
                >
                  <Label>{t("sortLabel")}</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="featured" textValue={t("featuredFirst")}>
                        {t("featuredFirst")}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="most-starred" textValue={t("mostStarred")}>
                        {t("mostStarred")}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="alphabetical" textValue={t("alphabetical")}>
                        {t("alphabetical")}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <Typography color="muted" type="body-sm">
                  {t("toExplore", { count: visibleProjects.length })}
                </Typography>
                {search || availability !== "all" ? (
                  <Button size="sm" variant="tertiary" onPress={clearFilters}>
                    {t("clearFilters")}
                  </Button>
                ) : null}
              </div>

              {visibleProjects.length > 0 ? (
                <div className="mt-5 flex flex-col gap-4" data-testid="projects-grid">
                  {visibleProjects[0] ? (
                    <ProjectCard featured project={visibleProjects[0]} />
                  ) : null}
                  {visibleProjects.length > 1 ? (
                    <div className={PROJECT_GRID}>
                      {visibleProjects.slice(1).map((project) => (
                        <ProjectCard key={project.id} project={project} />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <Card variant="secondary" className="mt-6 items-start gap-4 p-7">
                  <Card.Header>
                    <Chip size="sm" variant="soft">
                      {t("noMatches")}
                    </Chip>
                    <Card.Title>{t("noMatchTitle")}</Card.Title>
                    <Card.Description>{t("noMatchHint")}</Card.Description>
                  </Card.Header>
                  <Button size="sm" variant="secondary" onPress={clearFilters}>
                    {t("showAll")}
                  </Button>
                </Card>
              )}
            </>
          ) : null}
        </section>

        <div className="border-default-200 mt-16 flex flex-col gap-3 border-t pt-7 sm:flex-row sm:items-center sm:justify-between">
          <Typography color="muted" type="body-sm">
            {t("lookingForNotes")}
          </Typography>
          <Link
            className="text-accent inline-flex items-center gap-2 text-sm font-medium no-underline"
            href="/explore"
          >
            {t("exploreWriting")}
            <Icon icon="gravity-ui:arrow-right" aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </PageFrame>
  );
}
