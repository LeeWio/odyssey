"use client";

import { Alert, Button, Card, Link, toast } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRef, useState, useSyncExternalStore } from "react";

import { PageFrame } from "@/components/layout/page-frame";
import {
  useUnsubscribeFromMomentsMutation,
  useVerifyMomentSubscriptionMutation,
} from "@/lib/features/moment/moment-subscription-api";

type SubscriptionAction = "verify" | "unsubscribe";

function subscribeToLocation(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function readLocation() {
  return window.location.search + window.location.hash;
}

function readInitialLocation() {
  return null;
}

export function MomentSubscriptionStatus({ action }: { action: SubscriptionAction }) {
  const location = useSyncExternalStore(subscribeToLocation, readLocation, readInitialLocation);
  const [search, hash] = location?.split("#", 2) ?? [];
  const token = new URLSearchParams(hash).get("token") ?? "";
  const completed = !token && new URLSearchParams(search).get("status") === "complete";
  return (
    <SubscriptionStatusContent
      key={`${action}:${token}`}
      action={action}
      token={token}
      ready={location !== null}
      alreadyCompleted={completed}
    />
  );
}

function SubscriptionStatusContent({
  action,
  token,
  ready,
  alreadyCompleted,
}: {
  action: SubscriptionAction;
  token: string;
  ready: boolean;
  alreadyCompleted: boolean;
}) {
  const t = useTranslations("MomentSubscription");
  const [verify] = useVerifyMomentSubscriptionMutation();
  const [unsubscribe] = useUnsubscribeFromMomentsMutation();
  const [state, setState] = useState<"ready" | "pending" | "error" | "complete">("ready");
  const pending = useRef(false);
  const isVerification = action === "verify";
  const complete = alreadyCompleted || state === "complete";
  const hasToken = token.length === 36;
  const title = complete
    ? t(isVerification ? "verifiedTitle" : "unsubscribedTitle")
    : t(isVerification ? "confirmTitle" : "unsubscribeTitle");
  const description = complete
    ? t(isVerification ? "verifiedDescription" : "unsubscribedDescription")
    : t(hasToken ? (isVerification ? "confirmDescription" : "unsubscribeDescription") : "missing");

  async function submit() {
    if (pending.current || !hasToken || complete) return;
    const requestedUrl = window.location.href;
    pending.current = true;
    setState("pending");
    try {
      await (isVerification ? verify(token) : unsubscribe(token)).unwrap();
      if (window.location.href !== requestedUrl) return;
      window.history.replaceState(null, "", `${window.location.pathname}?status=complete`);
      setState("complete");
      toast.success(t(isVerification ? "verifiedTitle" : "unsubscribedTitle"));
    } catch {
      if (window.location.href === requestedUrl) {
        setState("error");
        toast.danger(t("linkUnavailable"));
      }
    } finally {
      pending.current = false;
    }
  }

  return (
    <PageFrame>
      <Card className="mx-auto w-full max-w-md">
        <Card.Header>
          <Card.Title render={(props) => <h1 {...props} />}>{title}</Card.Title>
          {ready && !complete && hasToken ? (
            <Card.Description>{description}</Card.Description>
          ) : null}
        </Card.Header>
        {ready ? (
          <Card.Content className="flex flex-col items-start gap-3">
            {complete || !hasToken || state === "error" ? (
              <Alert
                role={complete ? "status" : "alert"}
                status={complete ? "success" : state === "error" ? "danger" : "warning"}
              >
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>
                    {state === "error" ? t("actionFailed") : description}
                  </Alert.Description>
                </Alert.Content>
              </Alert>
            ) : null}
            {!complete && hasToken ? (
              <Button isPending={state === "pending"} onPress={() => void submit()}>
                {state === "pending"
                  ? t("working")
                  : t(isVerification ? "confirmAction" : "unsubscribeAction")}
              </Button>
            ) : null}
          </Card.Content>
        ) : null}
        <Card.Footer>
          <Link href="/moments">{t("backToMoments")}</Link>
        </Card.Footer>
      </Card>
    </PageFrame>
  );
}
