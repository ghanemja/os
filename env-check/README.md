# env-check

Validate environment variables at startup. Describe what your app needs once, get a typed config object back, and when something is wrong see **every** problem at once in a readable table instead of crashing on the first one.

- Zero dependencies, one file, Node 18+
- Types: `string`, `number`, `integer`, `boolean`, `url`, `email`, `port`, `enum`, `json`
- Built-in `.env` parser (quotes, comments, `export`, multiline values, escapes), no `dotenv` needed
- CLI for CI and deploy scripts, plus `.env.example` generation
- Secret-looking values are never printed in errors
- TypeScript types infer the config shape from your schema

## Install

```sh
npm install env-check
```

## Usage

```js
import { checkEnv } from 'env-check';

const config = checkEnv(
  {
    PORT: { type: 'port', default: 3000 },
    DATABASE_URL: { type: 'url', required: true, description: 'Postgres connection string' },
    MODE: { type: 'enum', values: ['dev', 'prod'], default: 'dev' },
    DEBUG: { type: 'boolean', default: false },
    WORKERS: { type: 'integer', min: 1, max: 32, default: 4 },
  },
  { dotenvPath: '.env', exit: true },
);

config.PORT;    // 3000 (a number)
config.DEBUG;   // false (a boolean)
```

When the environment is wrong you get all of it at once:

```
env-check: 4 problems with environment variables

  VARIABLE      TYPE              PROBLEM
  ------------  ----------------  -------
  PORT          port              "99999" is not a valid port (1-65535)
  DATABASE_URL  url               is required but not set (Postgres connection string)
  MODE          enum: dev | prod  "staging" is not one of: dev, prod
  API_TOKEN     string            is required but not set
```

## CLI

Put the schema in `env.schema.json`:

```json
{
  "PORT": { "type": "port", "default": 3000 },
  "DATABASE_URL": { "type": "url", "required": true, "description": "Postgres connection string" },
  "MODE": { "type": "enum", "values": ["dev", "prod"] }
}
```

```sh
npx env-check                    # checks process.env + .env against env.schema.json
npx env-check --env .env.prod    # use another .env file
npx env-check --no-dotenv        # real environment only (CI)
npx env-check --example          # write .env.example from the schema
npx env-check --example -        # print it instead
```

| Option | Description |
| --- | --- |
| `-s, --schema <file>` | Schema file (default `env.schema.json`) |
| `-e, --env <file>` | `.env` file to read (default `.env`, skipped if missing) |
| `--no-dotenv` | Ignore `.env` files |
| `--example [file]` | Write a `.env.example` (default `.env.example`, `-` for stdout) |
| `-q, --quiet` | No output on success |
| `-h, --help` | Help |

Exit codes: `0` valid, `1` invalid variables, `2` usage or schema error. Keys starting with `$` (like `"$schema"`) are ignored.

Generated `.env.example`:

```sh
# port, optional, default: 3000
PORT=3000

# Postgres connection string
# url, required
DATABASE_URL=
```

## API

### `checkEnv(schema, options?) → config`

Validates and returns an object with one entry per schema key.

| Option | Default | Description |
| --- | --- | --- |
| `env` | `process.env` | The variables to check |
| `dotenvPath` | none | Also read this `.env` file. Values already in `env` win. A missing file is ignored. |
| `exit` | `false` | On failure, print the table to stderr and `process.exit(1)`. Otherwise an `EnvCheckError` is thrown with the table as its message and the list in `err.errors`. |

### Schema entries

| Field | Description |
| --- | --- |
| `type` | One of the types below (required) |
| `required` | Fail when the variable is missing or empty. Default `false`. |
| `default` | Used when missing or empty. String defaults are parsed with the type (`default: '80'` on a port gives `80`). |
| `values` | Allowed values for `enum` |
| `min`, `max` | Bounds for `number` and `integer` |
| `description` | Shown in errors and in `.env.example` |
| `example` | Value written to `.env.example` (falls back to `default`) |
| `secret` | Never show the received value in errors. On by default for names containing `SECRET`, `TOKEN`, `PASSWORD`, `PRIVATE`, `API_KEY` or `CREDENTIAL`. |

An empty string counts as missing. Optional variables without a default come back as `undefined`.

| Type | Accepts | Returns |
| --- | --- | --- |
| `string` | anything | `string` |
| `number` | any finite number (`3.5`, `-2`, `1e3`) | `number` |
| `integer` | whole numbers only | `number` |
| `boolean` | `true/false`, `1/0`, `yes/no`, `on/off`, `y/n` (any case) | `boolean` |
| `url` | `scheme://...` that `new URL()` accepts | `string` |
| `email` | `name@domain.tld` | `string` |
| `port` | integer 1-65535 | `number` |
| `enum` | one of `values` (case-sensitive) | `string` |
| `json` | valid JSON | parsed value |

### Other exports

- `validateEnv(schema, env?) → { config, errors }` — same checks, never throws for bad values.
- `formatErrors(errors) → string` — the table shown above.
- `parseDotenv(text) → object` — parse `.env` contents.
- `loadDotenv(path = '.env') → object` — read and parse a file, `{}` if missing.
- `generateExample(schema) → string` — `.env.example` contents.
- `EnvCheckError` — has `errors: { key, type, message, value?, description? }[]`.

### `.env` format

```sh
# comments and blank lines are ignored
export NAME=value            # `export` prefix is allowed
PLAIN=hello world # comment  # unquoted: trimmed, ` #` starts a comment
COLOR=#ff0000                # `#` without a space before it is kept
SINGLE='no $escapes \n here' # single quotes and backticks are literal
DOUBLE="tab\there\nnewline"  # double quotes understand \n \r \t \" \\
PEM="-----BEGIN KEY-----
multiline values work in quotes
-----END KEY-----"
```

Later duplicates win. Variable expansion (`${OTHER}`) is intentionally not supported.

## License

MIT (c) 2026 ghanemja. See [LICENSE](LICENSE).
