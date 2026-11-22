"use client";

import { useSubscribeMutation } from "@/lib/features/openapi";
import { EmailSubscriptionForm } from "./email-subscription-form";

export function NewsletterSubscribeForm({ variant }: { variant?: "inline" | "stacked" }) {
  const [subscribe] = useSubscribeMutation();
  return (
    <EmailSubscriptionForm
      channel="Newsletter"
      subscribe={(email) => subscribe({ email }).unwrap()}
      variant={variant}
    />
  );
}
