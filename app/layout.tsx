import type { Metadata, Viewport } from "next";
import clsx from "clsx";
import { headers } from "next/headers";
import { fontSans } from "@/config/fonts";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "./theme-provider";
import { siteConfig } from "@/config/site";
import { Navbar } from "@/components/navbar";
import { StoreProvider } from "./store-provider";
import { ThemeCSSLoader } from "@/components/theme-css-loader";
import { IntlProvider } from "./intl-provider";
import { getMessages } from "next-intl/server";
import { Toast } from "@heroui/react";
import { SheetPanel } from "@/components/sheet-panel";
import { DashboardSheet } from "@/components/dashboard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  const acceptLanguage = (await headers()).get("accept-language");
  const lang = acceptLanguage?.split(/[,;]/)[0] || "en-US";

  const messages = await getMessages({ locale: lang });

  return (
    <html
      data-scrollbar="none"
      lang={lang}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className={clsx(
          "text-foreground bg-background min-h-screen font-sans antialiased",
          fontSans.variable
        )}
      >
        <IntlProvider lang={lang} messages={messages}>
          <StoreProvider>
            <ThemeProvider>
              <ThemeCSSLoader />
              <Toast.Provider />
              <div className="relative flex min-h-screen flex-col overflow-x-hidden">
                <Navbar />
                <SheetPanel />
                <DashboardSheet />
                <main className="flex w-full grow flex-col">{children}</main>
                <footer className="flex w-full items-center justify-center py-3">
                  <a
                    className="flex items-center gap-1 text-current no-underline"
                    href="https://heroui.com?utm_source=next-app-template"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="text-muted">Powered by</span>
                    <p className="text-accent">HeroUI</p>
                  </a>
                </footer>
              </div>
            </ThemeProvider>
          </StoreProvider>
        </IntlProvider>
      </body>
    </html>
  );
}
