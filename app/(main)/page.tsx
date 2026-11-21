import { Suspense } from "react";
import { Skeleton } from "@heroui/react";
import { cookies } from "next/headers";
import { HomePage } from "@/features/home";
import { HomeMessages } from "@/features/home/home-messages";
import { HomeOrientation } from "@/features/home/home-orientation";
import { HOME_ORIENTATION_COOKIE } from "@/features/home/home-orientation-storage";
import { MomentsShowcase } from "@/features/home/moments-showcase";
import { MomentsRecovery } from "@/features/home/moments-recovery-loader";
import { MomentsMasonry } from "@/features/home/moments-masonry";
import { getPublicMomentsInitialPage } from "@/lib/features/moment/server";
import { MOMENTS_SHOWCASE_LIMIT } from "@/features/home/layout";

async function RecentMoments() {
  const page = await getPublicMomentsInitialPage(MOMENTS_SHOWCASE_LIMIT);

  if (!page) return <MomentsRecovery />;
  if (!page.list.length) return null;
  return (
    <MomentsShowcase>
      <MomentsMasonry moments={page.list} />
    </MomentsShowcase>
  );
}

export default async function HomeRoute() {
  const orientationDismissed = (await cookies()).get(HOME_ORIENTATION_COOKIE)?.value === "1";

  return (
    <HomeMessages>
      <HomePage
        orientation={orientationDismissed ? null : <HomeOrientation />}
        moments={
          <Suspense fallback={<Skeleton className="mx-auto h-80 w-full max-w-5xl" />}>
            <RecentMoments />
          </Suspense>
        }
      />
    </HomeMessages>
  );
}
