"use client";

import { Icon } from "@iconify/react";

import { EmptyState } from "@heroui-pro/react";
import { Button, Card, Skeleton, Switch, Typography } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { selectIsAuthenticated } from "@/lib/features/auth";
import {
  type NotificationPreference,
  useGetMyNotificationPreferencesQuery,
  useUpdateMyNotificationPreferencesMutation,
} from "@/lib/features/notification";
import { setLoginOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

const PREFERENCE_ROWS = [
  {
    descriptionKey: "commentsDescription",
    emailKey: "commentEmailNotificationsEnabled",
    inboxKey: "commentNotificationsEnabled",
    titleKey: "commentsTitle",
  },
  {
    descriptionKey: "followsDescription",
    emailKey: "categoryPostEmailNotificationsEnabled",
    inboxKey: "categoryPostNotificationsEnabled",
    titleKey: "followsTitle",
  },
  {
    descriptionKey: "systemDescription",
    emailKey: "systemEmailNotificationsEnabled",
    inboxKey: "systemNotificationsEnabled",
    titleKey: "systemTitle",
  },
] as const;

function NotificationPreferencesSkeleton() {
  const t = useTranslations("Notifications");
  return (
    <Card variant="secondary" role="status" aria-label={t("loadingPreferences")}>
      <span className="sr-only">{t("loadingPreferencesStatus")}</span>
      <Card.Header>
        <Skeleton className="h-5 w-40 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </Card.Header>
      <Card.Content className="gap-6">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48 rounded-lg" />
              <Skeleton className="h-4 w-72 rounded-lg" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-6 w-10 rounded-full" />
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
          </div>
        ))}
      </Card.Content>
    </Card>
  );
}

function PreferenceSwitch({
  isSelected,
  label,
  onChange,
}: {
  isSelected: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <Switch aria-label={label} isSelected={isSelected} onChange={onChange}>
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
}

export function NotificationPreferencesPage() {
  const t = useTranslations("Notifications");
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const preferences = useGetMyNotificationPreferencesQuery(undefined, { skip: !isAuthenticated });
  const [updatePreferences, { isLoading: isSaving }] = useUpdateMyNotificationPreferencesMutation();
  const [draft, setDraft] = useState<NotificationPreference | null>(null);
  const saving = useRef(false);

  if (!isAuthenticated) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
        <div className="mx-auto w-full max-w-lg">
          <EmptyState size="lg">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Icon icon="gravity-ui:bell" aria-hidden="true" />
              </EmptyState.Media>
              <EmptyState.Title>{t("preferencesSignInTitle")}</EmptyState.Title>
              <EmptyState.Description>{t("preferencesSignInDescription")}</EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => dispatch(setLoginOpen(true))}>{t("signIn")}</Button>
            </EmptyState.Content>
          </EmptyState>
        </div>
      </div>
    );
  }

  const updateDraft = <Key extends keyof NotificationPreference>(
    key: Key,
    value: NotificationPreference[Key]
  ) => {
    setDraft((current) => {
      const base = current ?? preferences.currentData;
      return base ? { ...base, [key]: value } : current;
    });
  };

  const handleSave = async () => {
    if (saving.current || !currentPreferences || !isDirty) return;
    saving.current = true;
    const submitted = currentPreferences;
    try {
      const saved = await updatePreferences(submitted).unwrap();
      setDraft((current) => {
        if (!current || current === submitted) return null;
        // Adopt the server result, retaining only edits made after submission.
        const remaining = { ...saved };
        for (const key of Object.keys(current) as (keyof NotificationPreference)[]) {
          if (current[key] !== submitted[key]) remaining[key] = current[key];
        }
        return remaining;
      });
    } catch {
      // The mutation reports the API error. Preserve the draft for retry.
    } finally {
      saving.current = false;
    }
  };

  // `data` may retain the last successful query snapshot after a failed
  // refresh; currentData includes the confirmed mutation's cache update.
  const savedPreferences = preferences.currentData;
  const currentPreferences = draft ?? savedPreferences;
  const isDirty =
    draft !== null &&
    savedPreferences !== undefined &&
    Object.keys(draft).some(
      (key) =>
        draft[key as keyof NotificationPreference] !==
        savedPreferences[key as keyof NotificationPreference]
    );

  return (
    <div className="bg-background min-h-[100dvh] px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-3xl">
        <header className="max-w-2xl">
          <div className="text-muted flex items-center gap-2 font-mono text-xs font-semibold uppercase">
            <Icon icon="gravity-ui:gear" aria-hidden="true" className="size-4" />{" "}
            {t("deliveryControls")}
          </div>
          <Typography type="h1" weight="bold" className="mt-5 leading-[1.02] text-balance">
            {t("title")}
          </Typography>
          <Typography color="muted" type="body" className="mt-5">
            {t("preferencesDescription")}
          </Typography>
        </header>

        <section className="mt-12" aria-label={t("deliveryPreferences")}>
          {!currentPreferences && (preferences.isLoading || preferences.isFetching) ? (
            <NotificationPreferencesSkeleton />
          ) : null}
          {preferences.isError && !preferences.isFetching ? (
            <Card variant="secondary">
              <Card.Header>
                <Card.Title>{t("preferencesUnavailable")}</Card.Title>
                <Card.Description>{t("tryAgainHint")}</Card.Description>
              </Card.Header>
              <Card.Footer>
                <Button variant="ghost" onPress={() => preferences.refetch()}>
                  {t("tryAgain")}
                </Button>
              </Card.Footer>
            </Card>
          ) : null}
          {currentPreferences ? (
            <Card>
              <Card.Header>
                <Card.Title>{t("whatReachesYou")}</Card.Title>
                <Card.Description>{t("whatReachesYouHint")}</Card.Description>
              </Card.Header>
              <Card.Content className="gap-6">
                <div className="text-muted grid grid-cols-[1fr_auto_auto] items-center gap-x-5 text-xs font-medium">
                  <span>{t("activity")}</span>
                  <span>{t("inApp")}</span>
                  <span>{t("email")}</span>
                </div>
                {PREFERENCE_ROWS.map((row) => {
                  const title = t(row.titleKey);
                  return (
                    <div
                      key={row.inboxKey}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-x-5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="text-muted mt-1 text-sm leading-5">{t(row.descriptionKey)}</p>
                      </div>
                      <PreferenceSwitch
                        isSelected={currentPreferences[row.inboxKey]}
                        label={t("inAppNamed", { title })}
                        onChange={(value) => updateDraft(row.inboxKey, value)}
                      />
                      <PreferenceSwitch
                        isSelected={currentPreferences[row.emailKey]}
                        label={t("emailNamed", { title })}
                        onChange={(value) => updateDraft(row.emailKey, value)}
                      />
                    </div>
                  );
                })}
              </Card.Content>
              <Card.Footer className="justify-between gap-4">
                <div className="text-muted flex items-center gap-2 text-xs">
                  <Icon icon="gravity-ui:envelope" aria-hidden="true" className="size-4" />{" "}
                  {t("emailOptIn")}
                </div>
                <Button isDisabled={!isDirty || isSaving} isPending={isSaving} onPress={handleSave}>
                  {t("savePreferences")}
                </Button>
              </Card.Footer>
            </Card>
          ) : null}
        </section>
      </div>
    </div>
  );
}
