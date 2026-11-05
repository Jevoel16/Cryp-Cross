<a id="readme-top"></a>

<div align="center">
  <img src="public/logomain.png" alt="Cryp-Cross logo" width="120" />

  <h1>Cryp-Cross</h1>

  <p><strong>A MERN showcase for a crypto crossword platform, with a full-stack project task log.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/react-19.2.0-blue?style=flat" alt="React 19.2.0" />
    <img src="https://img.shields.io/badge/react--router--dom-7.9.6-blue?style=flat" alt="React Router 7.9.6" />
    <img src="https://img.shields.io/badge/react--scripts-5.0.1-blue?style=flat" alt="react-scripts 5.0.1" />
    <img src="https://img.shields.io/badge/express-4.22.3-blue?style=flat" alt="Express 4.22.3" />
    <img src="https://img.shields.io/badge/mongoose-7.8.13-blue?style=flat" alt="Mongoose 7.8.13" />
    <img src="https://img.shields.io/badge/helmet-8.3.0-blue?style=flat" alt="helmet 8.3.0" />
    <img src="https://img.shields.io/badge/express--rate--limit-7.5.1-blue?style=flat" alt="express-rate-limit 7.5.1" />
    <img src="https://img.shields.io/badge/node-22-blue?style=flat" alt="Node 22" />
  </p>
  <p>
    <img src="https://img.shields.io/badge/version-0.1.6-green?style=flat" alt="Version 0.1.6" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-Sprucetrap%20Source--Available-orange?style=flat" alt="License: Sprucetrap Source-Available" /></a>
    <img src="https://img.shields.io/badge/platform-web-lightgrey?style=flat" alt="Platform: web" />
    <a href="https://github.com/Jevoel16/Cryp-Cross/actions/workflows/ci.yml"><img src="https://github.com/Jevoel16/Cryp-Cross/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
  </p>
