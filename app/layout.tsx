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
import { isRTL, Toast } from "@heroui/react";
// import { Navbar } from "@/components/navbar";
import { getMessages } from "next-intl/server";
import { DashboardSheet } from "@/components/dashboard";
// import { RichTextModal } from "@/components/rich-text";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { SheetPanel } from "@/components/sheet-panel";
import { siteConfig } from "@/config/site";
import { getInitialThemeState } from "@/lib/theme";
import { getThemeInitScript } from "@/lib/theme-init-script";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
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
  const acceptLanguage = requestHeaders.get("accept-language");
  const lang = acceptLanguage?.split(/[,;]/)[0] || "en-US";
  const initialTheme = getInitialThemeState(requestHeaders.get("cookie"));

  const messages = await getMessages({ locale: lang });

  return (
    <html
      data-scrollbar="none"
      lang={lang}
      dir={isRTL(lang) ? "rtl" : "ltr"}
      data-theme={initialTheme.themeName}
      data-theme-variant={initialTheme.variant}
      data-theme-mode={initialTheme.mode}
      data-theme-resolved-mode={initialTheme.resolvedMode}
      suppressHydrationWarning
      className={clsx(
        fontSans.variable,
        fontMono.variable,
        fontDisplay.variable,
        fontBrutalismBody.variable,
        fontBrutalismDisplay.variable,
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
          <Toast.Provider placement="top" />
          <div className="relative flex min-h-screen flex-col overflow-x-clip">
            <Navbar />
            <SheetPanel />
            <DashboardSheet />
            {/* <RichTextModal /> */}
            <main className="flex w-full grow flex-col">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
