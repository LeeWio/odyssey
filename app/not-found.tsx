import { getTranslations } from "next-intl/server";
import { RouteLinkButton, RouteState } from "@/components/system/route-state";

export default async function NotFound() {
  const t = await getTranslations("Errors");

  return (
    <RouteState
      kind="not-found"
      title={t("notFoundTitle")}
      description={t("notFoundDescription")}
      actions={
        <>
          <RouteLinkButton href="/">{t("backHome")}</RouteLinkButton>
          <RouteLinkButton href="/blog" variant="secondary">
            {t("browseChronicle")}
          </RouteLinkButton>
        </>
      }
    />
  );
}
