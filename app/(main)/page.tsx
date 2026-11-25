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
import { HomeSiteRecord, HomeSiteRecordSkeleton } from "@/features/home/home-site-record";
import { buildWritingHistory, publicWritingArchiveSchema } from "@/features/home/writing-history";
import { FOOTPRINTS } from "@/features/footprints/footprints-data";
import { fetchServerApiJson } from "@/lib/api/server-client";
import { getPublicMomentsInitialPage } from "@/lib/features/moment/server";
import { MOMENTS_SHOWCASE_LIMIT } from "@/features/home/layout";

type MomentsRequest = ReturnType<typeof getPublicMomentsInitialPage>;

async function RecentMoments({ moments }: { moments: MomentsRequest }) {
  const page = await moments;

  if (!page) return <MomentsRecovery />;
  if (!page.list.length) return null;
  return (
    <MomentsShowcase>
      <MomentsMasonry moments={page.list} />
    </MomentsShowcase>
  );
}

async function SiteRecord({ moments }: { moments: MomentsRequest }) {
  const [archive, momentPage] = await Promise.all([
    fetchServerApiJson("/api/v1/public/blog/facets", publicWritingArchiveSchema, {
      localize: false,
      revalidate: 300,
    }),
    moments,
  ]);

  return (
    <HomeSiteRecord
      articleCount={archive.data?.totalPublishedCount ?? null}
      momentCount={momentPage?.total ?? null}
      footprintCount={FOOTPRINTS.length}
      history={archive.data ? buildWritingHistory(archive.data.archives) : null}
    />
  );
}

export default async function HomeRoute() {
  const orientationDismissed = (await cookies()).get(HOME_ORIENTATION_COOKIE)?.value === "1";
  const moments = getPublicMomentsInitialPage(MOMENTS_SHOWCASE_LIMIT);

  return (
    <HomeMessages>
      <HomePage
        orientation={orientationDismissed ? null : <HomeOrientation />}
        moments={
          <Suspense fallback={<Skeleton className="mx-auto h-80 w-full max-w-5xl" />}>
            <RecentMoments moments={moments} />
          </Suspense>
        }
        siteRecord={
          <Suspense fallback={<HomeSiteRecordSkeleton />}>
            <SiteRecord moments={moments} />
          </Suspense>
        }
      />
    </HomeMessages>
  );
}
