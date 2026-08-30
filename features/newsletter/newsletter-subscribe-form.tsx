"use client";

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Spinner,
  TextField,
  cn,
  toast,
} from "@heroui/react";
import { useState, type FormEvent } from "react";

import { useSubscribeMutation } from "@/lib/features/openapi";

type NewsletterSubscribeFormProps = {
  variant?: "inline" | "stacked";
};

export function NewsletterSubscribeForm({ variant = "stacked" }: NewsletterSubscribeFormProps) {
  const [email, setEmail] = useState("");
  const [hasSubscribed, setHasSubscribed] = useState(false);
  const [subscribe, { isLoading: isSubscribing }] = useSubscribeMutation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      return;
    }

    try {
      await subscribe({ email: normalizedEmail }).unwrap();
      setEmail("");
      setHasSubscribed(true);
      toast.success("Check your inbox to confirm your subscription.");
    } catch {
      // The generated mutation reports API failures through the shared toast helper.
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <Form
        className={cn(
          "flex w-full gap-3",
          variant === "inline" ? "flex-col sm:flex-row sm:items-start" : "flex-col"
        )}
        validationBehavior="native"
        onSubmit={handleSubmit}
      >
        <TextField
          isRequired
          className="min-w-0 flex-1"
          name="email"
          type="email"
          validate={(value) =>
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Enter a valid email address."
          }
        >
          <Label className="sr-only">Email address</Label>
          <Input
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            variant="secondary"
            onChange={(event) => {
              setEmail(event.target.value);
              setHasSubscribed(false);
            }}
          />
          <FieldError />
        </TextField>
        <Button
          className={variant === "inline" ? "shrink-0" : "w-full"}
          isPending={isSubscribing}
          type="submit"
        >
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : null}
              Subscribe
            </>
          )}
        </Button>
      </Form>
      {hasSubscribed ? (
        <p aria-live="polite" className="text-success text-xs leading-5">
          Check your inbox to confirm your subscription.
        </p>
      ) : null}
    </div>
  );
}
