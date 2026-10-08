# Profile

The public identity is `/persona`. Account settings and the author byline are separate.

## Surfaces

| Surface        | Path                     | What it shows                                             |
| -------------- | ------------------------ | --------------------------------------------------------- |
| Persona        | `/persona`               | Tabs: About, Uses, a recruiter sandbox, and the guestbook |
| About          | `/about`                 | The same About composition, full page                     |
| Uses           | `/uses`                  | Tools in current use. No affiliate links                  |
| Author archive | `/single/authors/{name}` | Published articles for that byline                        |
| Account        | navbar menu              | Sign-in, notifications, reading library, logout           |

`/recruiter` is labeled Demo. It is a sandbox inside Persona, not a public résumé API.

## Data

About and Uses copy lives in the repo (`features/about/about-content.ts`, `features/uses/uses-data.ts`). The guestbook and author archive come from their own APIs. There is no profile document type and no public profile editor.

## Boundary

Changing tools updates `uses-data.ts`. Changing the biography updates About content. Neither change should invent a profile service.
