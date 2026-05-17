# Plan: Implement Moment Feature with Elite Standards

Implementation of the Moment (微语) module, covering public timeline and administrative management.

## Objective

- Provide a public timeline for viewing published moments.
- Allow users to "like" moments.
- Provide administrative tools to create, update, publish, and delete moments.
- Ensure strict type safety and runtime Zod validation.

## Key Files

- `lib/features/api/base-api.ts`: Add `Moment` tag.
- `lib/features/moment/moment-api.ts`: Moment-specific endpoints and Zod schemas.
- `lib/features/moment/index.ts`: Unified export.
- `app/test/moment/page.tsx`: Isolated test page.

## Implementation Steps

### Phase 1: Infrastructure

1. **Update `baseApi`**: Add `"Moment"` to `tagTypes`.

### Phase 2: Moment API Development

2. **Create `moment-api.ts`**:
   - **Schemas**: `MomentResponseSchema`, `MomentRequestSchema`, `ApiResponseSchema`, `PageResultSchema`.
   - **Endpoints**:
     - **Public**:
       - `getPublicMoments`: `query<PageResult<MomentResponse>, Pageable>`
       - `likeMoment`: `mutation<void, number>`
     - **Admin**:
       - `getAllMoments`: `query<PageResult<MomentResponse>, Pageable>`
       - `createMoment`: `mutation<MomentResponse, MomentRequest>`
       - `updateMoment`: `mutation<MomentResponse, { id: number, body: MomentRequest }>`
       - `deleteMoment`: `mutation<void, number>`
   - **Logic**: Use `transformError`, `rawResponseSchema`, and fine-grained tags.

### Phase 3: Verification

3. **Create `app/test/moment/page.tsx`**:
   - Build a timeline-style UI to list moments.
   - Add a form to create/edit moments.
   - Test "like" functionality and verify cache invalidation.
