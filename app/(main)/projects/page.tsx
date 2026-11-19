import { ProjectShowcasePage } from "@/features/project-showcase";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const initialSearch = typeof q === "string" ? q : "";
  return <ProjectShowcasePage key={initialSearch} initialSearch={initialSearch} />;
}
