"use client";

import { Spinner, toast } from "@heroui/react";
import { TextShimmer } from "@heroui-pro/react";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef } from "react";
import {
  extractOAuthCode,
  extractOAuthError,
  extractOAuthToken,
  getSafeRedirectPath,
  OAUTH_REDIRECT_KEY,
  scrubOAuthParamsFromLocation,
} from "@/components/auth/auth-utils";
import { baseApi } from "@/lib/api";
import { authApi } from "@/lib/features/auth/auth-api";
import { setCredentials, setPermissions } from "@/lib/features/auth";
import { permissionApi, type MenuResponse } from "@/lib/features/permission";
import { useAppDispatch } from "@/lib/hooks";

const decodeJwt = (token: string) => {
  if (typeof window === "undefined") return null;
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

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
  const router = useRouter();
  const dispatch = useAppDispatch();
  const startedRef = useRef(false);

  const finishLogin = useCallback(
    async (credentials: {
      accessToken: string;
      refreshToken?: string;
      username: string;
      email?: string;
      roles: string[];
    }) => {
      let referrer = "/";
      if (typeof window !== "undefined") {
        referrer = getSafeRedirectPath(localStorage.getItem(OAUTH_REDIRECT_KEY));
      }

      try {
        dispatch(setCredentials(credentials));

        const menuResult = await dispatch(
          permissionApi.endpoints.getCurrentUserMenus.initiate()
        ).unwrap();

        dispatch(setPermissions(extractPermissions(menuResult)));
        dispatch(baseApi.util.resetApiState());

        if (typeof window !== "undefined") {
          localStorage.removeItem(OAUTH_REDIRECT_KEY);
        }

        toast.success("Successfully authenticated with Odyssey!");
        router.replace(referrer);
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem(OAUTH_REDIRECT_KEY);
        }
        toast.danger("Authentication succeeded, but failed to sync user permissions.");
        router.replace("/");
      }
    },
    [dispatch, router]
  );

  const handleLegacyToken = useCallback(
    async (token: string) => {
      const payload = decodeJwt(token);
      if (!payload) {
        toast.danger("Invalid token received from server");
        if (typeof window !== "undefined") {
          localStorage.removeItem(OAUTH_REDIRECT_KEY);
        }
        router.replace("/");
        return;
      }

      await finishLogin({
        accessToken: token,
        username: payload.sub || payload.username || "OAuth User",
        email: payload.email || undefined,
        roles: payload.roles || ["ROLE_USER"],
      });
    },
    [finishLogin, router]
  );

  const handleLoginCode = useCallback(
    async (code: string) => {
      try {
        const authResponse = await dispatch(
          authApi.endpoints.exchangeOAuthCode.initiate({ code })
        ).unwrap();

        await finishLogin({
          accessToken: authResponse.accessToken,
          refreshToken: authResponse.refreshToken,
          username: authResponse.username,
          email: authResponse.email,
          roles: authResponse.roles,
        });
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem(OAUTH_REDIRECT_KEY);
        }
        toast.danger("OAuth login code is invalid or expired. Please try again.");
        router.replace("/");
      }
    },
    [dispatch, finishLogin, router]
  );

  useEffect(() => {
    if (startedRef.current || typeof window === "undefined") return;
    startedRef.current = true;

    const { search, hash } = window.location;
    const error = extractOAuthError(search, hash);
    const code = extractOAuthCode(search, hash);
    const token = extractOAuthToken(search, hash);

    // Remove secrets / codes from the address bar before any further navigation.
    scrubOAuthParamsFromLocation();

    if (error) {
      toast.danger(`OAuth authentication failed: ${error}`);
      localStorage.removeItem(OAUTH_REDIRECT_KEY);
      router.replace("/");
      return;
    }

    if (code) {
      void handleLoginCode(code);
      return;
    }

    // Legacy fallback while older backends still redirect with a JWT in the URL.
    if (token) {
      void handleLegacyToken(token);
      return;
    }

    router.replace("/");
  }, [handleLegacyToken, handleLoginCode, router]);

  return (
    <div className="bg-background flex h-screen w-screen flex-col items-center justify-center gap-4">
      <Spinner size="lg" color="accent" />
      <TextShimmer className="text-muted text-sm font-medium">
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
