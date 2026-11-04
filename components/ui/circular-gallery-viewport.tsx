"use client";

import { Modal } from "@heroui/react";
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface CircularGalleryViewportProps {
  children: ReactNode;
  expanded: boolean;
  onClose: () => void;
}

export function CircularGalleryViewport({
  children,
  expanded,
  onClose,
}: CircularGalleryViewportProps) {
  const inlineRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement | null>(null);
  const restoreFrameRef = useRef(0);
  const focusFrameRef = useRef(0);
  const [host] = useState(() => {
    if (typeof document === "undefined") return null;
    const element = document.createElement("div");
    element.className = "h-full w-full";
    return element;
  });

  useLayoutEffect(() => {
    if (!host) return;
    inlineRef.current?.appendChild(host);
    return () => {
      cancelAnimationFrame(restoreFrameRef.current);
      cancelAnimationFrame(focusFrameRef.current);
      host.remove();
    };
  }, [host]);

  const focusExpanded = useCallback(() => {
    cancelAnimationFrame(focusFrameRef.current);
    focusFrameRef.current = requestAnimationFrame(() => {
      if (host && expandedRef.current?.contains(host)) {
        host
          .querySelector<HTMLButtonElement>("[data-gallery-close]")
          ?.focus({ preventScroll: true });
      }
    });
  }, [host]);

  useLayoutEffect(() => {
    const target = expanded ? expandedRef.current : inlineRef.current;
    if (host && target) target.appendChild(host);
    if (expanded) focusExpanded();
  }, [expanded, host, focusExpanded]);

  const attachExpanded = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element || !host) return;
      // Only move the portal host: its React children and WebGL context stay mounted.
      expandedRef.current = element;
      cancelAnimationFrame(restoreFrameRef.current);
      element.appendChild(host);
      focusExpanded();
      return () => {
        expandedRef.current = null;
        if (element.contains(host)) inlineRef.current?.appendChild(host);
        restoreFrameRef.current = requestAnimationFrame(() => {
          if (!expandedRef.current && inlineRef.current?.isConnected) {
            host
              .querySelector<HTMLButtonElement>('[aria-current="true"]')
              ?.focus({ preventScroll: true });
          }
        });
      };
    },
    [host, focusExpanded]
  );

  return (
    <>
      <div ref={inlineRef} className="h-full w-full" data-gallery-inline="" />
      {host && createPortal(children, host)}
      <Modal>
        <Modal.Backdrop isOpen={expanded} onOpenChange={(isOpen) => !isOpen && onClose()}>
          <Modal.Container size="full" placement="center">
            <Modal.Dialog aria-label="Image gallery" className="overflow-hidden bg-black p-0">
              <div ref={attachExpanded} className="h-full min-h-0 w-full flex-1" />
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
