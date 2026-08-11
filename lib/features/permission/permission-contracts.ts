import { z } from "zod";

const baseMenuFields = {
  id: z.number(),
  parentId: z.number().nullable().default(0),
  name: z.string(),
  path: z.string().nullable().default(""),
  permission: z.string().nullable().default(""),
  type: z.number(),
  icon: z.string().nullable().default(""),
  sortOrder: z.number().nullable().default(0),
  isVisible: z.boolean(),
  isPublic: z.boolean(),
  createdAt: z.string(),
};

const baseMenuSchema = z.object(baseMenuFields);

export type MenuResponse = z.infer<typeof baseMenuSchema> & {
  children?: MenuResponse[];
};

export const MenuResponseSchema: z.ZodType<MenuResponse> = baseMenuSchema.extend({
  children: z
    .lazy(() => z.array(MenuResponseSchema))
    .nullable()
    .transform((children) => children ?? []),
});

export interface MenuRequest {
  name: string;
  parentId: number;
  path?: string;
  permission?: string;
  type: number;
  icon?: string;
  sortOrder?: number;
  isVisible?: boolean;
  isPublic?: boolean;
}
