# Journal index redesign (JOURNAL-20261122)

Status `READY_FOR_REVIEW`. Source `feature/article-index-redesign` from `989143d4` on `main`.

## Design and scope

The production opening spent most of the first screen on a shader fallback. On a phone a reader had to pass the feature before reaching search and the dated list. The selected design gives the lead and two recommendations a compact opening, places search and topic selection near the heading, and follows it with a single chronological list. The existing articles supply the titles, summaries and optional covers.

The stacked-cover alternative gave featured media more space but depended on artwork across the catalogue. The selected composition works with text-only articles. Desktop reserves space for authored media beside the lead. On narrow screens the lead is textual and the latest rows stack their dates above their titles.

- Use HeroUI OSS and Pro primitives for cards, type, links, filters, actions, pagination, feedback, column selection and archive disclosure. Use semantic page elements and Tailwind for layout.
- Keep `/single`, `q`, `category`, `page`, article links, saving, copying and reading continuation available. Preserve client navigation and the published digest API.
- Display loading, failure and no-match feedback. Loading secondary discovery near the end of the list limits requests in the opening view.
- Roll back through a revert and the standard immutable-image deployment workflow. No migrations or dependency updates are needed.

## Visual checks

- The responsive toolbar and tighter highlights bring Latest and its first title into the 390 × 844 px live-data preview. The toolbar preserves its size while facets load.
- The English fixture exposed overlapping lines in long highlighted titles. The title defines font size and line height together. Playwright checks the line-height ratio and article bounds from 320 to 2560 px.
- Measured contrast exposed low contrast for dates and excerpts in several light themes. These labels use the HeroUI foreground token, and the browser check measures titles, excerpts and dates against their rendered surfaces.
- Real site preview and fixtures are kept separate. Browser journeys cover query and topic transitions, reset, paging, client navigation, copy feedback, guest sign-in, save/remove and retry, columns and archive disclosure.

## Local verification

| Check                                                                       | Result                                                                                                                                          |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run preflight`                                                         | Formatting, lint, types and 454 unit tests passed.                                                                                              |
| `bun run build`                                                             | The production build completed and served server-rendered highlights and article rows.                                                          |
| Playwright against the production build                                     | 16 targeted cases passed across `journal-redesign.spec.ts`, `journal.spec.ts` and the article card journeys in `consolidated-journeys.spec.ts`. |
| `bun run test:e2e:smoke`                                                    | 15 cases passed, including the article reader, Chronicle, authentication and a mobile reader.                                                   |
| `OPENAPI_FILE=contracts/nexus-openapi.operations.json bun run api:coverage` | All 319 frontend operations matched the pinned contract.                                                                                        |

The AI review checked query and pagination state, route navigation, the shared action menu, theme tokens, loading and mobile overflow against `989143d4`. Signed-in writes were exercised on Playwright fixtures. The production smoke uses public journeys.

## Production follow-up

The first production smoke found a hydration mismatch on the lead's date. Nexus returned `2026-10-13T04:43:43` with no offset. The server rendered October 13 and the Asia/Shanghai browser rendered October 12 because JavaScript parsed the value in the runtime's local time zone before formatting it in UTC. The journal uses the shared API timestamp parser to handle offset-free timestamps consistently and retain explicit offsets. Browser coverage uses a timestamp with the production format and checks the displayed date and page errors in Asia/Shanghai.
