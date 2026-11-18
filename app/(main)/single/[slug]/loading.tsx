import { Skeleton } from "@heroui/react";
import { getTranslations } from "next-intl/server";

import { PageContainer } from "@/components/layout/page-container";

export default async function ArticleLoading() {
  const t = await getTranslations("Article");

  return (
    <PageContainer aria-busy="true" aria-label={t("loading")} className="min-h-[70dvh] pt-28">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-12 w-full max-w-xl rounded-lg" />
        <Skeleton className="h-6 w-full max-w-md rounded-lg" />
        <Skeleton className="mt-8 h-4 w-40 rounded-lg" />
      </div>
      <div className="mx-auto mt-16 flex w-full max-w-3xl flex-col gap-4">
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-11/12 rounded-lg" />
        <Skeleton className="h-4 w-10/12 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-lg" />
      </div>
    </PageContainer>
  );
}
