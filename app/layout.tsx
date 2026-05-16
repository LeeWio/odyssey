import type { Metadata, Viewport } from "next";
import clsx from "clsx";
import { fontSans } from "@/config/fonts";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "./theme-provider";
import { siteConfig } from "@/config/site";
import { Navbar } from "@/components/navbar";
import { StoreProvider } from "./store-provider";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <StoreProvider>
          <ThemeProvider>
            <div className="relative flex flex-col h-screen">
              <Navbar />
              <main className="w-full flex-grow">{children}</main>
              <footer className="w-full flex items-center justify-center py-3">
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
      </body>
    </html>
  );
}
