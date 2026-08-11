import { z } from "zod";

export const RoleResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable().default(""),
});

export type RoleResponse = z.infer<typeof RoleResponseSchema>;

export interface RoleRequest {
  name: string;
  code: string;
  description?: string;
}
