"use client";

import {
  Button,
  FieldError,
  Form,
  Input,
  InputOTP,
  Label,
  Link,
  REGEXP_ONLY_DIGITS,
  Spinner,
  TextField,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useInterval } from "@mantine/hooks";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useRef } from "react";
import { useLoginWithOtpMutation, useSendOtpMutation } from "@/lib/features/auth";
import { useLoginSession } from "../hooks/use-login-session";
import { isValidEmail, maskEmail } from "../utils/email";
import { AuthDivider, AuthSwitchPrompt } from "./auth-prompts";
import { AuthView } from "./auth-shell";
import { AuthStep } from "./auth-step";
import { SocialLoginButtons } from "./social-login-buttons";

export interface LoginContentProps {
  /** False while the dialog is closed or showing another mode. Late responses must not advance the flow. */
  isActive?: boolean;
  onSuccess: () => void;
  onSwitchToSignUp?: () => void;
}

export const LoginContent = ({
  isActive = true,
  onSuccess,
  onSwitchToSignUp,
}: LoginContentProps) => {
  const t = useTranslations("Auth");
  const [sendOtp, { isLoading: isSendingOtp }] = useSendOtpMutation();
  const [loginWithOtp, { isLoading: isLoggingIn }] = useLoginWithOtpMutation();
  const {
    step,
    email,
    resendCooldown,
    otpValue,
    otpError,
    setEmail,
    setOtpValue,
    setOtpError,
    setResendCooldown,
    submitEmail,
    completeOtp,
    resend,
    changeEmail,
  } = useLoginSession(isActive, { sendOtp, loginWithOtp });

  const setResendCooldownRef = useRef(setResendCooldown);
  useEffect(() => {
    setResendCooldownRef.current = setResendCooldown;
  }, [setResendCooldown]);
  const tickResendCooldown = () => {
    setResendCooldownRef.current((current) => Math.max(0, current - 1));
  };
  const { start } = useInterval(tickResendCooldown, 1000);

  useEffect(() => {
    if (resendCooldown > 0) start();
  }, [resendCooldown, start]);

  const handleEmailSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitEmail().catch(() => {
      // API middleware owns error toasts.
    });
  };

  const handleOTPComplete = (otp: string) => {
    void completeOtp(otp, onSuccess).catch(() => {
      // The mutation displays the server error through the shared API toast handler.
    });
  };

  const handleResend = () => {
    if (isSendingOtp || isLoggingIn || resendCooldown > 0 || !email) return;
    void resend().catch(() => {
      // API middleware owns error toasts.
    });
  };

  return (
    <AuthView
      title={t("login")}
      subtitle={step === 2 ? t("codeSentTo", { email: maskEmail(email) }) : undefined}
    >
      {step === 1 ? (
        <AuthStep stepKey="email">
          <Form
            validationBehavior="native"
            className="flex flex-col gap-4"
            onSubmit={handleEmailSubmit}
          >
            <TextField
              fullWidth
              isRequired
              name="email"
              type="email"
              value={email}
              variant="secondary"
              onChange={setEmail}
              validate={(value) => (isValidEmail(value) ? null : t("validEmail"))}
            >
              <Label>{t("email")}</Label>
              <Input autoFocus className="w-full" placeholder="john@example.com" />
              <FieldError />
            </TextField>
            <Button fullWidth type="submit" variant="primary" isPending={isSendingOtp}>
              {({ isPending }) => (
                <>
                  {isPending && <Spinner color="current" size="sm" />}
                  {t("sendCode")}
                </>
              )}
            </Button>
          </Form>
          <AuthDivider />
          <SocialLoginButtons isDisabled={isSendingOtp} />
          <AuthSwitchPrompt
            text={t("needAccount")}
            actionLabel={t("signUp")}
            onAction={onSwitchToSignUp}
          />
        </AuthStep>
      ) : (
        <AuthStep stepKey="otp" className="gap-y-2">
          <div className="flex flex-col gap-2">
            <Label id="log-in-otp-label">{t("otpLabel")}</Label>
            <InputOTP
              aria-describedby={otpError ? "log-in-otp-error" : undefined}
              aria-labelledby="log-in-otp-label"
              autoFocus
              isDisabled={isLoggingIn}
              isInvalid={otpError}
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={otpValue}
              variant="secondary"
              onChange={(value) => {
                setOtpValue(value);
                setOtpError(false);
              }}
              onComplete={handleOTPComplete}
            >
              <InputOTP.Group>
                <InputOTP.Slot index={0} />
                <InputOTP.Slot index={1} />
                <InputOTP.Slot index={2} />
              </InputOTP.Group>
              <InputOTP.Separator />
              <InputOTP.Group>
                <InputOTP.Slot index={3} />
                <InputOTP.Slot index={4} />
                <InputOTP.Slot index={5} />
              </InputOTP.Group>
            </InputOTP>
            <span
              className="field-error"
              data-visible={otpError || undefined}
              id="log-in-otp-error"
            >
              {otpError ? t("otpInvalid") : null}
            </span>
          </div>
          <div
            className="flex flex-wrap items-center gap-x-1.5 gap-y-1 px-1 pt-1"
            aria-live="polite"
          >
            <p className="text-muted text-sm">{t("didntReceiveCode")}</p>
            <Link
              isDisabled={isSendingOtp || isLoggingIn || resendCooldown > 0}
              onPress={handleResend}
            >
              {isSendingOtp
                ? t("sending")
                : resendCooldown > 0
                  ? t("resendIn", { seconds: resendCooldown })
                  : t("resend")}
            </Link>
          </div>
          <Button fullWidth variant="tertiary" onPress={changeEmail} isDisabled={isLoggingIn}>
            <Icon icon="gravity-ui:arrow-shape-turn-up-left" aria-hidden="true" />
            {t("changeEmail")}
          </Button>
        </AuthStep>
      )}
    </AuthView>
  );
};
