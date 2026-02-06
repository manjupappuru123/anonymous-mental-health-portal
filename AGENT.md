# AGENT.md

## Purpose
- This file is a persistent architectural reference for AI agents working on this repo.
- It complements `README.md` with architecture, rationale, and constraints.
- It is expected to be kept current as the system evolves.

## Mandatory Update Rule
- Any architectural change MUST update `AGENT.md`.
- If the change affects user-facing behavior, setup, or project understanding, `README.md` MUST also be updated.

## High-Level Overview
- Full-stack web application providing anonymous mental health and stress support for students.
- Two primary user roles:
  - Students: submit issues anonymously and view responses using an anonymous ID.
  - Counselors: register/login, view/assign issues, respond, and manage status.
- Separation of concerns:
  - React SPA frontend in `client/`.
  - Express REST API backend in `server/`.
  - MongoDB for persistence.

## System Architecture
- Client (React + Vite) communicates with the backend over HTTP/REST.
- Backend (Express) exposes `/api/*` routes and applies auth middleware for protected endpoints.
- MongoDB stores:
  - `issues` documents keyed by `anonId`.
  - `messages` documents tied to issues for anonymous chat.
  - `counselors` documents for authenticated users.
  - `notifications` documents for counselor in-app notifications.

### Data Flow (Core)
- Student submits issue:
  1. Client POSTs to `/api/issues/submit`.
  2. Server generates `anonId`, stores issue in MongoDB, returns `anonId`.
  3. Client displays `anonId` for future lookup.
- Student checks status:
  1. Client GETs `/api/issues/:anonId`.
  2. Server retrieves issue and response data.
- Counselor operations:
  1. Counselor logs in via `/api/auth/login`, receives JWT.
  2. Client stores JWT in `localStorage` and attaches it to subsequent requests via Axios interceptor.
  3. Protected endpoints require `Authorization: Bearer <token>`.

## Key Design Decisions and Trade-offs
- Anonymous ID system:
  - Protects student privacy by avoiding personal data collection in issues.
  - Trade-off: no direct contact channel; all follow-up uses `anonId`.
- Student chat token-link:
  - Each issue gets a one-time returned student access token.
  - Only the hashed token is stored in MongoDB.
- Stateless JWT auth:
  - Simplifies horizontal scaling.
  - Trade-off: token revocation is not built-in.
- REST API (not GraphQL):
  - Simpler tooling and implementation for this scope.
- MongoDB:
  - Flexible schema for issue content and counselor data.
  - Trade-off: requires explicit indexing for performant lookups.

## Technology Stack (Source of Truth)
- Backend:
  - Node.js + Express (`server/package.json` shows Express `4.18.2`).
  - MongoDB with Mongoose.
  - JWT + bcryptjs for authentication.
  - CORS enabled globally.
  - Socket.IO for real-time chat message updates.
- Frontend:
  - React 19 + React Router.
  - Vite build system.
  - Axios API client with auth interceptor.

## Folder Responsibilities
- `client/`
  - `src/pages/`: route-level pages (Home, SubmitIssue, ViewResponse, Dashboard, etc.).
  - `src/components/`: reusable UI components.
  - `src/services/api.js`: Axios setup and API wrappers.
  - `src/services/socket.js`: Socket.IO client initialization for real-time chat updates.
  - `src/context/AuthContext.jsx`: auth state, login/register, token persistence.
  - `src/styles/`: CSS for pages/components.
- `server/`
  - `server.js`: app bootstrap, middleware, routes, health check.
  - `config/db.js`: MongoDB connection.
  - `models/`: Mongoose schemas (`Counselor`, `Issue`, `Notification`).
  - `models/Message.js`: chat messages tied to issues.
  - `controllers/`: route logic for auth, issues, counselors, notifications.
  - `controllers/chatController.js`: token-link student chat + counselor chat APIs.
  - `services/chatService.js`: shared chat validation, authorization, and persistence helpers.
  - `routes/`: Express route definitions, including notification routes for counselor alerts.
  - `routes/chatRoutes.js`: chat API routes (`/api/chat`).
  - `middleware/`: auth and error handling.
  - `socket/`: Socket.IO server initialization and chat room events.
  - `utils/`: helper utilities like anonymous ID generation and email delivery.
  - `utils/studentChatToken.js`: token generation and hashing.

## Architectural Constraints (Must Respect)
- Issues must not store student-identifying personal data.
- `anonId` is the only key students use to retrieve status and responses.
- Student chat access uses a token-link; only token hashes are stored.
- All protected routes require JWT via `Authorization: Bearer <token>`.
- Client must read API base URL from `VITE_API_URL` (fallback to `http://localhost:5000/api`).
- `localStorage` is the single source of client auth persistence.

## Assumptions and Invariants
- MongoDB is available (local or Atlas) and configured via `server/.env`.
- JWT secret is provided via `JWT_SECRET`.
- CORS is required for local client/server development.
- The API path prefix is `/api`.
- Indexing on `issues.anonId` and `counselors.email` is required for performance and uniqueness.

## Known Limitations / Non-Goals
- No admin role or moderation workflows.
- No token revocation or refresh flow.
- No SMS notifications.
- Privacy is achieved through anonymity, not through end-to-end encryption.

## Documentation Pointers
- `README.md`: setup, usage, endpoints, and schema.
- `ARCHITECTURE.md`: diagrams and flowcharts.
- `QUICKSTART.md`: short setup path.
