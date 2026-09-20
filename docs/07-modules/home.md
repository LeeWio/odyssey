# Home

## Visitor content recovery

Featured writing and Moments distinguish loading, empty results, and failed requests.
A successful empty response hides the optional section. A failed request keeps its
heading and browse link visible and displays a HeroUI Alert with a keyboard-accessible
retry button. An in-flight retry disables the button, and any cached content remains
available. A successful retry replaces the error with the returned content.

The shared error UI contains visitor-facing language only. Transport errors and
backend details are not displayed. Tests mock all API traffic and never publish data.

## Motion preferences and hydration

The home page, navigation, footer, and Hello illustration use
`useReducedMotionPreference`, backed by Mantine's native media-query hook. Both server
rendering and the first browser render default to reduced motion. The hook reads the
browser preference after hydration and subscribes to later changes. This avoids
mismatched markup, styles, and focusability when a visitor has reduced motion enabled.

The Hello SVG renders its completed word before hydration. Its existing SVG animation
runs only when motion is allowed; it stops when the preference changes. Gradient IDs
are unique per instance. The outer blur/scale entrance has been removed so the static
illustration is immediately visible.

The Hello path is an existing custom illustration, with no equivalent HeroUI primitive.
Its SVG path morph and stroke timeline remain a documented exception to the default
Motion stack; the existing CSS gradient animation is decorative and disabled by the
reduced-motion media query. No new animation library is introduced.

## Verification

Browser regressions cover 390px and 1440px viewports, hydration errors and warnings,
visible static artwork, live motion-preference changes, horizontal overflow, keyboard
retry, prevention of duplicate in-flight requests, and successful empty recovery.
Moment formatting regressions also cover the home cards using the same content renderer.
