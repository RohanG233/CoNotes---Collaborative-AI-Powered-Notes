# PrepFlow

PrepFlow is a full-stack interview preparation app for writing notes, organizing study material, collaborating in real time, and generating AI-assisted study outputs from note content.

The app is built with a React + Vite frontend and a TypeScript microservice backend. It demonstrates cookie-based authentication, API gateway, MongoDB-backed notes, Socket.IO collaboration, and AI integration through OpenRouter.

## Table of Contents

| Section                                                 | What it covers                                       |
| ------------------------------------------------------- | ---------------------------------------------------- |
| [What It Does](#what-it-does)                           | Main product features                                |
| [Architecture](#architecture)                           | How the frontend, gateway, and services fit together |
| [Tech Stack](#tech-stack)                               | Frameworks, libraries, and infrastructure            |
| [Repository Structure](#repository-structure)           | Folder layout                                        |
| [Backend Services](#backend-services)                   | Service responsibilities and ports                   |
| [Communication Flow](#communication-flow)               | HTTP routing and Socket.IO usage                     |
| [Authentication](#authentication)                       | Access tokens, refresh tokens, and cookies           |
| [API Reference](#api-reference)                         | Main backend endpoints                               |
| [Realtime Events](#realtime-events)                     | Socket.IO events used for collaboration              |
| [Local Setup](#local-setup)                             | How to run locally                                   |
| [Production Readiness](#production-readiness)           | Security and deployment checklist                    |
| [Render Deployment](#render-deployment)                 | Render-specific deployment steps                     |
| [Key Environment Variables](#key-environment-variables) | Required frontend and backend variables              |
| [Status](#status)                                       | Current readiness and remaining work                 |

## What It Does

- Create, edit, search, star, tag, and delete interview prep notes.
- Invite another registered user to a note by email.
- Show shared notes on the collaborator's dashboard with a collaborator badge.
- Let owner and collaborator edit the same note at the same time.
- Broadcast live note updates, presence, and typing state with Socket.IO.
- Generate summaries, questions, explanations, and answer feedback with AI.
- Keep sessions secure with HttpOnly access and refresh token cookies.

## Architecture

```text
React frontend (:5173)
  |
  | HTTP requests with credentials
  v
API gateway (:3000)
  |-> auth-service  (:3001) - users, login, refresh, logout
  |-> notes-service (:3002) - notes CRUD, collaborators, Socket.IO
  |-> ai-service    (:3003) - OpenRouter AI actions

React frontend also connects directly to notes-service for Socket.IO.
```

## Tech Stack

| Layer         | Technology                                                         |
| ------------- | ------------------------------------------------------------------ |
| Frontend      | React 18, Vite, TypeScript, CSS Modules                            |
| API gateway   | Express, http-proxy-middleware                                     |
| Auth service  | Express, MongoDB, Mongoose, JWT, bcrypt                            |
| Notes service | Express, MongoDB, Mongoose, Socket.IO                              |
| AI service    | Express, OpenAI SDK configured for OpenRouter                      |
| Security      | Helmet, CORS credentials, HttpOnly cookies, express-mongo-sanitize |
| Deployment    | Dockerfiles, Docker Compose, Render-ready services                 |

## Repository Structure

```text
.
|-- prepflow-frontend/
|   |-- src/
|   |-- package.json
|   `-- vite.config.ts
|-- prepflow-backend/
|   |-- auth-service/
|   |-- notes-service/
|   |-- ai-service/
|   |-- gateway/
|   `-- docker-compose.yml
`-- README.md
```

## Backend Services

| Service       | Port | Responsibility                                              |
| ------------- | ---: | ----------------------------------------------------------- |
| gateway       | 3000 | Single HTTP entry point and request proxy                   |
| auth-service  | 3001 | Signup, login, refresh token rotation, logout, current user |
| notes-service | 3002 | Notes, collaborators, dashboard data, Socket.IO rooms       |
| ai-service    | 3003 | Authenticated AI requests with per-user rate limiting       |

## Communication Flow

### HTTP

The frontend calls the gateway:

```text
POST /api/auth/login
GET  /api/notes
POST /api/ai
```

The gateway strips the path prefix and forwards to the correct service:

```text
/api/auth/*  -> auth-service
/api/notes/* -> notes-service
/api/ai      -> ai-service
```

### Realtime

When a user opens `/editor/:id`, the frontend connects to Socket.IO and emits `joinRoom(noteId)`. The notes service verifies that the user owns the note or is in the note's `collaborators` array, then joins the socket to a room named after the note ID.

Live editor events are sent through Socket.IO. Saving to MongoDB still happens through normal HTTP autosave.

## Authentication

PrepFlow uses two JWTs stored in HttpOnly cookies:

| Token        |   Lifetime | Purpose                                      |
| ------------ | ---------: | -------------------------------------------- |
| accessToken  | 15 minutes | Authorizes protected API and socket requests |
| refreshToken |     7 days | Rotates sessions and restores login state    |

Access tokens are verified independently by protected services. Refresh tokens are stored in MongoDB so logout and refresh-token reuse detection work.

## API Reference

### Auth

| Method | Path                | Purpose                                    |
| ------ | ------------------- | ------------------------------------------ |
| POST   | `/api/auth/signup`  | Create a new user account                  |
| POST   | `/api/auth/login`   | Log in and set auth cookies                |
| POST   | `/api/auth/refresh` | Rotate access and refresh tokens           |
| POST   | `/api/auth/logout`  | Clear cookies and invalidate refresh token |
| GET    | `/api/auth/me`      | Return the current authenticated user      |

### Notes

| Method | Path                           | Purpose                      |
| ------ | ------------------------------ | ---------------------------- |
| GET    | `/api/notes`                   | List owned and shared notes  |
| POST   | `/api/notes`                   | Create a note                |
| GET    | `/api/notes/:id`               | Fetch one note               |
| PATCH  | `/api/notes/:id`               | Autosave note updates        |
| DELETE | `/api/notes/:id`               | Delete an owned note         |
| PATCH  | `/api/notes/:id/star`          | Toggle star on an owned note |
| POST   | `/api/notes/:id/collaborators` | Add a collaborator by email  |

### AI

| Method | Path      | Purpose                                                |
| ------ | --------- | ------------------------------------------------------ |
| POST   | `/api/ai` | Run `summarize`, `questions`, `explain`, or `feedback` |

AI requests require a valid session and are rate limited per user.

## Realtime Events

The editor uses Socket.IO only after a note is opened.

Client to server:

| Event        | Payload                | Purpose                                 |
| ------------ | ---------------------- | --------------------------------------- |
| `joinRoom`   | `noteId`               | Join a note room after permission check |
| `leaveRoom`  | `noteId`               | Leave a note room                       |
| `noteUpdate` | `{ noteId, content }`  | Broadcast live text changes             |
| `cursorMove` | `{ noteId, position }` | Broadcast cursor position               |
| `typing`     | `{ noteId, isTyping }` | Broadcast typing state                  |

Server to client:

| Event          | Payload                         | Purpose                               |
| -------------- | ------------------------------- | ------------------------------------- |
| `presence`     | `PresenceUser[]`                | Show active collaborators             |
| `noteUpdate`   | `{ content, from, userId, ts }` | Receive another user's text update    |
| `cursorUpdate` | `{ userId, name, position }`    | Receive cursor position               |
| `userTyping`   | `{ userId, name, isTyping }`    | Show typing indicator                 |
| `error`        | `{ message }`                   | Show socket permission or auth errors |

## Local Setup

### Prerequisites

- Node.js 20+
- MongoDB connection string
- OpenRouter API key

### Backend

Create `.env` files from the examples in each backend service:

```bash
cd prepflow-backend
cp auth-service/.env.example auth-service/.env
cp notes-service/.env.example notes-service/.env
cp ai-service/.env.example ai-service/.env
cp gateway/.env.example gateway/.env
```

Important:

- `JWT_SECRET` must match across auth-service, notes-service, and ai-service.
- `REFRESH_SECRET` must be different from `JWT_SECRET`.
- `CLIENT_URL` should be `http://localhost:5173` locally.

Run each backend service in a separate terminal:

```bash
cd prepflow-backend/auth-service && npm install && npm run dev
cd prepflow-backend/notes-service && npm install && npm run dev
cd prepflow-backend/ai-service && npm install && npm run dev
cd prepflow-backend/gateway && npm install && npm run dev
```

Or run the backend with Docker Compose:

```bash
cd prepflow-backend
cp .env.example .env
docker-compose up --build
```

### Frontend

Create `prepflow-frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3002
```

Then run:

```bash
cd prepflow-frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Production Readiness

Implemented production-facing basics:

- Helmet security headers.
- `X-Powered-By` disabled on all Express services.
- `express-mongo-sanitize` on Mongo-backed services.
- JSON body size limits.
- Exact-origin CORS with credentials.
- HttpOnly cookies with `secure: true` and `sameSite: 'none'` in production.
- AI rate limiting per authenticated user.
- Health endpoints for all backend services.
- Graceful shutdown handlers.
- Non-root Docker runtime users.

Recommended before serious production use:

- Add automated tests and CI.
- Add structured logging and monitoring.
- Add database backups and stricter MongoDB network rules.
- Add Redis for multi-instance Socket.IO rooms and presence.
- Use asymmetric JWTs for larger multi-service deployments.

Production deployment checklist:

- Set `NODE_ENV=production` on all backend services.
- Store secrets in the hosting provider, not in source code.
- Use strong, different `JWT_SECRET` and `REFRESH_SECRET` values.
- Keep `JWT_SECRET` identical across auth, notes, and AI services.
- Set `CLIENT_URL` to the exact frontend origin with no trailing slash.
- Use HTTPS so `secure` cross-site cookies work.
- Confirm all `/health` endpoints respond successfully.
- Run production builds before deploying.
- Verify signup, login, refresh, logout, notes, sharing, realtime editing, and AI in the browser.
- Add monitoring for 5xx errors and failed health checks.

## Render Deployment

Deploy these as separate Render Web Services:

| Service       | Root directory                   | Build command             | Start command         |
| ------------- | -------------------------------- | ------------------------- | --------------------- |
| auth-service  | `prepflow-backend/auth-service`  | `npm ci && npm run build` | `node dist/server.js` |
| notes-service | `prepflow-backend/notes-service` | `npm ci && npm run build` | `node dist/server.js` |
| ai-service    | `prepflow-backend/ai-service`    | `npm ci && npm run build` | `node dist/server.js` |
| gateway       | `prepflow-backend/gateway`       | `npm ci && npm run build` | `node dist/server.js` |

Set each health check path to `/health`.

Deploy order:

1. Deploy auth-service, notes-service, and ai-service.
2. Copy their public URLs into the gateway environment variables:
   - `AUTH_SERVICE_URL`
   - `NOTES_SERVICE_URL`
   - `AI_SERVICE_URL`
3. Deploy gateway.
4. Deploy frontend as a static site.
5. Set frontend env vars:
   - `VITE_API_URL=<gateway-url>`
   - `VITE_SOCKET_URL=<notes-service-url>`
6. Set every backend `CLIENT_URL` to the final frontend URL.
7. Redeploy services after changing environment variables.

## Key Environment Variables

Backend:

```env
NODE_ENV=production
CLIENT_URL=https://your-frontend-url
JWT_SECRET=<shared-access-token-secret>
REFRESH_SECRET=<different-refresh-token-secret>
MONGO_URI=mongodb+srv://...
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

Frontend:

```env
VITE_API_URL=https://your-gateway-url
VITE_SOCKET_URL=https://your-notes-service-url
```

## Status

The app is ready for local development and small demo deployment. The main remaining production work is around automated tests, observability, and multi-instance realtime scaling.
