import {
  Share_Tech_Mono as FontBrutalismBody,
  Anton as FontBrutalismDisplay,
  Instrument_Serif as FontDisplay,
  Geist_Mono as FontMono,
  Geist as FontSans,
} from "next/font/google";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const fontDisplay = FontDisplay({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
  style: ["normal", "italic"],
});

export const fontBrutalismBody = FontBrutalismBody({
  subsets: ["latin"],
  variable: "--font-brutalism-body",
  weight: "400",
});

export const fontBrutalismDisplay = FontBrutalismDisplay({
  subsets: ["latin"],
  variable: "--font-brutalism-display",
  weight: "400",
});
