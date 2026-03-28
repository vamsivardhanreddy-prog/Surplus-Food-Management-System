# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Real-time**: Socket.io
- **Auth**: JWT (jsonwebtoken + bcryptjs)

## Application: Smart Surplus Food Management System (ShareBite)

A web app connecting food donators with verified NGOs to minimize food waste.

### User Roles
- **Admin**: Manages platform, verifies/rejects NGO registrations, views statistics
- **Donator**: General public/restaurants who donate surplus food
- **NGO**: Verified organizations (orphanages, old age homes, trusts) who claim food

### Key Features
- JWT authentication with role-based access control
- NGO verification flow (pending → verified/rejected)
- Food donation creation with geolocation
- Geospatial matching to find nearby NGOs (Haversine formula)
- Real-time Socket.io notifications for nearby NGO alerts
- Donation claiming with double-booking prevention
- Admin dashboard with platform statistics

### Demo Credentials
- Admin: `admin@foodmgmt.com` / `password`

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server with Socket.io
│   └── food-mgmt/          # React + Vite frontend (ShareBite)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array.

## Database Schema

Tables:
- `users` — user accounts with roles (admin/donator/ngo) and statuses (active/pending_verification/verified/rejected)
- `donations` — food donations with geolocation (lat/lng), food items (JSONB), expiry time, dietary type
- `notifications` — in-app notifications for all user events

## API Routes

All routes under `/api`:
- `POST /auth/register` — register as donator or NGO
- `POST /auth/login` — login
- `GET /auth/me` — current user
- `GET /users` — list all users (admin only)
- `GET /users/ngos/pending` — list pending NGO verifications
- `PATCH /users/:id/verify` — verify or reject NGO
- `GET /users/stats` — platform statistics
- `GET /donations` — list donations (role-filtered)
- `POST /donations` — create donation (donator only)
- `GET /donations/nearby` — list nearby available donations (verified NGO only)
- `GET /donations/:id` — get donation details
- `POST /donations/:id/claim` — claim a donation (verified NGO only)
- `POST /donations/:id/complete` — mark as completed
- `GET /notifications` — get user notifications
- `PATCH /notifications/:id/read` — mark notification as read
- `PATCH /notifications/read-all` — mark all as read

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
