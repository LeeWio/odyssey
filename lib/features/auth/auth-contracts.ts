import { z } from "zod";

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.string(),
  username: z.string(),
  email: z.string().optional(),
  roles: z.array(z.string()),
});

export const OtpSendRequestSchema = z.object({
  email: z.string().email(),
});

export const OtpLoginRequestSchema = z.object({
  email: z.string().email(),
  code: z.string().min(1),
});

export const EmptyAuthResponseSchema = z.unknown();

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type OtpSendRequest = z.infer<typeof OtpSendRequestSchema>;
export type OtpLoginRequest = z.infer<typeof OtpLoginRequestSchema>;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
