import { useEffect, useRef, useState } from "react";

type AsyncMutation<Argument> = (argument: Argument) => { unwrap: () => Promise<unknown> };

export const useRegistrationSession = (
  isActive: boolean,
  register: AsyncMutation<{ username: string; email: string; password: string }>
) => {
  const [isPendingReview, setIsPendingReview] = useState(false);
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
    setIsPendingReview(false);
  }, [isActive]);

  const submit = async (account: { username: string; email: string; password: string }) => {
    const id = ++requestId.current;
    await register(account).unwrap();
    if (!isActiveRef.current || id !== requestId.current) return;
    setIsPendingReview(true);
  };

  return { isPendingReview, isActive, submit };
};
