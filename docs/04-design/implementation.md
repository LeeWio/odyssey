# Design Foundation Implementation

## Shared Layout

- `components/layout/page-container.tsx` fills the available width without a maximum-width cap, with `px-4 md:px-6 xl:px-8` edge padding.
- `components/layout/page-frame.tsx` owns route-level rhythm: `min-h-[100dvh]`, the shared navigation offset, and the standard bottom breathing room. Use it for standalone frontend routes; keep the inner `max-w-*` measure on the page when the content needs one.
- `components/layout/section.tsx` composes that boundary with the standard section rhythm: `py-16 md:py-24`.
- `components/layout/page-header.tsx` composes HeroUI Typography with optional descriptions, metadata and actions. It renders an H1 and belongs at page level.
- Layout components do not add a second `main` landmark. The app shell owns `#main-content`.

Home content sections and their dynamic loading placeholders share the same boundary. The reading page uses that boundary while separately constraining the article to `max-w-3xl`. The dashboard uses the same container without adopting the home's display scale.

Full-width page boundaries are the product's intentional exception to the bounded-container recommendation in `layout.md`. Navigation and footer also fill the viewport; compact navigation and individual text/media reading measures remain content-specific constraints, not page caps.

Route pages use one outer rhythm and one inner content measure. Do not combine independent `px-6 sm:px-10`, `py-24 sm:py-32`, and `pt-28 lg:pt-32` shells on the same route. Rich index pages may use a wider `max-w-7xl` measure, while reading and utility views keep their narrower local measure. The Universe remains an intentional dark immersive exception, but it follows the same page-frame geometry.

The home hero uses a bounded `min-h-[min(760px,calc(100dvh-2rem))]` rhythm so it feels like an entrance rather than a full-screen cover. Its only atmospheric visual is a subdued shader background; the content remains text-led and the next section can begin without an oversized blank fold.

The home page now shares section header and content offsets through `components/home/layout.ts`. Exploration is treated as a lightweight route index, while writing, projects, gallery, footprints, moments and friend links keep their feature-specific content surfaces. This keeps the homepage expressive without making every section a competing hero or card wall.

The homepage closing modules keep the same hierarchy: Guestbook is a social action surface with one clear composer control, and FAQ uses local icon glyphs with text-first accordion rows. Decorative gradient headings and remote 3D icon assets are intentionally avoided so the closing sequence stays quiet and readable.

The Lately listening surface follows the same media rule as articles: the track is represented by a static shader field with readable metadata instead of album-cover imagery. Real photography remains reserved for gallery and place-based content where the image itself is the subject.

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

The projects, friend-links and uses routes now use the shared PageFrame for route-level rhythm and a single inner content measure, preserving their existing header, controls, list and supporting sections. Embedded friend links do not create a second page container or introduce additional padding. The Building playground uses the same outer frame so development-only surfaces do not drift from the public navigation geometry.

The projects route uses a directory-first header: the title and description establish the page, while published, preview and source counts form one compact status group. The filter rail is separated by rules rather than another card, and results begin with a single explicit count line. This keeps the page scannable before the user reaches the project grid.

The Uses route follows the same directory-first pattern. Its total tools, category count and linked-tool count sit alongside the page introduction rather than inside a detached statistic card. Search and category filters share one bounded control rail; active filters expose a clear action, while the default state retains the invitation to browse the toolkit.

Project grids use a 22rem minimum track width; friend-link grids use 18rem. Both use Tailwind `auto-fill` grids so wider screens gain columns while sparse lists and search results retain normal card proportions instead of expanding a single card across the page. Loading skeletons use the same track definitions. Project cover-image size hints follow the responsive density.

`tests/e2e/collection-density.spec.ts` checks both routes at 390, 820, 1440, 1920 and 2560px: full-width boundaries, increasing column counts, horizontal overflow, sparse search results, empty-result recovery and no extra API requests on resize. The existing friend-link chrome tests cover the application section and narrow-screen search.

## Article Taxonomy

Category and tag indexes now use HeroUI Card, Typography, Link and NumberValue as editorial directory units rather than anonymous card tiles. Each unit exposes a stable ordinal, prominent linked name, article count and optional description, with a restrained hover cue that reinforces navigation without adding decorative chrome. The existing Tailwind auto-fill grid remains responsible for responsive density, so wide screens add columns while each entry keeps a readable internal measure.

Category and tag directories and their detail routes use PageContainer with the same full-width boundaries and edge padding as the other migrated pages. Back links, article counts, filtering, eight-item pagination and API contracts are unchanged.

`app/(main)/single/components/grid-classes.ts` defines Tailwind auto-fill grids for taxonomy entries (18rem minimum tracks) and essays (22rem). Loading placeholders reuse the corresponding grid. EssayGrid also serves existing year, month and reading-list routes, so it adapts to their available content width without changing their page containers. Sparse results keep normal card widths. Long taxonomy labels and essay titles wrap inside their links rather than overlapping adjacent cards.

