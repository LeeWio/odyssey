import { getTranslations } from "next-intl/server";

export default async function ArticleLoading() {
  const t = await getTranslations("Article");

  return <div aria-busy="true" aria-label={t("loading")} className="min-h-[70dvh]" />;
}
