"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/lib/hooks";
import { selectThemeVariant } from "@/lib/features/ui";

export function ThemeCSSLoader() {
  const themeVariant = useAppSelector(selectThemeVariant);

  useEffect(() => {
    if (!themeVariant || themeVariant === "default") {
      removeExistingThemeLink();
      return;
    }

    const cssHref = `/themes/${themeVariant}.css`;
    const linkId = "dynamic-theme-css";

    let link = document.getElementById(linkId) as HTMLLinkElement;

    if (link) {
      if (link.getAttribute("href") !== cssHref) {
        link.href = cssHref;
      }
    } else {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = cssHref;
      document.head.appendChild(link);
    }
  }, [themeVariant]);

  return null;
}

function removeExistingThemeLink() {
  const existingLink = document.getElementById("dynamic-theme-css");
  if (existingLink && existingLink.parentNode) {
    existingLink.parentNode.removeChild(existingLink);
  }
}
