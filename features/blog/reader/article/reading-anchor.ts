import { ARTICLE_OUTLINE_TOP_OFFSET } from "@/lib/reading-scroll";

/** Place a library or outline heading just below the sticky site header. */
export function scrollReadingAnchorIntoView(id: string) {
  const heading = document.getElementById(id);
  if (!heading) return false;
  const top = heading.getBoundingClientRect().top + window.scrollY - ARTICLE_OUTLINE_TOP_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
  return true;
}
