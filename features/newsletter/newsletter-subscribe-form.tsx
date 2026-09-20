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
import { useRef, useState, type FormEvent } from "react";

import { useSubscribeMutation } from "@/lib/features/openapi";

type NewsletterSubscribeFormProps = {
  variant?: "inline" | "stacked";
};

export function NewsletterSubscribeForm({ variant = "stacked" }: NewsletterSubscribeFormProps) {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    email: string;
  } | null>(null);
  const submissionPending = useRef(false);
  const draftRevision = useRef(0);
  const [subscribe, { isLoading: isSubscribing }] = useSubscribeMutation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail || submissionPending.current) {
      return;
    }

    submissionPending.current = true;
    const submittedRevision = draftRevision.current;
    setFeedback(null);
    try {
      await subscribe({ email: normalizedEmail }).unwrap();
      // Only clear the submitted draft; edits made while waiting belong to the reader.
      if (draftRevision.current === submittedRevision) setEmail("");
      setFeedback({ kind: "success", email: normalizedEmail });
      toast.success(`Check ${normalizedEmail} to confirm your subscription.`);
    } catch {
      // The generated mutation reports API failures through the shared toast helper.
      setFeedback({ kind: "error", email: normalizedEmail });
    } finally {
      submissionPending.current = false;
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <Form
        aria-label="Newsletter subscription"
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
          value={email}
          onChange={(value) => {
            draftRevision.current += 1;
            setEmail(value);
            setFeedback(null);
          }}
          validate={(value) =>
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : "Enter a valid email address."
          }
        >
          <Label className="sr-only">Email address</Label>
          <Input autoComplete="email" placeholder="you@example.com" variant="secondary" />
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
      {feedback ? (
        <p
          role={feedback.kind === "success" ? "status" : "alert"}
          className={cn(
            "text-xs leading-5 break-words",
            feedback.kind === "success" ? "text-success" : "text-danger"
          )}
        >
          {feedback.kind === "success"
            ? `Check ${feedback.email} to confirm your subscription.`
            : `We couldn’t request a confirmation email for ${feedback.email}. Please try again.`}
        </p>
      ) : null}
    </div>
  );
}
