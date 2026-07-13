# DXC Portal

Internal portal for projects, service requests, calendar, and team operations.

## Stack

- Next.js
- Firebase Authentication, Firestore, and Storage
- Deployed on Vercel (`Web App` as root directory)

## Setup

1. Copy `.env.example` to `.env.local` and fill Firebase web config for project `dxc-portal`.
2. Install dependencies with `pnpm install` (or `npm install`).
3. Run `pnpm dev`.

## Scripts

- `pnpm dev` — local development
- `pnpm build` — production build
- `pnpm start` — start production server
