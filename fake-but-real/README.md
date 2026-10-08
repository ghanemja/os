# fake-but-real

Believable, seedable placeholder data that isn't lorem ipsum. People with names from many cultures, companies, job titles, products with prices, fictional addresses, short bios and product reviews. Same seed, same data, every time.

- Zero dependencies, one file, Node 18+ and browsers
- Seeded PRNG (mulberry32), so screenshots, fixtures and snapshot tests stay stable
- Safe by design: emails use the reserved `example.com` / `example.org` / `example.net` domains, phone numbers use the `555-0100` to `555-0199` range set aside for fiction
- Hand-written word lists, TypeScript types included

## Install

```sh
npm install fake-but-real
```

## Usage

```js
import { createFaker } from 'fake-but-real';

const fake = createFaker(42); // number or string seed

fake.person();
// {
//   firstName: 'Meera', lastName: 'Joshi', fullName: 'Meera Joshi',
//   email: 'meera.joshi@example.org', username: 'meeraj66',
//   phone: '(773) 555-0147'
// }

fake.company();   // 'Quarry Health'
fake.jobTitle();  // 'Senior Marketing Coordinator'
fake.product();   // { name: 'Classic Plant Pot', price: 28.99, currency: 'USD' }
fake.address();   // { street: '8289 Juniper Way', city: 'Fairfield', region: 'Colorado',
                  //   regionCode: 'CO', postalCode: '80519', country: 'United States',
                  //   full: '8289 Juniper Way, Fairfield, CO 80519' }
fake.bio();       // 'Priya has spent the last 5 years as a security strategist. Most weekends ...'
fake.review();    // { rating: 5, title: 'Exceeded expectations', text: '...', author: 'Hamza Karam' }
fake.dateRange(); // { start: Date, end: Date, days: 29 }
```

Build a whole list of users for a mockup:

```js
const fake = createFaker('team-page');
const team = Array.from({ length: 12 }, () => {
  const p = fake.person();
  return { ...p, title: fake.jobTitle(), bio: fake.bio({ firstName: p.firstName }) };
});
```

## API

### `createFaker(seed?)`

Returns a faker whose every call draws from one seeded random stream. `seed` may be a number or a string (default `1`). Two fakers created with the same seed return the same values when you call the same methods in the same order.

### People

| Method | Returns |
| --- | --- |
| `firstName()` / `lastName()` / `fullName()` | `string`. A full name keeps first and last name from the same culture. |
| `person()` | `{ firstName, lastName, fullName, email, username, phone }` with email and username derived from the name |
| `email(first?, last?)` | e.g. `amara.okafor@example.com` |
| `username(first?, last?)` | e.g. `amara.okafor`, `tide_amara`, `amarao42` |
| `phone()` | e.g. `(415) 555-0123` |

### Business

| Method | Returns |
| --- | --- |
| `company()` | e.g. `Northbridge Analytics` |
| `jobTitle()` | e.g. `Lead Platform Engineer` |
| `product()` | `{ name, price, currency }`, prices within a sensible range for the item, ending in `.99` |

### Places

| Method | Returns |
| --- | --- |
| `city()` | invented, real-sounding city, e.g. `Port Ashford` |
| `address()` | `{ street, city, region, regionCode, postalCode, country, full }` |

### Text

| Method | Returns |
| --- | --- |
| `bio(person?)` | two or three sentences built from templates. Pass `{ firstName, jobTitle, company, city }` to fix any part. |
| `review({ rating? })` | `{ rating, title, text, author }`. Ratings lean positive like real stores; pass `rating` (1-5) to force one. |

### Dates

| Method | Returns |
| --- | --- |
| `date({ from?, to? })` | a `Date` between `from` and `to` (default: the year before 2026-01-01). Accepts `Date`, ISO strings or timestamps. |
| `dateRange({ from?, to?, minDays = 1, maxDays = 30 })` | `{ start, end, days }` |

### Helpers

| Method | Returns |
| --- | --- |
| `random()` | float in `[0, 1)` |
| `int(min, max)` | integer in `[min, max]`; `int(n)` means `[0, n]` |
| `float(min = 0, max = 1, decimals = 2)` | rounded float |
| `bool(probability = 0.5)` | boolean |
| `pick(array)` | one item |
| `shuffle(array)` | a shuffled copy (input is not mutated) |
| `sample(array, n)` | `n` distinct items |

## License

MIT (c) 2026 ghanemja. See [LICENSE](LICENSE).
