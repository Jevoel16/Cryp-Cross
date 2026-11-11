# Configuration

Environment variables for the API and the frontend, and how to set up GitHub and Google sign-in.

**Backend:** `server/.env.example` has three blocks (Local, Development, Production) with the same keys. Copy the Local block into `server/.env` and fill it in; set the Development or Production block in your host.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | MongoDB connection string |
| `PORT` | no | Port for the Express API (default `5000`, which the frontend expects in development) |
| `CORS_ORIGINS` | in production | Comma-separated frontend origins allowed to call the API and send cookie-authenticated writes; must include the site's own origin. Unset: `http://localhost:3000` in development, no browser origins in production. |
| `SESSION_SECRET` | in production | Long random string that signs the session cookie. Development uses a random one per start (sessions end when the API restarts). |
| `APP_URL` | in production | Public site URL, the destination after GitHub/Google sign-in (default `http://localhost:3000`) |
| `API_URL` | no | Public origin of the API, used to build the OAuth callback URLs. Leave empty when the API is on the same origin as the site (or behind the Vite proxy in development); it then defaults to `APP_URL`. |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | at least one provider | Enables **Continue with GitHub**, the only way (with Google) to create an account. Both must be set; with one missing the button stays hidden and the API warns at startup. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | no | Enables **Continue with Google**, same rules as GitHub |
| `AUTH_RATE_LIMIT` | no | Login and password-change attempts per IP per 15 minutes (default `10`) |
| `OAUTH_RATE_LIMIT` | no | GitHub/Google sign-in requests per IP per 15 minutes; each sign-in uses two (default `30`). Over the limit, players return to the login page with a message |
| `PUZZLE_SECRET` | in production | Secret mixed into the puzzle seed (HMAC of the date), so future puzzles can't be generated from the public source. Changing it only affects puzzles not yet created. |
| `MIN_SOLVE_SECONDS` | no | Correct submissions sooner than this after opening the puzzle are refused (default `30`) |
| `PUZZLE_TZ` | no | IANA time zone that decides when the daily puzzle changes (default `UTC`) |
| `TRUST_PROXY` | behind a proxy | Proxy hops to trust, so rate limiting sees real client IPs and https is detected. Default `1` on Vercel (detected from `VERCEL`), otherwise `0`; set `1` on Render or Railway. |
| `DEMO_ACCOUNT` | no | Shared demo account shown on the Log in page. On by default; set to `off` to hide it and stop seeding it |
| `NODE_ENV` | no | Set to `production` in production |

**Frontend:** optional. `.env.example` has the same three blocks; copy the one you need into a root `.env` or your host.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | no | Base URL of the API when it is on another origin. Empty (default) means same origin: in development Vite proxies `/api` to `http://localhost:5000`. |
| `VITE_SITE_URL` | in production | Public site URL (https, no trailing slash). Used for canonical links and to generate `sitemap.xml` / `robots.txt` after `npm run build`. `SITE_URL` also works for the sitemap step. Vite only exposes variables prefixed with `VITE_` to the browser bundle, so never put secrets in them. |

See [`.env.example`](../.env.example) for a template.

## Setting up GitHub and Google sign-in

The callback URL is `<API_URL or APP_URL>/api/auth/oauth/<provider>/callback`. In development (Vite on port 3000 proxying `/api`) that is:

- `http://localhost:3000/api/auth/oauth/github/callback`
- `http://localhost:3000/api/auth/oauth/google/callback`

In production use your real https origin. On Vercel that is `https://<project>.vercel.app/api/auth/oauth/github/callback` and `.../google/callback`.

**GitHub**
1. Go to GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**.
2. Homepage URL: your `APP_URL`. Authorization callback URL: the GitHub callback above.
3. Create the app, then **Generate a new client secret**.
4. Put the Client ID and secret in `server/.env` as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`, and restart the API.

**Google**
1. In the Google Cloud console, open APIs & Services → **OAuth consent screen** and set it up (External, app name, support email; scopes `openid` and `profile`).
2. APIs & Services → Credentials → **Create credentials → OAuth client ID**, type **Web application**.
3. Authorized redirect URI: the Google callback above.
4. Put the Client ID and secret in `server/.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and restart the API.

Use separate OAuth apps (or at least separate redirect URIs) for development and production. Keep the secrets in `server/.env` or your host's secret settings, never in the frontend.


`.env` files are gitignored. Never commit real credentials.

[Back to README](../README.md)
