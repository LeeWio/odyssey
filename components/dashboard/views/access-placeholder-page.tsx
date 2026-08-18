import { EmptyState } from "@heroui-pro/react";

interface AccessPlaceholderPageProps {
  title: string;
  description: string;
}

export function AccessPlaceholderPage({ title, description }: AccessPlaceholderPageProps) {
  const headingId = `${title.toLowerCase().replaceAll(" ", "-")}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className="mx-auto flex min-h-full max-w-7xl flex-col px-5 pt-8 pb-10"
    >
      <div className="flex flex-col gap-1">
        <span className="text-muted text-sm font-medium">Users &amp; Access</span>
        <h1 id={headingId} className="text-foreground text-2xl font-semibold">
          {title}
        </h1>
        <p className="text-muted text-sm">{description}</p>
      </div>

      <div className="bg-surface-secondary/40 mt-6 flex min-h-80 flex-1 items-center justify-center">
        <EmptyState className="w-full max-w-md">
          <EmptyState.Header>
            <EmptyState.Title>{title} will appear here</EmptyState.Title>
            <EmptyState.Description className="max-w-sm text-pretty">
              This workspace is prepared for the next stage of your role-based access control.
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      </div>
    </section>
  );
}
