# Gullak Money API

Personal finance tracker. REST API built with Node.js, Express, PostgreSQL, and Prisma.

## Stack

- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT authentication
- Swagger docs at `/docs`

## Local Setup

```bash
npm install
cp .env.example .env
# fill in DATABASE_URL and JWT_SECRET in .env
npx prisma migrate dev
node prisma/seed.js
npm run dev
```

Server runs on `http://localhost:3000`.  
Swagger UI: `http://localhost:3000/docs`

## Environment Variables

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port (default: 3000) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) |

## Database

```bash
# apply migrations
npx prisma migrate dev

# seed default categories
node prisma/seed.js

# open Prisma Studio
npm run db:studio
```

## API Overview

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register |
| POST | `/auth/login` | No | Login |
| GET | `/users/me` | Yes | Get profile |
| PATCH | `/users/me` | Yes | Update profile |
| PATCH | `/users/me/password` | Yes | Change password |
| GET | `/transactions` | Yes | List with filters + pagination |
| POST | `/transactions` | Yes | Create transaction |
| GET | `/transactions/:id` | Yes | Get transaction |
| PATCH | `/transactions/:id` | Yes | Update transaction |
| DELETE | `/transactions/:id` | Yes | Delete transaction |
| GET | `/categories` | Yes | List categories |
| POST | `/categories` | Yes | Create custom category |
| PATCH | `/categories/:id` | Yes | Update custom category |
| DELETE | `/categories/:id` | Yes | Delete custom category |
| GET | `/analytics/summary` | Yes | Income, expense, net balance |
| GET | `/analytics/by-category` | Yes | Spending by category |
| GET | `/analytics/monthly` | Yes | Month-over-month breakdown |
| GET | `/health` | No | Health check |

All protected routes require `Authorization: Bearer <token>`.

### Query params — transactions

| Param | Type | Description |
|---|---|---|
| `type` | `INCOME` \| `EXPENSE` | Filter by type |
| `categoryId` | integer | Filter by category |
| `dateFrom` | date | Range start (inclusive) |
| `dateTo` | date | Range end (inclusive) |
| `page` | integer | Default: 1 |
| `limit` | integer | Default: 20, max: 100 |
| `sortBy` | `date` \| `amount` \| `createdAt` | Default: `date` |
| `order` | `asc` \| `desc` | Default: `desc` |

### Query params — analytics

All analytics endpoints accept `dateFrom` and `dateTo`. `/analytics/by-category` also accepts `type`.

## Deployment on Render

1. Create a new **Web Service** pointing to this repo.
2. Set **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
3. Set **Start Command**: `node server.js`
4. Add all environment variables from `.env.production.example`.
5. Create a **PostgreSQL** database on Render and copy the internal connection string into `DATABASE_URL`.
6. After first deploy, run the seed manually via the Render shell: `node prisma/seed.js`

A `render.yaml` is included for infrastructure-as-code deploys.

## Tradeoffs

**No refresh tokens** — JWTs expire and users re-login. Acceptable for a personal finance app with no high-security requirements.

**Default categories are global** — stored with `userId = null`. Simpler than duplicating them per user on register, but means a schema migration is required to add or rename defaults.

**Raw SQL for monthly analytics** — Prisma's `groupBy` doesn't support `DATE_TRUNC`/`TO_CHAR`, so `$queryRaw` is used for the monthly breakdown only. The rest of the queries use the Prisma client.

**No soft deletes** — transactions and categories are hard deleted. Keeps the schema simple; there's no audit trail requirement here.

**Single token auth** — no RBAC, no roles. Every authenticated user has the same access scope over their own data.
