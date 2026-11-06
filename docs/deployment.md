# Deployment

Deploying Cryp-Cross to Vercel, with notes for self-hosting.

The site and the API run in one Vercel project on one origin: `vercel.json` builds the frontend into `build/`, serves it with the security headers, and rewrites `/api/*` to the serverless function `api/index.js`, which runs the same Express app as `server/`. Because both share an origin, the `SameSite=Lax` session cookie works and `VITE_API_URL` stays empty.

1. **Database**: create a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and a database user. Under Network Access allow `0.0.0.0/0` (Vercel functions have no fixed IPs). Copy the connection string.
2. **Sign-in**: create a production GitHub OAuth app and/or Google OAuth client (see [Setting up GitHub and Google sign-in](configuration.md#setting-up-github-and-google-sign-in)). They are the only way to create accounts.
3. **Import**: on [vercel.com](https://vercel.com) choose **Add New > Project** and import `Jevoel16/Cryp-Cross`. Leave the framework preset as **Other**; install, build and output settings come from `vercel.json`.
4. **Environment variables** (Production), with `<site>` = `https://<project>.vercel.app`:

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Atlas connection string |
   | `SESSION_SECRET`, `PUZZLE_SECRET` | two different long random strings, e.g. from `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `APP_URL`, `CORS_ORIGINS`, `VITE_SITE_URL` | `<site>` |
   | `TRUST_PROXY` | `1` |
   | `GITHUB_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET` | at least one pair, from the production OAuth apps |
   | `PUZZLE_TZ`, `MIN_SOLVE_SECONDS`, `AUTH_RATE_LIMIT`, `OAUTH_RATE_LIMIT` | optional |

5. **Deploy**, then register `<site>/api/auth/oauth/github/callback` and `<site>/api/auth/oauth/google/callback` with the OAuth apps.
6. From then on every push to `main` deploys to production, and other branches get preview URLs. Previews have a different origin, so logins there are refused unless you set Preview variables to match.

**Upgrading a 1.x database**: the API drops the old unique email index on startup. Old email + password accounts keep working through username + password login (stored email fields are ignored), and can connect GitHub or Google from the Account page.

**Custom domain** (e.g. `https://cryp-cross.example.dev`): after adding it under Project > Domains,
- set `APP_URL` and `VITE_SITE_URL` to the custom domain, and add it to `CORS_ORIGINS` (comma-separated, keep the `vercel.app` URL if you still use it);
- register `<domain>/api/auth/oauth/github/callback` and `<domain>/api/auth/oauth/google/callback` with the OAuth apps (GitHub allows one callback, so replace it, and update its Homepage URL);
- set the `vercel.app` domain to redirect (308) to the custom domain, so search engines index one copy;
- redeploy: `VITE_SITE_URL` is baked into the build (sitemap, robots, canonical tags), so a new build is needed.

Since v2.0.1 the API accepts writes from its own origin even if `CORS_ORIGINS` doesn't list it, so guest checks and saving keep working on a new domain; sign-in still needs `APP_URL` and the callbacks above. Vercel's free Hobby plan is for non-commercial use, which matches this project's license. Since v2.0.4, a sign-in started on any other domain (such as the old `vercel.app` URL) first moves to the callback host, so the session cookie and the callback always share a host.

**Analytics**: since v2.1.0 the site includes Vercel Web Analytics (`@vercel/analytics`, cookieless page views, no personal data). Turn it on under Project > Analytics > Enable, then redeploy; until then the script request returns 404 and nothing is recorded. The script and its beacons use `/_vercel/insights/*` on the same origin, so the CSP needs no change. When self-hosting, the script is not served and the component does nothing.

## Self-hosting (without Vercel)

- **Backend** (e.g. Render or Railway): root directory `server`, start command `npm start`. Set the same variables as for Vercel plus `TRUST_PROXY=1`; the host provides `PORT`.
- **Cookies**: the session cookie is `SameSite=Lax`, so the API must be on the same site as the frontend: the same origin behind a reverse proxy (leave `VITE_API_URL` empty and route `/api` to the API), or a subdomain of the same domain. An API on a different domain will not keep players logged in.
- **Frontend**: set `VITE_SITE_URL` (and `VITE_API_URL` if needed) at build time, run `npm run build`, then `npm run serve`, which applies `serve.json` (SPA rewrites and security headers). If the API is on another origin, add it to the CSP `connect-src` in `serve.json`.

[Back to README](../README.md)