`tests/e2e/taxonomy-design.spec.ts` covers category and tag navigation, five viewport widths, long unbroken labels, sparse results, pagination, no resize-triggered refetch, loading, API failures and retry to an empty state.

Explore now shares the full-width PageContainer and uses an editorial page header with a publication count, HeroUI SearchField and TagGroup filters, a date-navigation bridge, Card-based results, EmptyState recovery and Pagination. The result grid adds columns at wider breakpoints while preserving card proportions and the existing URL-driven search and filter contract.

Archive, Columns, Explore and the development-only Explorer now use `PageFrame` for their route shell. Their existing filters, pagination and result measures remain local to each page, while the outer navigation offset, horizontal boundary and bottom rhythm are shared with the other public content routes.

Moments secondary views (liked, saved, topics and month detail) and Journal secondary views (reading lists, year and month archives) use the same route shell. Narrow feeds remain `max-w-3xl`; discovery grids and archive indexes remain `max-w-5xl`, so shared geometry does not erase the intended reading measure.

Library, Guestbook, Notifications, notification preferences, Schedule and Roadmap also use `PageFrame`. Authentication-required empty states remain vertically centered inside the frame; authenticated content keeps its local `max-w-*` measure. This separates route rhythm from feature-specific surfaces such as notification cards, guestbook comments and the agenda canvas.

## Journal Editorial Redesign

The journal is an editorial index rather than a dashboard or a marketing landing page. Its existing routes, article links, topic selection, bookmarks and URL-driven search remain intact. The redesign changes composition, not just container width:

- A visible Journal heading and description establish the page, with quiet links to topics, authors and the archive.
- The opening pairs one prominent shader story with two smaller, text-led recommendations. Summaries are visible rather than available only on hover. Articles do not render cover images; `ArticleCover` provides a deterministic shader visual when a media surface is useful.
- Search and topic filters form an unframed, full-width toolbar. Search hides the editorial opening and supplementary columns so results take priority. No-match copy differs from an empty publication, and reset clears the query, category and page together.
- Latest articles use transparent HeroUI Cards, restrained top rules, larger titles, readable summaries and deterministic shader media where a thumbnail surface is useful. Tailwind auto-fill tracks increase density with available space. The API requests 12 articles per page; pagination sits below the whole grid rather than occupying one of its tracks.
- Continue reading and columns follow the latest results. Discovery occupies a quiet, unframed rail on desktop and follows the article content on mobile. An absent rail does not reserve an empty column.
- Featured media has stable responsive heights. Overlaid titles remain white in all themes, with a dark scrim for readability. Section entrances use 280ms, 12px movement and reduced-motion support; column autoplay is disabled for reduced motion.

`tests/e2e/journal-redesign.spec.ts` covers hierarchy and media loading at 390, 820, 1440, 1920 and 2560px, text bounds, pagination placement, column switching, no-match recovery, later pages, all theme variants and text-only recommendations with standard motion. `tests/e2e/journal.spec.ts` retains the existing search, URL restoration, authentication and bookmark regression coverage. Screenshots are generated for desktop/mobile and theme states; geometry and computed-style assertions provide automated layout checks.

## Columns Directory

The columns index uses the full-width PageContainer with a publication summary, HeroUI SearchField, TagGroup availability filters and Select sorting. A shared Tailwind auto-fill grid uses 22rem tracks for both results and skeletons. Cards show reading availability, essay count and a readable introduction; article cover images are not rendered. Shader media is deterministic and used only where a visual surface improves scanning. Card entrances no longer delay results, and keyboard focus is visible around each complete navigation target.

`tests/e2e/columns-redesign.spec.ts` covers five viewport widths, column density, long names, sparse results, search reset, availability selection, keyboard links, failure recovery and empty publication states. The detail page is intentionally unchanged in this batch.

## Archive Editorial Redesign

Archive is intentionally a timeline directory rather than another article-card grid. The page header now establishes the sequence-reading purpose and surfaces the number of available years. HeroUI Select remains the year control, TagGroup remains the month control, Pagination remains the navigation primitive, and EmptyState owns loading failure and no-content recovery.

The article list keeps a stable date column, readable title and summary column, and a compact views signal on wide screens. On small screens the date moves into the article metadata flow. The page uses the shared full-width PageContainer, with responsive padding and no page-level maximum width. Long titles wrap within their article link, while the timeline remains a single scan-friendly sequence.

`tests/e2e/archive-redesign.spec.ts` checks the new hierarchy, HeroUI period controls, full-width boundaries, ten-item timeline, long-title containment, mobile overflow and keyboard period selection at 390, 820, 1440 and 2560px. Existing `tests/e2e/archive.spec.ts` continues to cover stale-page correction, delayed responses, period changes, failures and URL preservation.
