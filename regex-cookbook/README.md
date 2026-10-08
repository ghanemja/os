# regex-cookbook

34 regular expressions for everyday jobs such as emails, URLs, IPs, UUIDs, semver, dates, postcodes, JWTs, cron and camelCase splitting. Each one has:

- a **piece-by-piece explanation**
- **caveats** that say plainly what it does not handle
- at least four strings it **must match** and four it **must not**, all checked by `npm test`

The patterns are stored as data in [`patterns.js`](patterns.js). The docs in [`COOKBOOK.md`](COOKBOOK.md) and the data in [`index.html`](index.html) are generated from that file. Open `index.html` directly in a browser for a searchable list with a live tester. It needs no server.

## Install

```sh
npm install regex-cookbook
```

There are no dependencies. Node 18 or newer, or any modern browser that supports lookbehind.

## Usage

```js
import { patterns, get, compile, test } from 'regex-cookbook';

get('semver');
// { name, category, pattern, flags, description, explanation, caveats, matches, nonMatches }

compile('uuid').test('123e4567-e89b-12d3-a456-426614174000'); // true
compile('duplicate-words', 'g');                             // a fresh RegExp, extra flags added
test('ipv4', '10.0.0.256');                                  // false

'XMLHttpRequest'.split(compile('camelcase-split'));          // ['XML', 'Http', 'Request']
'a  \nb'.replace(compile('trailing-whitespace', 'g'), '');   // 'a\nb'

patterns.filter((p) => p.category === 'dates').map((p) => p.name);
// ['iso-date', 'iso-datetime', 'time-24h', 'cron-basic']
```

## Patterns

| Category | Patterns |
|---|---|
| Web & markup | email-simple, url, domain, slug, html-tag, markdown-link, hashtag, mention, file-extension |
| Network | ipv4, ipv6, mac-address |
| Identifiers & versions | uuid, semver, git-sha, username, jwt |
| Dates & times | iso-date, iso-datetime, time-24h, cron-basic |
| Locale-specific | us-zip, uk-postcode, phone-e164 |
| Numbers & money | number-thousands, currency, credit-card-shape (Luhn is a separate step), lat-long |
| Colors, encodings & passwords | hex-color, base64, strong-password |
| Text editing | trailing-whitespace, duplicate-words, camelcase-split |

See [COOKBOOK.md](COOKBOOK.md) for every pattern with its explanation, caveats and examples.

## Entry format

```js
{
  name: 'hex-color',
  category: 'encoding',
  pattern: '^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$', // RegExp source string
  flags: 'i',
  description: 'A CSS hex color in #rgb, #rgba, #rrggbb or #rrggbbaa form.',
  explanation: [['^#', 'a leading hash'], /* [piece, meaning], ... */],
  caveats: ['Named colors, rgb() and hsl() are not covered.'],
  matches: ['#fff', '#FFFFFF', '#1a2b3c', '#ff000080'],
  nonMatches: ['fff', '#ff', '#12345', '#ggg'],
}
```

A case passes when `new RegExp(pattern, flags).test(input)` returns `true` for every `matches` string and `false` for every `nonMatches` string. Validation patterns are anchored with `^…$`. Search patterns (hashtag, mention, html-tag, duplicate-words…) match anywhere in the input.

## Contributing a pattern

1. Add an entry to `patterns.js` with at least 4 `matches` and 4 `nonMatches`. Include the edge cases people get wrong.
2. Run `npm run docs` to regenerate `COOKBOOK.md` and the data in `index.html`.
3. Run `npm test`. It checks every case, checks that the regex literal form is valid, and fails if the generated docs are out of date.

## License

MIT © 2026 ghanemja
