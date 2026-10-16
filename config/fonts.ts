import localFont from "next/font/local";

/** Body face. Preloaded because it paints the first screen. */
export const fontSans = localFont({
  src: [
    {
      path: "../fonts/Geist/Geist-VariableFont_wght.ttf",
      style: "normal",
    },
    {
      path: "../fonts/Geist/Geist-Italic-VariableFont_wght.ttf",
      style: "italic",
    },
  ],
  adjustFontFallback: "Arial",
  display: "swap",
  preload: true,
  variable: "--font-sans",
});

export const fontMono = localFont({
  src: [
    {
      path: "../fonts/Geist_Mono/GeistMono-VariableFont_wght.ttf",
      style: "normal",
    },
    {
      path: "../fonts/Geist_Mono/GeistMono-Italic-VariableFont_wght.ttf",
      style: "italic",
    },
  ],
  adjustFontFallback: "Arial",
  display: "swap",
  preload: false,
  variable: "--font-mono",
});

export const fontDisplay = localFont({
  src: [
    {
      path: "../fonts/Instrument_Serif/InstrumentSerif-Regular.ttf",
      style: "normal",
    },
    {
      path: "../fonts/Instrument_Serif/InstrumentSerif-Italic.ttf",
      style: "italic",
    },
  ],
  adjustFontFallback: "Times New Roman",
  display: "swap",
  preload: false,
  variable: "--font-display",
});

export const fontBrutalismBody = localFont({
  src: "../fonts/Share_Tech_Mono/ShareTechMono-Regular.ttf",
  adjustFontFallback: "Arial",
  display: "swap",
  preload: false,
  variable: "--font-brutalism-body",
});

export const fontBrutalismDisplay = localFont({
  src: "../fonts/Anton/Anton-Regular.ttf",
  adjustFontFallback: "Arial",
  display: "swap",
  preload: false,
  variable: "--font-brutalism-display",
});
