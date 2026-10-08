# Design Foundation Implementation

## Shared Layout

- `components/layout/page-container.tsx` fills the available width without a maximum-width cap, with `px-4 md:px-6 xl:px-8` edge padding.
- `components/layout/section.tsx` composes that boundary with the standard section rhythm: `py-16 md:py-24`.
- `components/layout/page-header.tsx` composes HeroUI Typography with optional descriptions, metadata and actions. It renders an H1 and belongs at page level.
- Layout components do not add a second `main` landmark. The app shell owns `#main-content`.

Home content sections and their dynamic loading placeholders share the same boundary. The reading page uses that boundary while separately constraining the article to `max-w-3xl`. The dashboard uses the same container without adopting the home's display scale.

Full-width page boundaries are the product's intentional exception to the bounded-container recommendation in `layout.md`. Navigation and footer also fill the viewport; compact navigation and individual text/media reading measures remain content-specific constraints, not page caps.

The home hero reserves 90dvh as a narrative layout exception so the following content can begin within the first viewport when content height permits. It may grow naturally on small screens or with long translations.

## Responsive Content Density

Home sections use Tailwind named inline-size containers (`@container/home-section`). Shared Tailwind class constants in `components/home/layout.ts` use an 18rem minimum card width with `gap-4`, adding columns as available space grows instead of stretching a fixed three-column layout. All layout and visibility rules use Tailwind utilities and container-query variants, with no custom CSS rules.

Project and friend-link previews keep up to 12 real entries available. Container queries show 3 entries in a single column, then 4/6/8/10/12 entries as the layout gains columns. The full-list links remain available at every size. Navigation destinations are never hidden by preview limits. Gallery previews use the available photos only, with no duplicated entries to fill space.

The article carousel requests up to 12 entries and shows 1 through 6 cards at once using the same container thresholds (37/56/75/94/113rem). It retains manual navigation to remaining slides without looping duplicate content. Dynamic placeholders and API-loading skeletons use the same grid rules. Presentation is CSS-driven; resizing does not refetch data or depend on `window.innerWidth`.

Existing moments masonry uses approximately 20rem columns and continues to add columns on wider screens.

## Reading And Themes

The article prose uses HeroUI `Typography.Prose`. Tailwind descendant variants extend heading spacing and paragraph rhythm; `odyssey-article-prose` is only a test hook. This does not style editor toolbars or create a parallel typography system.

Existing CSS files remain unchanged. New presentation rules must be expressed through Tailwind utilities rather than custom CSS selectors or declarations.

## Motion

Shared page/section entrance presets default to 280ms and 12px travel. Explicit narrative timing remains possible at the call site. Reduced motion removes both duration and delay.

## Verification

For an isolated local preview alongside an existing dev server, use `NEXT_DIST_DIR=.next-design bun run dev -- --port 3100`. The default build directory remains `.next`.

`tests/e2e/design-foundation.spec.ts` covers shared home boundaries, skip-link keyboard access, mobile overflow, reading width and prose rhythm. It captures desktop/mobile screenshots across theme variants and modes. Existing article and home tests cover the surrounding workflows.

This is the initial foundation migration, not a complete site-wide redesign. Remaining routes, experimental visual modules and module-specific motion should migrate incrementally after their behavior and exceptions have been reviewed.

## Collection Pages

The projects and friend-links routes now use the shared full-width PageContainer and edge padding, preserving their existing header, controls, list and supporting sections. Embedded friend links do not create a second page container or introduce additional padding.

Project grids use a 22rem minimum track width; friend-link grids use 18rem. Both use Tailwind `auto-fill` grids so wider screens gain columns while sparse lists and search results retain normal card proportions instead of expanding a single card across the page. Loading skeletons use the same track definitions. Project cover-image size hints follow the responsive density.

`tests/e2e/collection-density.spec.ts` checks both routes at 390, 820, 1440, 1920 and 2560px: full-width boundaries, increasing column counts, horizontal overflow, sparse search results, empty-result recovery and no extra API requests on resize. The existing friend-link chrome tests cover the application section and narrow-screen search.

## Article Taxonomy

Category and tag directories and their detail routes use PageContainer with the same full-width boundaries and edge padding as the other migrated pages. Back links, article counts, filtering, eight-item pagination and API contracts are unchanged.

`app/(main)/single/components/grid-classes.ts` defines Tailwind auto-fill grids for taxonomy entries (18rem minimum tracks) and essays (22rem). Loading placeholders reuse the corresponding grid. EssayGrid also serves existing year, month and reading-list routes, so it adapts to their available content width without changing their page containers. Sparse results keep normal card widths. Long taxonomy labels and essay titles wrap inside their links rather than overlapping adjacent cards.

`tests/e2e/taxonomy-design.spec.ts` covers category and tag navigation, five viewport widths, long unbroken labels, sparse results, pagination, no resize-triggered refetch, loading, API failures and retry to an empty state.

## Journal Editorial Redesign

The journal is an editorial index rather than a dashboard or a marketing landing page. Its existing routes, article links, topic selection, bookmarks and URL-driven search remain intact. The redesign changes composition, not just container width:

- A visible Journal heading and description establish the page, with quiet links to topics, authors and the archive.
- The opening pairs one prominent cover story with two smaller, text-led recommendations. Summaries are visible rather than available only on hover. Cover images come from article data; missing covers remain text-led, without fabricated imagery.
- Search and topic filters form an unframed, full-width toolbar. Search hides the editorial opening and supplementary columns so results take priority. No-match copy differs from an empty publication, and reset clears the query, category and page together.
- Latest articles use transparent HeroUI Cards, restrained top rules, larger titles, readable summaries and optional thumbnails. Tailwind auto-fill tracks increase density with available space. The API requests 12 articles per page; pagination sits below the whole grid rather than occupying one of its tracks.
- Continue reading and columns follow the latest results. Discovery occupies a quiet, unframed rail on desktop and follows the article content on mobile. An absent rail does not reserve an empty column.
- Featured media has stable responsive heights. Overlaid titles remain white in all themes, with a dark scrim for readability. Section entrances use 280ms, 12px movement and reduced-motion support; column autoplay is disabled for reduced motion.

`tests/e2e/journal-redesign.spec.ts` covers hierarchy and media loading at 390, 820, 1440, 1920 and 2560px, text bounds, pagination placement, column switching, no-match recovery, later pages, all theme variants and text-only recommendations with standard motion. `tests/e2e/journal.spec.ts` retains the existing search, URL restoration, authentication and bookmark regression coverage. Screenshots are generated for desktop/mobile and theme states; geometry and computed-style assertions provide automated layout checks.
