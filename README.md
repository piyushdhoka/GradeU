

# GradeU - Advanced Learning Management System

GradeU is a next-generation education platform designed to deliver high-quality, interactive learning experiences. It features a robust student dashboard, automated course generation, proctoring capabilities, and a community-driven learning environment.

## 🚀 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [Shadcn UI](https://ui.shadcn.com/)
- **Authentication:** [Supabase Auth](https://supabase.com/auth) (SSR + PCKE Flow)

- **Database:**
  - [Supabase](https://supabase.com/) (PostgreSQL) for Auth & User Profiles
  - [MongoDB](https://www.mongodb.com/) for Course Content & Proctoring Logs
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Backend:** Express.js (via Next.js Route Handlers / Serverless)
- **Deployment:** Vercel (Monorepo specific setup)

## 🛠️ Prerequisites

- **Node.js:** v18.17+ or v20+
- **Bun:** (Preferred package manager) or npm/yarn
- **Supabase Project:** For authentication and database.
- **MongoDB Cluster:** For content storage.

## 📦 Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/grade-u.git
    cd grade-u
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    # or
    npm install
    ```

3.  **Environment Setup:**
    Duplicate `.env.example` to `.env` and fill in the required variables.

    ```bash
    cp .env.example .env
    ```

    **Required Environment Variables:**
    - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
    - `MONGODB_URI`: Connection string for MongoDB
    - `NEXT_PUBLIC_BACKEND_URL`: URL for the backend API (e.g., `http://localhost:3000` locally)
    - `UPSTASH_REDIS_REST_URL` & `TOKEN`: For caching/limiting (if used)

## ⚡ Development

To start the development environment with both the Next.js frontend and the Express backend (if running separately for dev):

```bash
bun run dev:full
```

Or strictly Next.js dev server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗️ Build & Production

To build the application for production:

```bash
bun run build
```

This compiles the TypeScript code and optimizes the Next.js application.

## 🧪 Linting & Formatting

This project uses **ESLint** and **Prettier** to ensure code quality.

- **Lint:** `bun run lint`
- **Format:** `bun run format` (configured via Prettier)

## 🤝 Contributing

1.  Create a feature branch (`git checkout -b feature/amazing-feature`)
2.  Commit your changes (`git commit -m 'feat: Add amazing feature'`)
3.  Push to the branch (`git push origin feature/amazing-feature`)
4.  Open a Pull Request

## 📄 License

This project is proprietary and confidential. Unauthorized copying of this file, via any medium is strictly prohibited.
