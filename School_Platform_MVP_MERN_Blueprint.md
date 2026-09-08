# School Platform — MVP Blueprint (MERN + TypeScript)

**Scope:** Multi-tenant school management MVP. Core + Academics + Fees/Payments.
**Stack:** MongoDB, Express, React, Node — all TypeScript.
**Cost rule:** Free tier only until the product is validated. No paid plans, no domain, no live payment gateway yet.
**Relationship to v2:** The heavier Next.js/NestJS/Postgres/microservice blueprint stays as the future scale-up path once this MVP proves the product. Nothing here blocks that migration — the domain model and API boundaries are designed so v2 can absorb them.

---

## 1. Why MERN for the MVP

You already know JS/TS end to end, one language across the stack means faster iteration, and Mongo's document model is genuinely a good fit for a v1 school app — a lot of your data (timetables, report cards, submissions) is naturally nested rather than relational. You lose Postgres's strict relational guarantees, so the trade-off is: move fast now, pay a bit of a migration cost later when you actually hit the scale where Postgres + microservices earns its complexity. That's the right trade for an MVP.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + TypeScript (Vite) | Vite over CRA — faster dev server, actively maintained |
| Backend | Node.js + Express + TypeScript | Single API service, modular by domain |
| Database | MongoDB (Atlas Free tier) | Shared cluster, multi-tenant via `tenantId` field |
| ODM | Mongoose | Schema validation, TS types via `mongoose` + `zod`/`io-ts` for request validation |
| Auth | JWT (access + refresh tokens) | Role + tenant claims embedded in token |
| File storage | Cloudflare R2 (free tier, S3-compatible) | Same SDK as v2 plan — no rewrite needed later |
| Background jobs | BullMQ + Redis (Upstash free) | Only if MVP needs async jobs (report generation, notifications) — can start without this and add when needed |
| Hosting — frontend | Vercel (free) | |
| Hosting — backend | Render (free web service) | Free tier sleeps on inactivity — fine for MVP/demo stage |
| CI/CD | GitHub Actions (free) | Lint, type-check, test, build on every PR |
| Repo | Single GitHub monorepo (pnpm workspaces) | `apps/web`, `apps/api`, `packages/shared` |

No payment gateway is activated in the MVP. Fee/payment data structures are built and ready, but real transactions come later — for now, payments can be marked manually or via a sandbox/test mode.

---

## 3. Repository Structure

```
school-platform/
├── apps/
│   ├── web/                 # React + TS frontend
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── features/    # feature-based folders: auth, students, attendance, fees...
│   │   │   ├── hooks/
│   │   │   ├── lib/         # api client, utils
│   │   │   ├── types/
│   │   │   └── App.tsx
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── api/                 # Express + TS backend
│       ├── src/
│       │   ├── config/
│       │   ├── middleware/  # auth, tenant-context, error-handler
│       │   ├── modules/     # one folder per domain (see section 5)
│       │   ├── models/      # Mongoose schemas
│       │   ├── jobs/        # BullMQ processors (added when needed)
│       │   ├── utils/
│       │   └── server.ts
│       └── package.json
├── packages/
│   └── shared/               # shared TS types/interfaces between web & api
├── .github/workflows/
│   └── ci.yml
├── .env.example
├── pnpm-workspace.yaml
└── README.md
```

Each domain module in `apps/api/src/modules/<name>/` follows: `routes.ts`, `controller.ts`, `service.ts`, `validation.ts`. This mirrors the "domain boundary" idea from the v2 blueprint, just without the NestJS ceremony — so migrating a module later is mostly a lift-and-shift.

---

## 4. Multi-Tenancy Strategy

Single shared MongoDB cluster, **discriminator-field multi-tenancy**:

- Every tenant-owned collection has an indexed `tenantId` field.
- A `tenant-context` middleware resolves the tenant (from subdomain, JWT claim, or header) on every request and injects it into `req.tenantId`.
- Every Mongoose query goes through a service layer that automatically scopes by `tenantId` — no controller should ever query a collection without it.
- Compound indexes: `{ tenantId: 1, <other frequently queried field> }` on every collection.

This is simpler than Postgres row-level security but requires discipline: **no raw queries without tenant scoping, ever.** Enforce this with a lint rule or a wrapped query helper (`tenantScoped(Model, tenantId)`) rather than trusting every developer to remember.

---

## 5. MVP Feature Scope

### Included in MVP

**Core**
- Tenants (schools), users, roles & permissions (admin, teacher, student, guardian)
- Auth: signup/login, JWT + refresh tokens, password reset
- Academic years, grades, sections, subjects
- Students, guardians, teachers, enrollments

**Academics**
- Timetables (basic — section/subject/teacher/time)
- Assignments & submissions
- Assessments/exams and marks entry
- Report cards (basic, generated from marks)

