"use client";

import { useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/hooks";
import { setCredentials, setPermissions } from "@/lib/features/auth/auth-slice";
import { permissionApi } from "@/lib/features/permission/permission-api";
import type { MenuResponse } from "@/lib/features/permission/permission-api";
import { baseApi } from "@/lib/features/api/base-api";
import { Spinner, toast } from "@heroui/react";
import { TextShimmer } from "@heroui-pro/react";

// Safe helper to decode JWT payload on the client side with Node SSR guard
const decodeJwt = (token: string) => {
  if (typeof window === "undefined") return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// Replicating standard permission extraction logic to ensure exact compatibility
const extractPermissions = (menus: MenuResponse[]): string[] => {
  const permissions = new Set<string>();

  const visit = (items: MenuResponse[]) => {
    for (const item of items) {
      if (item.permission) {
        permissions.add(item.permission);
      }
      if (item.children?.length) {
        visit(item.children);
      }
    }
  };

  visit(menus);
  return Array.from(permissions);
};

function RedirectHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleAuth = useCallback(async (token: string) => {
    const payload = decodeJwt(token);
    
    // Fallback referrer path check
    let referrer = "/";
    if (typeof window !== "undefined") {
      referrer = localStorage.getItem("oauth_redirect_referrer") || "/";
    }

    if (!payload) {
      toast.danger("Invalid token received from server");
      if (typeof window !== "undefined") {
        localStorage.removeItem("oauth_redirect_referrer");
      }
      router.push("/");
      return;
    }

    try {
      // 1. Commit JWT Credentials to Redux Store
      const credentialsPayload = {
        accessToken: token,
        username: payload.sub || payload.username || "OAuth User",
        email: payload.email || undefined,
        roles: payload.roles || ["ROLE_USER"],
      };
      dispatch(setCredentials(credentialsPayload));

      // 2. Fetch User Custom Menus and Access Rights
      const menuResult = await dispatch(
        permissionApi.endpoints.getCurrentUserMenus.initiate()
      ).unwrap();
      
      // 3. Extract and Commit Permissions
      const permissions = extractPermissions(menuResult);
      dispatch(setPermissions(permissions));

      // 4. Invalidate and Clean unauthenticated cache to force fresh data load
      dispatch(baseApi.util.resetApiState());

      // 5. Restore the user's active page and clear session tracker
      if (typeof window !== "undefined") {
        localStorage.removeItem("oauth_redirect_referrer");
      }

      toast.success("Successfully authenticated with Odyssey!");
      router.push(referrer);
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("oauth_redirect_referrer");
      }
      toast.danger("Authentication succeeded, but failed to sync user permissions.");
      router.push("/");
    }
  }, [dispatch, router]);

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      toast.danger(`OAuth authentication failed: ${error}`);
      if (typeof window !== "undefined") {
        localStorage.removeItem("oauth_redirect_referrer");
      }
      router.push("/");
      return;
    }

    if (token) {
      void handleAuth(token);
    } else {
      router.push("/");
    }
  }, [searchParams, router, handleAuth]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
      <Spinner size="lg" color="accent" />
      <TextShimmer className="text-sm font-medium text-muted">
        Syncing your digital sanctuary...
      </TextShimmer>
    </div>
  );
}

export default function OAuth2RedirectPage() {
  return (
    <Suspense fallback={null}>
      <RedirectHandler />
    </Suspense>
  );
}
