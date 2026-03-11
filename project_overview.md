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

## 🏗️ Technical Stack

GradeU relies heavily on a deeply integrated Next.js architecture alongside powerful, serverless data stores:

- **Frontend & React Framework:** Next.js 16 (App Router) combined with React 19 and written in strict TypeScript.
- **Design System:** Tailwind CSS paired with Shadcn UI & Framer Motion (dynamic micro-animations and smooth layout transitions).
- **Video Playback:** `plyr-react` to deliver smooth, high-quality video instruction.
- **Authentication & Core DB (PostgreSQL):** Supabase provides user identity management, SSR-ready tokens, relational data mappings (course material, users), and cloud storage.
- **Auditing & Telemetry DB (NoSQL):** MongoDB is used via `mongoose` specifically for managing high-throughput logs like continuous behavioral analytics and strict proctoring events.
- **State Management:** Zustand for lightweight, scalable global UI state handling.
- **Backend Routing:** Handled serverlessly via Next.js Route Handlers. Extensible with an Express base where manual configurations or middleware (e.g., rate-limiting, CORS) is required.

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
