import type { Metadata, Viewport } from "next";
import clsx from "clsx";
import { headers } from "next/headers";
import { fontSans } from "@/config/fonts";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "./providers";
import { siteConfig } from "@/config/site";
import { Navbar } from "@/components/navbar";
import { getMessages } from "next-intl/server";
import { Toast } from "@heroui/react";
import { SheetPanel } from "@/components/sheet-panel";
import { DashboardSheet } from "@/components/dashboard";
import { RichTextModal } from "@/components/rich-text";
import { Footer } from "@/components/footer";

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
      data-theme="mouve-dark"
      suppressHydrationWarning
      className={clsx(geistSans.variable, geistMono.variable, "dark h-full antialiased")}
    >
      <body
        className={clsx(
          "text-foreground bg-background min-h-screen font-sans antialiased",
          fontSans.variable
        )}
      >
        <Providers lang={lang} messages={messages}>
          <Toast.Provider />
          <div className="relative flex min-h-screen flex-col overflow-x-hidden">
            <Navbar />
            <SheetPanel />
            <DashboardSheet />
            <RichTextModal />
            <main className="flex w-full grow flex-col">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
