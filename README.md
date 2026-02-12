# Examda — Offline-First Exam Reminder App

A mobile exam reminder application built with **Expo (React Native)** and a **NestJS** backend. Designed with an **offline-first architecture** — all core features (creating exams, setting reminders, completing exams, earning coins) work without an internet connection and sync automatically when connectivity is restored.

---

## Key Features

- **Exam Management** — Create, edit, delete, and mark exams as complete
- **Local Notifications** — Configurable reminders (1 min, 1 hour, 1 day before exam)
- **Focus Timer** — Pomodoro-style countdown with coin rewards
- **Coin Economy** — Earn coins by completing exams (+5) and focus sessions (+2–30)
- **Shop & Inventory** — Purchase and equip avatar items with earned coins
- **Offline-First** — Full functionality without internet; data syncs on reconnect
- **JWT Authentication** — Secure student login with bcrypt password hashing

---

## Tech Stack

| Layer             | Technology                      |
| ----------------- | ------------------------------- |
| **Mobile App**    | React Native (Expo SDK 54)      |
| **Routing**       | Expo Router v6 (file-based)     |
| **Local Storage** | expo-sqlite (SQLite)            |
| **Notifications** | expo-notifications (local only) |
| **Auth Storage**  | expo-secure-store               |
| **Backend**       | NestJS 11                       |
| **ORM**           | Prisma 7                        |
| **Database**      | MySQL / MariaDB                 |
| **Auth**          | Passport + JWT                  |

---

## Architecture Overview

### Offline-First Design

```
┌───────────────────────────────────┐
│           Mobile Client           │
│                                   │
│  ┌──────────┐    ┌─────────────┐  │
│  │  SQLite  │◄──►│  Services   │  │
│  │  (source │    │  (exams,    │  │
│  │  of truth)│    │  sync, db) │  │
│  └──────────┘    └──────┬──────┘  │
│                         │         │
│  ┌──────────────────────┴───────┐ │
│  │  Expo Local Notifications    │ │
│  └──────────────────────────────┘ │
└──────────────────┬────────────────┘
                   │ (when online)
                   ▼
┌──────────────────────────────────┐
│         NestJS Backend           │
│  ┌──────────┐    ┌────────────┐  │
│  │  Prisma  │◄──►│   MySQL    │  │
│  └──────────┘    └────────────┘  │
└──────────────────────────────────┘
```

**Local SQLite is the source of truth.** The client reads and writes to SQLite first, then syncs bidirectionally with the server:

- **Push** — Local pending changes (creates, updates, deletes, completions) are pushed to the server
- **Pull** — Remote exams are fetched and merged into SQLite (local changes win on conflict)
- **Coin sync** — Offline coin awards (exam completion, timer rewards) are tracked as a `pendingCoinDelta` and synced on reconnect

### Notification System

Notifications are handled **entirely on the client** using Expo local notifications:

- Scheduled via `Notifications.scheduleNotificationAsync()`
- Metadata stored in SQLite `notification_schedules` table
- Cancelled and rescheduled when exams are updated or deleted
- **No server-side push notifications** — the backend stores only exam metadata

---

## Features in Detail

### Exam CRUD

- Create exams with name, description, date/time, and notification preferences
- Edit existing exams with automatic notification rescheduling
- Delete exams with automatic notification cancellation
- Complete exams with instant +5 coin reward (works offline)

### Focus Timer

- Configurable durations: 60s (+2 coins), 20min (+10), 30min (+15), 1hr (+30)
- Coins awarded locally in SQLite immediately — server sync in background

### Offline Support

- All screens function without internet (except Shop and Inventory)
- Offline banner shown on profile screen
- Password changes require connectivity (communicated to user)
- Sync triggers automatically when connection is restored

### Authentication

- Student ID + password login
- JWT tokens stored in Secure Store
- User profile cached in SQLite for offline access

### Shop & Inventory

- Browse and purchase avatar items with coins
- Equip purchased items as profile avatar
- Requires internet connectivity

---

## 🗃 Database Schema

### Remote (MySQL via Prisma)

| Model        | Description                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| **User**     | Student account with `studentId`, name, email, `coin` balance, and optional `equippedItemId`             |
| **Exam**     | Exam entry with name, description, `examDateTime`, `remindBeforeMinutes` (JSON array), `isComplete` flag |
| **ShopItem** | Purchasable avatar item with name, description, `price`, and `imageUrl`                                  |
| **UserItem** | Junction table — tracks which items each user has purchased (unique per user+item)                       |

### Local (SQLite)

| Table                      | Purpose                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| **exams**                  | Mirrors server exams + sync metadata (`syncStatus`, `locallyModifiedAt`, `deletedLocally`) |
| **notification_schedules** | Local notification metadata (exam ID, minutes before, Expo notification ID)                |
| **user_cache**             | Cached user profile + coin sync tracking (`coinSyncPending`, `pendingCoinDelta`)           |
| **sync_metadata**          | Key-value store for sync state (e.g., `lastSyncTime`)                                      |

---

## Setup Instructions

### Prerequisites

- **Node.js** ≥ 18
- **MySQL** or **MariaDB** instance
- **Expo CLI** (`npx expo`)
- iOS Simulator / Android Emulator / Physical device with Expo Go

### 1. Clone the Repository

