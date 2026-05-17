# Plan: Implement Admin File Management with Elite Standards

Implementation of the File Management module, focusing on file uploads and deletion with strict type safety.

## Objective

- Provide a robust interface for file uploads (images, etc.).
- Allow deletion of files by name.
- Handle multi-part form data in RTK Query.
- Ensure strict type safety and runtime validation.

## Key Files

- `lib/features/file/file-api.ts`: File-specific endpoints and Zod schemas.
- `lib/features/file/index.ts`: Unified export.
- `app/test/file/page.tsx`: Isolated test page for uploads.

## Implementation Steps

### Phase 1: File API Development

1. **Create `file-api.ts`**:
   - **Schemas**: `FileResponseSchema`, `ApiResponseSchema`.
   - **Endpoints**:
     - `uploadFile`: `mutation<FileResponse, File>` (using `FormData`).
     - `deleteFile`: `mutation<void, string>`.
   - **Logic**: Use `transformError`, `rawResponseSchema`.

### Phase 2: Verification

2. **Create `app/test/file/page.tsx`**:
   - Build a UI with a file input.
   - Implement a drop zone or simple button trigger.
   - Show uploaded file details (URL, Size, Name).
   - Test deletion.

## Technical Detail: Multipart Upload

In RTK Query, file uploads require creating a `FormData` object. We will ensure the `prepareHeaders` logic doesn't interfere with the automatic boundary setting for `multipart/form-data`.
