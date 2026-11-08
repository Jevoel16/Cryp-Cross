# Architecture notes

The reasoning behind decisions that are too long for a one-line code comment. Code comments link here by section.

## Serverless startup

`api/index.js` is the Vercel function for `/api/*`. Warm invocations reuse the module, so the MongoDB connection and the Express app are built once per instance. The app is created only after MongoDB connects, because the session store and the rate-limit store pick MongoDB only when the connection is already open (otherwise they fall back to memory).

## Proxies

`TRUST_PROXY` is the number of proxy hops to trust for the client IP and protocol. Without it, behind a proxy every player shares the proxy's IP (one rate-limit bucket) and https requests look like http, which breaks the same-origin check in the CSRF guard. Vercel sets `VERCEL=1` and always sits in front of the function, so the default there is `1`.

## CSRF

Writes are authenticated by the session cookie, so `server/app.js` guards them:

- The browser always sends `Origin` on cross-site POSTs, so a foreign `Origin` is refused.
- Writes must have a JSON body. Plain HTML form posts can't send `application/json` without a CORS preflight.
- Same-origin requests (the site and `/api` on one host) are always allowed. A page on another site can't make the browser send this `Host` together with this `Origin`, so it isn't CSRF. This keeps a newly added custom domain working before `CORS_ORIGINS` lists it.

## Rate limits

Counters live in MongoDB (`server/lib/rateLimitStore.js`). On serverless hosts each instance has its own memory, so the default in-memory store would let attackers spread requests across instances; a shared store gives one limit per client.

GitHub/Google sign-in has its own, looser budget (`OAUTH_RATE_LIMIT`). Each attempt costs two requests (start and callback) and no password can be guessed through it, so sharing the login budget locked players out after a few retries. Browsers reach these routes by navigation, so going over the limit sends them back to the login page with a message instead of a raw JSON error.

## OAuth host

The provider redirects to the callback's host, and the session cookie that holds `state` only exists on the host where sign-in started. When the site is also served on another domain (for example `*.vercel.app` beside a custom domain), sign-in first restarts on the callback's host. The target comes from environment variables only, so this is not an open redirect.

## Solve timer

The attempt (and its timer) is created only when a signed-in player opens today's puzzle with `GET /api/puzzles/today/progress`. If saving, checking or submitting could create it too, a pre-solved grid could be submitted as the very first request with a near-zero time. Solves faster than `MIN_SOLVE_SECONDS` are refused, and the puzzle seed is `HMAC(PUZZLE_SECRET, date)` so future puzzles can't be worked out from the public source.

## Puzzle generator

`server/puzzle/generate.js` places words one by one. A placement must stay on the board, match the letters it crosses, leave the cells just before and after the word empty, and never run side by side with a parallel word (that would create unclued letter runs). A placement must cross at least one letter; among legal ones it picks, at random from the seed, one that crosses the most. Generation is deterministic from the seed, so two first requests racing to create a day store the same puzzle; the unique index makes the loser read the winner's copy.

[Back to README](../README.md)
