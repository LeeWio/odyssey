import { Suspense } from "react";
import { Skeleton } from "@heroui/react";
import { HomePage } from "@/features/home";
import { HomeMessages } from "@/features/home/home-messages";
import { MomentsShowcase } from "@/features/home/moments-showcase";
import { getPublicMomentsInitialPage } from "@/lib/features/moment/server";
import { MOMENTS_SHOWCASE_LIMIT } from "@/features/home/layout";

async function RecentMoments() {
  const page = await getPublicMomentsInitialPage(MOMENTS_SHOWCASE_LIMIT);

  return <MomentsShowcase moments={page?.list ?? null} />;
}

export default function HomeRoute() {
  return (
    <HomeMessages>
      <HomePage
        moments={
          <Suspense fallback={<Skeleton className="mx-auto h-80 w-full max-w-5xl" />}>
            <RecentMoments />
          </Suspense>
        }
      />
    </HomeMessages>
  );
}
