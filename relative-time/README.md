# relative-time

"3 minutes ago" in any language. A tiny wrapper around
[`Intl.RelativeTimeFormat`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat)
that picks the right unit for you, handles past and future dates, and has zero dependencies.

**Size:** about 0.9 KB minified, about 600 bytes minified + gzipped. The source is a single ~50-line file.

## Install

```sh
npm install relative-time
```

Works in Node 18+ and every modern browser (anything with `Intl.RelativeTimeFormat`).

## Usage

```js
import { relativeTime, createFormatter } from 'relative-time';

relativeTime(Date.now() - 3 * 60 * 1000);            // "3 minutes ago"
relativeTime(Date.now() + 2 * 86400 * 1000);         // "in 2 days"
relativeTime(Date.now() - 86400 * 1000);             // "yesterday"
relativeTime('2026-01-01T00:00:00Z', { now: '2026-03-01T00:00:00Z' }); // "2 months ago"

relativeTime(Date.now() - 86400 * 1000, { locale: 'de' });                      // "gestern"
relativeTime(Date.now() - 86400 * 1000, { locale: 'de', numeric: 'always' });   // "vor 1 Tag"
relativeTime(Date.now() - 3 * 60 * 1000, { locale: 'ja' });                     // "3 分前"
relativeTime(Date.now() + 2 * 3600 * 1000, { locale: 'en', style: 'short' });   // "in 2 hr."

// Reuse options (the underlying Intl formatter is cached either way)
const ago = createFormatter({ locale: 'fr' });
ago(Date.now() - 2 * 3600 * 1000);                    // "il y a 2 heures"
ago(Date.now() - 2 * 3600 * 1000, { style: 'short' }); // per-call overrides
```

## API

### `relativeTime(date, options?) => string`

`date` can be a `Date`, a millisecond timestamp, or any string `Date.parse` accepts (such as ISO 8601).
Invalid input throws a `TypeError`.

| Option    | Default       | Description |
|-----------|---------------|-------------|
| `now`     | `Date.now()`  | Reference time (`Date`, number or string). |
| `locale`  | runtime default | BCP 47 tag or list of tags, e.g. `'en'`, `'pt-BR'`, `['fr-CA', 'fr']`. |
| `style`   | `'long'`      | `'long'`, `'short'` or `'narrow'`. |
| `numeric` | `'auto'`      | `'auto'` gives "yesterday" / "next week"; `'always'` gives "1 day ago" / "in 1 week". |

### `createFormatter(defaults?) => (date, options?) => string`

Returns a function with `defaults` baked in. Options passed per call override the defaults.

### `selectUnit(seconds) => { value, unit }`

The unit picker on its own, if you want to format the result yourself.
`seconds` is `date - now` in seconds (negative means the past).

## How the unit is chosen

The difference is rounded (half away from zero, so past and future behave the same) in each unit
from smallest to largest, and the first unit whose rounded value is below its limit wins:

| Unit   | Used while rounded value is below | So in practice |
|--------|----------------------------------|----------------|
| second | 60  | under 59.5 seconds |
| minute | 60  | under 59.5 minutes |
| hour   | 24  | under 23.5 hours |
| day    | 7   | under 6.5 days |
| week   | 4   | under 3.5 weeks (24.5 days) |
| month  | 12  | under 11.5 months (a month is 30.4375 days) |
| year   | -   | everything else (a year is 365.25 days) |

A difference that rounds to zero is formatted as `0 seconds`, which is "now" with `numeric: 'auto'`.

## Tests

```sh
npm test
```

## License

MIT (c) 2026 ghanemja. See [LICENSE](LICENSE).
