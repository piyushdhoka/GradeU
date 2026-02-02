# GradeU - Empowering Excellence in Education 🛡️

**GradeU** is a next-generation education platform designed to provide an unmatched learning experience. Built with a focus on results, it combines AI-powered tutoring, interactive hands-on labs, and proctored assessments to ensure students don't just learn, but master their chosen fields.

![GradeU Logo](public/logo.svg)

## 🚀 Key Features

- **Personalized Learning Paths**: Tailored course recommendations and progress tracking.
- **Interactive Hands-on Labs**: Learn by doing with integrated terminal and lab environments.
- **Proctored Assessments**: AI-driven proctoring to maintain academic integrity and certification value.
- **Verified Certificates**: Earn blockchain-style verified certificates upon course completion.
- **Community Hub**: Connect with mentors and peers in a dedicated community space.
- **Telegram Bot Integration**: Get instant notifications and interact with your learning journey on the go.
- **Sleek Minimalist UI**: A modern, dark-themed interface designed for focus and productivity.

## 🛠️ Tech Stack

### Frontend
- **Next.js 15+** (App Router)
- **React 19**
- **Tailwind CSS v4** (Modern utility-first styling)
- **Framer Motion / Motion** (Smooth, premium animations)
- **Shadcn/UI** (Accessible, high-quality components)
- **Zustand** (State management)

### Backend & Services
- **Express.js** (API Layer)
- **Supabase** (Authentication, User Profiles, Postgres Database)
- **MongoDB** (Course data, metadata, and activity tracking)
- **Upstash Redis** (High-performance caching)
- **ImageKit** (Optimized image delivery and transformations)
- **Nodemailer** (SMTP communication for welcome emails and alerts)

## 📦 Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (Recommended) or Node.js
- Supabase Project
- MongoDB Cluster
- ImageKit Account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/piyushdhoka/GradeU.git
   cd GradeU
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   MONGODB_URI=your_mongodb_uri
   NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
   PORT=4000
   IMAGEKIT_PRIVATE_KEY=your_private_key
   NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=your_endpoint
   NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_public_key
   GMAIL_USER=your_email
   GMAIL_PASS=your_app_password
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token
   ```

4. **Run the development environment:**
   ```bash
   bun run dev:full
   ```
   This will start both the Next.js frontend (Port 3000) and the Express backend (Port 4000).

## 🚢 Deployment

GradeU is optimized for deployment on **Vercel**.

1. Connect your repository to Vercel.
2. Add the required environment variables in the Vercel dashboard.
3. Ensure the `NEXT_PUBLIC_BACKEND_URL` points to your deployed backend (e.g., Render, Railway, or Heroku).
4. Build Command: `bun run build`

Refer to [DEPLOYMENT.md](DEPLOYMENT.md) for more details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by the **GradeU Team**.
