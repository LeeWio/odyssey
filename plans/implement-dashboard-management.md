# Plan: Implement Dashboard module with Elite Standards

Implementation of the Dashboard (仪表盘) module, focusing on administrative statistics and traffic analysis.

## Objective

- Provide an overview of site-wide statistics (Users, Posts, Comments, Views).
- Deliver real-time traffic analysis (Today vs Yesterday PV/UV, Growth Rates).
- Showcase top visited content.
- **Access Control:** Restrict Dashboard visibility and data access exclusively to users with the `ROLE_ADMIN` role. This restriction must apply to the UI (e.g., hidden in Command Palette/Sidebar for non-admins) and data fetching.
- Utilize rich `HeroUI Pro` components (`kpi`, `kpi-group`, `widget`, `area-chart`, `bar-chart`, `list-view`) to create a modern, polished visualization layout following the 4px/8px grid and semantic design principles.
- Maintain elite standards for type safety and runtime validation.

## Key Files

- `lib/features/api/base-api.ts`: Add `Dashboard` tag.
- `lib/features/dashboard/dashboard-api.ts`: Dashboard endpoints and Zod schemas.
- `lib/features/dashboard/index.ts`: Unified export.
- `app/test/dashboard/page.tsx`: Isolated test page for data visualization.
- `components/command-palette/static-commands.ts`: Update command triggers to enforce `selectIsAdmin` check dynamically or conditionally render commands based on the Redux auth state.

## Implementation Steps

### Phase 1: Infrastructure

1. **Update `baseApi`**: Add `"Dashboard"` to `tagTypes`.

### Phase 2: Dashboard API Development

2. **Create `dashboard-api.ts`**:
   - **Schemas**:
     - `DashboardStatsResponseSchema`: General counts.
     - `AnalyticsOverviewResponseSchema`: Traffic metrics and growth rates.
   - **Endpoints**:
     - `getDashboardStats`: `query<DashboardStatsResponse, void>`
     - `getAnalyticsOverview`: `query<AnalyticsOverviewResponse, void>`
   - **Logic**: Use `transformError` and `rawResponseSchema`.

### Phase 3: Authorization & Visual Integration

3. **Secure UI Triggers**:
   - Ensure that the Dashboard page and any shortcuts leading to it (like inside the Command Palette) verify the user's role via `selectIsAdmin` from `lib/features/auth/auth-slice.ts`.
4. **Create `app/test/dashboard/page.tsx`**:
   - Wrap the component logic to return an "Unauthorized / Access Denied" empty state (using HeroUI `EmptyState`) if the user is not an admin.
   - Display KPI cards for site-wide stats using `KPI` and `KPIGroup`.
   - Visualize traffic growth using `AreaChart` and `BarChart` within `Widget` containers.
   - List top performing content using `ListView` or `DataGrid`.
