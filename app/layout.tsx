import clsx from "clsx";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import {
  fontBrutalismBody,
  fontBrutalismDisplay,
  fontDisplay,
  fontMono,
  fontSans,
} from "@/config/fonts";
import "@/styles/globals.css";
import { isRTL } from "@heroui/react";
// import { Navbar } from "@/components/navbar";
import { getMessages } from "next-intl/server";
import { siteConfig } from "@/config/site";
import { resolveAppLocale } from "@/i18n/locale";
import { getInitialTheme } from "@/lib/theme";
import { getThemeInitScript } from "@/lib/theme-init-script";
import { Providers } from "./providers";
import WebVitals from "./web-vitals";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.svg",
  },
  alternates: {
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const lang = resolveAppLocale(requestHeaders.get("accept-language"));
  const initialTheme = getInitialTheme(requestHeaders.get("cookie"));

  const messages = await getMessages({ locale: lang });

  return (
    <html
      data-scrollbar="none"
      lang={lang}
      dir={isRTL(lang) ? "rtl" : "ltr"}
      data-theme={initialTheme.selector}
      suppressHydrationWarning
      className={clsx(
        fontSans.variable,
        fontMono.variable,
        fontDisplay.variable,
        fontBrutalismBody.variable,
        fontBrutalismDisplay.variable,
        initialTheme.selector,
        initialTheme.resolvedMode,
        "h-full antialiased"
      )}
    >
      <body
        className={clsx(
          "text-foreground bg-background min-h-screen font-sans antialiased",
          fontSans.variable
        )}
      >
        <Script
          dangerouslySetInnerHTML={{ __html: getThemeInitScript() }}
          id="theme-init"
          strategy="beforeInteractive"
        />
        <Providers lang={lang} messages={messages}>
          <WebVitals />
          {children}
        </Providers>
      </body>
    </html>
  );
}
