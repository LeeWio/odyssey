"use client";

import { EmptyState } from "@heroui-pro/react";
import { Button, Chip, Link, Tabs, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Key } from "react";

import { selectIsAuthenticated } from "@/lib/features/auth";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useTranslations } from "next-intl";

import { CollectionsSection } from "./collections-section";
import { ContinueReadingSection } from "./continue-reading-section";
import { FavoritesSection } from "./favorites-section";
import { FollowingFeedSection } from "./following-feed-section";
import { ReadingHistorySection } from "./reading-history-section";
import { ReadingListSection } from "./reading-list-section";
import { ReadingPreferencesSection } from "./reading-preferences-section";
import { RecommendationsSection } from "./recommendations-section";
import { PageFrame } from "@/components/layout/page-frame";

type LibraryView = "reading" | "discover" | "organize" | "history";

const LIBRARY_VIEWS: LibraryView[] = ["reading", "discover", "organize", "history"];

function getLibraryView(value: string | null): LibraryView {
  return LIBRARY_VIEWS.includes(value as LibraryView) ? (value as LibraryView) : "reading";
}

export function LibraryPage() {
  const t = useTranslations("Library");
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeView = getLibraryView(searchParams.get("view"));

  const handleViewChange = (key: Key) => {
    const nextView = getLibraryView(String(key));
    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextView === "reading") nextParams.delete("view");
    else nextParams.set("view", nextView);
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const renderLibraryView = () => {
    switch (activeView) {
      case "discover":
        return (
          <>
            <FollowingFeedSection />
            <RecommendationsSection />
            <ReadingPreferencesSection />
          </>
        );
      case "organize":
        return (
          <>
            <FavoritesSection />
            <CollectionsSection />
          </>
        );
      case "history":
        return <ReadingHistorySection />;
      case "reading":
      default:
        return (
          <>
            <ContinueReadingSection />
            <ReadingListSection />
          </>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <PageFrame className="bg-background flex items-center">
        <div className="mx-auto w-full max-w-lg">
          <EmptyState size="lg">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Icon icon="gravity-ui:book-open" aria-hidden="true" />
              </EmptyState.Media>
              <EmptyState.Title>{t("signInTitle")}</EmptyState.Title>
              <EmptyState.Description>{t("signInDescription")}</EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => dispatch(setLoginOpen(true))}>{t("signIn")}</Button>
              <Link className="no-underline" href="/single">
                {t("browseArticles")}
              </Link>
            </EmptyState.Content>
          </EmptyState>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame className="bg-background">
      <div className="flex w-full flex-col gap-16">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <Chip size="sm" variant="secondary">
              {t("eyebrow")}
            </Chip>
            <Typography
              type="h1"
              weight="bold"
              className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.045em] text-balance"
            >
              {t("title")}
            </Typography>
            <Typography color="muted" type="body" className="mt-4 leading-7">
              {t("description")}
            </Typography>
          </div>
          <Link
            className="text-accent inline-flex shrink-0 items-center gap-2 no-underline"
            href="/single"
          >
            {t("browseAllWriting")}
            <Icon icon="gravity-ui:arrow-up-right" aria-hidden="true" className="size-4" />
          </Link>
        </header>

        <Tabs className="min-w-0" selectedKey={activeView} onSelectionChange={handleViewChange}>
          <Tabs.ListContainer className="overflow-x-auto">
            <Tabs.List aria-label={t("libraryViews")}>
              <Tabs.Tab id="reading">
                <Icon icon="gravity-ui:book-open" aria-hidden="true" className="size-4" />
                {t("viewReading")}
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="discover">
                <Icon icon="gravity-ui:sparkles" aria-hidden="true" className="size-4" />
                {t("viewDiscover")}
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="organize">
                <Icon icon="gravity-ui:layers" aria-hidden="true" className="size-4" />
                {t("viewOrganize")}
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="history">
                <Icon icon="gravity-ui:clock" aria-hidden="true" className="size-4" />
                {t("viewHistory")}
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
          <Tabs.Panel id={activeView} className="focus:outline-none">
            {renderLibraryView()}
          </Tabs.Panel>
        </Tabs>
      </div>
    </PageFrame>
  );
}
