# Symbria Delivery Logistics

**Manage RX driver deliverables and logistics.**

This application is a comprehensive logistics management platform designed to track pharmacy (RX) deliveries and driver schedules. It is built with modern web technologies to ensure performance, type safety, and scalability.

## 🚀 Live Demo
[View Deployed Application](https://symbria-delivery-logistics.vercel.app)

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** CSS Modules / PostCSS
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Auth.js)
- **Deployment:** [Vercel](https://vercel.com/)

## ✨ Key Features

* **Driver Management:** Track driver assignments and status.
* **Delivery Tracking:** Real-time updates on RX deliverables.
* **Secure Authentication:** User login and session management via NextAuth.
* **Responsive UI:** Optimized for desktop and mobile use.

---

## ⚡ Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/idongCodes/symbria-delivery-logistics.git](https://github.com/idongCodes/symbria-delivery-logistics.git)
   cd symbria-delivery-logistics
   ````

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables:**
    Rename `.env.example` to `.env.local` (or create a new `.env.local` file) and add the following keys:

    ```bash
    # Authentication Secrets
    NEXTAUTH_SECRET=your_super_secret_key
    NEXTAUTH_URL=http://localhost:3000

    # Database (if applicable)
    DATABASE_URL=your_database_connection_string
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Visit [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser.

## 📂 Project Structure

```text
├── app/                # Main application routes (App Router)
├── lib/                # Utility functions and shared logic
├── pages/api/auth/     # NextAuth.js API routes
├── public/             # Static assets (images, fonts)
├── types/              # TypeScript type definitions
└── ...
```

## 🤝 Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature`).
3.  Commit your changes (`git commit -m 'Add some feature'`).
4.  Push to the branch (`git push origin feature/your-feature`).
5.  Open a Pull Request.

## 📄 License

This project is proprietary. All rights reserved.
