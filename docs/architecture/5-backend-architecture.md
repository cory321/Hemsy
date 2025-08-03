# 5. Backend Architecture

- **Runtime:** Node.js 22.17.1
- **Server Layer:** Next.js Server Actions
- **Data Access:** Supabase JS SDK via shared `server/db/`
- **Logic:** Modular server actions, atomic DB transactions
- **Feature Flags:** `trial_countdown_enabled`

## 5.1 User Identity & Synchronization

- Clerk user IDs (`clerk_user_id`) map to Supabase `users` table.
- On sign-in, `ensureUser()` upserts user.
- Clerk webhook keeps email/name in sync.
- Supabase RLS enforces row-level access.

---
