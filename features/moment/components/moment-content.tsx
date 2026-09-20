import { Typography } from "@heroui/react";
import type { JSONContent } from "@tiptap/core";
import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import { cn } from "@/lib/utils";
import { isDocumentEmpty } from "../utils/content-parser";
import { momentContentExtensions } from "../utils/content-schema";

export function MomentContent({
  content,
  className,
}: {
  content: JSONContent;
  className?: string;
}) {
  if (isDocumentEmpty(content)) return null;

  return (
    <Typography.Prose
      data-slot="moment-content"
      className={cn(
        "text-sm leading-relaxed break-words whitespace-pre-wrap [&_li]:text-sm [&_li]:leading-relaxed [&_p]:min-h-[1lh] [&_p]:text-sm [&_p]:leading-relaxed [&>p+p]:mt-[1lh]",
        className
      )}
    >
      {renderToReactElement({ content, extensions: momentContentExtensions })}
    </Typography.Prose>
  );
}
