"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Button,
  Modal,
  Label,
  TextField,
  Link,
  Separator,
  Input,
  InputOTP,
  REGEXP_ONLY_DIGITS,
  Alert,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useGSAP } from "@gsap/react";
import { useRouter } from "next/navigation";
import { useSendOtpMutation, useLoginWithOtpMutation } from "@/lib/features/auth";

export interface LogInProps {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  onSwitchToSignUp?: () => void;
}

const orDivider = (
  <div className="flex items-center gap-4 py-2">
    <Separator className="flex-1" />
    <p className="text-tiny text-default-500 shrink-0">OR</p>
    <Separator className="flex-1" />
  </div>
);

export const LogIn = ({ isOpen, onOpenChange, onSwitchToSignUp }: LogInProps) => {
  const router = useRouter();

  // State: 1 = email + socials, 2 = otp input
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: containerRef });

  const [sendOtp, { isLoading: isSendingOtp }] = useSendOtpMutation();
  const [loginWithOtp, { isLoading: isLoggingIn, error: loginError }] = useLoginWithOtpMutation();

  const getErrorMessage = (error: unknown) => {
    const err = error as { data?: { message?: string }; error?: string };
    return err?.data?.message || err?.error || "An unknown error occurred";
  };

  const handleEmailSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      await sendOtp({ email }).unwrap();
      setEmailError("");
      switchStep(2); // Move to OTP step only after success
    } catch {
      // Error is handled by global transformError and toast
    }
  };

  const handleOTPComplete = async (otp: string) => {
    try {
      await loginWithOtp({ email, code: otp }).unwrap();

      if (onOpenChange) {
        onOpenChange(false);
      }
      router.push("/");

      // Reset state for next time modal opens
      setTimeout(() => {
        setStep(1);
        setEmail("");
        setEmailError("");
      }, 500);
    } catch {
      // Error handled by loginError state
    }
  };

  const switchStep = useCallback((nextStep: 1 | 2) => {
    const activeViewChildren = containerRef.current?.firstElementChild?.children;
    if (!activeViewChildren || activeViewChildren.length === 0) {
      setStep(nextStep);
      return;
    }

    contextSafe(() => {
      gsap.to(activeViewChildren, {
        autoAlpha: 0,
        y: nextStep > step ? -10 : 10,
        duration: 0.2,
        ease: "power2.in",
        stagger: 0.02,
        onComplete: () => setStep(nextStep),
      });
    })();
  }, [contextSafe, step]);

  useGSAP(() => {
    const activeViewChildren = containerRef.current?.firstElementChild?.children;
    if (!activeViewChildren || activeViewChildren.length === 0) return;

    gsap.fromTo(
      activeViewChildren,
      { autoAlpha: 0, y: step > 1 ? 15 : -15 },
      { autoAlpha: 1, y: 0, duration: 0.5, ease: "back.out(1.2)", stagger: 0.05, clearProps: "all" }
    );
  }, [step]);

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (onOpenChange) onOpenChange(open);
          if (!open) {
            setTimeout(() => {
              setStep(1);
              setEmail("");
              setEmailError("");
            }, 300);
          }
        }}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="mb-4 text-xl font-medium">Log In</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="scrollbar-none [&::-webkit-scrollbar]:hidden">
              <div ref={containerRef} className="-mx-2 px-2 sm:-mx-3 sm:px-3">
                {step === 1 ? (
                  <form className="flex flex-col gap-y-3 w-full" onSubmit={handleEmailSubmit}>
                    <div className="flex flex-col gap-4">
                      <TextField isRequired name="email" type="email" isInvalid={!!emailError}>
                        <Label>Email</Label>
                        <Input
                          placeholder="john@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) setEmailError("");
                          }}
                        />
                        {emailError && (
                          <div className="text-tiny text-danger mt-1">{emailError}</div>
                        )}
                      </TextField>

                      <Button fullWidth type="submit" variant="primary" isPending={isSendingOtp}>
                        {({ isPending }) => (
                          <>
                            {isPending && <Spinner color="current" size="sm" />}
                            Send Code
                          </>
                        )}
                      </Button>
                    </div>
                    {orDivider}
                    <div className="flex flex-col gap-2">
                      <Button fullWidth variant="secondary">
                        <Icon icon="devicon:google" />
                        Continue with Google
                      </Button>
                      <Button fullWidth variant="secondary">
                        <Icon icon="devicon:github" />
                        Continue with Github
                      </Button>
                    </div>
                    <p className="text-small mt-3 text-center">
                      Need to create an account?&nbsp;
                      <Link className="no-underline cursor-pointer" onPress={onSwitchToSignUp}>
                        Sign Up
                      </Link>
                    </p>
                  </form>
                ) : (
                  <div className="flex flex-col gap-y-3">
                    <div className="flex flex-col gap-2 mb-2">
                      {loginError && (
                        <Alert status="danger">
                          <Alert.Indicator />
                          <Alert.Content>
                            <Alert.Title>Login Failed</Alert.Title>
                            <Alert.Description>{getErrorMessage(loginError)}</Alert.Description>
                          </Alert.Content>
                        </Alert>
                      )}
                      <p className="text-sm text-default-500">
                        Enter the 6-digit verification code sent to{" "}
                        <span className="font-medium text-foreground">{email}</span>.
                      </p>
                    </div>

                    <div className="flex justify-center w-full mb-4">
                      <InputOTP
                        maxLength={6}
                        pattern={REGEXP_ONLY_DIGITS}
                        onComplete={handleOTPComplete}
                        isDisabled={isLoggingIn}
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
                    </div>

                    <Button
                      fullWidth
                      variant="secondary"
                      onPress={() => switchStep(1)}
                      isDisabled={isLoggingIn}
                    >
                      <Icon icon="solar:arrow-left-linear" />
                      Change Email
                    </Button>
                  </div>
                )}
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};