**Fees/Payments**
- Fee structures & fee items per academic year
- Student fee assignment (with discounts)
- Invoices
- Payment records (manual/sandbox entry — no live gateway yet)
- Receipts (simple PDF or in-app record)

### Explicitly deferred to v2
- Multi-campus, multi-room/exam-hall seating logistics
- Clubs, events, achievements, portfolios
- Messaging/threads (start with simple notifications instead)
- Analytics warehouse, BullMQ-heavy pipelines beyond basic notification/report jobs
- NexLab connector
- Live payment gateway integration
- Read replicas, partitioning, service extraction

---

## 6. Core Data Model (MongoDB collections)

Kept intentionally close to the v2 relational schema so the *concepts* transfer even though the storage shape changes.

| Collection | Key fields | Notes |
|---|---|---|
| `tenants` | name, slug, status | |
| `users` | tenantId, email, passwordHash, role, status | one collection for all roles; role determines access |
| `academicYears` | tenantId, name, startDate, endDate, status | |
| `grades` | tenantId, name, sequence | |
| `sections` | tenantId, gradeId, name, capacity | |
| `subjects` | tenantId, code, name | |
| `students` | tenantId, userId, admissionNo, guardians[], enrollments[] | guardians can be embedded refs |
| `teachers` | tenantId, userId, employeeNo, assignedSections[] | |
| `enrollments` | tenantId, studentId, academicYearId, sectionId, rollNo | |
| `attendanceRecords` | tenantId, sectionId, date, records: [{studentId, status}] | one doc per session, embedded array — avoids one doc per student per day |
| `assignments` | tenantId, sectionId, subjectId, title, dueAt | |
| `submissions` | tenantId, assignmentId, studentId, fileUrl, score | |
| `assessments` | tenantId, subjectId, academicYearId, type, weight | |
| `marks` | tenantId, studentId, subjectId, assessmentId, score | |
| `reportCards` | tenantId, studentId, academicYearId, status, fileUrl | |
| `feeStructures` | tenantId, academicYearId, name, items: [{name, amount}] | embedded fee items |
| `invoices` | tenantId, studentId, items[], total, status | |
| `payments` | tenantId, invoiceId, amount, method, reference, status | |
| `notifications` | tenantId, userId, type, readAt | |

Design conventions carried over from the v2 plan:
- `tenantId` on every tenant-owned collection.
- `createdAt`/`updatedAt` timestamps (Mongoose `timestamps: true`).
- UTC everywhere.
- Money stored as integer minor units (paise) + currency code — never floats.
- Files in object storage (R2); DB stores only the URL/key.

---

## 7. Auth & Authorization

- JWT access token (short-lived, ~15 min) + refresh token (httpOnly cookie).
- Token payload: `{ userId, tenantId, role }`.
- Role-based middleware: `requireRole('admin', 'teacher')` guards routes.
- Tenant isolation enforced at the service layer, not just the route layer.
- Passwords: bcrypt, never store plaintext, never log tokens.
- Rate limiting on auth routes (simple in-memory or Redis-backed once BullMQ/Redis is added).

---

## 8. Deployment Plan (Free Tier)

| Component | Where | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploy from `main`, preview deploys per PR |
| Backend API | Render free web service | Sleeps after inactivity — acceptable for MVP/demo |
| Database | MongoDB Atlas Free (M0) | 512MB storage limit — fine for MVP, synthetic + early real data |
| File storage | Cloudflare R2 free tier | 10GB-month free |
| Redis (when needed) | Upstash free tier | Add only when you introduce background jobs |
| Domain | Provider-generated URLs (`.vercel.app`, `.onrender.com`) | No domain purchase yet |

Same zero-cost discipline as the original blueprint: no paid plans, no card-based billing, synthetic data before real student data goes anywhere.

---

## 9. Build Order

1. Repo + monorepo skeleton (pnpm workspaces, shared TS package).
2. MongoDB Atlas free cluster + connection from API.
3. Auth module (tenant, user, login/signup, JWT).
4. Tenant-context middleware + tenant-scoped query helper.
5. Core academic structure: academic years, grades, sections, subjects.
6. Students, guardians, teachers, enrollments.
7. Attendance.
8. Assignments + submissions.
9. Assessments + marks + report cards.
10. Fee structures, invoices, payments (manual entry).
11. Frontend: auth flow → dashboard → each feature module in the same order as the backend.
12. Deploy frontend (Vercel) + backend (Render) + connect to Atlas.
13. Basic CI (lint, type-check, test) on GitHub Actions.
14. Two-tenant test: create a second school, verify zero data leakage across tenants.

---

## 10. What Carries Over to v2 Later

Because the domain modules and data shapes mirror the v2 relational schema, migrating later mostly means: move each `modules/<name>` folder's logic into a NestJS module, convert Mongoose schemas to Postgres tables with the same field names, and split the monolith into services only where you've actually measured a bottleneck — not before. Nothing in this MVP is a dead end.
