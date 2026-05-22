"use client";

import { useEffect, useState } from "react";
import { setupListeners } from "@reduxjs/toolkit/query";
import { Provider } from "react-redux";
import { makeStore } from "@/lib/store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());

  useEffect(() => {
    return setupListeners(store.dispatch);
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
