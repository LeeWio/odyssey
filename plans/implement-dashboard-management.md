# Plan: Implement Dashboard module with Elite Standards

Implementation of the Dashboard (仪表盘) module, focusing on administrative statistics and traffic analysis.

## Objective

- Provide an overview of site-wide statistics (Users, Posts, Comments, Views).
- Deliver real-time traffic analysis (Today vs Yesterday PV/UV, Growth Rates).
- Showcase top visited content.
- Maintain elite standards for type safety and runtime validation.

## Key Files

- `lib/features/api/base-api.ts`: Add `Dashboard` tag.
- `lib/features/dashboard/dashboard-api.ts`: Dashboard endpoints and Zod schemas.
- `lib/features/dashboard/index.ts`: Unified export.
- `app/test/dashboard/page.tsx`: Isolated test page for data visualization.

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

### Phase 3: Verification

3. **Create `app/test/dashboard/page.tsx`**:
   - Display KPI cards for site-wide stats.
   - Visualize traffic growth using HeroUI components.
   - List top performing content.
