"use client";

import React, { useState, useCallback } from "react";
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
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { AnimatePresence, m, domAnimation, LazyMotion } from "motion/react";
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

const maskEmail = (email: string) => {
  return email.replace(/^(.)(.*)(@.*)$/, "$1****$3");
};

export const LogIn = ({ isOpen, onOpenChange, onSwitchToSignUp }: LogInProps) => {
  const router = useRouter();

  // State: 1 = email + socials, 2 = otp input
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const variants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" as const },
    },
    hidden: {
      opacity: 0,
      y: 10,
      transition: { duration: 0.2, ease: "easeIn" as const },
    },
  };

  const [sendOtp, { isLoading: isSendingOtp }] = useSendOtpMutation();
  const [loginWithOtp, { isLoading: isLoggingIn }] = useLoginWithOtpMutation();

  const handleEmailSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const submit = async () => {
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

    void submit();
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
    setStep(nextStep);
  }, []);

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
          <Modal.Dialog className="sm:max-w-90">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="mb-4 text-xl font-medium">Log In</Modal.Heading>
            </Modal.Header>
            <Modal.Body data-scrollbar="none">
              <LazyMotion features={domAnimation}>
                <m.div layout transition={{ duration: 0.3, ease: "easeInOut" }}>
                  <AnimatePresence initial={false} mode="wait">
                    {step === 1 ? (
                      <m.form
                        key="email"
                        className="flex w-full flex-col gap-y-3"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={variants}
                        onSubmit={handleEmailSubmit}
                      >
                        <div className="flex flex-col gap-4">
                          <TextField isRequired name="email" type="email" isInvalid={!!emailError}>
                            <Label>Email</Label>
                            <Input
                              variant="secondary"
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

                          <Button
                            fullWidth
                            type="submit"
                            variant="primary"
                            isPending={isSendingOtp}
                          >
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
                          <Button fullWidth variant="tertiary">
                            <Icon icon="devicon:google" />
                            Continue with Google
                          </Button>
                          <Button fullWidth variant="tertiary">
                            <Icon icon="devicon:github" />
                            Continue with Github
                          </Button>
                        </div>
                        <p className="text-small mt-3 text-center">
                          Need to create an account?&nbsp;
                          <Link className="cursor-pointer no-underline" onPress={onSwitchToSignUp}>
                            Sign Up
                          </Link>
                        </p>
                      </m.form>
                    ) : (
                      <m.div
                        key="otp"
                        className="flex flex-col gap-y-3"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={variants}
                      >
                        <div className="flex flex-col gap-1">
                          <Label>Verify account</Label>
                          <p className="text-muted text-sm">
                            We&apos;ve sent a code to {maskEmail(email)}
                          </p>
                        </div>

                        <InputOTP
                          maxLength={6}
                          pattern={REGEXP_ONLY_DIGITS}
                          onComplete={handleOTPComplete}
                          isDisabled={isLoggingIn}
                          variant="secondary"
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

                        <div className="flex items-center gap-1.25 px-1 pt-1">
                          <p className="text-muted text-sm">Didn&apos;t receive a code?</p>
                          <Link className="text-foreground underline" href="#">
                            Resend
                          </Link>
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
                      </m.div>
                    )}
                  </AnimatePresence>
                </m.div>
              </LazyMotion>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};
