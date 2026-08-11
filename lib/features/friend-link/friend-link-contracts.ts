import { z } from "zod";

export const FriendLinkStatusSchema = z.enum(["APPLYING", "APPROVED", "REJECTED"]);

export const FriendLinkResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
  avatar: z.string().nullable().default(""),
  description: z.string().nullable().default(""),
  email: z.string().nullable().default(""),
  status: FriendLinkStatusSchema,
  sortOrder: z.number(),
  isPublished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FriendLinkStatus = z.infer<typeof FriendLinkStatusSchema>;
export type FriendLinkResponse = z.infer<typeof FriendLinkResponseSchema>;

export interface FriendLinkRequest {
  name: string;
  url: string;
  avatar?: string;
  description?: string;
  email?: string;
  sortOrder?: number;
  isPublished?: boolean;
  status?: FriendLinkStatus;
}
