"use client";

import { Icon } from "@iconify/react";

import { Button, Card, Link } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { useUnsubscribeQuery, useVerifyQuery } from "@/lib/features/openapi";

type NewsletterAction = "verify" | "unsubscribe";

export function NewsletterStatusPage({ action }: { action: NewsletterAction }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  return (
    <NewsletterStatusContent
      key={`${action}:${token}`}
      action={action}
      token={token}
      isComplete={!token && searchParams.get("status") === action}
    />
  );
}

// Isolate query state when another email link is opened in the same mounted page.
// A previous token's success must never complete a different token's request.
function NewsletterStatusContent({
  action,
  token,
  isComplete,
}: {
  action: NewsletterAction;
  token: string;
  isComplete: boolean;
}) {
  const t = useTranslations("Newsletter");
  const router = useRouter();
  const verification = useVerifyQuery(
    { token },
    { skip: action !== "verify" || token.length === 0 || isComplete }
  );
  const unsubscription = useUnsubscribeQuery(
    { token },
    { skip: action !== "unsubscribe" || token.length === 0 || isComplete }
  );
  const request = action === "verify" ? verification : unsubscription;
  const isVerification = action === "verify";
  const state = isComplete
    ? "success"
    : !token
      ? "missing"
      : request.isFetching || request.isUninitialized
        ? "pending"
        : request.isError
          ? "error"
          : request.isSuccess
            ? "success"
            : "pending";
  const successTitle = isVerification ? t("verifiedTitle") : t("unsubscribedTitle");
  const successDescription = isVerification
    ? t("verifiedDescription")
    : t("unsubscribedDescription");
  const title = {
    success: successTitle,
    pending: isVerification ? t("confirming") : t("updating"),
    missing: t("linkNeeded"),
    error: t("confirmFailed"),
  }[state];
  const description = {
    success: successDescription,
    pending: t("pleaseWait"),
    missing: t("openCompleteLink"),
    error: t("tryLatest"),
  }[state];

  useEffect(() => {
    if (state === "success" && token) {
      router.replace(`/newsletter/${action}?status=${action}`);
    }
  }, [action, state, token, router]);

  return (
    <div className="bg-background flex min-h-[100dvh] items-center px-6 py-24 sm:px-10">
      <div className="mx-auto w-full max-w-xl">
        <Card>
          <Card.Header>
            <div className="text-muted flex items-center gap-2 font-mono text-xs font-semibold uppercase">
              <Icon icon="gravity-ui:envelope" aria-hidden="true" className="size-4" />{" "}
              {t("eyebrow")}
            </div>
            <Card.Title className="mt-4 text-3xl tracking-[-0.03em]">{title}</Card.Title>
            <Card.Description className="mt-3 max-w-md text-base leading-7">
              {description}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {state === "missing" ? (
              <div role="alert" className="text-muted flex items-center gap-3 text-sm">
                <Icon
                  icon="gravity-ui:xmark"
                  aria-hidden="true"
                  className="text-danger size-5 shrink-0"
                />
                {t("incomplete")}
              </div>
            ) : state === "pending" ? (
              <div role="status" className="text-muted flex items-center gap-3 text-sm">
                <span aria-hidden="true" className="bg-accent size-2 animate-pulse rounded-full" />
                {t("confirmingChoice")}
              </div>
            ) : state === "error" ? (
              <div className="flex flex-col items-start gap-4">
                <div role="alert" className="text-muted flex items-center gap-3 text-sm">
                  <Icon
                    icon="gravity-ui:xmark"
                    aria-hidden="true"
                    className="text-danger size-5 shrink-0"
                  />
                  {t("processFailed")}
                </div>
                <Button variant="secondary" onPress={() => void request.refetch()}>
                  {t("tryAgain")}
                </Button>
              </div>
            ) : state === "success" ? (
              <div role="status" className="text-muted flex items-center gap-3 text-sm">
                <Icon
                  icon="gravity-ui:check"
                  aria-hidden="true"
                  className="text-success size-5 shrink-0"
                />
                {t("saved")}
              </div>
            ) : null}
          </Card.Content>
          <Card.Footer className="justify-between gap-4">
            <Link className="text-muted text-sm no-underline" href="/">
              {t("backHome")}
            </Link>
            <Link
              className="text-accent inline-flex items-center gap-2 text-sm font-medium no-underline"
              href="/single"
            >
              {t("browseWriting")}
              <Icon icon="gravity-ui:arrow-right" aria-hidden="true" className="size-4" />
            </Link>
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
}
