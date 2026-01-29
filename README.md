# Symbria Delivery Logistics

**A Digital Fleet Management & Inspection Platform.**

## 🎯 Purpose & Scope (MVP)

### The Problem
Before this platform, vehicle inspections were conducted using manual paper logs. This process was inefficient, prone to errors, difficult to track in real-time, and lacked accountability regarding vehicle conditions (dents, cleanliness, etc.).

### The Solution
This Minimum Viable Product (MVP) digitizes the entire Pre-Trip and Post-Trip inspection workflow. It provides a mobile-responsive interface for drivers to submit logs, upload photo evidence, and track vehicle status, while offering administrators real-time visibility into fleet operations.

---

## ✨ Key Features

### 🚛 For Drivers
*   **Dynamic Inspection Forms:** Context-aware checklists that change based on "Pre-Trip" or "Post-Trip" selection.
*   **Photo Evidence:** Mandatory photo uploads for vehicle conditions (Front, Back, Trunk) directly from the device camera.
*   **Smart Validation:** Conditional logic forces detailed comments when specific defects are reported (e.g., "Check Engine Light" = Yes).
*   **Mobile-First Design:** A "Card View" interface optimized for completing logs on phones during shifts.
*   **Edit Windows:** Drivers can edit their own logs within a short timeframe (15 mins) to fix mistakes before records are locked.

### 🛡️ For Admins & Management
*   **Real-Time Dashboard:** Instant access to all submitted logs with filtering and status indicators.
*   **Role-Based Access Control (RBAC):**
    *   **Drivers:** View/Edit own logs.
    *   **Management:** Read-only access to all logs.
    *   **Admins:** Full CRUD capabilities for logs and routes.
*   **Reporting:** One-click PDF generation (printable reports) and CSV export for data analysis.
*   **Public Sharing:** Generate secure, time-limited tokens to share specific inspection logs with external parties (e.g., mechanics/insurers) without requiring a login.

---

## 🛠️ Tech Stack

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Backend & Auth:** [Supabase](https://supabase.com/) (Postgres, Auth, Storage)
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Testing:** Vitest & Playwright

---

## 🧪 Test Suite

The codebase maintains quality through a dual-layer testing strategy:

### 1. Unit Tests (Vitest + React Testing Library)
Run via: `npm run test:unit`

Focuses on component logic and isolation.
*   **Navigation Logic:** Verifies correct link rendering based on auth state (Guest vs. Driver vs. Admin).
*   **Component Hydration:** Ensures components like `ClientDate` handle server/client timestamp mismatches correctly.
*   **Mocking:** Uses extensively mocked Supabase and Next.js Navigation modules to test behavior without external dependencies.

### 2. End-to-End Tests (Playwright)
Run via: `npm run test:e2e`

Focuses on critical user flows in a real browser environment.
*   **Authentication Flows:** Verifies Login form rendering, registration toggles, and form validation.
*   **Landing Page:** Ensures critical CTA elements and branding are visible.
*   **Cross-Browser:** configured to run on Chromium, Firefox, and WebKit.

---

## 🔧 Technical Challenges & Resolutions

### 1. Hydration Mismatches on Dates
*   **Issue:** Server-rendered timestamps (UTC) differed from Client-rendered timestamps (Local Time), causing React hydration errors.
*   **Resolution:** Created a dedicated `<ClientDate />` component that defers rendering the date string until after the component has mounted on the client, ensuring consistency.

### 2. Impure Functions in Render
*   **Issue:** Using `Date.now()` directly in `useState(Date.now())` caused inconsistent initial states during renders, flagging warnings in strict mode and potential UI bugs.
*   **Resolution:** Switched to lazy initialization `useState(() => Date.now())` to ensure the timestamp is generated only once during the initial render pass.

### 3. Complex Form State & Validation
*   **Issue:** Managing dynamic checklists where "Pre-Trip" has different fields (e.g., Tire Pressure) than "Post-Trip" within a single form component.
*   **Resolution:** Implemented a single source of truth `checklistData` state map, combined with a configuration array (`PRE_TRIP_QUESTIONS`, `POST_TRIP_QUESTIONS`) to dynamically render fields and enforce conditional validation rules.

### 4. E2E Testing in CI/CD
*   **Issue:** Playwright tests failing due to missing browser binaries in the environment.
*   **Resolution:** Configured the setup process to include `npx playwright install` and handled system dependency checks to ensure reliable test execution across different environments.

---

## 🚀 Getting Started

1.  **Clone & Install:**
    ```bash
    git clone [repo-url]
    npm install
    ```

2.  **Environment Setup:**
    Create `.env.local` with your Supabase credentials:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

4.  **Run Tests:**
    ```bash
    npm run test:unit  # Run Unit Tests
    npm run test:e2e   # Run E2E Tests
    ```