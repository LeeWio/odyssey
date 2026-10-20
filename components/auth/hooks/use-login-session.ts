import { useEffect, useRef, useState } from "react";

type AsyncMutation<Argument> = (argument: Argument) => { unwrap: () => Promise<unknown> };

export const useLoginSession = (
  isActive: boolean,
  mutations: {
    sendOtp: AsyncMutation<{ email: string }>;
    loginWithOtp: AsyncMutation<{ email: string; code: string }>;
  }
) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmailValue] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState(false);
  const requestId = useRef(0);
  const wasActive = useRef(false);
  const isActiveRef = useRef(isActive);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const invalidate = () => {
    requestId.current += 1;
  };

  useEffect(() => {
    if (!isActive) {
      invalidate();
      wasActive.current = false;
      return;
    }
    if (wasActive.current) return;
    invalidate();
    wasActive.current = true;
    setStep(1);
    setEmailValue("");
    setResendCooldown(0);
    setOtpValue("");
    setOtpError(false);
  }, [isActive]);

  const isCurrent = (id: number) => isActiveRef.current && id === requestId.current;

  const setEmail = (value: string) => {
    invalidate();
    setEmailValue(value);
  };

  const submitEmail = async () => {
    const id = ++requestId.current;
    const requestedEmail = email;
    await mutations.sendOtp({ email: requestedEmail }).unwrap();
    if (!isCurrent(id)) return;
    setResendCooldown(30);
    setStep(2);
  };

  const completeOtp = async (code: string, onSuccess: () => void) => {
    const id = ++requestId.current;
    try {
      await mutations.loginWithOtp({ email, code }).unwrap();
      if (isCurrent(id)) onSuccess();
    } catch (error) {
      if (isCurrent(id)) setOtpError(true);
      throw error;
    }
  };

  const resend = async () => {
    const id = ++requestId.current;
    await mutations.sendOtp({ email }).unwrap();
    if (isCurrent(id)) setResendCooldown(30);
  };

  const changeEmail = () => {
    invalidate();
    setStep(1);
    setResendCooldown(0);
    setOtpValue("");
    setOtpError(false);
  };

  return {
    step,
    email,
    resendCooldown,
    otpValue,
    otpError,
    isActive,
    setEmail,
    setOtpValue,
    setOtpError,
    setResendCooldown,
    submitEmail,
    completeOtp,
    resend,
    changeEmail,
  };
};
