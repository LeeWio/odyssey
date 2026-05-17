# Plan: Implement Project module with Elite Standards

Implementation of the Project (项目展示) module, showcasing your portfolio with GitHub metrics integration.

## Objective

- Provide a public showcase of portfolio projects.
- Integrate GitHub metrics (Stars, Forks, Languages).
- Administrative tools to manage projects (Create, Update, Publish, Sort).
- Ensure strict type safety and runtime Zod validation.

## Key Files

- `lib/features/api/base-api.ts`: Add `Project` tag.
- `lib/features/project/project-api.ts`: Project endpoints and Zod schemas.
- `lib/features/project/index.ts`: Unified export.
- `app/test/project/page.tsx`: Isolated test page for showcase and management.

## Implementation Steps

### Phase 1: Infrastructure

1. **Update `baseApi`**: Ensure `"Project"` is in `tagTypes` (it's already there).

### Phase 2: Project API Development

2. **Create `project-api.ts`**:
   - **Schemas**:
     - `ProjectResponseSchema`: Including GitHub metrics and nullable metadata.
     - `ProjectRequestSchema`: For creation/update.
   - **Endpoints**:
     - **Public**:
       - `getPublicProjects`: `query<ProjectResponse[], void>`
     - **Admin**:
       - `getAllProjects`: `query<PageResult<ProjectResponse>, Pageable>`
       - `getProjectById`: `query<ProjectResponse, number>`
       - `createProject`: `mutation<ProjectResponse, ProjectRequest>`
       - `updateProject`: `mutation<ProjectResponse, { id: number, body: ProjectRequest }>`
       - `deleteProject`: `mutation<void, number>`
   - **Logic**: Strict Zod validation with nullable/fallback handling and fine-grained tags.

### Phase 3: Verification

3. **Create `app/test/project/page.tsx`**:
   - Build a gallery-style UI to preview projects.
   - Add a form to manage project details.
   - Test status toggling and sort order.
