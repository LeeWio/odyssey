# Plan: Implement Admin Tag Management with Elite Standards

Implementation of the Tag Management (标签管理) module, following the project's high standards for type safety and runtime validation.

## Objective

- Manage blog tags (List, Create, Update, Delete).
- Ensure strict type safety and runtime Zod validation.
- Provide consistent UI feedback via Toasts and Alerts.

## Key Files

- `lib/features/api/base-api.ts`: Ensure `Tag` is in `tagTypes`.
- `lib/features/tag/tag-api.ts`: Tag-specific endpoints and Zod schemas.
- `lib/features/tag/index.ts`: Unified export.
- `app/test/tag/page.tsx`: Isolated test page.

## Implementation Steps

### Phase 1: Infrastructure

1. **Update `baseApi`**: Confirm/Add `"Tag"` to `tagTypes`. (It is already there as per initial `base-api.ts` read, but will verify).

### Phase 2: Tag API Development

2. **Create `tag-api.ts`**:
   - **Schemas**: `TagResponseSchema`, `TagRequestSchema`, `ApiResponseSchema`.
   - **Endpoints**:
     - `getAllTags`: `query<TagResponse[], void>`
     - `createTag`: `mutation<TagResponse, TagRequest>`
     - `updateTag`: `mutation<TagResponse, { id: number, body: TagRequest }>`
     - `deleteTag`: `mutation<void, number>`
   - **Logic**: Use `transformError`, `rawResponseSchema`, and fine-grained tags.

### Phase 3: Verification

3. **Create `app/test/tag/page.tsx`**:
   - Build a UI to list tags in a Table.
   - Add a form to create/edit tags.
   - Test deletion and verify cache invalidation.