```bash
git clone https://github.com/TeeNzario/examda.git
cd examda
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file:

```env
DATABASE_URL="mysql://user:password@localhost:3306/examda"
JWT_SECRET="your-secure-jwt-secret"
JWT_EXPIRES_IN="7d"
```

Run Prisma migrations and start the server:

```bash
npx prisma db push
npx prisma generate
npm run start:dev
```

The server runs on `http://localhost:3000` by default.

### 3. Client Setup

```bash
cd client
npm install
```

Update the API base URL in `services/api.ts` to point to your backend:

```typescript
const api = axios.create({
  baseURL: "http://<YOUR_SERVER_IP>:3000",
});
```

Start the Expo dev server:

```bash
npm run start
```

Scan the QR code with Expo Go or press `i` for iOS simulator / `a` for Android emulator.

---

## Offline Sync Logic

### How It Works

1. **All writes go to SQLite first** with `syncStatus: "pending"`
2. **Online operations** also attempt immediate server sync
3. **On reconnect**, `_layout.tsx` detects the transition and triggers:
   - `syncExams()` — pushes pending creates/updates/deletes/completions
   - `syncUserData()` — pulls fresh user profile from server
   - `syncCoinDelta()` — pushes accumulated offline coin rewards

### Pending Change Types

| Change        | Local Action                                         | Sync Action                               |
| ------------- | ---------------------------------------------------- | ----------------------------------------- |
| Create exam   | Insert into SQLite (`syncStatus: pending`)           | `POST /exams` → update `serverId`         |
| Update exam   | Update SQLite → set `pending`                        | `PATCH /exams/:id`                        |
| Delete exam   | Set `deletedLocally = 1`                             | `DELETE /exams/:id` → hard delete locally |
| Complete exam | Set `isComplete = true` + add 5 coins to cache       | `POST /exams/:id/complete`                |
| Timer reward  | Add coins to `user_cache` + track `pendingCoinDelta` | `PATCH /users/coins/add`                  |

### Conflict Resolution

- **Local wins** — If a local exam has `syncStatus: pending`, remote updates are ignored
- **Server deletions** — If a synced exam is deleted remotely, it's removed locally
- **Coin delta** — Accumulated offline coins are pushed as a single delta on reconnect

---

## 📁 Folder Structure

```
examda/
├── client/                      # Expo React Native app
│   ├── app/                     # Expo Router file-based routes
│   │   ├── _layout.tsx          # Root Stack navigator + auth routing
│   │   ├── login.tsx            # Login screen
│   │   ├── profile.tsx          # User profile (stack screen)
│   │   ├── (tabs)/              # Tab navigator group
│   │   │   ├── _layout.tsx      # Tab bar configuration
│   │   │   ├── index.tsx        # Home screen
│   │   │   ├── count.tsx        # Focus timer
│   │   │   ├── shop.tsx         # Item shop
│   │   │   └── inventory.tsx    # User inventory
│   │   └── list/                # Exam list routes (stack screens)
│   │       ├── index.tsx        # Exam list
│   │       ├── create.tsx       # Create exam form
│   │       └── [id].tsx         # Edit exam form
│   ├── components/              # Reusable UI components
│   ├── context/                 # React contexts (Auth, Network)
│   ├── hooks/                   # Custom hooks
│   ├── services/                # Business logic layer
│   │   ├── api.ts               # Axios HTTP client
│   │   ├── database.ts          # SQLite operations
│   │   ├── syncService.ts       # Bidirectional sync engine
│   │   ├── exams.ts             # Offline-first exam operations
│   │   ├── notificationService.ts # Local notification scheduling
│   │   └── users.ts             # User API calls
│   └── types/                   # TypeScript type definitions
│
└── server/                      # NestJS backend
    ├── prisma/
    │   └── schema.prisma        # Database schema
    └── src/
        ├── auth/                # JWT authentication module
        ├── exams/               # Exam CRUD + completion
        ├── users/               # User profile + coins
        ├── shop/                # Shop item listings
        ├── inventory/           # User item management
        └── prisma/              # Prisma service module
```

### Routing Structure

| Route               | Type          | Description                  |
| ------------------- | ------------- | ---------------------------- |
| `/login`            | Stack         | Authentication screen        |
| `/(tabs)`           | Tab Navigator | Main app with bottom tab bar |
| `/(tabs)/index`     | Tab           | Home screen                  |
| `/(tabs)/count`     | Tab           | Focus timer                  |
| `/(tabs)/shop`      | Tab           | Item shop                    |
| `/(tabs)/inventory` | Tab           | User inventory               |
| `/list`             | Stack         | Exam list (no tab bar)       |
| `/list/create`      | Stack         | Create exam form             |
| `/list/[id]`        | Stack         | Edit exam form               |
| `/profile`          | Stack         | User profile (no tab bar)    |

---

## Future Improvements

- **Server Push Notifications** — Optional Expo push notifications for cross-device reminders
- **Multi-Device Sync** — Real-time sync across multiple devices via WebSockets
- **Analytics Dashboard** — Track study habits, focus time, and completion rates
- **Exam Categories** — Organize exams by subject or course
- **Recurring Reminders** — Weekly/daily study reminder scheduling
- **Dark Mode** — Full theme support with system preference detection
- **Export/Import** — Backup and restore exam data

---

## License

This project is private and unlicensed.

---

<p align="center">
  Built with ❤️ using Expo + NestJS
</p>
