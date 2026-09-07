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
import { useIsPresent } from "motion/react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useLoginWithOtpMutation, useSendOtpMutation } from "@/lib/features/auth";
import { maskEmail } from "./auth-utils";
import { AuthView, AuthDivider, AuthStep, AuthSwitchPrompt } from "./auth-layout";
import { SocialLoginButtons } from "./social-login-buttons";

export interface LoginContentProps {
  onSuccess: () => void;
  onSwitchToSignUp?: () => void;
}

export const LoginContent = ({ onSuccess, onSwitchToSignUp }: LoginContentProps) => {
  const t = useTranslations("Auth");
  const isPresent = useIsPresent();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState(false);
  const otpRequestId = useRef(0);
  const [sendOtp, { isLoading: isSendingOtp }] = useSendOtpMutation();
  const [loginWithOtp, { isLoading: isLoggingIn }] = useLoginWithOtpMutation();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(
      () => setResendCooldown((current) => Math.max(0, current - 1)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  useEffect(
    () => () => {
      otpRequestId.current += 1;
    },
    [isPresent]
  );

  const handleEmailSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requestId = ++otpRequestId.current;
    const requestedEmail = email;
    void sendOtp({ email: requestedEmail })
      .unwrap()
      .then(() => {
        if (requestId !== otpRequestId.current) return;
        setResendCooldown(30);
        setStep(2);
      })
      .catch(() => {
        // API middleware owns error toasts.
      });
  };

  const handleOTPComplete = async (otp: string) => {
    const requestId = ++otpRequestId.current;
    try {
      await loginWithOtp({ email, code: otp }).unwrap();
      if (requestId === otpRequestId.current) onSuccess();
    } catch {
      if (requestId === otpRequestId.current) setOtpError(true);
      // The mutation displays the server error through the shared API toast handler.
    }
  };

  const handleResend = () => {
    if (isSendingOtp || isLoggingIn || resendCooldown > 0 || !email) return;
    const requestId = ++otpRequestId.current;
    const requestedEmail = email;
    void sendOtp({ email: requestedEmail })
      .unwrap()
      .then(() => {
        if (requestId === otpRequestId.current) setResendCooldown(30);
      })
      .catch(() => {
        // API middleware owns error toasts.
      });
  };

  const changeEmail = () => {
    otpRequestId.current += 1;
    setStep(1);
    setResendCooldown(0);
    setOtpValue("");
    setOtpError(false);
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
              isRequired
              name="email"
              type="email"
              value={email}
              onChange={(value) => {
                otpRequestId.current += 1;
                setEmail(value);
              }}
              validate={(value) =>
                /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) ? null : t("validEmail")
              }
            >
              <Label>{t("email")}</Label>
              <Input
                autoFocus
                id="log-in-email"
                name="email"
                variant="secondary"
                placeholder="john@example.com"
              />
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
          <InputOTP
            autoFocus
            aria-label={t("otpLabel")}
            isInvalid={otpError}
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            value={otpValue}
            onChange={(value) => {
              setOtpValue(value);
              setOtpError(false);
            }}
            onComplete={handleOTPComplete}
            isDisabled={isLoggingIn}
            variant="secondary"
          >
            <InputOTP.Group>
              <InputOTP.Slot
                className="transition-[border-color,background-color,box-shadow] duration-150 ease-out"
                index={0}
              />
              <InputOTP.Slot
                className="transition-[border-color,background-color,box-shadow] duration-150 ease-out"
                index={1}
              />
              <InputOTP.Slot
                className="transition-[border-color,background-color,box-shadow] duration-150 ease-out"
                index={2}
              />
            </InputOTP.Group>
            <InputOTP.Separator />
            <InputOTP.Group>
              <InputOTP.Slot
                className="transition-[border-color,background-color,box-shadow] duration-150 ease-out"
                index={3}
              />
              <InputOTP.Slot
                className="transition-[border-color,background-color,box-shadow] duration-150 ease-out"
                index={4}
              />
              <InputOTP.Slot
                className="transition-[border-color,background-color,box-shadow] duration-150 ease-out"
                index={5}
              />
            </InputOTP.Group>
          </InputOTP>
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
