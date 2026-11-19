import { z } from "zod";

export const FileResponseSchema = z.object({
  // Optional during rolling deployments; Moment uploads reject a missing ID with a recoverable UI error.
  id: z.number().optional(),
  fileName: z.string(),
  originalName: z.string(),
  fileUrl: z.string(),
  thumbnailUrl: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  fileSize: z.number(),
  fileType: z.string(),
  createdAt: z.string(),
});

export type FileResponse = z.infer<typeof FileResponseSchema>;

export const AssetUsageSchema = z.object({
  total: z.number().int().nonnegative(),
  locations: z.array(
    z.object({
      kind: z.enum([
        "ARTICLE_COVER",
        "ARTICLE_CONTENT",
        "ARTICLE_SUMMARY",
        "COMMENT",
        "USER_AVATAR",
        "PROJECT_COVER",
        "SERIES_COVER",
        "FRIEND_LINK_AVATAR",
        "ARTICLE_REVISION",
        "MOMENT",
      ]),
      id: z.number(),
      label: z.string().nullish(),
    })
  ),
});

export type AssetUsage = z.infer<typeof AssetUsageSchema>;
