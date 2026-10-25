"use client";

import { useEffect } from "react";

/**
 * Sheet drag walks every ancestor and aborts when a scrolled document is
 * still at a non-zero scrollTop. Safari already pins the body while a sheet
 * is open. Other browsers keep the page scroll offset, so the handle and
 * swipe never start. Pin the body for those browsers until the last sheet
 * closes.
 */
const SAFARI_USER_AGENT = /^((?!chrome|android).)*safari/i;

type ScrollSnapshot = {
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  scrollX: number;
  scrollY: number;
};

let locks = 0;
let snapshot: ScrollSnapshot | null = null;

function pinDocumentForSheetDrag() {
  if (snapshot || SAFARI_USER_AGENT.test(navigator.userAgent)) return;

  const { body, documentElement } = document;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  snapshot = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    scrollX,
    scrollY,
  };
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = `-${scrollX}px`;
  body.style.right = "0px";
  body.style.width = "100%";
  documentElement.scrollTop = 0;
  body.scrollTop = 0;
}

function unpinDocumentForSheetDrag() {
  if (!snapshot) return;

  const { body } = document;
  const { scrollX, scrollY, position, top, left, right, width } = snapshot;
  snapshot = null;
  body.style.position = position;
  body.style.top = top;
  body.style.left = left;
  body.style.right = right;
  body.style.width = width;
  window.scrollTo(scrollX, scrollY);
}

export function useSheetDismissScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    locks += 1;
    if (locks === 1) pinDocumentForSheetDrag();

    return () => {
      locks -= 1;
      if (locks === 0) unpinDocumentForSheetDrag();
    };
  }, [isOpen]);
}
