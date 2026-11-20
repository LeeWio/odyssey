# Content translations

Odyssey stores the default Chinese content in the resource's primary fields and
editor-maintained translations in the explicit `translations` map. The admin
editor exposes Chinese and English as separate editing states so title,
summary, and rich-text content cannot be accidentally mixed.

## Editing rules

- Chinese is the source field for articles, categories, tags, and life-list categories.
- English fields are submitted only when an editor provides a non-empty translation.
- Article translations keep their own Tiptap JSON document in `translations[locale].content`.
- Empty translation records are omitted from requests instead of being saved as partial records.
- User-authored articles, comments, moments, and memories are never machine-translated.

## Frontend contract

`components/content-translations/translation-fields.tsx` owns the shared HeroUI language
tabs and field composition. Feature contracts preserve the API translation maps
so admin forms can load existing values and submit them without a compatibility
layer.
