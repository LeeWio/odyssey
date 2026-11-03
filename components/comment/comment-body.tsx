"use client";

import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import { commentExtensions, parseCommentDocument } from "./comment-document";

export function CommentBody({ content }: { content: string }) {
  return (
    <>
      {renderToReactElement({
        content: parseCommentDocument(content),
        extensions: commentExtensions,
      })}
    </>
  );
}
