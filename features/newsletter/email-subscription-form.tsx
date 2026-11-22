"use client";

import {
  Alert,
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
import { useTranslations } from "next-intl";
import { useRef, useState, type FormEvent } from "react";

type EmailSubscriptionFormProps = {
  channel: "Newsletter" | "MomentSubscription";
  subscribe: (email: string) => Promise<unknown>;
  variant?: "inline" | "stacked";
};

export function EmailSubscriptionForm({
  channel,
  subscribe,
  variant = "stacked",
}: EmailSubscriptionFormProps) {
  const t = useTranslations(channel);
  const isMoments = channel === "MomentSubscription";
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    email: string;
  } | null>(null);
  const submissionPending = useRef(false);
  const draftRevision = useRef(0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail || submissionPending.current) {
      return;
    }

    submissionPending.current = true;
    setIsSubscribing(true);
    const submittedRevision = draftRevision.current;
    setFeedback(null);
    try {
      await subscribe(normalizedEmail);
      // Only clear the submitted draft; edits made while waiting belong to the reader.
      if (draftRevision.current === submittedRevision) setEmail("");
      setFeedback({ kind: "success", email: normalizedEmail });
      const confirmation = t("checkInbox", { email: normalizedEmail });
      if (isMoments) {
        toast.success(t("requestAccepted"), { description: confirmation });
      } else {
        toast.success(confirmation);
      }
    } catch {
      setFeedback({ kind: "error", email: normalizedEmail });
      if (isMoments) toast.danger(t("requestUnavailable"));
    } finally {
      submissionPending.current = false;
      setIsSubscribing(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <Form
        aria-label={t("formLabel")}
        aria-busy={isSubscribing}
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
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : t("invalidEmail")
          }
        >
          <Label className={isMoments ? undefined : "sr-only"}>{t("email")}</Label>
          <Input
            autoComplete="email"
            autoFocus={isMoments}
            maxLength={isMoments ? 254 : undefined}
            placeholder="you@example.com"
            variant="secondary"
          />
          <FieldError />
        </TextField>
        <Button
          className={variant === "inline" ? "shrink-0" : undefined}
          fullWidth={variant !== "inline"}
          isPending={isSubscribing}
          type="submit"
        >
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : null}
              {t("subscribe")}
            </>
          )}
        </Button>
      </Form>
      {feedback ? (
        <Alert
          role={feedback.kind === "success" ? "status" : "alert"}
          status={feedback.kind === "success" ? "success" : "danger"}
        >
          <Alert.Indicator />
          <Alert.Content className="min-w-0">
            <Alert.Title className="wrap-anywhere">
              {feedback.kind === "success"
                ? t("checkInbox", { email: feedback.email })
                : t("requestFailed", { email: feedback.email })}
            </Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
    </div>
  );
}
