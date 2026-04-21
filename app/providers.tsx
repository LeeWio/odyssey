"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, AppStore } from "@/store";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toast } from "@heroui/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>(undefined);

  if (storeRef.current == null) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <Toast.Provider />
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        enableColorScheme={false}
      >
        {children}
      </NextThemesProvider>
    </Provider>
  );
}
