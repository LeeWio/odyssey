import { HomePage } from "@/features/home";
import { getPublicMomentsInitialData } from "@/lib/features/moment/server";
import { MOMENTS_SHOWCASE_LIMIT } from "@/features/home/moments-showcase";

export default async function HomeRoute() {
  const initial = await getPublicMomentsInitialData(MOMENTS_SHOWCASE_LIMIT);

  return <HomePage moments={initial.page?.list ?? []} />;
}
