export const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const getVisibleFocusableElements = (container: HTMLElement | null) =>
  Array.from(container?.querySelectorAll<HTMLElement>(focusableSelector) ?? []).filter(
    (element) => element.getClientRects().length > 0
  );
