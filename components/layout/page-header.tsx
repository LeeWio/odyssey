"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { Typography } from "@heroui/react";

import { cn } from "@/lib/utils";

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  titleId?: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  titleId,
  description,
  actions,
  children,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-3">
        <Typography id={titleId} type="h1" className="tracking-normal text-balance break-words">
          {title}
        </Typography>
        {description ? (
          <Typography color="muted" className="max-w-2xl text-pretty break-words">
            {description}
          </Typography>
        ) : null}
        {children}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
