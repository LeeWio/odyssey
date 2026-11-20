import { cookies, headers } from "next/headers";

import { LOCALE_COOKIE_NAME } from "@/i18n/config";
import { resolveAppLocale, type AppLocale } from "@/i18n/locale";

export async function getRequestLocale(): Promise<AppLocale> {
  const [requestCookies, requestHeaders] = await Promise.all([cookies(), headers()]);
  return resolveAppLocale(
    requestCookies.get(LOCALE_COOKIE_NAME)?.value ?? requestHeaders.get("accept-language")
  );
}
