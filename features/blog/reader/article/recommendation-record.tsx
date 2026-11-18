"use client";

import { Link } from "@heroui/react";
import { useLocale } from "next-intl";

export function formatReadingDate(value: string | null | undefined, locale: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** One recommendation: relation, title, an optional summary line, and a date. */
export function RecommendationRecord({
  date,
  href,
  relation,
  summary,
  title,
}: {
  date?: string | null;
  href?: string;
  relation: string;
  summary?: string | null;
  title: string;
}) {
  const locale = useLocale();
  const published = formatReadingDate(date, locale);
  const body = (
    <>
      <span className="text-muted text-xs">{relation}</span>
      <span className="text-foreground line-clamp-2 text-base leading-snug font-medium wrap-break-word">
        {title}
      </span>
      {summary ? (
        <span className="text-muted line-clamp-2 text-sm leading-6">{summary}</span>
      ) : null}
      {published ? (
        <time className="text-muted text-xs" dateTime={date ?? undefined}>
          {published}
        </time>
      ) : null}
    </>
  );

  if (!href) {
    return (
      <div className="flex min-w-0 flex-col gap-1 border-t border-current/10 py-4">{body}</div>
    );
  }

  return (
    <Link
      className="flex min-w-0 flex-col gap-1 border-t border-current/10 py-4 no-underline"
      href={href}
    >
      {body}
    </Link>
  );
}
