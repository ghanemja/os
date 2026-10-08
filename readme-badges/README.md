# readme-badges

Looks at your project and prints the shields.io badges that fit it. It can also write them into your README.

- **Zero dependencies.** It only reads local files and never makes network calls.
- **It can tell what kind of project it is looking at:** `package.json`, `pyproject.toml`, `setup.cfg`, `Cargo.toml`, `go.mod`, the text of your `LICENSE`, GitHub Actions workflows, the git remote, `.nvmrc` and `Dockerfile`.
- **It updates the README in place.** Badges go between `<!-- badges:start -->` and `<!-- badges:end -->`. If those markers are missing, it adds them under the first heading.

## Install

```sh
npm install -g readme-badges
# or run it without installing
npx readme-badges
```

Requires Node 18 or newer.

## Usage

```sh
readme-badges                      # print badge markdown for the current directory
readme-badges ../my-lib            # ...for another directory
readme-badges --write              # insert/update badges in README.md
readme-badges --style for-the-badge
readme-badges --only license,npm,ci
readme-badges --json               # machine-readable output
```

Example output for a Node package with two workflows:

```md
[![CI](https://github.com/acme/widget/actions/workflows/ci.yml/badge.svg)](https://github.com/acme/widget/actions/workflows/ci.yml)
[![Release](https://github.com/acme/widget/actions/workflows/release.yml/badge.svg)](https://github.com/acme/widget/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@acme/widget)](https://www.npmjs.com/package/@acme/widget)
[![npm downloads](https://img.shields.io/npm/dm/@acme/widget)](https://www.npmjs.com/package/@acme/widget)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acme/widget)](https://bundlephobia.com/package/@acme/widget)
[![install size](https://packagephobia.com/badge?p=@acme/widget)](https://packagephobia.com/result?p=@acme/widget)
[![node >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
```

### What gets detected

| Badge id | Source | Badge |
|---|---|---|
| `ci` | `.github/workflows/*.yml`, plus a GitHub repo | One GitHub Actions status badge per workflow, labelled with the workflow's `name:` |
| `npm`, `downloads` | `package.json` `name` (skipped when `private`) | npm version and monthly downloads |
| `bundlesize`, `installsize` | `package.json` | bundlephobia min+gzip size, packagephobia install size |
| `node` | `package.json` `engines.node` | Static badge showing the engines range |
| `nvmrc` | `.nvmrc` | Static badge showing the pinned Node version |
| `pypi`, `python` | `pyproject.toml` (`[project]` or `[tool.poetry]`) or `setup.cfg` | PyPI version, and `requires-python` / `python_requires` (falls back to PyPI's pyversions badge) |
| `crates`, `docsrs` | `Cargo.toml` `[package] name` | crates.io version and docs.rs status |
| `go`, `goversion` | `go.mod` | pkg.go.dev reference badge and the `go` directive |
| `docker` | `Dockerfile` | The first `FROM` base image |
| `license` | Text of `LICENSE` / `LICENCE` / `COPYING`, or the manifest's `license` field | MIT, Apache-2.0, GPL-2.0/3.0, LGPL, AGPL, BSD-2/3-Clause, ISC, CC0-1.0, MPL-2.0, Unlicense |

The GitHub `owner/repo` comes from the `origin` remote in `.git/config`. It searches parent directories for it and never runs `git`. If that fails, it tries the `repository` field in `package.json`, then a `github.com/...` module path in `go.mod`. If no repo is found, CI badges are left out.

`--style` adds `?style=…` to shields.io URLs. GitHub's own workflow badges ignore it.

## API

```js
import { detect, badges, toMarkdown, updateReadme, writeBadges, detectLicense } from 'readme-badges';

detect('.');                         // { npm, python, rust, go, license, workflows, github, nvmrc, docker }
const list = badges('.', { style: 'flat-square', only: ['npm', 'license'] });
// [{ id, alt, image, link }, ...]
toMarkdown(list);                    // '[![npm version](...)](...)\n...'
updateReadme(readmeText, markdown);  // pure: returns new README text
writeBadges('.', { style: 'flat' }); // { file, badges, changed }
detectLicense(text);                 // 'MIT' | 'Apache-2.0' | ... | null
```

## Development

```sh
npm test
```

Tests run against the fixture projects in `fixtures/`.

## License

MIT © 2026 ghanemja
