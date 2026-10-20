const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const isValidEmail = (value: string) => EMAIL_PATTERN.test(value);

/** Hide the local part. A one-character name is fully masked. */
export const maskEmail = (email: string) =>
  email.replace(/^(.)([^@]*)(@.*)$/, (_match, first: string, rest: string, domain: string) =>
    rest.length === 0 ? `****${domain}` : `${first}****${domain}`
  );
