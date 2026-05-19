# PrepFlow Backend

PrepFlow Backend is a TypeScript microservice backend for an interview preparation app. It handles authentication, secure session cookies, notes, collaborators, realtime editing, AI requests, and gateway routing.

The frontend talks to the backend through an API gateway for HTTP requests and connects directly to the notes service for Socket.IO collaboration.

## Table of Contents

| Section | What it covers |
|---|---|
| [Services](#services) | Backend services and responsibilities |
| [Architecture](#architecture) | Request flow and service communication |
| [Tech Stack](#tech-stack) | Main backend libraries |
| [Local Prerequisites](#local-prerequisites) | Required local tools and accounts |
| [Environment Setup](#environment-setup) | Required `.env` files and secrets |
| [Run Locally](#run-locally) | Local service startup |
| [API Reference](#api-reference) | Auth, notes, collaborator, and AI endpoints |
| [Socket.IO](#socketio) | Realtime collaboration events |
| [Security Model](#security-model) | Cookies, headers, sanitization, CORS, and rate limits |
| [Docker Compose](#docker-compose) | Containerized backend startup |
| [Production Readiness](#production-readiness) | Deployment checklist |
| [Render Deployment](#render-deployment) | Render setup instructions |
| [Key Environment Variables](#key-environment-variables) | Production variable reference |
| [Status](#status) | Current readiness and known scale work |

## Services

| Service | Port | Responsibility |
|---|---:|---|
| `gateway` | 3000 | Public HTTP entry point; proxies client traffic |
| `auth-service` | 3001 | Signup, login, refresh token rotation, logout, user profile |
| `notes-service` | 3002 | Notes CRUD, collaborator access, dashboard data, Socket.IO rooms |
| `ai-service` | 3003 | Authenticated AI actions through OpenRouter |

## Architecture

```text
Frontend
  |
  | HTTP with credentials
  v
gateway (:3000)
  |-> auth-service  (:3001)
  |-> notes-service (:3002)
  |-> ai-service    (:3003)

Frontend
  |
  | Socket.IO
  v
notes-service (:3002)
```

The gateway receives `/api/auth/*`, `/api/notes/*`, and `/api/ai` requests. It strips the API prefix and forwards the request to the matching upstream service.

Socket.IO is handled directly by notes-service because it owns note room access checks and collaboration events.

## Tech Stack

| Area | Technology |
|---|---|
| Runtime | Node.js 20 |
| HTTP | Express |
| Gateway | http-proxy-middleware |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcrypt, HttpOnly cookies |
| Realtime | Socket.IO |
| AI | OpenAI SDK configured with OpenRouter |
| Security | Helmet, CORS, express-mongo-sanitize, body limits |
| Logging | Morgan |
| Deployment | Dockerfiles, Docker Compose, Render-compatible builds |

## Local Prerequisites

- Node.js 20 or newer.
- MongoDB Atlas or local MongoDB.
- OpenRouter API key.
- Frontend running on `http://localhost:5173`.

## Environment Setup

Each service has its own `.env.example`. Copy and fill them:

```bash
cp auth-service/.env.example auth-service/.env
cp notes-service/.env.example notes-service/.env
cp ai-service/.env.example ai-service/.env
cp gateway/.env.example gateway/.env
```

Important:

- `JWT_SECRET` must be identical in auth-service, notes-service, and ai-service.
- `REFRESH_SECRET` is used only by auth-service.
- `REFRESH_SECRET` must be different from `JWT_SECRET`.
- `CLIENT_URL` should be `http://localhost:5173` locally.
- `OPENROUTER_API_KEY` is required only for ai-service.

## Run Locally

Install dependencies inside each service:

```bash
cd auth-service && npm install
cd ../notes-service && npm install
cd ../ai-service && npm install
cd ../gateway && npm install
```

Run each service in a separate terminal:

```bash
cd prepflow-backend/auth-service && npm run dev
cd prepflow-backend/notes-service && npm run dev
cd prepflow-backend/ai-service && npm run dev
cd prepflow-backend/gateway && npm run dev
```

The frontend should use:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3002
```

## API Reference

### Auth - `/api/auth/*`

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/api/auth/signup` | No | `{ name, email, password }` | `201 { message }` |
| POST | `/api/auth/login` | No | `{ email, password }` | `200 { user }` plus cookies |
| POST | `/api/auth/refresh` | Refresh cookie | Empty | `200 { ok }` plus rotated cookies |
| POST | `/api/auth/logout` | Refresh cookie if present | Empty | `204` |
| GET | `/api/auth/me` | Access cookie | Empty | `200 { id, name, email, createdAt }` |

Login sets `accessToken` and `refreshToken` as HttpOnly cookies. Refresh rotates both tokens and checks the submitted refresh token against MongoDB. Logout clears both cookies and invalidates the stored refresh token.

### Notes - `/api/notes/*`

All notes routes require a valid `accessToken` cookie.

| Method | Path | Body or query | Purpose |
|---|---|---|---|
| GET | `/api/notes` | `?q=&starred=true&page=1&limit=20` | List owned and shared notes |
| POST | `/api/notes` | `{ title?, content?, tags? }` | Create a note |
| GET | `/api/notes/:id` | Empty | Fetch one note |
| PATCH | `/api/notes/:id` | `{ title?, content?, tags? }` | Autosave note updates |
| DELETE | `/api/notes/:id` | Empty | Delete an owned note |
| PATCH | `/api/notes/:id/star` | Empty | Toggle star on an owned note |
| POST | `/api/notes/:id/collaborators` | `{ email }` | Add a collaborator by registered email |

The dashboard list includes notes where the current user is the owner or a collaborator. Shared notes include an `accessRole: "collaborator"` marker so the frontend can show a badge.

### AI - `/api/ai`

All AI routes require a valid `accessToken` cookie.

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/ai` | `{ action, title?, content, answer? }` | `200 { result }` |

Supported actions:

- `summarize`
- `questions`
- `explain`
- `feedback`

Default rate limit is 10 requests per user per hour.

## Socket.IO

The frontend connects directly to notes-service with `VITE_SOCKET_URL`.

Socket authentication uses the same `accessToken` cookie during the Socket.IO handshake. Before joining a room, notes-service checks whether the user owns the note or is in the note's `collaborators` array.

Client to server:

| Event | Payload | Purpose |
|---|---|---|
| `joinRoom` | `noteId: string` | Join a note room after DB access check |
| `leaveRoom` | `noteId: string` | Leave note room |
| `noteUpdate` | `{ noteId, content }` | Broadcast content change |
| `cursorMove` | `{ noteId, position }` | Broadcast cursor position |
| `typing` | `{ noteId, isTyping }` | Broadcast typing indicator |

Server to client:

| Event | Payload | Purpose |
|---|---|---|
| `presence` | `PresenceUser[]` | Active users in room |
| `noteUpdate` | `{ content, from, userId, ts }` | Remote content update |
| `cursorUpdate` | `{ userId, name, position }` | Remote cursor update |
| `userTyping` | `{ userId, name, isTyping }` | Remote typing state |
| `error` | `{ message }` | Socket auth or permission error |

## Security Model

Implemented security basics:

- HttpOnly cookies for access and refresh tokens.
- Short-lived access tokens.
- Database-backed refresh tokens for logout and reuse detection.
- Helmet security headers on every service.
- `X-Powered-By` disabled on every Express app.
- Exact-origin CORS with credentials.
- `express-mongo-sanitize` on Mongo-backed services.
- JSON body size limits.
- Per-user AI rate limiting.
- `trust proxy` enabled for hosted reverse proxies.

Production cookie behavior:

| Environment | `sameSite` | `secure` |
|---|---|---|
| development | `lax` | `false` |
| production | `none` | `true` |

## Docker Compose

From `prepflow-backend/`:

```bash
cp .env.example .env
docker-compose up --build
```

Docker Compose starts all four services, maps ports 3000-3003, uses Docker DNS for internal service URLs, adds health checks, and restarts services unless stopped manually.

## Production Readiness

Before deployment:

- Set `NODE_ENV=production` for every service.
- Store secrets in the hosting provider, not in source code.
- Use strong, different `JWT_SECRET` and `REFRESH_SECRET` values.
- Keep `JWT_SECRET` identical across auth, notes, and AI services.
- Set `CLIENT_URL` to the exact frontend URL with no trailing slash.
- Use HTTPS so secure cookies work.
- Confirm `/health` works on all four services.
- Run `npm run build` in every backend service.
- Verify signup, login, refresh, logout, notes, sharing, realtime editing, and AI.
- Add monitoring for 5xx errors and failed health checks.

Recommended before larger production use:

- Add automated tests and CI.
- Add structured logs and metrics.
- Enable MongoDB backups and stricter IP rules.
- Add Redis for multi-instance Socket.IO rooms and presence.
- Use asymmetric JWT signing for larger multi-service deployments.

## Render Deployment

Deploy these as separate Render Web Services:

| Service | Root directory | Build command | Start command |
|---|---|---|---|
| auth-service | `prepflow-backend/auth-service` | `npm ci --include=dev && npm run build` | `node dist/server.js` |
| notes-service | `prepflow-backend/notes-service` | `npm ci --include=dev && npm run build` | `node dist/server.js` |
| ai-service | `prepflow-backend/ai-service` | `npm ci --include=dev && npm run build` | `node dist/server.js` |
| gateway | `prepflow-backend/gateway` | `npm ci --include=dev && npm run build` | `node dist/server.js` |

Set each service health check path to:

```text
/health
```

Deploy order:

1. Deploy auth-service, notes-service, and ai-service first.
2. Copy their Render URLs into gateway environment variables:
   - `AUTH_SERVICE_URL`
   - `NOTES_SERVICE_URL`
   - `AI_SERVICE_URL`
3. Deploy gateway.
4. Set the frontend `VITE_API_URL` to the gateway URL.
5. Set the frontend `VITE_SOCKET_URL` to the notes-service URL.
6. Set every backend `CLIENT_URL` to the final frontend URL.
7. Redeploy after every environment variable change.

## Key Environment Variables

Auth service:

```env
NODE_ENV=production
PORT=3001
MONGO_URI=mongodb+srv://...
JWT_SECRET=<shared-access-token-secret>
REFRESH_SECRET=<different-refresh-token-secret>
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-url
```

Notes service:

```env
NODE_ENV=production
PORT=3002
MONGO_URI=mongodb+srv://...
JWT_SECRET=<same-as-auth-service>
CLIENT_URL=https://your-frontend-url
```

AI service:

```env
NODE_ENV=production
PORT=3003
JWT_SECRET=<same-as-auth-service>
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
CLIENT_URL=https://your-frontend-url
AI_RATE_LIMIT_MAX=10
AI_RATE_LIMIT_WINDOW_MS=3600000
```

Gateway:

```env
NODE_ENV=production
PORT=3000
CLIENT_URL=https://your-frontend-url
AUTH_SERVICE_URL=https://your-auth-service-url
NOTES_SERVICE_URL=https://your-notes-service-url
AI_SERVICE_URL=https://your-ai-service-url
```

## Status

The backend is ready for local development and small demo deployment. For serious production scale, add tests, CI, monitoring, Redis-backed Socket.IO scaling, and stricter database network controls.
