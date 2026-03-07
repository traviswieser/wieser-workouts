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
4. After edits, run `node build.js` to compile (requires `@babel/core @babel/preset-react` — install in `/home/claude/` if needed).
5. Push to `dev` for testing. Travis will say "deploy" when ready for `main`.

### Deploy to production:
```
git checkout main && git pull origin main && git merge dev && git push origin main && git checkout dev
```

---

## 📁 File Structure

| File | Purpose |
|------|---------|
| `ww-source.html` | ✅ **The file we edit.** JSX + `<script type="text/babel">`. ~2,211 lines. |
| `build.js` | Build script — compiles JSX, defers autoCue, adds splash screen → outputs `index.html` |
| `index.html` | ❌ **Never edit.** Compiled production output deployed by Netlify. |
| `HANDOFF.md` | This file. Updated at the end of each session. |
| `sw.js` | Service worker file (cache v35). Registered from real URL for proper WebAPK. |
| `manifest.json` | Static PWA manifest — references real icon files, linked via `<link>` in HTML head. |
| `icon-512.jpg` | App icon (512×512, purpose: "any") — the main branded logo with dark bg and glow |
| `icon-512-maskable.jpg` | Maskable icon (512×512, purpose: "maskable") — W on solid dark bg with safe zone |
| `icon-192.png` | App icon (192×192, purpose: "any") |
| `icon-192-maskable.png` | Maskable icon (192×192, purpose: "maskable") |

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
- Delete their account (Danger Zone in Account settings)

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
| `account` | Account page — email, sign out, delete account (Danger Zone) |

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

## 🎨 UI & Icon Patterns

- **Color system:** `C` object (e.g. `C.acc`, `C.bg`, `C.card`, `C.txt`, `C.dim`, `C.bdr`)
- **Theme:** Auto (match device) mode default, user-switchable via settings
- **Font:** Outfit (Google Fonts)
- **App logo:** 512×512 branded logo (`/icon-512.jpg`) — used on sign-in screen (120×120), loading screen (64×64), and as `DBIcon` component
- **DBIcon component** (line ~307): `<img src="/icon-512.jpg">` with rounded corners — defined but currently only referenced in the component definition (sign-in and loading screens use inline `<img>` tags directly)
- **No transparent W logo** — it was removed for quality reasons. The 512px branded logo is the only logo in use.
- **Header bar:** Title text only, no logo icon (logo was removed from header)

### PWA Icons (static files in repo root)
- `icon-512.jpg` — main branded logo with dark background + glow effects (purpose: "any")
- `icon-512-maskable.jpg` — transparent W on solid `#08080A` background with 60% safe zone (purpose: "maskable")
- `icon-192.png` — 192px version for "any" purpose
- `icon-192-maskable.png` — 192px maskable version

---

## 🔑 Account & Auth Features

- **Sign-in:** Google Sign-In via Firebase Auth
- **Sign-in screen:** Shows 512px logo centered (120×120), app name, and tagline
- **Delete Account:** Available in Account screen under "Danger Zone". User must type "DELETE" to enable button. Deletes all 13 Firestore collections for the user, then deletes Firebase Auth account. Handles `auth/requires-recent-login` error gracefully.

---

## ⚠️ Key Lessons Learned

1. **Composite IDs are required** for connection documents — auto-generated IDs break `exists()` checks in security rules.
2. **No read-before-write** in Firestore — use `set()` or `set({merge:true})` to avoid permission errors on non-existent docs.
3. **Unicode emoji** in Firestore strings need proper surrogate pairs, not shorthand escape sequences.
4. **Silent patch failures** can make features appear missing — always verify after applying patches.
5. **Single-field Firestore indexes** are handled automatically. Two composite indexes on `connections` may still need manual creation in Firebase console.
6. **PWA manifest must be a static file** — blob URL manifests prevent Chrome from creating a proper WebAPK (standalone install). Same applies to service worker registration.
7. **Hidden plans count** must filter against `allPlans` to avoid showing stale IDs from removed official plans.
8. **`dataLoaded` state** gates the "no plan" tips on the home screen to prevent flash-of-content before cloud data arrives.

---

## 📋 Recent Commits (last 8)

- `6a2d617` — Fix PWA standalone install, replace transparent W logo with 512px logo, deploy static manifest
- `2025091` — Use 512px logo for app icon, remove header logo, add delete account, fix hidden plans count
- `e7b996c` — Fix app icon, replace dumbbell logo, fix Instructions flash
- `3c735bd` — Change theme default to auto mode
- `b706c78` — Add HANDOFF.md
- `a5bb5af` — Fix permissions, real logo, superset link UX
- `f6564cc` — v33: Theme system, progress all-plans, chat/coach fixes, exercise types
- `2c46f15` — Hotfix: add missing saveDraft/clearDraft functions, fix duplicate Firebase init

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
- Further PWA testing after Chrome cache clear + reinstall

---

*Last updated: 2026-03-07 (session 3)*
