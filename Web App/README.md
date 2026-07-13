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

## Deploy (Vercel)

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `Web App`.
3. Add the same `NEXT_PUBLIC_FIREBASE_*` env vars as `.env.example`.
4. Deploy.
5. In Firebase Auth → Authorized domains, add your Vercel domain.

## Firebase

Enable Email/Password Auth, Firestore, and Storage on project `dxc-portal`.

Deploy rules/indexes from this folder:

```bash
npx -y firebase-tools@latest deploy --only firestore,storage --project dxc-portal
```

Composite indexes are listed in `firestore.indexes.json` (also prompted by the Firebase console when queries first run).

### First admin

1. Create an Auth user (email/password) in the Firebase console.
2. Sign in once so `users/{uid}` is created with role `staff`.
3. In Firestore, set that user’s `role` to `admin`.
4. Use the client switcher to create a client and assign memberships under Settings → Team members.

## Smoke test

- Switch clients: Dashboard, Projects, and Service Requests should change; Calendar should stay org-wide.
- Create a service request and move stages — progress should follow 0/20/40/60/80/100.
- Create a project, add subtasks, confirm project progress rolls up; set allocated/spent finance.
- Add annual leave (emerald) and staff movement (amber) on Calendar.
- Edit Profile (avatar/cover) and Settings preferences.
