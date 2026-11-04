import { publicWebsiteHref } from "../comment-website";
import type { GuestCommentIdentity } from "../hooks/use-comment-mutations";

/** Nested sheet submit buttons; signature popover must not steal their press. */
export const COMMENT_COMPOSER_SUBMIT_ATTR = "data-comment-composer-submit";

export function isCommentComposerSubmitTarget(element: Element) {
  return Boolean(element.closest(`[${COMMENT_COMPOSER_SUBMIT_ATTR}]`));
}

/**
 * Logged-out composers always post as a guest. An empty name uses the
 * visible anonymous label so submitting does not require editing the field.
 */
export function resolveGuestCommentIdentity({
  isAuthenticated,
  postAsGuest,
  guestName,
  guestEmail,
  guestWebsite,
  anonymousLabel,
}: {
  isAuthenticated: boolean;
  postAsGuest: boolean;
  guestName: string;
  guestEmail: string;
  guestWebsite: string;
  anonymousLabel: string;
}): GuestCommentIdentity | undefined {
  if (isAuthenticated && !postAsGuest) return undefined;
  const trimmedName = guestName.trim();
  return {
    guestName: trimmedName || anonymousLabel,
    guestEmail: guestEmail.trim() || undefined,
    guestWebsite: publicWebsiteHref(guestWebsite) ?? undefined,
  };
}
