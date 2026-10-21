import Home from "./home-client";
import { getPublicMomentsInitialData } from "@/lib/features/moment/public-moments";
import { MOMENTS_SHOWCASE_LIMIT } from "@/features/home/moments-showcase";

export default async function HomePage() {
  const initial = await getPublicMomentsInitialData(MOMENTS_SHOWCASE_LIMIT);

  return <Home moments={initial.page?.list ?? []} />;
}
