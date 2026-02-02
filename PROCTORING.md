# Proctoring & Experience Tracking Implementation

## Overview
We have implemented a dual-layer tracking system to monitor student engagement and integrity without overloading the main Supabase database.

### 1. Architecture
- **Client-Side**: 
  - `useProctoring`: Monitors tab switches, window blur, and fullscreen exits.
  - `useExperienceTracker`: Monitors reading speed, scroll depth, and time spent per module.
  - `ProctoringComponent`: Handles AI face detection (client-side) and reports violations.
- **Transport**: 
  - Uses `navigator.sendBeacon` for non-blocking, reliable log transmission.
  - Endpoints: `/api/student/track/proctor/ingest` and `/api/student/track/experience/sync`.
- **Storage**:
  - **MongoDB**: Stores heavy logs (`ProctoringLog`) and analytics (`StudentExperience`).
  - **Supabase**: Remains the source of truth for Course structure and User Auth.

### 2. New Hooks
#### `useProctoring`
- Automatically logs `tab-switch` and `window-blur` events.
- Exposes `logEvent` for manual logging (e.g., face detection).

#### `useExperienceTracker`
- Tracks time spent and scroll depth.
- Syncs every 30s or on unmount.

### 3. Database Models (MongoDB)
- **ProctoringLog**: `{ studentId, eventType, details, timestamp }`
- **StudentExperience**: `{ studentId, courseId, moduleStats: [{ timeSpent, scrollDepth }] }`

### 4. Setup
- Ensure `MONGODB_URI` is set in `.env`.
- The backend server (`src/server/server.ts`) connects to MongoDB automatically.
