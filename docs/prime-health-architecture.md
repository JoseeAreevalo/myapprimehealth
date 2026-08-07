# Prime Health Architecture

## Product boundaries

Prime Health is a premium nutrition and coaching platform. It is organized around three roles: `superAdmin`, `coach`, and `client`. Role capabilities are enforced by the API and never by frontend visibility alone.

## Target architecture

```text
apps/
  web/                 React PWA client
  api/                 REST API and background job entry points
packages/
  contracts/           Versioned DTOs, schemas, API error contracts
  ui/                  Accessible, role-agnostic design-system primitives
  config/              Shared TypeScript, linting, and build configuration
docs/                  Product and architecture documentation
infra/                 Container, deployment, and environment configuration
```

The current `frontend/` and `api/` folders are the transition locations for `apps/web` and `apps/api`. They will be moved only after the foundational API and shared-contract package exist, avoiding a disruptive, non-functional repository move.

## Domain modules

Each module owns its use cases, domain models, persistence adapters, HTTP controllers, and tests:

- `identity`: sessions, credentials, password recovery, refresh token rotation.
- `access`: roles, permissions, authorization policies, audit events.
- `people`: profiles and coach-client relationships.
- `nutrition`: food catalog, meal plans, nutrition plans, macros, supplements.
- `checkIns`: weekly check-ins, measurements, photos, adherence, comments, notes.
- `progress`: historical aggregates and chart-ready read models.
- `files`: secure upload intents and metadata.
- `notifications`: user preferences, schedules, delivery attempts.
- `administration`: platform settings, branding, module switches, user management.

## Data and integration decisions

- PostgreSQL is the production system of record. It is selected for transactional integrity, relationships, constraints, JSON support where genuinely useful, and reporting growth.
- Object storage holds PDFs and progress photographs. Database records contain only metadata and authorized object references.
- The API publishes versioned REST contracts. Native clients will consume these same contracts.
- Background jobs process reminders, email, media cleanup, and future analytics. A queue keeps delivery work outside request-response paths.
- Health integrations, barcode scanning, payments, and AI recommendations are ports behind domain interfaces. They are not part of the core model.

## Security baseline

- Short-lived access tokens and rotating, revocable refresh tokens.
- Passwords hashed with Argon2id.
- Authorization policies checked on every protected use case.
- Upload URLs are time-limited and scoped to the authenticated owner.
- Immutable audit events cover administrative and clinical-plan changes.
- Secrets live only in environment-specific secret stores; no keys in source control.

## Check-in model

Weekly check-ins are a first-class aggregate. A check-in is attached to a client and a week, and may contain body weight, measurements, photos, comments, adherence, notes, and coach review. The calendar is a projection of this aggregate, making it reliable for web and future native applications.

## Quality gates

- Unit tests for domain use cases and repositories.
- API integration tests for authorization and response contracts.
- Component tests for interaction-heavy web components.
- End-to-end coverage for authentication, client check-in, and coach review.
- Type checking, linting, tests, and production builds required in CI.
