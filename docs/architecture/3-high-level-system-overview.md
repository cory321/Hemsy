# 3. High-Level System Overview

```text
┌────────────────────────────┐
│    Marketing Site (ISR)    │
│  Next.js / Vercel Edge CDN │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│  Hemsy App (PWA)     │
│  Next.js 15+ (App Router)  │
│  MUI, React Server Components │
└─────────────┬──────────────┘
 Server Actions│   Client Components
              ▼
┌───────────────────────────────────┐
│  Backend Logic & Data Access     │
│  Next.js Server Actions + Supabase JS SDK │
└──────┬───────────────┬────────────┘
       │               │
       ▼               ▼
┌────────────┐    ┌──────────────────┐
│ Supabase   │    │ External Services │
│ PostgreSQL │    │ (Clerk, Stripe,  │
└────────────┘    │  Resend, Twilio, │
                  │  Cloudinary)     │
                  └──────────────────┘
```

---
