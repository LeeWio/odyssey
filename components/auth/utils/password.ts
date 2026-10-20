export const validatePassword = (
  value: string,
  messages: {
    min?: string;
    uppercase?: string;
    number?: string;
  } = {}
) => {
  if (value.length < 8) return messages.min ?? "Password must be at least 8 characters";
  if (!/[A-Z]/.test(value))
    return messages.uppercase ?? "Password must contain at least one uppercase letter";
  if (!/[0-9]/.test(value)) return messages.number ?? "Password must contain at least one number";
  return null;
};
