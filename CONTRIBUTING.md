# Contributing

Thanks for taking a look. Small fixes and ideas are welcome; for anything bigger, open an issue first so we can agree on it.

## Setup

```bash
npm install
npm run dev
```

That starts the API on port 5000 with an in-memory database and the site on http://localhost:3000. More in the [README](README.md#getting-started).

## Branches and commits

- Branch from `main` as `feat/short-description` or `fix/short-description`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/), e.g. `feat: add CSV export` or `fix: keep the timer running after a reload`.
- The version (SemVer) is bumped once per release with `chore: release vX.Y.Z` and a tag, not in normal commits.

## Before you open a pull request

- Run `npm run lint`, `npm run format:check`, `npm test` and `npm test --prefix server`.
- Add a test for every bug fix and every new function with logic.
- Update the README and the matching file in `docs/` with every change.

By contributing you agree that your changes are covered by the project's [license](LICENSE).
