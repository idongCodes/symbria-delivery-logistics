# Symbria Delivery Logistics

**Fleet Management & RX Delivery Inspection Platform.**

This application is a specialized logistics management platform designed to track pharmacy (RX) delivery driver inspections, route assignments, and vehicle conditions. It replaces paper logs with a digital, type-safe, and mobile-responsive solution.

## 🚀 Live Demo

[View Deployed Application](https://symbria-delivery-logistics.vercel.app)

-----

## 🛠️ Tech Stack

  - **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
  - **Language:** [TypeScript](https://www.typescriptlang.org/)
  - **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Responsive Mobile/Desktop)
  - **Backend & Auth:** [Supabase](https://supabase.com/) (Postgres, Auth, Storage)
  - **Deployment:** [Vercel](https://vercel.com/)

-----

## ✨ Key Features

### 🚛 Driver & Trip Management

  * **Smart Inspection Forms:** Dynamic Pre-Trip and Post-Trip logic. Questions change based on the selected trip type.
  * **Condition Reporting:** Conditional logic requires drivers to describe issues if "No" is selected on safety checks (or "Yes" on damage checks).
  * **Photo Evidence:** Integrated file uploading for Front, Back, and Trunk vehicle photos (stored in Supabase Buckets).
  * **Tire Pressure Logging:** Dedicated inputs for tire PSI during Pre-Trip inspections.
  * **Dynamic Routes:** Route selection dropdown pulls live data from the database, allowing admins to update routes without code changes.

### 🔐 Role-Based Access Control (RBAC)

  * **Drivers:** Can only view and edit their own logs for a limited time window. Mobile-optimized "Card View" for easy use on phones.
  * **Management:** Read-only access to all driver logs and exports.
  * **Admins:** Full access to Edit/Delete any log, manage routes, and view global history.

### 📊 Reporting & Contacts

  * **One-Click Exports:** Generate PDF reports for individual inspections (including photos) or export data to CSV.
  * **Live Contact Roster:** Auto-updating "Contacts" page that separates Drivers from Management based on registration titles.

-----

## ⚡ Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites

  - Node.js (v18 or higher)
  - A Supabase project (for DB and Auth)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/idongCodes/symbria-delivery-logistics.git
    cd symbria-delivery-logistics
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory and add your Supabase credentials:

    ```bash
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Visit [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser.

-----

## 🗄️ Database Schema (Supabase)

The application relies on the following key tables in Postgres:

  * **`auth.users`**: Managed by Supabase Auth.
  * **`public.profiles`**: Extends user data (Job Title, Phone, First/Last Name).
  * **`public.trip_logs`**: Stores inspection data, JSON checklists, image URLs, and odometer readings.
  * **`public.routes`**: Stores the list of active delivery routes.
  * **`storage.buckets`**: 'trip\_logs' bucket stores vehicle images.

-----

## 🤝 Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature`).
3.  Commit your changes (`git commit -m 'Add some feature'`).
4.  Push to the branch (`git push origin feature/your-feature`).
5.  Open a Pull Request.

## 📄 License

This project is proprietary. All rights reserved.
