# Plan: Implement Admin Role Management with Elite Standards

Implementation of the Role Management module, following the project's high standards for type safety and runtime validation.

## Objective

- Manage system roles (List, Create, Update, Delete).
- Ensure strict type safety and runtime Zod validation.
- Provide consistent UI feedback via Toasts and Alerts.

## Key Files

- `lib/features/api/base-api.ts`: Add `Role` tag.
- `lib/features/role/role-api.ts`: Role-specific endpoints and Zod schemas.
- `lib/features/role/index.ts`: Unified export.
- `app/test/role/page.tsx`: Isolated test page.

## Implementation Steps

### Phase 1: Infrastructure

1. **Update `baseApi`**: Add `"Role"` to `tagTypes`.

### Phase 2: Role API Development

2. **Create `role-api.ts`**:
   - **Schemas**: `RoleResponseSchema`, `RoleRequestSchema`, `ApiResponseSchema`.
   - **Endpoints**:
     - `getAllRoles`: `query<RoleResponse[], void>`
     - `createRole`: `mutation<RoleResponse, RoleRequest>`
     - `updateRole`: `mutation<RoleResponse, { id: number, body: RoleRequest }>`
     - `deleteRole`: `mutation<void, number>`
   - **Logic**: Use `transformError`, `rawResponseSchema`, and fine-grained tags.

### Phase 3: Verification

3. **Create `app/test/role/page.tsx`**:
   - Build a UI to list roles in a Table.
   - Add a form to create/edit roles.
   - Test deletion and verify cache invalidation.
