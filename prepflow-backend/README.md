# PrepFlow Backend

PrepFlow is a TypeScript microservice backend for an interview prep app with notes, real-time collaboration, and AI-assisted study workflows.

## Services

| Service | Port | Responsibility |
|---|---:|---|
| `gateway` | 3000 | Public HTTP entry point; proxies client traffic |
| `auth-service` | 3001 | Signup, login, refresh, logout, user profile |
| `notes-service` | 3002 | Notes CRUD, search, starring, Socket.IO rooms |
| `ai-service` | 3003 | Authenticated AI actions through OpenRouter |

## Local Prerequisites

- Node.js 20 or newer
- MongoDB connection string
- OpenRouter API key

## Environment Setup

Each service has its own `.env.example`. Copy and fill in values:

```bash
cp auth-service/.env.example auth-service/.env
cp notes-service/.env.example notes-service/.env
cp ai-service/.env.example ai-service/.env
cp gateway/.env.example gateway/.env
```

Important: `JWT_SECRET` must be identical in auth-service, notes-service, and ai-service. `REFRESH_SECRET` is used only by auth-service and must be different from `JWT_SECRET`.

## Run Locally

From separate terminals:

```bash
cd auth-service && npm run dev
cd notes-service && npm run dev
cd ai-service && npm run dev
cd gateway && npm run dev
```

The frontend should call the gateway at `http://localhost:3000` and Socket.IO at `http://localhost:3002`.

## API Reference

### Auth - `/api/auth/*`

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/api/auth/signup` | No | `{ name, email, password }` | `201 { message }` |
| POST | `/api/auth/login` | No | `{ email, password }` | `200 { user }` plus cookies |
| POST | `/api/auth/refresh` | Refresh cookie | Empty | `200 { ok }` plus rotated cookies |
| POST | `/api/auth/logout` | Refresh cookie if present | Empty | `204` |
| GET | `/api/auth/me` | Access cookie | Empty | `200 { id, name, email, createdAt }` |

Login sets `accessToken` and `refreshToken` as HttpOnly cookies. Refresh rotates both tokens and checks the submitted refresh token against MongoDB to detect reuse. Logout clears both cookies and invalidates the stored refresh token even if the access token has expired.

### Notes - `/api/notes/*`

All notes routes require a valid `accessToken` cookie.

| Method | Path | Body or query | Response |
|---|---|---|---|
| GET | `/api/notes` | `?q=&starred=true&page=1&limit=20` | `{ notes, pagination }` |
| POST | `/api/notes` | `{ title?, content?, tags? }` | `201 Note` |
| GET | `/api/notes/:id` | Empty | `200 Note` |
| PATCH | `/api/notes/:id` | `{ title?, content?, tags? }` | `200 Note` |
| DELETE | `/api/notes/:id` | Empty | `204` |
| PATCH | `/api/notes/:id/star` | Empty | `200 { starred }` |

The list endpoint returns metadata only: `title`, `starred`, `tags`, `updatedAt`, and `createdAt`. Full note content is fetched with `GET /api/notes/:id`. Pagination is capped at 50 notes per page.

### AI - `/api/ai`

All AI routes require a valid `accessToken` cookie.

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/ai` | `{ action, title?, content, answer? }` | `200 { result }` |

Supported actions:

- `summarize`: three concise bullet points.
- `questions`: five interview questions and answers.
- `explain`: simple explanation with an analogy.
- `feedback`: answer review; requires `answer`.

Default rate limit is 10 requests per user per hour. The limit is configurable with `AI_RATE_LIMIT_MAX` and `AI_RATE_LIMIT_WINDOW_MS`.

## Socket.IO

The frontend connects directly to notes-service with `VITE_SOCKET_URL`.

Client to server:

| Event | Payload |
|---|---|
| `joinRoom` | `noteId: string` |
| `leaveRoom` | `noteId: string` |
| `noteUpdate` | `{ noteId, content }` |
| `cursorMove` | `{ noteId, position }` |
| `typing` | `{ noteId, isTyping }` |

Server to client:

| Event | Payload |
|---|---|
| `presence` | `PresenceUser[]` |
| `noteUpdate` | `{ content, from, userId, ts }` |
| `cursorUpdate` | `{ userId, name, position }` |
| `userTyping` | `{ userId, name, isTyping }` |
| `error` | `{ message }` |

Socket authentication uses the same `accessToken` cookie during the Socket.IO handshake.

## Docker Compose

From `prepflow-backend/`:

```bash
cp .env.example .env
docker-compose up --build
```

The compose file builds all four services, uses Docker DNS for service-to-service URLs, exposes ports 3000-3003, adds health checks, and restarts containers unless they are manually stopped.

## Production Notes

Production mode enables:

- `sameSite: 'none'` and `secure: true` cookies for cross-origin HTTPS deployments.
- Helmet security headers.
- Morgan request logging.
- Body size limits.
- `express-mongo-sanitize` on auth and notes services.
- `trust proxy: 1` for load balancer deployments.
- Graceful shutdown on `SIGTERM` and `SIGINT`.
- Non-root Docker users.

See `prod.md` for a deployment checklist.

## Documentation

- `project.md`: architecture and design decisions.
- `PerFile.md`: file-by-file backend reference.
- `prod.md`: production hardening and deployment guide.
- `../communication.md`: backend/frontend protocol reference.
