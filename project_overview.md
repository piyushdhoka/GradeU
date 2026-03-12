# GradeU - Advanced Learning Management System

**GradeU** is a next-generation education platform built to deliver high-quality, seamless, and highly interactive learning experiences. It extends beyond standard Learning Management Systems (LMS) by leveraging features like automated course generation, integrated student communities, AI-level proctoring, and comprehensive analytics.

## ✨ Key Features & Capabilities

Based on the application structure and components, GradeU incorporates a broad range of student-focused features:

- **Student Dashboard:** Centralized analytics detailing student progress, active courses, notifications, and upcoming deadlines.
- **Dynamic Course generator:** Supports rich modules to facilitate structured learning (`ModuleViewer`). Accommodates various course structures and tracks content completion.
- **Interactive Labs:** Practical environments integrated directly into courses for hands-on experience without leaving the platform.
- **Community Hub:** Fosters peer-to-peer engagement, group discussions, and shared learning.
- **Proctoring System (`ProctoringEngine`):** Emphasizes integrity by using AI-driven facial validation via the device camera (`@tensorflow-models/blazeface` and `WebGL` backend computations). Ensures continuous monitoring during assessments.
- **Certificates Management:** Students can automatically earn, view, store, and export (`jspdf`, `html2canvas`) certificates documenting their achieved milestones.
- **Robust Authentication & Roles:** Handles secure role-based access using Supabase Auth (SSR + PKCE flow).

## 💡 Unique Selling Points (USPs)

1. **Automated Course Generation:** Reduces the burden on educators by semi-automating structured learning pathways.
2. **AI Face Proctoring:** True client-side AI analysis for assessment integrity natively built into the browser without heavy invasive software installs.
3. **Experience Analytics:** Logs and tracks granular user activities (using MongoDB) to constantly measure engagement points and optimize content delivery.

## 🏗️ Technical Implementation & Stack

GradeU relies heavily on a deeply integrated, modern architecture to deliver a seamless and powerful educational experience.

### Architecture & Frameworks

- **Frontend & React Framework:** Next.js 16 (App Router) combined with React 19, written in strict TypeScript. This enables robust SSR (Server-Side Rendering) and SEO optimization.
- **Styling & UI:** Tailwind CSS combined with Shadcn UI for accessible, reusable components. Framer Motion and `tw-animate-css` are used for dynamic micro-animations and smooth layout transitions.
- **State Management:** Zustand provides lightweight, scalable global UI state handling across complex dashboards and interactive modules.
- **Backend Routing:** Handled serverlessly via Next.js Route Handlers. Extensible with an Express base (`express-rate-limit`, `cors`) where manual configurations or middleware are required.

### Database & Data Management

- **Authentication & Core Relational DB:** Supabase (PostgreSQL) provides user identity management, SSR-ready tokens (`@supabase/ssr`), relational data mappings for course material, and cloud storage.
- **Auditing & Telemetry DB:** MongoDB (via `mongoose`) is used specifically for managing high-throughput logs like continuous behavioral analytics and strict proctoring events.
- **Caching & Rate Limiting:** Upstash Redis (`@upstash/redis`) allows for rapid session lookups, caching API responses, and throttling rate limits.
- **Local Fallback:** `better-sqlite3` is incorporated as a lightweight, fast, local database alternative or fallback when needed.

### AI & Specialized Libraries

- **AI Facial Proctoring:** True client-side AI analysis for assessment integrity natively built into the browser using `@tensorflow-models/blazeface` and `@tensorflow/tfjs-backend-webgl`.
- **Media & Exporting:** `plyr-react` to deliver smooth, high-quality video instruction. `html2canvas`, `html-to-image`, and `jspdf` are utilized to render DOM elements into downloadable certificates on the fly.
- **Visualizations:** Mermaid (`mermaid`) powers dynamic generation of flowcharts and diagrams within courses or roadmap representations.
- **Emails:** `nodemailer` is used to trigger automated platform emails (welcome emails, certificate delivery, alerts).

### Implementation Process (SDLC)

1. **Component-Driven Development:** UI elements are isolated and built out as standalone Shadcn blocks before being stitched into complex pages.
2. **Strict Typing & Linting:** Enforced globally using TypeScript, ESLint, and Prettier on pre-commit hooks (Husky & lint-staged).
3. **API-First Integration:** Data requirements are mapped out in Supabase/MongoDB before Next.js Route handlers are written. Client-side fetch logic heavily relies on Zustand to minimize re-renders and React state clutter.
4. **Serverless Deployment:** Built to be primarily hosted on edge-optimized platforms like Vercel, maximizing Next.js caching capabilities.

## 🚀 Novel Upcoming Features (Roadmap additions)

The platform is expanding to include deeply specialized integrations tailored for personalized learning and academic research:

### 1. Knowledge Graph Memory for Learning Patterns

This feature will construct a personalized, conceptual map of a student’s cognitive abilities dynamically:

- **Identification of Strong/Weak Topics:** Instead of linear numeric grades, the system tracks specific nodes (e.g., "calculus", "machine learning concepts"). If a student fails questions related to a sub-node, the graph memory registers it as a weak point and re-configures future practice questions.
- **Adaptive Remediation:** The graph acts globally. If the student enters a new course related to a weak node, the system will explicitly inject prerequisite refresher materials prior to starting.

### 2. Automated DOI Research Paper Fetcher

A dedicated integration that streamlines academic research for educators and specific advanced courses:

- **Direct Querying:** Users submit a DOI (Digital Object Identifier) link into a dedicated module interface.
- **Automated Metadata & Content Parsing:** GradeU will reach out to publisher APIs (like Crossref) to securely fetch abstracts, authors, citations, and—where open-access allows—the full text PDF.
- **Integration into Course Material:** Instructors can immediately add these fetched, verified papers as required reading modules within the `Courses` component.
