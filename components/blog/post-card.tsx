"use client";

import { Calendar, Person } from "@gravity-ui/icons";
import { Chip, Link } from "@heroui/react";
import { ItemCard } from "@heroui-pro/react";

interface PostCardProps {
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  href: string;
}

export const PostCard = ({ title, description, date, author, category, href }: PostCardProps) => {
  return (
    <ItemCard variant="outline" className="h-full transition-shadow hover:shadow-md">
      <ItemCard.Content>
        <div className="mb-2 flex items-center gap-2">
          <Chip size="sm" variant="primary" color="accent">
            {category}
          </Chip>
        </div>
        <ItemCard.Title className="text-xl font-bold">
          <Link
            href={href}
            className="text-foreground hover:text-primary no-underline hover:underline"
          >
            {title}
          </Link>
        </ItemCard.Title>
        <ItemCard.Description className="text-default-500 mt-2 line-clamp-2">
          {description}
        </ItemCard.Description>
        <div className="text-default-400 mt-4 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Person className="size-3" />
            <span>{author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="size-3" />
            <span>{date}</span>
          </div>
        </div>
      </ItemCard.Content>
    </ItemCard>
  );
};
