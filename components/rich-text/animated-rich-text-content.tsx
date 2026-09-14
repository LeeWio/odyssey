"use client";

import { RichTextEditor, useRichTextEditor } from "@heroui-pro/react/rich-text-editor";
import { gsap } from "gsap";
import { useEffect } from "react";

type Props = { className?: string; enabled?: boolean; stagger?: number; duration?: number };

export function AnimatedRichTextContent({
  className,
  enabled = true,
  stagger = 45,
  duration = 280,
}: Props) {
  const { editor } = useRichTextEditor();
  useEffect(() => {
    if (!editor || !enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    let observer: IntersectionObserver | undefined;
    let mutationObserver: MutationObserver | undefined;
    let blocks: HTMLElement[] = [];
    const frame = requestAnimationFrame(() => {
      const initialize = () => {
        blocks = Array.from(editor.view.dom.children).filter(
          (node): node is HTMLElement => node instanceof HTMLElement
        );
        if (!blocks.length) return false;
        blocks.forEach((block) => gsap.set(block, { autoAlpha: 0, y: 8 }));
        const root = editor.view.dom.closest<HTMLElement>("[data-slot='rich-text-editor-content']");
        observer = new IntersectionObserver(
          (entries) => {
            entries
              .filter((entry) => entry.isIntersecting)
              .sort(
                (a, b) =>
                  blocks.indexOf(a.target as HTMLElement) - blocks.indexOf(b.target as HTMLElement)
              )
              .forEach((entry, index) => {
                const block = entry.target as HTMLElement;
                if (block.dataset.richTextAnimated) return;
                block.dataset.richTextAnimated = "true";
                gsap.to(block, {
                  autoAlpha: 1,
                  y: 0,
                  delay: (index * stagger) / 1000,
                  duration: duration / 1000,
                  ease: "power2.out",
                  clearProps: "transform",
                });
                observer?.unobserve(block);
              });
          },
          { root, threshold: 0.05 }
        );
        blocks.forEach((block) => observer?.observe(block));
        return true;
      };
      if (!initialize()) {
        mutationObserver = new MutationObserver(() => {
          if (initialize()) mutationObserver?.disconnect();
        });
        mutationObserver.observe(editor.view.dom, { childList: true });
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      blocks.forEach((block) => {
        gsap.killTweensOf(block);
        gsap.set(block, { clearProps: "opacity,visibility,transform" });
        delete block.dataset.richTextAnimated;
      });
    };
  }, [duration, editor, enabled, stagger]);
  return <RichTextEditor.Content className={className} />;
}
