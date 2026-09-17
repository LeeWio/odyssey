import { getRequestConfig } from "next-intl/server";
import { resolveAppLocale } from "./locale";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = resolveAppLocale(await requestLocale);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: "UTC",
  };
});
