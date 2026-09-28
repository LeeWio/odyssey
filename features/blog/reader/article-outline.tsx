"use client";

import { useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react/rich-text-editor";
import type { TableOfContentData } from "@tiptap/extension-table-of-contents";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

const EMPTY_OUTLINE: TableOfContentData = [];

function headingElement(editorElement: HTMLElement, id: string) {
  return editorElement.querySelector<HTMLElement>(`[data-toc-id="${CSS.escape(id)}"]`);
}

export function ArticleOutline({
  className,
  label,
  maxHeadingLevel = 3,
  variant = "inline",
}: {
  className?: string;
  label: string;
  maxHeadingLevel?: number;
  variant?: "inline" | "rail";
}) {
  const t = useTranslations("Article");
  const { editor } = useRichTextEditor();
  const storedItems = useRichTextEditorState(
    (state) =>
      (state.editor.storage.tableOfContents?.content as TableOfContentData | undefined) ??
      EMPTY_OUTLINE
  );
  const items = useMemo(
    () => (storedItems ?? EMPTY_OUTLINE).filter((item) => item.originalLevel <= maxHeadingLevel),
    [maxHeadingLevel, storedItems]
  );
  const [activeId, setActiveId] = useState("");
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const railHost =
    variant === "rail" && isClient ? document.getElementById("article-outline-rail") : null;

  useEffect(() => {
    if (!editor || items.length === 0) return;

    let frame = 0;
    const updateActiveHeading = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let nextId = items[0]?.id ?? "";
        for (const item of items) {
          const heading = headingElement(editor.view.dom, item.id);
          if (!heading) continue;
          if (heading.getBoundingClientRect().top <= 140) {
            nextId = item.id;
            continue;
          }
          break;
        }
        setActiveId((current) => (current === nextId ? current : nextId));
      });
    };

    updateActiveHeading();
    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    window.addEventListener("resize", updateActiveHeading);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveHeading);
      window.removeEventListener("resize", updateActiveHeading);
    };
  }, [editor, items]);

  if (!editor || items.length === 0) return null;

  const jumpTo = (id: string) => {
    const heading = headingElement(editor.view.dom, id);
    if (!heading) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    heading.setAttribute("tabindex", "-1");
    window.scrollTo({
      behavior: reduceMotion ? "auto" : "smooth",
      top: heading.getBoundingClientRect().top + window.scrollY - 112,
    });
    heading.focus({ preventScroll: true });
    if (window.history.pushState) {
      window.history.pushState(null, "", `#${id}`);
    }
    setActiveId(id);
  };

  const outlineList = (
    <ol
      className={cn(
        "mt-3 flex flex-col gap-1",
        variant === "rail" && "max-h-[calc(100dvh-9rem)] overflow-y-auto"
      )}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <li key={item.id}>
            <a
              aria-current={isActive ? "location" : undefined}
              className={cn(
                "block rounded-md py-1 text-sm leading-5 no-underline",
                item.level > 1 ? "ps-3" : "",
                isActive ? "text-foreground font-medium" : "text-muted hover:text-foreground"
              )}
              href={`#${item.id}`}
              onClick={(event) => {
                event.preventDefault();
                jumpTo(item.id);
              }}
            >
              {item.textContent}
            </a>
          </li>
        );
      })}
    </ol>
  );

  if (variant === "rail") {
    const rail = (
      <nav aria-label={label} className={className}>
        <p className="text-muted text-xs font-medium">{t("onThisPage")}</p>
        {outlineList}
      </nav>
    );
    return railHost ? createPortal(rail, railHost) : null;
  }

  return (
    <details className={cn("mb-8 xl:hidden", className)}>
      <summary className="text-muted cursor-pointer text-sm font-medium">{t("onThisPage")}</summary>
      {outlineList}
    </details>
  );
}
