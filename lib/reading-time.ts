/**
 * Adult silent-reading rates from Brysbaert (2019): about 238 English words
 * per minute, and about 260 Chinese characters per minute.
 */
const LATIN_WORDS_PER_MINUTE = 238;
const CJK_CHARACTERS_PER_MINUTE = 260;

function cjkCharacters(text: string) {
  return (
    text.match(/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/gu)
      ?.length ?? 0
  );
}

/**
 * Minutes from the counts HeroUI already exposes: `characterCount`, `text`,
 * and `wordCount` on `RichTextEditor` value details and `CharacterCount`.
 */
export function readingMinutesFromCounts(counts: {
  characterCount: number;
  text: string;
  wordCount: number;
}) {
  const text = counts.text.trim();
  if (!text) return 1;

  const cjk = cjkCharacters(text);
  const latinWords = Math.max(0, counts.wordCount - cjk);
  return Math.max(
    1,
    Math.ceil(cjk / CJK_CHARACTERS_PER_MINUTE + latinWords / LATIN_WORDS_PER_MINUTE)
  );
}
