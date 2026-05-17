# Plan: Implement Friend Link Feature with RTK Query

This plan outlines the implementation of the Friend Link (友链) module, covering both public application/listing and administrative management.

## Objective

- Provide a public interface for viewing approved friend links.
- Allow users to apply for new friend link exchanges.
- Provide administrative tools to manage, moderate, and update friend links.

## Key Files & Context

- `lib/features/api/base-api.ts`: Central API configuration (add `FriendLink` tag).
- `lib/features/friend-link/friend-link-api.ts`: Friend Link endpoints (Public & Admin).
- `lib/features/friend-link/index.ts`: Unified export for friend link logic.
- `types/index.ts`: Add common pagination types if needed.

## Implementation Steps

### Phase 1: API Setup & Tag Configuration

1. **Update `lib/features/api/base-api.ts`**:
   - Add `"FriendLink"` to `tagTypes`.

### Phase 2: Friend Link API Implementation (RTK Query)

2. **Create `lib/features/friend-link/friend-link-api.ts`**:
   - **Define Data Models**:
     - `FriendLinkStatus`: `"APPLYING" | "APPROVED" | "REJECTED"`
     - `FriendLinkRequest`: `name`, `url`, `avatar`, `description`, `email`, etc.
     - `FriendLinkResponse`: Detailed link info with IDs and timestamps.
   - **Inject Endpoints**:
     - **Public**:
       - `getPublicFriendLinks`: `query<FriendLinkResponse[], void>` (Path: `/api/v1/public/friend-links`).
       - `applyFriendLink`: `mutation<void, FriendLinkRequest>` (Path: `/api/v1/public/friend-links/apply`).
     - **Admin**:
       - `getAdminFriendLinks`: `query<PageResult<FriendLinkResponse>, Pageable>` (Path: `/api/v1/admin/friend-links`).
       - `createAdminFriendLink`: `mutation<FriendLinkResponse, FriendLinkRequest>` (Path: `/api/v1/admin/friend-links`).
       - `updateAdminFriendLink`: `mutation<FriendLinkResponse, { id: number, body: FriendLinkRequest }>` (Path: `/api/v1/admin/friend-links/{id}`).
       - `deleteAdminFriendLink`: `mutation<void, number>` (Path: `/api/v1/admin/friend-links/{id}`).
       - `moderateFriendLink`: `mutation<void, { id: number, status: FriendLinkStatus }>` (Path: `/api/v1/admin/friend-links/{id}/status`).
   - **Tag Invalidation**:
     - `providesTags: ["FriendLink"]` for GET requests.
     - `invalidatesTags: ["FriendLink"]` for POST/PUT/PATCH/DELETE requests.

### Phase 3: Integration & Testing

3. **Update `lib/features/friend-link/index.ts`**:
   - Export `friendLinkApi` and hooks.
4. **Update `lib/features/index.ts`**:
   - Export the `friend-link` module.
5. **Create Test Page**:
   - `app/test/friend-link/page.tsx`: A dedicated page to test listing, applying, and moderating friend links.

## Verification & Testing

- Verify public list retrieval.
- Test link application with toast feedback.
- Test administrative actions (Update/Delete/Moderate) and verify cache invalidation.
