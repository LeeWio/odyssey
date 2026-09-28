"use client";

import { useEffect, useState } from "react";

import { selectCurrentUser, selectIsAuthenticated } from "@/lib/features/auth";
import { readMomentBookmarks, subscribeMomentBookmarks } from "@/lib/features/moment";
import { useAppSelector } from "@/lib/hooks";

export function useMomentBookmarks() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    const sync = () => setIds(readMomentBookmarks(isAuthenticated ? username : null));
    sync();
    return subscribeMomentBookmarks(sync);
  }, [isAuthenticated, username]);

  return { ids, isAuthenticated, username };
}
