type CommentDebugDetails = Record<string, unknown>;

export function commentDebug(event: string, details?: CommentDebugDetails) {
  if (process.env.NODE_ENV === "production") return;

  console.info(
    "[comments-debug]",
    new Date().toISOString(),
    event,
    details ? JSON.stringify(details) : ""
  );
}
