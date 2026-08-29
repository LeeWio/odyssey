"use client";

import { Bell, Envelope, Gear } from "@gravity-ui/icons";
import { EmptyState } from "@heroui-pro/react";
import { Button, Card, Skeleton, Switch, Typography } from "@heroui/react";
import { useState } from "react";

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
    description: "Replies, approvals, and moderation changes that involve you.",
    emailKey: "commentEmailNotificationsEnabled",
    inboxKey: "commentNotificationsEnabled",
    title: "Comments & replies",
  },
  {
    description: "New writing published in categories you follow.",
    emailKey: "categoryPostEmailNotificationsEnabled",
    inboxKey: "categoryPostNotificationsEnabled",
    title: "Writing from your follows",
  },
  {
    description: "Account, security, and operational updates that may need attention.",
    emailKey: "systemEmailNotificationsEnabled",
    inboxKey: "systemNotificationsEnabled",
    title: "System updates",
  },
] as const;

function NotificationPreferencesSkeleton() {
  return (
    <Card variant="secondary">
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
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const preferences = useGetMyNotificationPreferencesQuery(undefined, { skip: !isAuthenticated });
  const [updatePreferences, { isLoading: isSaving }] = useUpdateMyNotificationPreferencesMutation();
  const [draft, setDraft] = useState<NotificationPreference | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="bg-background flex min-h-[100dvh] items-center px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
        <div className="mx-auto w-full max-w-lg">
          <EmptyState size="lg">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <Bell aria-hidden="true" />
              </EmptyState.Media>
              <EmptyState.Title>Notification preferences</EmptyState.Title>
              <EmptyState.Description>
                Sign in to choose how activity reaches you.
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content>
              <Button onPress={() => dispatch(setLoginOpen(true))}>Sign in</Button>
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
      const base = current ?? preferences.data;
      return base ? { ...base, [key]: value } : current;
    });
  };

  const handleSave = async () => {
    if (!currentPreferences) return;
    await updatePreferences(currentPreferences).unwrap();
    setDraft(null);
  };

  const savedPreferences = preferences.data;
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
            <Gear aria-hidden="true" className="size-4" /> Delivery controls
          </div>
          <Typography type="h1" weight="bold" className="mt-5 leading-[1.02] text-balance">
            Notifications
          </Typography>
          <Typography color="muted" type="body" className="mt-5">
            Choose the updates that deserve a place in your inbox, your email, or both.
          </Typography>
        </header>

        <section className="mt-12" aria-label="Notification delivery preferences">
          {preferences.isLoading || !currentPreferences ? (
            <NotificationPreferencesSkeleton />
          ) : null}
          {preferences.isError ? (
            <Card variant="secondary">
              <Card.Header>
                <Card.Title>Preferences are unavailable</Card.Title>
                <Card.Description>Try loading this page again in a moment.</Card.Description>
              </Card.Header>
              <Card.Footer>
                <Button variant="ghost" onPress={() => preferences.refetch()}>
                  Try again
                </Button>
              </Card.Footer>
            </Card>
          ) : null}
          {currentPreferences ? (
            <Card>
              <Card.Header>
                <Card.Title>What reaches you</Card.Title>
                <Card.Description>
                  In-app is your archive. Email is reserved for the updates you do not want to miss.
                </Card.Description>
              </Card.Header>
              <Card.Content className="gap-6">
                <div className="text-muted grid grid-cols-[1fr_auto_auto] items-center gap-x-5 text-xs font-medium">
                  <span>Activity</span>
                  <span>In-app</span>
                  <span>Email</span>
                </div>
                {PREFERENCE_ROWS.map((row) => (
                  <div
                    key={row.inboxKey}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-x-5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{row.title}</p>
                      <p className="text-muted mt-1 text-sm leading-5">{row.description}</p>
                    </div>
                    <PreferenceSwitch
                      isSelected={currentPreferences[row.inboxKey]}
                      label={`${row.title} in-app`}
                      onChange={(value) => updateDraft(row.inboxKey, value)}
                    />
                    <PreferenceSwitch
                      isSelected={currentPreferences[row.emailKey]}
                      label={`${row.title} email`}
                      onChange={(value) => updateDraft(row.emailKey, value)}
                    />
                  </div>
                ))}
              </Card.Content>
              <Card.Footer className="justify-between gap-4">
                <div className="text-muted flex items-center gap-2 text-xs">
                  <Envelope aria-hidden="true" className="size-4" /> Email delivery is opt-in.
                </div>
                <Button isDisabled={!isDirty} isPending={isSaving} onPress={handleSave}>
                  Save preferences
                </Button>
              </Card.Footer>
            </Card>
          ) : null}
        </section>
      </div>
    </div>
  );
}
