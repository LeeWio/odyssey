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
