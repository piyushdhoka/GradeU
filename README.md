<div align="center">

<img src="./public/cybercoach-logo.png" alt="CyberCoach Logo" width="200"/>

# 🛡️ VOIS CyberCoach

### AI-Powered Cybersecurity Education Platform (Next.js 15 & Bun)

Transform passive learning into hands-on, job-ready cybersecurity skills with adaptive learning paths, proctored assessments, vulnerability labs, and career tools—all in one unified, high-performance platform.

[![Next.js 15](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-project-structure) • [Tech Stack](#️-tech-stack) • [Team](#-team)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎓 **Learning & Education**
- 🧠 **Adaptive Learning Paths** - AI-personalized curriculum based on skill gaps.
- 📚 **Interactive Courses** - Comprehensive video lectures with integrated testing.
- 🔬 **Hands-on Labs** - In-browser real-world vulnerability scenarios.
- 📊 **Progress Tracking** - Real-time statistics and completion monitoring.
- 🤖 **AI Tutor** - RAG-powered cybersecurity expert grounded in NIST standards.

</td>
<td width="50%">

### 📝 **Assessments & Proctoring**
- 🎥 **AI Proctoring** - Real-time face detection and multi-face violation tracking.
- 🎯 **Integrity Monitoring** - Tab-switch and window-blur detection during exams.
- 🚨 **Automatic Flagging** - Real-time violation alerts and session termination.
- 🏆 **Certified Credentials** - Dynamic PDF certificate generation and verification.
- 📉 **Skill Analytics** - Post-exam gap analysis and recommendations.

</td>
</tr>
<tr>
<td width="50%">

### 🛡️ **Security Tools**
- 🔍 **Vulnerability Scanner** - AI-assisted security posture assessments.
- 🌐 **OSINT Intelligence** - Integrated WHOIS and domain reputation analysis.
- 🕵️ **Fraud Detection** - Content-based NLP scam and phishing analysis.
- 📄 **Dynamic Reports** - Automated security finding documentation.

</td>
<td width="50%">

### 💼 **Career Development**
- 🎤 **AI Interviewer** - Real-time technical interview simulation with feedback.
- 📝 **Resume Builder** - Tailored ATS-optimized resume generation.
- 💼 **Smart Job Board** - Curated and verified cybersecurity job listings.
- 💡 **Technical Prep** - Massive bank of categorized security problems.

</td>
</tr>

</table>

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (Recommended), [pnpm](https://pnpm.io/), or Node.js 20+ (npm)
- Git
- Supabase Account
- Google Gemini API Key

### Installation

1️⃣ **Clone the repository**
```bash
git clone https://github.com/AadarshCanCode/VOIS_cybercoach.git
cd VOIS_cybercoach
```

2️⃣ **Install dependencies**

Choose your preferred package manager:

**Bun (Fastest)**
```bash
bun install
```

**npm**
```bash
npm install
```

**pnpm**
```bash
pnpm install
```

3️⃣ **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Next.js Public Client Vars (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# Server-Side Vars (Required)
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=your-gemini-api-key

# Optional (ImageKit/OSINT)
IMAGEKIT_PRIVATE_KEY=your-key
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your-key
```

4️⃣ **Download Assets & Models**
```bash
bun run fetch-faceapi
```

5️⃣ **Start the Platform**
```bash
bun run dev:full
```

6️⃣ **Access Portals**
- 🌐 Frontend: [http://localhost:3000](http://localhost:3000)
- 🔌 Backend API: [http://localhost:4000](http://localhost:4000)

---

## 📂 Project Structure

Unified monolithic structure optimized for Next.js 15:

```text
VOIS_cybercoach/
├── src/
│   ├── app/                # Next.js App Router (Pages & Layouts)
│   ├── features/           # Modular Feature Components (Student, Admin)
│   ├── server/             # Express.js Backend Logic
│   └── shared/             # Cross-cutting Types, Hooks, and Services
├── public/                 # Static Assets & ML Models
├── next.config.ts          # Unified Build Configuration
└── package.json            # Bun-powered unified scripts
```

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4, Framer Motion
- **Backend**: Node.js, Express.js (TypeScript)
- **Runtime**: Bun
- **Database**: Supabase (PostgreSQL) & MongoDB Atlas
- **AI/ML**: Google Gemini (LLM), face-api.js (Proctoring), Natural (NLP)
- **Infrastructure**: Vercel (Frontend), ImageKit (Media)

---

## 📜 Unified Scripts

| Command | Description |
|---------|-------------|
| `bun run dev:full` | 🚀 Launch both Frontend and Backend concurrently |
| `bun run build` | 📦 Create an optimized production build |
| `bun run lint` | 🔍 Run Next.js linting checks |
| `bun run server` | 🔌 Start the Express backend independently |
| `bun run fetch-faceapi` | 📥 Sync proctoring ML models to public folder |

---

## 👥 Team

<div align="center">

| <img src="https://github.com/piyushdhoka.png" width="80" style="border-radius:50%"/> | <img src="https://github.com/AadarshCanCode.png" width="80" style="border-radius:50%"/> | <img src="https://github.com/varuninamdar.png" width="80" style="border-radius:50%"/> |
|:---:|:---:|:---:|
| **Piyush Dhoka** | **Aadarsh Pathre** | **Varun Inamdar** |
| [piyushdhoka](https://github.com/piyushdhoka) | [AadarshCanCode](https://github.com/AadarshCanCode) | [varuninamdar](https://github.com/varuninamdar) |

</div>

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">

### Made with ❤️ by the VOIS CyberCoach Team

**⭐ Star us on GitHub — it motivates us a lot!**

</div>
