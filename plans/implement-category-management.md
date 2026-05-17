# Plan: Implement Admin Category Management with Elite Standards

Implementation of the Category Management module, following the project's high standards for type safety and runtime validation.

## Objective

- Manage blog categories (List, Create, Update, Delete).
- Ensure strict type safety and runtime Zod validation.
- Provide consistent UI feedback via Toasts and Alerts.

## Key Files

- `lib/features/api/base-api.ts`: Add `Category` tag.
- `lib/features/category/category-api.ts`: Category-specific endpoints and Zod schemas.
- `lib/features/category/index.ts`: Unified export.
- `app/test/category/page.tsx`: Isolated test page.

## Implementation Steps

### Phase 1: Infrastructure

1. **Update `baseApi`**: Add `"Category"` to `tagTypes`.

### Phase 2: Category API Development

2. **Create `category-api.ts`**:
   - **Schemas**: `CategoryResponseSchema`, `CategoryRequestSchema`, `ApiResponseSchema`.
   - **Endpoints**:
     - `getCategories`: `query<CategoryResponse[], void>`
     - `createCategory`: `mutation<CategoryResponse, CategoryRequest>`
     - `updateCategory`: `mutation<CategoryResponse, { id: number, body: CategoryRequest }>`
     - `deleteCategory`: `mutation<void, number>`
   - **Logic**: Use `transformError`, `rawResponseSchema`, and fine-grained tags.

### Phase 3: Verification

3. **Create `app/test/category/page.tsx`**:
   - Build a UI to list categories in a Table.
   - Add a form to create/edit categories.
   - Test deletion and verify cache invalidation.
