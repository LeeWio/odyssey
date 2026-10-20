"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

const NAVIGATION = "navigation";
const BRIDGE = Symbol.for("odyssey.navigation-transition");
const ROUTER = Symbol.for("odyssey.navigation-router");

type TransitionLike = { types: string[] | null };
type Finish = (transition: TransitionLike, returnValue: unknown) => void;
type MarkedFinish = Finish & { [BRIDGE]?: true };

type Internals = { S: MarkedFinish | null };

type PatchedRouter = ReturnType<typeof useRouter> & { [ROUTER]?: true };

type NavState = { pending: boolean };

const navState: NavState = ((globalThis as { __odysseyNav?: NavState }).__odysseyNav ??= {
  pending: false,
});

/** The next startTransition in this turn is a route change. */
function armNavigation() {
  navState.pending = true;
  queueMicrotask(() => {
    navState.pending = false;
  });
}

function internals(): Internals | null {
  return (
    (
      React as typeof React & {
        __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?: Internals;
      }
    ).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ?? null
  );
}

/**
 * Next calls startTransition from a few copies of the function (Link, popstate,
 * router.push). React DOM reads transition.types from the shared finish hook,
 * so tagging the transition there covers every copy. Suspense reveals never
 * enter that hook, and stay untyped.
 */
function installTypeBridge() {
  const shared = internals();
  if (!shared || shared.S?.[BRIDGE]) return;
  const previous = shared.S;
  const wrapped: MarkedFinish = (transition, returnValue) => {
    if (navState.pending) {
      navState.pending = false;
      if (transition.types == null) transition.types = [NAVIGATION];
      else if (!transition.types.includes(NAVIGATION)) transition.types.push(NAVIGATION);
    }
    previous?.(transition, returnValue);
  };
  wrapped[BRIDGE] = true;
  shared.S = wrapped;
}

function isNavigationClick(event: MouseEvent) {
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const target = event.target;
  if (!(target instanceof Element)) return false;
  const anchor = target.closest("a");
  if (!anchor) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) return false;
  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false;
  return url.pathname !== window.location.pathname || url.search !== window.location.search;
}

function patchRouter(router: PatchedRouter) {
  if (router[ROUTER]) return;
  const push = router.push.bind(router);
  const replace = router.replace.bind(router);
  // Shared App Router singleton. Every useRouter() caller has to see the arm,
  // and Next does not offer a hook for that.
  router.push = (href, options) => {
    armNavigation();
    push(href, options);
  };
  router.replace = (href, options) => {
    armNavigation();
    replace(href, options);
  };
  router[ROUTER] = true;
}

/**
 * Marks Link clicks, back/forward, and router.push/replace as the
 * "navigation" view-transition type. Other transitions, including the
 * Suspense reveal on the first dynamic overlay, stay unmarked.
 */
export function useNavigationTransition() {
  const router = useRouter();

  useEffect(() => {
    installTypeBridge();
    patchRouter(router as PatchedRouter);

    const onClick = (event: MouseEvent) => {
      if (isNavigationClick(event)) armNavigation();
    };
    const onPopState = () => {
      armNavigation();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState, true);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState, true);
    };
  }, [router]);
}
