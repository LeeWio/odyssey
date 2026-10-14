import type { PostResponse } from "@/lib/features/post";

/** The article facts these controls need. */
export type Target = Pick<
  PostResponse,
  "id" | "title" | "summary" | "slug" | "isLiked" | "likesCount" | "isInReadingList"
>;
