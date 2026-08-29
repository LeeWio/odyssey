"use client";

import { ArrowRight, Check, Envelope, Xmark } from "@gravity-ui/icons";
import { Card, Link } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useUnsubscribeQuery, useVerifyQuery } from "@/lib/features/openapi";

type NewsletterAction = "verify" | "unsubscribe";

export function NewsletterStatusPage({ action }: { action: NewsletterAction }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const isComplete = searchParams.get("status") === action;
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
  const isSuccessful = isComplete || request.isSuccess;
  const title = isVerification ? "You’re on the list." : "You’ve been unsubscribed.";
  const description = isVerification
    ? "Your subscription is confirmed. Expect an occasional note when there is something worth sharing."
    : "You will no longer receive the weekly note. You can always come back when the timing feels right.";

  useEffect(() => {
    if (request.isSuccess && !isComplete) {
      router.replace(`/newsletter/${action}?status=${action}`);
    }
  }, [action, isComplete, request.isSuccess, router]);

  return (
    <main className="bg-background flex min-h-[100dvh] items-center px-6 py-24 sm:px-10">
      <div className="mx-auto w-full max-w-xl">
        <Card>
          <Card.Header>
            <div className="text-muted flex items-center gap-2 font-mono text-xs font-semibold uppercase">
              <Envelope aria-hidden="true" className="size-4" /> Newsletter
            </div>
            <Card.Title className="mt-4 text-3xl tracking-[-0.03em]">{title}</Card.Title>
            <Card.Description className="mt-3 max-w-md text-base leading-7">
              {description}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {!token ? (
              <div className="text-muted flex items-center gap-3 text-sm">
                <Xmark aria-hidden="true" className="text-danger size-5 shrink-0" />
                This link is incomplete. Please use the link from your email.
              </div>
            ) : request.isLoading ? (
              <div className="text-muted flex items-center gap-3 text-sm">
                <span aria-hidden="true" className="bg-accent size-2 animate-pulse rounded-full" />
                Confirming your choice…
              </div>
            ) : request.isError ? (
              <div className="text-muted flex items-center gap-3 text-sm">
                <Xmark aria-hidden="true" className="text-danger size-5 shrink-0" />
                This link is no longer valid. You can request a fresh subscription email below.
              </div>
            ) : isSuccessful ? (
              <div className="text-muted flex items-center gap-3 text-sm">
                <Check aria-hidden="true" className="text-success size-5 shrink-0" />
                Your preference has been saved.
              </div>
            ) : null}
          </Card.Content>
          <Card.Footer className="justify-between gap-4">
            <Link className="text-muted text-sm no-underline" href="/">
              Back to Odyssey
            </Link>
            <Link
              className="text-accent inline-flex items-center gap-2 text-sm font-medium no-underline"
              href="/blog"
            >
              Browse writing
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Card.Footer>
        </Card>
      </div>
    </main>
  );
}
