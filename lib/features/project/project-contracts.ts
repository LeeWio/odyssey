import { z } from "zod";

export const ProjectResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().default(""),
  coverImage: z.string().nullable().default(""),
  githubUrl: z.string().nullable().default(""),
  previewUrl: z.string().nullable().default(""),
  techStack: z.string().nullable().default(""),
  starsCount: z.number().nullable().default(0),
  forksCount: z.number().nullable().default(0),
  language: z.string().nullable().default(""),
  sortOrder: z.number(),
  isPublished: z.boolean(),
  createdAt: z.string(),
});

export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;

export interface ProjectRequest {
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
  githubUrl?: string;
  previewUrl?: string;
  techStack?: string;
  sortOrder?: number;
  isPublished: boolean;
}
