import { headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { resolveAppLocale } from "./locale";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestHeaders = await headers();
  const locale = resolveAppLocale(requestHeaders.get("accept-language") ?? (await requestLocale));

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: "UTC",
  };
});
