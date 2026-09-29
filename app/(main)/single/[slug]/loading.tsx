import { Skeleton } from "@heroui/react";
import { getTranslations } from "next-intl/server";

export default async function ArticleLoading() {
  const t = await getTranslations("Article");

  return (
    <div className="grid w-full grid-cols-1 gap-x-10 gap-y-12 px-6 pt-28 pb-28 sm:px-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:px-8 xl:grid-cols-[14rem_minmax(0,1fr)_18rem] xl:px-10 2xl:px-14">
      <div className="hidden xl:block" />
      <div aria-busy="true" aria-label={t("loading")} className="flex flex-col gap-6">
        <Skeleton className="h-4 w-40 rounded-md" />
        <Skeleton className="h-14 w-11/12 rounded-lg" />
        <Skeleton className="h-14 w-3/4 rounded-lg" />
        <Skeleton className="h-5 w-full rounded-md" />
        <div className="flex flex-col gap-3 pt-8">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-11/12 rounded-md" />
          <Skeleton className="h-4 w-4/5 rounded-md" />
        </div>
      </div>
    </div>
  );
}
