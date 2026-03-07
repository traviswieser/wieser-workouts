# Wieser Workouts — Project Handoff Doc

> **For Claude:** Read this file at the start of every session. Do not ask Travis to re-explain the project. Clone the repo and start coding.

---

## 🚀 Session Startup (Do This Every Time)

1. Clone the repo using the token Travis provides:
   ```
   git clone https://TOKEN@github.com/traviswieser/wieser-workouts.git repo
   cd repo && git checkout dev
   ```
2. **Always work on the `dev` branch.** Never edit `main` directly.
3. Edit `ww-source.html` only. Never touch `index.html`.
4. After edits, run `node build.js` to compile.
5. Push to `dev` for testing. Travis will say "deploy" when ready for `main`.

### Deploy to production:
```
git checkout main && git merge dev && git push origin main && git checkout dev
```

---

## 📁 File Structure

| File | Purpose |
|------|---------|
| `ww-source.html` | ✅ **The file we edit.** JSX + `<script type="text/babel">`. 2,199 lines. |
| `build.js` | Build script — compiles JSX, defers autoCue, adds splash screen → outputs `index.html` |
| `index.html` | ❌ **Never edit.** Compiled production output deployed by Netlify. |
| `HANDOFF.md` | This file. Updated at the end of each session. |

---

## 🏗️ Tech Stack

- **Frontend:** React PWA, single-file architecture (`ww-source.html`)
- **Backend:** Firebase / Firestore (real-time listeners, security rules)
- **Deployment:** Netlify auto-deploys from `main` branch via GitHub
- **Repo:** `github.com/traviswieser/wieser-workouts`
- **Branches:** `main` (production) · `dev` (testing)

---

## 👤 App Overview

Wieser Workouts is a personal workout tracking PWA. Users can:
- Create and follow structured workout plans (phases → days → exercises)
- Log sessions and track progress
- Connect with coaches for plan assignment and messaging
- Browse community plans and a leaderboard

---

## 🧭 Screen Architecture

The app uses a single `screen` state variable to render different views. Key screens:

| Screen ID | Description |
|-----------|-------------|
| `home` | Dashboard — active plan, coach instructions, getting-started tips for new users |
| `workout` | Active workout session |
| `plans` | Manage Plans (user's saved plans) |
| `create` | Plan editor (cpScreen sub-state: `main` / `edit`) |
| `progress` | Progress charts |
| `leaderboard` | Leaderboard (accessible from dropdown menu) |
| `community` | Community plans browse |
| `coaching` | Coach/athlete connection hub |
| `coachDir` | Find a Coach directory |
| `chatlist` | Message thread list |
| `chat` | Individual chat thread |
| `settings` | App settings |

Navigation lives in `NAV_OPTIONS` array (~line 479). Top bar has app title (clickable → home) and a hamburger dropdown menu.

---

## 🎯 Coaching Platform (Phases 1–3 Complete)

### Phase 1 — Coach Registration & Connections
- Coaches register with a 6-character auto-generated invite code
- Athletes connect to coaches using the code
- Connection documents use **composite IDs** (`coachUid_athleteUid`) — critical for Firestore `exists()` checks in security rules
- Athletes can connect to multiple coaches simultaneously

### Phase 2 — Plan Assignment
- Coaches can assign plans to individual athletes or bulk-assign
- Athlete detail view has tabs: Sessions / Plans / Instructions
- Coach instructions surface on athlete's home screen

### Phase 3 — Real-Time Chat & Notifications
- Firestore `onSnapshot` listeners for real-time chat
- Auto-notifications on session save and plan assignment
- Notification preference toggles
- Unread badge on chat header icon
- Listener cleanup on screen change and sign-out

### Firestore Collections
| Collection | Purpose |
|------------|---------|
| `users/{uid}` | User profile, workout history, plans |
| `coaches/{uid}` | Coach profile, invite code |
| `connections/{coachUid_athleteUid}` | Coach-athlete link (composite ID) |
| `chats/{chatId}` | Chat metadata |
| `chats/{chatId}/messages` | Individual messages |
| `coachPlans/{uid}` | Plans assigned by coach |
| `coachNotes/{uid}` | Coach instructions for athlete |

### Key Firestore Rules Notes
- Connection documents **must** use composite IDs (`coachUid_athleteUid`) for `exists()` checks
- Coach connect and chat use `set()` / `set({merge:true})` — no read-before-write (avoids permission errors)
- Security rules cover all collections above

---

## 🎨 UI Patterns

- **Color system:** `C` object (e.g. `C.acc`, `C.bg`, `C.card`, `C.txt`, `C.dim`, `C.bdr`)
- **Theme:** Auto (match device) mode default, user-switchable via settings
- **Font:** Outfit (Google Fonts)
- **Icons:** Inline SVG components (e.g. `<DBIcon/>`)
- **Logo:** Real "W" logo embedded as base64 (192px PNG + 512px JPEG)

---

## ⚠️ Key Lessons Learned

1. **Composite IDs are required** for connection documents — auto-generated IDs break `exists()` checks in security rules.
2. **No read-before-write** in Firestore — use `set()` or `set({merge:true})` to avoid permission errors on non-existent docs.
3. **Unicode emoji** in Firestore strings need proper surrogate pairs, not shorthand escape sequences.
4. **Silent patch failures** can make features appear missing — always verify after applying patches.
5. **Single-field Firestore indexes** are handled automatically. Two composite indexes on `connections` may still need manual creation in Firebase console.

---

## 📋 Recent Commits (last 5)

- `a5bb5af` — Fix permissions, real logo, superset link UX
- `f6564cc` — v33: Theme system, progress all-plans, chat/coach fixes, exercise types
- `2c46f15` — Hotfix: add missing saveDraft/clearDraft functions, fix duplicate Firebase init
- `5ae7923` — Keep nav bar visible during workouts, stack Finish button above it
- `5c6c619` — Auto-save workouts, Finish Workout button, fix nav overlap

---

## 💡 Token-Efficient Session Tips (for Travis)

- **Don't upload `ww-source.html`** — Claude will clone it from GitHub directly.
- **Do attach this HANDOFF.md** at the start of each new chat (or just tell Claude to clone the repo and read it).
- **Be specific upfront** — one clear task sentence saves multiple back-and-forth clarification turns.
- **One feature per session** when possible — focused sessions use far fewer tokens.
- At the end of each session, say: **"Update the handoff doc"** so this file stays current.

---

## 🔜 On the Horizon

- Two composite indexes on `connections` collection may need manual creation in Firebase console
- Push notifications (Web Push API) — not yet implemented
- Coach analytics dashboard — not yet implemented
- Coach remotely setting an athlete's active plan — not yet implemented

---

*Last updated: 2026-03-06*
