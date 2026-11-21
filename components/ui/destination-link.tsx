import { ChevronRight } from "@gravity-ui/icons";
import { ItemCard } from "@heroui-pro/react";
import NextLink from "next/link";
import type { ReactNode } from "react";

export function DestinationLink({
  href,
  title,
  description,
  icon,
  isCurrent,
  onNavigate,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  isCurrent?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <ItemCard<"a">
      aria-current={isCurrent ? "page" : undefined}
      className="group/destination focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
      render={(props) => (
        <NextLink {...props} href={href} onNavigate={onNavigate} prefetch={false} />
      )}
      variant={isCurrent ? "secondary" : "transparent"}
    >
      <ItemCard.Icon aria-hidden="true">{icon}</ItemCard.Icon>
      <ItemCard.Content>
        <ItemCard.Title className="w-auto whitespace-normal group-hover/destination:underline">
          {title}
        </ItemCard.Title>
        <ItemCard.Description className="w-auto whitespace-normal">
          {description}
        </ItemCard.Description>
      </ItemCard.Content>
      <ItemCard.Action aria-hidden="true">
        <ChevronRight className="text-muted size-4 rtl:rotate-180" />
      </ItemCard.Action>
    </ItemCard>
  );
}
