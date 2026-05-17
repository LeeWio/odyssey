# Plan: Implement Comment module with Elite Standards

Implementation of the Comment (评论) module, covering public discussions and administrative moderation.

## Objective

- Provide a public interface for viewing post comments.
- Allow authenticated users to post and reply to comments.
- Provide administrative tools to moderate comment status and delete comments.
- Maintain recursive/hierarchical data structure for threaded discussions.

## Key Files

- `lib/features/api/base-api.ts`: Add `Comment` tag.
- `lib/features/comment/comment-api.ts`: Comment endpoints and Zod schemas.
- `lib/features/comment/index.ts`: Unified export.
- `app/test/comment/page.tsx`: Isolated test page for threading and moderation.

## Implementation Steps

### Phase 1: Infrastructure

1. **Update `baseApi`**: Add `"Comment"` to `tagTypes`.

### Phase 2: Comment API Development

2. **Create `comment-api.ts`**:
   - **Schemas**:
     - `CommentResponseSchema`: Recursive schema to handle the `children` array.
     - `CommentRequestSchema`: Handling `postId` and optional `parentId`.
   - **Endpoints**:
     - **Public**:
       - `getPostComments`: `query<PageResult<CommentResponse>, { postId: number } & Pageable>`
       - `publishComment`: `mutation<void, CommentRequest>`
     - **Admin**:
       - `getAdminComments`: `query<PageResult<CommentResponse>, Pageable>`
       - `moderateComment`: `mutation<void, { id: number, status: string }>`
       - `deleteComment`: `mutation<void, number>`
   - **Logic**: Strict Zod validation and fine-grained tag management.

### Phase 3: Verification

3. **Create `app/test/comment/page.tsx`**:
   - Select a Post (from existing ones) to view comments.
   - Test replying to existing comments (nested structure).
   - Test Admin moderation (Approved/Rejected/Spam).
