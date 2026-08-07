# Prime Health

Prime Health is a premium nutrition and coaching platform for clients, coaches, and platform administrators. It is designed as a responsive web application that can evolve into native Android and iOS clients without rewriting the core domain or API.

## Technology foundation

- **Web:** React, TypeScript, Vite, Tailwind CSS.
- **API:** Express, TypeScript, OpenAPI.
- **Data:** PostgreSQL.
- **Security:** role-based authorization, short-lived access tokens, rotating refresh tokens, and auditable administrative actions.
- **Infrastructure:** Docker Compose for local parity with production.

## Product roles

| Role | Primary responsibility |
| --- | --- |
| Super admin | User governance, coaches, clients, permissions, branding, modules, platform settings, and audit access. |
| Coach | Client care, nutrition and meal plans, macros, supplements, goals, documents, progress, and coaching feedback. |
| Client | Plans, meals, consumption records, weekly check-ins, measurements, photos, hydration, adherence, progress, and reminders. |

## Local development

1. Copy `.env.example` to `.env`.
2. Replace `JWT_ACCESS_SECRET` with a long, random local development secret.
3. Start PostgreSQL:

   ```bash
   docker compose up database
   ```

4. Install dependencies:

   ```bash
   npm install
   ```

5. Start the web application and API:

   ```bash
   npm run dev
   ```

The web application runs on `http://localhost:5137`. The API runs on `http://localhost:3000`, with OpenAPI documentation at `http://localhost:3000/api-docs`.

## Documentation

- [Prime Health Architecture](./docs/prime-health-architecture.md)

## Current scope

The initial release establishes the premium web experience and the identity foundation. Nutrition planning, weekly check-ins, progress charts, notifications, file uploads, and administration are implemented as independent milestones so the platform remains maintainable as it grows.
