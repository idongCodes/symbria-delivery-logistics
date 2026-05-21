# Symbria Delivery Logistics

## Project Overview

Symbria Delivery Logistics is a digital fleet management and inspection platform web application. Built for drivers to submit pre-trip and post-trip logs, capture photo evidence, and track vehicle conditions, it replaces traditional paper logs. The platform also provides administrators with real-time dashboard visibility, role-based access control, and robust reporting/sharing features.

**Tech Stack:**
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Note: Specifically configured for *Light Mode only*. Dark mode classes have been stripped project-wide.)
- **Backend & Auth:** Supabase (Postgres, Auth, Storage)
- **ORM:** Prisma
- **UI Icons:** Heroicons (`@heroicons/react`)
- **Testing:** Vitest (Unit) & Playwright (E2E)

## Architecture & Data Models

The project leverages Prisma to interact with a PostgreSQL database hosted on Supabase.
**Core Prisma Models (`prisma/schema.prisma`):**
- **Feedback:** User-submitted feedback/issues.
- **TripLog:** Core entity storing driver logs, odometers, checklists (JSON), images (JSON), and generated public share tokens.
- **Profile:** Stores user details, roles (e.g., Driver, Management, Admin), and contact info.
- **Route:** Stores the delivery routes (e.g., "North East (NE)", "South East (SE)", "South West (SW)").

## Building and Running

**Commands:**
- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Generates the Prisma client and creates an optimized Next.js production build.
- `npm start`: Starts the application in production mode (requires a successful build first).
- `npm run lint`: Runs ESLint for code analysis.
- `npm run git`: Custom bash script for Git operations (`scripts/git-ops.sh`).

**Testing Commands:**
- `npm run test` or `npm run test:unit`: Runs unit tests via Vitest.
- `npm run test:e2e`: Runs End-to-End tests via Playwright.
- `npm run test:ui`: Opens the Playwright UI mode for interactive E2E testing.

## Development Conventions

- **Next.js App Router:** Follow standard Next.js App Router conventions (e.g., `app/page.tsx`, `app/layout.tsx`, `app/api/...`).
- **Styling:** Use standard Tailwind CSS utility classes. **Strictly avoid `dark:` variants**, as the project is intentionally designed to force Light Mode.
- **Form State & Images:** Heavy use of dynamic forms based on "Pre-Trip" vs "Post-Trip" types. Images are typically handled and compressed (via `browser-image-compression`) before uploading.
- **Database & Supabase:** Interacting with data goes through the Prisma Client for server-side logic and Supabase client for Authentication/Storage needs.
- **Hydration Safety:** Use patterns like `<ClientDate />` components to avoid UTC/Local timezone hydration mismatches during React rendering. Avoid impure functions like `Date.now()` directly in the top-level of functional components.
- **Testing:** New features should include relevant test coverage in `tests/e2e/` (Playwright) or alongside components (Vitest, e.g., `Component.test.tsx`).
