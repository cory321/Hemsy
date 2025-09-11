# Hemsy PRD (Condensed)

## Overview

**Hemsy**: Web app for seamstresses/tailoring businesses  
**Users**: Solo seamstresses, tailoring shops, alteration businesses  
**Core**: Fast, mobile-first workflow for clients, orders, garments, appointments, invoices

## Tech Stack

- **Runtime**: Node.js 22.17.1
- **Stack**: Next.js 15+ (App Router), TypeScript, MUI, Supabase, Clerk, Stripe
- **Services**: Cloudinary (storage), Resend (email), Twilio (SMS), Vercel (hosting)
- **Monitoring**: Sentry, Logtail/Datadog

## Core Features

1. **Dashboard**: Quick actions, priority garments, today's appointments
2. **Clients**: Contact info, order history, search/filter
3. **Orders**: Parent of garments, service attachment, confirmation flow
4. **Garments**: Stage tracking (New→In Progress→Ready→Done), filters
5. **Appointments**: Conflict-free calendar, working hours, buffer times
6. **Services**: Alteration catalog with pricing
7. **Invoices**: Create, send (Stripe), manual payments
8. **Settings**: Business info, hours, payment preferences

## Requirements

- **Performance**: <1.5s marketing, <2s dashboard
- **Mobile**: Large targets, swipe gestures, bottom sheets
- **Security**: HTTPS, Clerk auth, Stripe PCI
- **Accessibility**: WCAG 2.1 AA
- **Reliability**: 99.9% uptime, optimistic UI
