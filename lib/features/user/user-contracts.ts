import { z } from "zod";

export const UserResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  nickname: z.string().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "BANNED", "DELETED"]),
  createdAt: z.string(),
  roles: z.array(z.string()),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

export const UserInfoResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  nickname: z.string().nullable().default(""),
  avatar: z.string().nullable().default(""),
  roles: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
});

export const UserProfileRequestSchema = z.object({
  nickname: z.string().max(50).optional(),
  avatar: z.string().max(255).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().max(100).optional(),
  email: z.string().email().max(100).optional(),
});

export const PasswordChangeRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export type UserInfoResponse = z.infer<typeof UserInfoResponseSchema>;
export type UserProfileRequest = z.infer<typeof UserProfileRequestSchema>;
export type PasswordChangeRequest = z.infer<typeof PasswordChangeRequestSchema>;
