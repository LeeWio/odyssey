# Content translations

Articles have a single title, summary, and body. The editor saves the author's
text in the primary fields, and readers see those fields in every interface
language. Existing article translations are ignored by Odyssey and retained
by Nexus when updates omit the translation map.

Categories, tags, and life-list categories store the default Chinese labels in
their primary fields and editor-maintained translations in a `translations` map.

## Editing rules

- English fields are submitted only when an editor provides a non-empty translation.
- Empty translation records are omitted from requests instead of being saved as partial records.
- User-authored articles, comments, moments, and memories are never machine-translated.

## Frontend contract

`components/content-translations/translation-fields.tsx` owns the shared HeroUI
language tabs for taxonomy forms. The API localization layer applies translated
names and descriptions, including taxonomy labels nested in article responses.
