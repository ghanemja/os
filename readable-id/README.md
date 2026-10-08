# readable-id

Friendly IDs like `brave-otter-42`. Good for room names, preview deployments, invite codes, temporary file names and anywhere a UUID is too unfriendly to read aloud.

- Zero dependencies, one file, Node 18+ and browsers
- Over 240 adjectives and 250 nouns, hand-picked to be inoffensive
- Uses `crypto.getRandomValues` (with rejection sampling, so no modulo bias) when available
- Helpers to tell you how many IDs exist and how likely a collision is
- TypeScript types included

## Install

```sh
npm install readable-id
```

## Usage

```js
import { readableId, isReadableId, combinations, collisionProbability } from 'readable-id';

readableId();                                   // 'brave-otter-42'
readableId({ words: 3 });                       // 'misty-gentle-heron-07'
readableId({ separator: '_', digits: 4 });      // 'lucky_comet_3810'
readableId({ number: false });                  // 'quiet-maple'

isReadableId('brave-otter-42');                 // true
isReadableId('brave-otter');                    // false (number expected)

combinations();                                 // 6374400
collisionProbability(1000);                     // ~0.075 (7.5% chance of any duplicate in 1000 IDs)
collisionProbability(1000, { words: 3, digits: 3 }); // ~0.00003
```

Not enough room? Every extra adjective multiplies the space by about 250 and every extra digit by 10. If you need guaranteed uniqueness, check new IDs against the ones you already have.

## API

### Options

All functions take the same options object.

| Option | Default | Description |
| --- | --- | --- |
| `separator` | `'-'` | String between parts |
| `words` | `2` | Total number of words. The last is a noun, the rest are adjectives. |
| `number` | `true` | Append a number |
| `digits` | `2` | Digits in the number (1-15), zero-padded, so `07` is possible |
| `random` | crypto | A function returning a float in `[0, 1)`. Pass a seeded PRNG for reproducible IDs. |
| `adjectives` | built-in | Your own adjective list |
| `nouns` | built-in | Your own noun list |

### `readableId(options?) → string`

Generates one ID.

### `isReadableId(id, options?) → boolean`

`true` if `id` has exactly the shape `readableId(options)` produces and every word is in the word lists. It needs a non-empty `separator`.

### `combinations(options?) → number`

How many distinct IDs the options can produce: `adjectives^(words-1) × nouns × 10^digits`.

### `collisionProbability(count, options?) → number`

Probability (0 to 1) that at least two of `count` independently generated IDs are equal, using the birthday approximation `1 - e^(-n(n-1) / 2N)`.

### `adjectives`, `nouns`

The built-in word lists, all lowercase `a-z`. Extend them with spread syntax:

```js
import { readableId, nouns } from 'readable-id';
readableId({ nouns: [...nouns, 'capybara'] });
```

## License

MIT (c) 2026 ghanemja. See [LICENSE](LICENSE).
