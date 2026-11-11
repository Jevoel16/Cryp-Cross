# State machines

Every flow that moves through steps has one status, one place that changes it, and tests for its transitions. A transition that is not in a table is rejected: the state stays as it was (frontend reducers) or the request gets an error (server).

| Machine | Owner | Tests |
|---------|-------|-------|
| [Attempt](#attempt) | `server/lib/attemptStatus.js`, used by `server/services/attempts.js` | `server/test/attemptStatus.test.js`, `server/test/play.test.js` |
| [Session auth](#session-auth) | `server/lib/sessionAuth.js` | `server/test/sessionAuth.test.js` |
| [Sign-in methods](#sign-in-methods) | `server/models/user.js` | `server/test/user.test.js` |
| [Auth session](#auth-session) | `src/auth/authMachine.js` | `src/auth/authMachine.test.js` |
| [Today page](#today-page) | `src/lib/playStatus.js` | `src/lib/playStatus.test.js` |
| [Puzzle player](#puzzle-player) | `src/lib/playerMachine.js` | `src/lib/playerMachine.test.js` |
| [Form submit](#form-submit) | `src/lib/submitMachine.js` | `src/lib/submitMachine.test.js` |
| [Crossword cursor](#crossword-cursor) | `src/hooks/useCrossword.js` | `src/hooks/useCrossword.test.js` |
| [OAuth providers](#oauth-providers) | `src/lib/oauth.js` | `src/lib/oauth.test.js` |

## Attempt

One player's work on one day's puzzle. The status is derived from the stored document (`solvedAt` set means solved), so no stored data changed.

States: `notStarted` (no document), `started`, `solved`.

| From | `open` | `save` | `check` | `solve` |
|------|--------|--------|---------|---------|
| `notStarted` | `started` | rejected (409) | rejected (409) | rejected (409) |
| `started` | `started` | `started` | `started` | `solved` |
| `solved` | `solved` | `solved` (no change) | `solved` (no change) | rejected (409) |

What must stay true:
- Only `GET /api/puzzles/today/progress` (`open`) creates an attempt and starts its timer.
- Every write uses the filter `solvedAt: { $exists: false }`, so the database applies it only while the attempt is unsolved. Two submits at once record one solve; the other gets 409.
- A solved grid, time and check count never change again.

## Session auth

How the current session proved who the player is. `userId`, `authAt` and `authVia` are only ever set together (`signIn`) and cleared together (`signOut`).

States: `anonymous`, `password`, `oauthFresh` (GitHub/Google sign-in in the last 10 minutes), `oauthExpired`.

| From | Password login | GitHub/Google sign-in | 10 minutes pass | Password saved | Logout or stale session |
|------|----------------|-----------------------|-----------------|----------------|-------------------------|
| `anonymous` | `password` | `oauthFresh` | — | — | — |
| `password` | `password` | `oauthFresh` | — | `password` | `anonymous` |
| `oauthFresh` | `password` | `oauthFresh` | `oauthExpired` | `password` | `anonymous` |
| `oauthExpired` | `password` | `oauthFresh` | — | `password` | `anonymous` |

Only `oauthFresh` may set a password without the current one. Saving a password moves the session to `password`, which closes that window. A session becomes stale when the password changed after it signed in.

## Sign-in methods

An account can sign in with a password, GitHub or Google. `signInMethods(user)` lists the ones it has.

| Event | Allowed when |
|-------|--------------|
| Add a method | Always |
| Remove a method | Another method remains (`canRemoveSignInMethod`) |
| Save the account | The list is not empty (checked before every save) |

## Auth session

The browser's view of the session.

States: `loading`, `signedIn` (has `user`), `signedOut`, `error` (has `error`; the first `/api/auth/me` failed).

| From | `loaded` | `failed` | `refreshed` | `setUser` | `loggedOut` |
|------|----------|----------|-------------|-----------|-------------|
| `loading` | `signedIn` or `signedOut` | `error` | `signedIn` or `signedOut` | `signedIn` or `signedOut` | `signedOut` |
| `signedIn` | ignored | ignored | `signedIn` or `signedOut` | `signedIn` or `signedOut` | `signedOut` |
| `signedOut` | ignored | ignored | `signedIn` or `signedOut` | `signedIn` or `signedOut` | `signedOut` |
| `error` | ignored | ignored | `signedIn` or `signedOut` | `signedIn` or `signedOut` | `signedOut` |

What must stay true:
- `loaded` and `failed` only count while `loading`, so a slow first answer cannot undo a login.
- `loggedOut` is sent only after the server ended the session. If logout fails, the player stays `signedIn` and sees why.
- `error` is not `signedOut`: the Account page offers Try again instead of sending the player to the login page.

## Today page

Who is playing today's puzzle. `playStatus()` combines the auth session with the progress request.

States: `authLoading`, `guest`, `loading`, `ready` (has `progress`), `error` (has `error`).

Progress request (`progressReducer`):

| From | `loaded` | `failed` | `retry` |
|------|----------|----------|---------|
| `pending` | `loaded` | `failed` | ignored |
| `loaded` | ignored | ignored | ignored |
| `failed` | ignored | ignored | `pending` |

| Auth session | Progress request | Status | Screen |
|--------------|------------------|--------|--------|
| `loading` | any | `authLoading` | Skeleton |
| no user | any | `guest` | Guest board |
| user | `pending` | `loading` | Skeleton |
| user | `loaded` | `ready` | Ranked board |
| user | `failed` | `error` | Message with Try again |

A signed-in player whose progress failed to load is never shown the guest board, so a solve can't go unranked by accident.

## Puzzle player

Check and Submit on the board.

States: `playing`, `requesting`, `solved` (has `result`).

| From | `request` | `checked` | `notSolved` | `failed` | `solved` |
|------|-----------|-----------|-------------|----------|----------|
| `playing` | `requesting` | ignored | ignored | ignored | ignored |
| `requesting` | ignored | `playing` | `playing` | `playing` | `solved` |
| `solved` | ignored | ignored | ignored | ignored | ignored |

Autosave is tracked beside the phase, not inside it: `saveFailed` sets `saveError` and `saved` clears it, in `playing` and `requesting`. Check and Submit feedback never overwrites a save error, and a grid counts as saved only after the server accepted it.

The guest timer in `localStorage` is read through `guestClockStatus()`: `none`, `running` or `solved`.

## Form submit

Shared by Log in, Username, Password and Connected accounts through `useSubmitState()`.

States: `idle`, `submitting`, `success` (has `message`), `error` (has `message`).

| From | `submit` | `succeeded` | `failed` | `reset` |
|------|----------|-------------|----------|---------|
| `idle` | `submitting` | ignored | ignored | `idle` |
| `submitting` | ignored | `success` | `error` | ignored |
| `success` | `submitting` | ignored | ignored | `idle` |
| `error` | `submitting` | ignored | ignored | `idle` |

A second submit while one is running is ignored, and buttons are disabled in `submitting`. Typed values are kept on `error`.

## Crossword cursor

`useCrossword` is a reducer over `{ board, letters, cursor }`. Its events are `select` (a cell), `selectEntry` (a clue), `key` (letter, Backspace, arrows, Space, Tab) and `setLetters`. Moves that would leave the board or land on a block return the same state. A locked (solved) board ignores typing.

## OAuth providers

The list of sign-in providers is fetched once per page load.

| From | Response | Failure |
|------|----------|---------|
| `loading` | `ready` (has `providers`) | `error` |

`ready` and `error` are final for the page load. The Log in page shows "not set up" only in `ready` with an empty list.

[Back to README](../README.md)
