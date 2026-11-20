"use client";

import { setupListeners } from "@reduxjs/toolkit/query";
import * as React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { getServerState, makeStore } from "@/lib/store";

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = React.useState(() => makeStore());
  const [serverState] = React.useState(getServerState);

  React.useEffect(() => setupListeners(store.dispatch), [store]);

  return (
    <ReduxProvider store={store} serverState={serverState}>
      {children}
    </ReduxProvider>
  );
}
