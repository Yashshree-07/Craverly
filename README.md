# Craverly — food delivery app

A food delivery PWA demo built with **React 19 + TypeScript + Vite**, **Tailwind CSS v4**, **Zustand**, **React Router v7**, **React Query**, and optional **Supabase** for a live backend.

## Features

- Auth: email/password (local mock or Supabase), optional Google OAuth
- Browse restaurants: search + voice, filters, URL-synced, infinite "Load more"
- Restaurant detail: menu with customizations, allergen & calorie filters, reviews with photo upload, dish favorites
- Cart & checkout: guest checkout, saved addresses, payment methods, discount codes, invoice PDF
- Order tracking: live status timeline, map, realtime updates (Supabase Postgres changes), printable invoice
- AI-style chatbot (rule-based) with voice input and quick replies
- Personalized recommendations engine, group ordering with invite codes + split bill
- Order analytics dashboard (Recharts)
- Dark mode, responsive design, PWA-ready

## Quick start

```bash
npm install
npm run dev
```

Other scripts:

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run build`   | Type-check (`tsc -b`) + production build |
| `npm run lint`    | Oxlint                               |
| `npm run test`    | Run Vitest unit tests (`vitest run`) |
| `npm run preview` | Preview the production build         |

## Supabase setup

The app runs in **local/mock mode** out of the box (no keys needed — auth, orders and reviews persist in `localStorage`). To enable the live backend:

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env.local` and fill in your project URL and anon key:

   ```bash
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Open the **SQL Editor** in your Supabase dashboard and run the whole
   `supabase/migrations/0001_init.sql` file. This creates the `profiles`, `orders`,
   `reviews`, `review_helpful`, `group_sessions` and `group_session_items` tables with
   Row Level Security, the `review-photos` storage bucket, and enables realtime on
   orders/group items.
4. (Optional) Enable **Google** under Authentication → Providers → Google and add the
   following URL to the allowed redirect URLs:
   `http://localhost:5173/auth/callback`

With Supabase enabled, auth is real, orders/reviews/favorites live in Postgres with
realtime order tracking, review photos upload to Storage, and group orders sync
across devices. If the env keys are absent, everything falls back to local mocks.

## Tests

```bash
npm test
```

Tests cover the chat intent engine and the recommendations engine with a jsdom +
`localStorage` shim (`src/test/setup.ts`).