</div>

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration and Environment Variables](#configuration-and-environment-variables)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## About

Cryp-Cross is a concept for a crossword platform that rewards players with blockchain-based tokens: a fresh puzzle every day, with correct answers recorded on a verifiable ledger. This repository is a MERN (MongoDB, Express, React, Node.js) web app that presents the concept (home, idea and team pages) and includes a **Project Log**, a full CRUD task tracker the team uses to log development work, backed by a REST API and MongoDB.

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Features

**Frontend (React)**
- Concept pages: Home, Idea (problem statement, key features, emerging technology) and a Team carousel
- Project Log list sorted by creation date, with create, status-cycle (Pending → InProgress → Complete) and delete
- Project detail page per entry (`/projects/:id`)
- Light/dark theme toggle, remembered in `localStorage`
- Client-side routing with React Router and a 404 page

**Backend (Express)**
- REST API with four endpoints: `GET`, `POST`, `PATCH`, `DELETE` on `/api/projects`
- MongoDB through Mongoose, with schema validation and automatic `createdAt` / `updatedAt`
- Server-side input validation (types, lengths, allowed statuses, id format) and a 10 KB body limit
- Security headers with `helmet`, a CORS allow-list (`CORS_ORIGINS`) and rate limiting (300 requests / 15 min per IP, 60 writes)
- Generic error responses: no internal messages or stack traces reach clients
- Environment-based configuration with `dotenv`

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Create React App (react-scripts 5), plain CSS |
| Backend | Node.js 22, Express 4, Mongoose 7, helmet, express-rate-limit, cors, dotenv |
| Database | MongoDB (MongoDB Atlas recommended) |
| Production frontend server | `serve` with `serve.json` (SPA rewrites) |
| CI | GitHub Actions |

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Prerequisites

- Node.js 22 (see `.nvmrc`) and npm
- A MongoDB database, for example a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- Git

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Installation

```bash
git clone https://github.com/Jevoel16/Cryp-Cross.git
```

```bash
cd Cryp-Cross
```

```bash
npm install
```

```bash
npm install --prefix server
```

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Configuration and Environment Variables

**Backend:** copy `server/.env.example` to `server/.env` and fill it in.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | MongoDB connection string |
| `PORT` | no | Port for the Express API (default `5000`, which the frontend expects in development) |
| `CORS_ORIGINS` | in production | Comma-separated frontend origins allowed to call the API. Unset: `http://localhost:3000` in development, no browser origins in production. |
| `TRUST_PROXY` | no | Set to `1` behind one reverse proxy (Render, Railway) so rate limiting sees real client IPs. Default `0`. |
| `NODE_ENV` | no | Set to `production` in production |

**Frontend:** optional, set in a root `.env` file or in your hosting provider.

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_API_URL` | in production | Base URL of the deployed API. In development it defaults to `http://localhost:5000`. |

`.env` files are gitignored. Never commit real credentials.

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Usage

### Run locally

Start the API in one terminal:

```bash
npm start --prefix server
```

You should see `Server is running on http://localhost:5000` and `Database Connected`.

Start the frontend in a second terminal:

```bash
npm start
```

The app opens at `http://localhost:3000`.

### Visitor flow

1. **Home** (`/`): introduction to Cryp-Cross.
2. **Idea** (`/idea`): problem statement, key features and blockchain integration.
3. **Team** (`/team`): team member carousel.
4. Use the theme toggle in the header to switch between light and dark mode.

### Project Log flow (team member)

| Action | How |
|--------|-----|
| Create | Open **Project Log** → **+ Create New Project**, fill in title, description and status, then submit. You're redirected to the list. |
| Read | **Project Log** (`/projects`) lists all entries, newest first. **View Detail** opens `/projects/:id`. |
| Update | **Change Status** cycles Pending → InProgress → Complete → Pending. |
| Delete | **Delete**, then confirm the dialog. |

<details>
<summary><strong>API reference</strong></summary>

Base URL: `http://localhost:5000` in development, or your deployed API URL.

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `GET` | `/` | none | API info and endpoint list |
| `GET` | `/api/projects` | none | List all projects, newest first |
| `POST` | `/api/projects` | `{ "title", "description", "status" }` | Create a project |
| `PATCH` | `/api/projects/:id` | `{ "status" }` | Update a project |
| `DELETE` | `/api/projects/:id` | none | Delete a project |

Example:

```bash
curl -X POST http://localhost:5000/api/projects -H "Content-Type: application/json" -d '{"title":"New Project","description":"Project description","status":"Pending"}'
```

Validation rules: `title` (max 200 characters) and `description` (max 2000) are non-empty strings, `status` is one of `Pending`, `InProgress` or `Complete` and defaults to `Pending`, and `:id` must be a 24-character MongoDB ObjectId.

| Status | Meaning |
|--------|---------|
| `400` | Invalid body, JSON or id. `message` explains why. |
| `404` | Project or route not found |
| `413` | Body larger than 10 KB |
| `429` | Rate limit exceeded |
| `500` | Server error (details only in server logs) |

</details>

<details>
<summary><strong>Deployment notes</strong></summary>

- **Backend** (e.g. Render or Railway): root directory `server`, start command `npm start`. Set `DATABASE_URL`, `NODE_ENV=production`, `CORS_ORIGINS=<your frontend URL>` and `TRUST_PROXY=1`. The host provides `PORT`.
- **Frontend**: build with `npm run build` and serve with `npm run serve` (uses `serve.json` for SPA rewrites), or deploy to a static host such as Vercel. Set `REACT_APP_API_URL` to the API URL at build time.

</details>

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Project Structure

```
Cryp-Cross/
├── .github/workflows/ci.yml   # GitHub Actions CI
├── public/                    # Static assets, index.html, manifest, robots.txt
│   └── img/                   # Team member photos
├── src/
│   ├── App.js                 # Routes, pages and Project Log CRUD logic
│   ├── App.css / index.css    # Styling
│   ├── config.js              # API base URL and endpoints
│   └── index.js               # React entry point
├── server/
│   ├── server.js              # Entry point: connects to MongoDB and starts the API
│   ├── app.js                 # Express app: routes, validation, security middleware
│   ├── test/                  # Backend tests (node:test, no database needed)
│   ├── models/projectLog.js   # Mongoose schema
│   └── .env.example           # Backend environment template
├── serve.json                 # Production static-server config
├── .nvmrc                     # Node version
├── LICENSE
└── package.json               # Frontend dependencies and scripts
```

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Scripts

**Root (frontend)**

| Script | Description |
|--------|-------------|
| `npm start` | Start the React dev server on port 3000 |
| `npm run build` | Production build into `build/` |
| `npm run serve` | Serve `build/` on port 3000 |
| `npm test` | Run the Jest test runner (watch mode) |

**`server/` (backend)**

| Script | Description |
|--------|-------------|
| `npm start` | Start the Express API |
| `npm run dev` | Start the API and restart on file changes (`node --watch`) |
| `npm test` | Run the backend tests |

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Testing

The backend has automated tests in `server/test/` (Node's built-in `node:test`). They cover validation, error handling, CORS and security headers, and need no database. The frontend has no automated tests yet. Every push and pull request to `main` runs [CI](.github/workflows/ci.yml): frontend install, build (with ESLint) and the test runner, then backend install, syntax check, tests and `npm audit --audit-level=high`.

Run the same checks locally:

```bash
npm run build
```

```bash
npm test -- --watchAll=false --passWithNoTests
```

```bash
npm test --prefix server
```

```bash
npm audit --audit-level=high --prefix server
```

**Manual checks**
- [ ] The API starts and logs `Database Connected`
- [ ] The frontend loads on port 3000; Home, Idea, Team and an unknown URL (404) render
- [ ] The theme toggle works and persists after a refresh
- [ ] Create, view detail, change status and delete a project
- [ ] Data persists after a page refresh

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `ECONNREFUSED` or "Cannot GET /api/projects" | API not running, or the wrong API URL | Start it with `npm start --prefix server`; check `REACT_APP_API_URL` / `src/config.js` |
| `Database connection error` | Wrong `DATABASE_URL` or IP not allowed | Check `server/.env`; add your IP to the MongoDB Atlas access list |
| `DATABASE_URL is not set` on startup | Missing `server/.env` | Copy `server/.env.example` to `server/.env` and fill it in |
| Browser shows a CORS error | Frontend origin isn't in `CORS_ORIGINS` | Add the exact origin (scheme + host + port) to `CORS_ORIGINS` and restart the API |
| `429 Too many requests` | Rate limit reached | Wait 15 minutes; behind a proxy, set `TRUST_PROXY=1` so users aren't grouped under the proxy IP |
| Port already in use | Another process on 3000/5000 | Windows: `netstat -ano \| findstr :5000`, then `taskkill /PID <PID> /F` |

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Contributing

- **Branches:** `feat/short-description`, `fix/short-description`, `docs/...`, `chore/...`
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) with the bumped SemVer version at the end of the subject, e.g. `feat: add CSV export (v0.2.0)`. Breaking change → minor while on `0.x`; `feat` → minor; everything else → patch. Bump `package.json` and the version badge in the same commit.
- Make sure CI checks pass locally before committing.
- **Update this README with every change.**

<details>
<summary><strong>SEO backlink ideas</strong></summary>

- Link the live site from the GitHub repository description and topics (`react`, `mern`, `crossword`, `blockchain`)
- Add it to team members' GitHub profile READMEs, LinkedIn and portfolios
- Write a short dev post (DEV.to, Hashnode, Medium) about building Cryp-Cross and link back
- Submit it to course or school project showcases and puzzle/web3 community directories

</details>

<p align="right"><a href="#readme-top">back to top</a></p>

---

## License

Licensed under the **Sprucetrap Source-Available License 1.0**. See [LICENSE](LICENSE). Non-commercial use, study and modification are allowed with visible credit: "Based on Cryp-Cross by Sprucetrap (https://github.com/Jevoel16)". Commercial use needs written permission.

<p align="right"><a href="#readme-top">back to top</a></p>

---

## Author

**Sprucetrap** ([@Jevoel16](https://github.com/Jevoel16)), for CCC181 Lab Activity Final (Orbilla team).

<p align="right"><a href="#readme-top">back to top</a></p>
