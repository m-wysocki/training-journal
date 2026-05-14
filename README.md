# Training Journal

Training Journal is a web app for logging workouts and reviewing progress over time.
I built it around a simple flow: define exercise setup once, log sessions quickly, and come back to clear history and weekly stats.

## What it does

- Email/password authentication with Supabase Auth.
- Access flow with `pending` and `approved` user states.
- Exercise setup management (categories and exercises).
- Workout logging for three exercise types:
  - `strength` (sets, reps, load)
  - `cardio` (distance, pace)
  - `duration` (time-based sets)
- Edit and review completed workout entries.
- Filter training history by date range and category.
- Weekly statistics grouped by exercise category.
- Optional admin notification on new signup (Resend API).

## Tech stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- SCSS Modules
- Radix UI
- lucide-react
- ESLint

## Architecture notes

- Server Components by default, Client Components only where interaction/state is needed.
- Supabase access is kept in `src/lib/supabase/*`.
- Feature-level structure with local `_components`, `_hooks`, and `_helpers`.
- PostgreSQL + RLS policies to enforce per-user data access.

## Main routes

- `/` - home dashboard
- `/completed-exercises/new` - log workout
- `/completed-exercises` - training history
- `/stats` - weekly stats
- `/settings/exercise-categories` - exercise setup

## Local setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables (`.env`)

Required:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Optional:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=
ADMIN_EMAIL=
AUTH_NOTIFICATION_FROM_EMAIL=
```

### 3) Initialize database schema

Run:

```sql
sql/initial-schema.sql
```

in Supabase SQL Editor.

### 4) Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Access after signup

New accounts start as `pending`.  
To grant access, set `approved = true` in `public.user_access`.

## Scripts

- `npm run dev` - development server
- `npm run build` - production build
- `npm run start` - run production build
- `npm run lint` - lint checks

## What this project demonstrates

- Auth + authorization flow with DB-level access control (RLS).
- Practical Server/Client component boundaries in Next.js App Router.
- Data modeling for multiple workout types in one journal.
- Maintainable feature organization and clear separation of concerns.
