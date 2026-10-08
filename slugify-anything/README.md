# slugify-anything

URL slugs that survive emoji, accents and non-Latin scripts. Zero dependencies, one file.

```js
slugify('Crème brûlée & café');     // "creme-brulee-and-cafe"
slugify('Москва, Ёжик');            // "moskva-yozhik"
slugify('Αθήνα');                   // "athina"
slugify('I ❤️ NY 🚀');              // "i-heart-ny-rocket"
slugify('Straße Łódź Ærø');         // "strasse-lodz-aero"
slugify('東京タワー');               // "東京タワー"
```

## Install

```sh
npm install slugify-anything
```

Works in Node 18+ and modern browsers (needs Unicode property escapes in regular expressions).

## Usage

```js
import { slugify } from 'slugify-anything';

slugify('Hello World!');                                  // "hello-world"
slugify('Hello World', { separator: '_' });               // "hello_world"
slugify('Hello World', { lowercase: false });             // "Hello-World"
slugify('The quick brown fox jumps', { maxLength: 16 });  // "the-quick-brown"
slugify('Müller', { locale: 'de' });                      // "mueller"
slugify('Київ', { locale: 'uk' });                        // "kyyiv"
slugify('Launch 🚀', { emoji: false });                   // "launch"
slugify('C++ & C#', { custom: { 'C++': 'cpp', 'C#': 'csharp' } }); // "cpp-and-csharp"
slugify('東京 Tower', { unicode: 'drop' });                // "tower"
```

## API

### `slugify(input, options?) => string`

`input` is converted with `String()`; `null` and `undefined` give `''`.

| Option      | Default  | Description |
|-------------|----------|-------------|
| `separator` | `'-'`    | Placed between words. Can be empty or several characters. |
| `lowercase` | `true`   | Lowercase the result. With `locale` set, lowercasing is locale-aware (Turkish `I` becomes `i`). |
| `maxLength` | `0`      | Maximum length in code points (`0` = unlimited). Whole words are kept; the slug is cut at the last separator that fits. If the first word alone is too long, it is hard-cut. |
| `emoji`     | `true`   | `true` replaces known emoji with names (`🔥` → `fire`) and flags with `flag-xx` (`🇩🇪` → `flag-de`). `false` drops all emoji. |
| `custom`    | none     | Your own replacements, as `{ from: to }` or `[[from, to], ...]`. Applied first, so they override the built-in rules. Longest match wins. Raw replacement: add spaces (`' and '`) if the result should be its own word. |
| `locale`    | none     | Language-specific transliteration (see below) and locale-aware lowercasing. |
| `unicode`   | `'keep'` | What to do with letters that have no transliteration (see below): `'keep'` or `'drop'`. |

### `EMOJI`

The built-in emoji → name table (300+ entries), exported in case you want to inspect or extend it.

## What happens to the input

1. **Custom replacements** from `custom`.
2. **Emoji.** Variation selectors, keycap marks and skin-tone modifiers are removed, known emoji
   (including ZWJ sequences like 👨‍💻 and 🏳️‍🌈) become their names, and regional-indicator pairs become
   `flag-` plus the two-letter region code. Unknown emoji are dropped.
3. **Transliteration.**
   - **Latin extended:** `ß`→`ss`, `æ`→`ae`, `œ`→`oe`, `ø`→`o`, `ł`→`l`, `đ`/`ð`→`d`, `þ`→`th`, `ħ`→`h`, `ı`→`i`, `ŋ`→`ng`, `ə`→`e` and more.
   - **Greek:** `θ`→`th`, `χ`→`ch`, `ψ`→`ps`, `η`→`i`, `υ`→`y`... Accented vowels lose their accents.
   - **Cyrillic:** Russian, Ukrainian, Belarusian, Serbian and Macedonian letters. `ж`→`zh`, `щ`→`shch`, `ю`→`yu`, `ъ`/`ь` dropped.
   - **Symbols become words:** `&`→`and`, `%`→`percent`, `@`→`at`, `+`→`plus`, `$`→`dollar`, `€`→`euro`, `£`→`pound`, `¥`→`yen`, `©`→`c`, `™`→`tm`, `°`→`deg`, `♥`→`love` and a few more.
   - **Everything else with an accent:** Unicode NFKD decomposition, then accents are stripped from Latin, Greek and Cyrillic letters (`é`→`e`, `ň`→`n`, `ễ`→`e`). NFKD also unfolds ligatures and compatibility forms (`ﬁ`→`fi`, `①`→`1`, full-width `Ａ`→`a`).
   - Multi-letter results keep sensible casing when `lowercase: false`: `Жук`→`Zhuk`, `ЖУК`→`ZHUK`.
4. **Apostrophes inside words are removed** (`don't`→`dont`). Every other run of characters that are not
   letters, numbers or combining marks becomes one separator, with none at the start or end.

### Locale rules

| `locale` | Changes |
|----------|---------|
| `de`     | `ä`→`ae`, `ö`→`oe`, `ü`→`ue` (default is `a`, `o`, `u`) |
| `da`, `nb`, `nn`, `no` | `æ`→`ae`, `ø`→`oe`, `å`→`aa` |
| `uk`     | Ukrainian romanization: `г`→`h`, `и`→`y`, `ї`→`yi`, `є`→`ye` |
| `bg`     | Bulgarian: `щ`→`sht`, `ъ`→`a` |
| `tr` and any other | Locale-aware lowercasing only |

Only the language subtag matters (`de-AT` uses the `de` rules).

### Scripts without transliteration (CJK, Arabic, Hebrew, Thai, Devanagari...)

These have no lossless, context-free romanization, so by default they are **kept as-is**. That is safe:
the slug only ever contains Unicode letters, numbers, combining marks (needed by scripts like Devanagari
and Thai) and the separator, never punctuation, whitespace or URL-reserved characters. Browsers show
such slugs readably and percent-encode them on the wire. Japanese kana with voicing marks and
Korean Hangul are re-composed after NFKD, so they come out unchanged.

If you need pure ASCII, pass `unicode: 'drop'`. Each run of untransliterable characters then acts as a word
break and disappears; a string made only of such characters gives `''`, so have a fallback (an ID, say).

## Tests

```sh
npm test
```

## License

MIT (c) 2026 ghanemja. See [LICENSE](LICENSE).
