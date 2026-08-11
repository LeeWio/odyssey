"use client";

import { CircleQuestion, TriangleExclamation } from "@gravity-ui/icons";
import {
  Link,
  ProgressCircle,
  Skeleton,
  Surface,
  Typography,
  buttonVariants,
  cn,
} from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import type { ComponentType, ReactNode, SVGProps } from "react";

interface RouteStateProps {
  actions: ReactNode;
  description: string;
  kind: "not-found" | "error";
  title: string;
}

const STATE_APPEARANCE: Record<
  RouteStateProps["kind"],
  {
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    mark: string;
  }
> = {
  "not-found": {
    icon: CircleQuestion,
    mark: "404",
  },
  error: {
    icon: TriangleExclamation,
    mark: "Error",
  },
};

export function RouteState({ actions, description, kind, title }: RouteStateProps) {
  const appearance = STATE_APPEARANCE[kind];
  const StateIcon = appearance.icon;

  return (
    <main className="bg-background flex min-h-[100dvh] items-center px-5 py-24 sm:px-8">
      <div className="mx-auto grid w-full max-w-4xl items-center gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-16">
        <div className="flex min-h-48 items-center justify-center md:min-h-96">
          <Typography
            className="text-muted text-[clamp(4.5rem,14vw,9rem)] leading-none tracking-[-0.075em]"
            type="h1"
            weight="bold"
          >
            {appearance.mark}
          </Typography>
        </div>

        <div className="flex items-center">
          <EmptyState className="w-full" size="lg">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <StateIcon aria-hidden="true" />
              </EmptyState.Media>
              <Typography type="h2" weight="semibold">
                {title}
              </Typography>
              <EmptyState.Description className="max-w-sm text-pretty">
                {description}
              </EmptyState.Description>
            </EmptyState.Header>
            <EmptyState.Content className="flex-row flex-wrap justify-center gap-2">
              {actions}
            </EmptyState.Content>
          </EmptyState>
        </div>
      </div>
    </main>
  );
}

export function RouteLinkButton({
  children,
  href,
  variant = "primary",
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
}) {
  return (
    <Link className={cn(buttonVariants({ variant }), "no-underline")} href={href}>
      {children}
    </Link>
  );
}

export function RouteLoading() {
  return (
    <main
      aria-busy="true"
      className="bg-background flex min-h-[100dvh] items-center justify-center px-5 py-24"
    >
      <Surface
        aria-live="polite"
        className="flex w-full max-w-md flex-col items-center gap-6 p-8 text-center sm:p-10"
        role="status"
        variant="transparent"
      >
        <ProgressCircle isIndeterminate aria-label="Loading page" size="lg">
          <ProgressCircle.Track>
            <ProgressCircle.TrackCircle />
            <ProgressCircle.FillCircle />
          </ProgressCircle.Track>
        </ProgressCircle>

        <div className="flex flex-col gap-1">
          <Typography type="h3" weight="semibold">
            Loading
          </Typography>
          <Typography color="muted" type="body-sm">
            Preparing the next page.
          </Typography>
        </div>

        <div aria-hidden="true" className="flex w-full flex-col gap-3">
          <Skeleton animationType="pulse" className="h-3 w-3/4 self-center rounded-lg" />
          <Skeleton animationType="pulse" className="h-3 w-full rounded-lg" />
          <Skeleton animationType="pulse" className="h-3 w-2/3 self-center rounded-lg" />
        </div>
      </Surface>
    </main>
  );
}
