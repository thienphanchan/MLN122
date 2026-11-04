# QR rooms and final quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver QR classroom rooms, independent five-day play, live host scores and an automatically graded final quiz, then test, commit and push.

**Architecture:** Node.js serves the built React app and Socket.IO. A serialized room service owns validation, scoring, private sessions and atomic JSON persistence; clients render role-specific snapshots and reuse Play for the five days.

**Tech Stack:** Existing React/JSX/Vite/Vitest/Playwright; Node.js, Express, Socket.IO and qrcode.

**Spec:** `docs/superpowers/specs/2026-11-04-qr-rooms-quiz-design.md` (approved by the user's instruction to complete, test, commit and push).

## Global Constraints

- Preserve five simulation days, existing formulas, party colors, Be Vietnam Pro and local solo storage.
- Five multiple-choice questions, four choices, one correct choice, 10 points each, score separately.
- Authoritative server; no answer key in the browser build or room snapshots before finish.
- Single server process, atomic local room storage; 24-hour expiry and 100 players by default.
- Vietnamese UI; responsive phone, tablet and projector; accessible labels and connection errors.
- User authorized working and pushing on current main branch; no additional approval checkpoints.

## Review Focus

- Acknowledgement lost after disk save: replay must not duplicate a decision or quiz submission.
- Participant credentials cannot invoke host commands or impersonate another participant.
- Refresh, host disconnection and server restart preserve progress and role.
- LAN QR must use a reachable origin; localhost cannot silently become the shared invitation.
- Early finish, full room, late join and incomplete quiz yield explicit recoverable states.

### Task 1: Authoritative room service and realtime server

**Files:** Create `server/{quiz,repository,rooms,index,dev}.js`, `src/room/questions.js`, `tests/rooms.test.js`, `tests/server.test.js`. Modify `package.json`, `vite.config.js`, `.gitignore`.

**Interfaces:** `createRoomService({repository,now,maxPlayers,ttlMs})` returns async `create(requestId)`, `join(code,name,requestId)`, `command(session,action,payload)`, sync `view(session)`, `setConnected(session,connectionId,connected)`, `subscribe(listener)`. Credentials are `{code,token}`. `createGameServer(options)` returns `{httpServer,io,service,close}`. Public question objects are `{id,text,options}`.

- [x] Write failing tests for two players, unauthorized start, sequential confirm/next, server-calculated score, idempotency, quiz before day five, incomplete quiz, concealed answer key, automatic/early finish, duplicate name, late join, expiry, capacity, disk failure and restart.
- [x] Run `npm test -- tests/rooms.test.js tests/server.test.js`; confirm missing implementation failure.
- [x] Implement room service, private quiz key, atomic repository, validated socket commands, connection presence, rate limits, same-origin production serving, LAN/public origin configuration and one-command dev startup.
- [x] Run targeted tests and full `npm test`; expect all pass.

### Task 2: React room flow

**Files:** Create `src/room/{client,useRoom,RoomApp,RoomLobby,Scoreboard,Quiz,rooms.css}.{js,jsx}` as appropriate; modify `src/App.jsx`, `src/ui/{Intro,Play}.jsx`; create `tests/ui/rooms.e2e.js`.

**Interfaces:** React room hook exposes `{session,view,connected,pending,error,send,leave}`; `send(action,payload)` supports create/join/resume/start/confirm/next/quiz/finish. `Play` receives existing game and decision actions; room draft stays local until confirm, next is authoritative.

- [x] Write an end-to-end test with host and two contexts, QR invite, lobby/start, live scores, phone play, reload, quiz and final answers. Run it and observe missing room controls.
- [x] Implement role-specific views using established tokens. Preserve solo start and history. Add clear loading/error/disconnected/empty/closed states, clipboard fallback, accessible radio groups, early finish confirmation and privacy-safe sessionStorage.
- [x] Verify phone and projector screenshots, browser errors, overflow and keyboard quiz selection.
- [x] Run `npm run test:ui`; expect existing solo tests and room tests pass.

### Task 3: Delivery and independent review

**Files:** Modify `README.md`, `PRODUCT.md`, add `.env.example` and deployment instructions. Track outcomes here.

- [x] Document `npm run dev`, `npm run build && npm start`, LAN/public origin and persistent data, single-process hosting and backups.
- [x] Run build, full unit/integration suite and production UI suite; inspect output.
- [x] Obtain a fresh review of the full diff, fix verified issues with regression tests, and re-run affected checks.

Delivery: commit exact project files, push `origin main`, verify remote revision equals local HEAD and working tree is clean; report the revision in the final response.

## Progress

- Baseline: 90 tests passed, branch main clean; origin is `thienphanchan/MLN122`.
- Ruling: execute in current checkout because user explicitly authorized completing, testing, committing and pushing the current game. Keep generated local workflow tools outside commits.
- Ruling: use concurrently in package scripts instead of a separate server/dev.js launcher; share private path validation through server/config.js.
- Final verification: 105 tests in 9 unit/integration files passed; production build passed; 36 browser tests passed across projector (1440×900), tablet (768×1024), phone (390×844).
- Fresh code review found development-server private file access and stale invitation sessions. Both fixed; follow-up found blocked-storage credential loss and glob characters in temporary private-file names. Regression tests reproduced the reachable failures, and all are now resolved.
- Original quiz-key filename finding was narrowed by real Vite tests: direct literal bracket/brace/parenthesis filenames were already blocked, but temporary brace/parenthesis files required escaped deny patterns. Tests cover normal, raw and /@fs access.
- Visual review: status-aware QR copy corrected for playing/finished rooms; final verdict `ship` covers that scored fix, with no visible regressions. Post-copy production build and all 12 room browser scenarios passed. Incumbent visual system and updated product documentation independently checked; no material mismatch.
