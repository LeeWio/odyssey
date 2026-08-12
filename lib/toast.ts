import { toast } from "@heroui/react";
import { getApiErrorMessage } from "./api/errors";

interface MutationToastOptions {
  error: string;
  success?: string;
}

/**
 * Gives every user-triggered mutation consistent HeroUI feedback while
 * preserving the API error message when one is available.
 */
export async function notifyMutation(
  queryFulfilled: Promise<unknown>,
  { error, success }: MutationToastOptions
) {
  try {
    await queryFulfilled;
    if (success) toast.success(success);
  } catch (reason) {
    toast.danger(getApiErrorMessage(reason, error));
  }
}
