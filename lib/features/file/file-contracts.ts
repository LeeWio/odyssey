import { z } from "zod";

export const FileResponseSchema = z.object({
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
