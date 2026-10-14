import { Skeleton } from "@heroui/react";
import { getTranslations } from "next-intl/server";

export default async function ArticleLoading() {
  const t = await getTranslations("Article");

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-28 pb-28 sm:px-8">
      <div aria-busy="true" aria-label={t("loading")} className="flex flex-col gap-3">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-11/12 rounded-md" />
        <Skeleton className="h-4 w-4/5 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-3/4 rounded-md" />
      </div>
    </div>
  );
}
