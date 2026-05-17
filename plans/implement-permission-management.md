# Plan: Implement Permission and Menu module with Elite Standards

Implementation of the Permission (权限/菜单) module to support dynamic navigation and fine-grained authorization.

## Objective

- Load dynamic menu trees based on user permissions.
- Manage system menus (Create, Update, Delete).
- Provide a bridge between Authentication and Authorization.
- Resolve Dashboard 403 by properly loading the permission context.

## Key Files

- `lib/features/api/base-api.ts`: Add `Menu` tag.
- `lib/features/permission/permission-api.ts`: Menu endpoints and recursive Zod schemas.
- `lib/features/permission/index.ts`: Unified export.
- `lib/features/auth/auth-slice.ts`: Add state to store current user's permissions.
- `app/test/permission/page.tsx`: Isolated test page for hierarchy and codes.

## Implementation Steps

### Phase 1: Infrastructure

1. **Update `baseApi`**: Add `"Menu"` to `tagTypes`.

### Phase 2: Permission API Development

2. **Create `permission-api.ts`**:
   - **Schemas**:
     - `MenuResponseSchema`: Recursive schema for hierarchical trees.
     - `MenuRequestSchema`: For management actions.
   - **Endpoints**:
     - **Admin**:
       - `getCurrentUserMenus`: `query<MenuResponse[], void>` (Path: `/api/v1/admin/menus/current`).
       - `getMenuTree`: `query<MenuResponse[], void>` (Path: `/api/v1/admin/menus/tree`).
       - `createMenu / updateMenu / deleteMenu`: Basic CRUD.
     - **Public**:
       - `getPublicNavigation`: `query<MenuResponse[], void>` (Path: `/api/v1/public/menus/navigation`).
   - **Logic**: Strict Zod validation and fine-grained tags.

### Phase 3: Auth Integration

3. **Update `auth-slice.ts`**:
   - Add `permissions: string[]` to `AuthState`.
   - Update `setCredentials` to accept permissions.
4. **Link Login & Permissions**:
   - In `auth-api.ts`, modify `login` onQueryStarted to fetch permissions immediately after successful login.

### Phase 4: Verification

5. **Create `app/test/permission/page.tsx`**:
   - Visualize the current user's menu tree.
   - List all available permission codes.
   - Test basic CRUD for menus.
