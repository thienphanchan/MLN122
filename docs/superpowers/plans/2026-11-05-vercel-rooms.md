# Vercel rooms deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task by task. User explicitly requested autonomous implementation; continue without another design approval.

**Goal:** Make the existing Vercel frontend serve working room APIs and realtime connections with shared durable state.

**Architecture:** Keep React and simulation unchanged. Add native Vercel functions for configuration/health and an exported HTTP server for Socket.IO at `/api/rooms`, using WebSocket transport directly. Use Redis transactions and pub/sub to synchronize independent instances; preserve file storage for local standalone mode.

**Spec:** Original QR room spec plus the user's 2026-11-05 request to fix the observed Vercel deployment autonomously. Existing public endpoints return 404; server/index.js currently only runs via npm start.

## Global Constraints

- Preserve solo localStorage, five simulation days, grading, private tokens, answer concealment and existing UI.
- Vercel must never silently fall back to an ephemeral JSON file or process-local room authority.
- Support REDIS_URL and legacy KV_URL. Never put credentials in VITE_* variables or tracked files.
- Distributed mutations use optimistic atomic Redis compare-and-set; notifications cause fresh state reload before private per-session broadcasts.
- Shared connection presence expires after instance failure; regular heartbeats maintain live sessions.
- Native API function URLs avoid rewrites for WebSocket upgrades; Socket.IO uses `/api/rooms` with no trailing slash on Vercel.
- Report missing external account/database setup honestly; complete all code, tests and push before asking for any final account action.

## Review Focus

- Two simultaneous mutations from separate instances must not lose decisions or names.
- A client reconnecting to another instance must recover the same room and finalized quiz.
- Cross-instance notifications must not leak other players' private state or credentials.
- Missing/misconfigured Redis must produce a useful unavailable response, not a working-looking ephemeral room.
- Native Vercel routes and websocket-only settings must coexist with local Vite/Node mode and refresh recovery.

### Task 1: Shared Redis authority

**Files:** `server/redis-repository.js`, `server/rooms.js`, `tests/redis.test.js`, `package.json`.

**Interfaces:** `createRedisRepository({url,prefix})` provides load(), transact(change) -> {data,result}, subscribe(listener), setPresence(session,id,connected), getPresence(code), close(). `createRoomService` adds refresh(sessions) and supports repository-level transactions while preserving synchronous local views and file tests.

- [x] Write and run failing real-Redis integration tests: concurrent instances, duplicate requests, refresh/resume, notifications, presence expiry and private state.
- [x] Implement atomic CAS retry, Redis pub/sub and expiring presence, then integrate room refresh/transaction behavior.
- [x] Run targeted Redis tests and existing unit suite.

### Task 2: Vercel entrypoints and browser connection

**Files:** `api/{rooms,config,health}.js`, `server/{index,hosted-config}.js`, `vercel.json`, `src/room/useRoom.js`, `vite.config.js`, tests.

- [x] Add failing tests for websocket-only connection at exact function path, host/player across two servers, missing-storage HTTP response and browser configuration failure.
- [x] Export a Vercel HTTP server, native config/health functions, deployment settings and safe server initialization. Configure browser Socket.IO from /api/config before connection and display server setup failure accurately.
- [x] Preserve local proxies, static serving and data-file protection; verify real websocket connections and no file fallback on Vercel.

### Task 3: Delivery

**Files:** `.env.example`, README.md, PRODUCT.md, deployment verification scripts/tests.

- [x] Document exact Vercel root `can-bang-chuyen-xe`, Redis integration/env, Fluid compute, routing, and local compatibility.
- [x] Run build, complete unit/integration and browser suites, including Redis-backed cross-instance production tests.
- [x] Fresh independent review and regressions for verified findings.

Delivery: commit and push origin/main; verify public endpoints and deployment if account access is available. Missing external account/database setup remains explicit, never reported as a deployed fix.

## Progress

- Baseline cb231eeb8efac954c3fd4f38fc63cc4a9a50dd11; clean main.
- Public /api/health, /api/config and /socket.io returned 404 during diagnosis.
- No existing CLI credentials or Redis environment variables found. Vercel connection requested through the available integration; code work continues independently.
- Redis 7 integration-test container started on loopback port 16379. It contains test-only data and will be stopped after validation.
- Native `/api/config`, `/api/health`, `/api/rooms` functions use a lazy stable HTTP server proxy. Failed initialization is retried rather than cached; local clients retain HTTP polling fallback, hosted clients use direct WebSocket.
- Independent review findings: cached failed initialization, unintended loss of local polling, and late initialization after native close. Each was reproduced, fixed and marked resolved by follow-up inspection.
- Validation observed: 115 unit/integration tests with real Redis, 39 regular browser tests, 15 hosted browser tests across three viewports; production builds passed. Official Vercel draft-04 JSON schema validation passed. Exact locked dependencies restored with npm ci before final rerun.
