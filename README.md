# Welcome to Scorebook - Basketball

Scorebook is a mobile-first, offline-ready basketball statistics tracking application designed as a **Tactical Operating System**. It moves beyond raw stats to provide **Causal Accountability**—helping coaches understand the *why* behind game events through environmental factors, tactical breakdown attribution, and real-time strategic advising.

## Tech Stack

### Frontend
- **React 19** with **TypeScript**
- **Vite** for fast builds and hot module replacement
- **Material UI (MUI) 6** for a responsive, modern component system
- **Dexie.js** (IndexedDB wrapper) for robust offline-first data storage
- **Recharts** for performance visualizations
- **Day.js** for lightweight date and time formatting

### Backend
- **AWS Lambda** (Node.js 22 runtime) utilizing a modular handler architecture.
- **Amazon DynamoDB** for high-performance, scalable NoSQL storage.
- **Amazon S3** for JSON snapshot distribution.
- **Amazon Cognito** for secure user authentication.

### Infrastructure
- **Terraform** for Infrastructure as Code (IaC).
- **GitHub Actions** for CI/CD pipelines (Backend Jest tests, Frontend Vitest tests, and automated deployment).

## Architecture

### Modular Backend
The backend has transitioned from a monolithic handler to a domain-specific modular architecture. The core router in `index.ts` delegates requests to specialized handlers in `backend/src/handlers/` (Players, Teams, Games, Cleanup), improving maintainability and reducing the cold-start footprint.

### Offline-First Strategy
The application is designed to function seamlessly without a network connection.
1.  **Local Storage**: All data is initially written to a local **IndexedDB** instance via Dexie.js.
2.  **Background Sync**: A custom `SyncService` monitors connectivity and pushes local changes to the backend when online.
3.  **Conflict Resolution**: Uses versioning and ETags to handle synchronization between multiple devices.

### S3 Snapshot Distribution
To optimize read performance and reduce DynamoDB costs:
- When data (Roster, Games, Stats) is updated, the backend generates a static JSON snapshot.
- These snapshots are uploaded to an S3 bucket.
- The frontend pulls these snapshots for large data sets (like full game stats), utilizing browser caching and S3's global scale.

### Security & Governance
- **API Security**: Administrative endpoints (like `/cleanup`) are protected via `x-api-key` headers with strict entropy requirements (min 16 chars).
- **Request Sanitization**: All incoming payloads are subject to size limits (512KB) and content-type enforcement to prevent injection and resource exhaustion attacks.
- **Data Protection**: Sensitive internal keys are stripped from public API responses using a recursive transformation layer.

## Development Workflow

### Agent-Based Development
This project utilizes specialized AI agents (Jules) to maintain and evolve the codebase. Coordination is handled through the `.Jules/` directory:
- **backlog.md**: The active list of features and maintenance tasks.
- **backlog-archive.md**: History of completed tasks to keep the active context small.
- **Agent Roles**: Specialized files (e.g., `scout.md`, `scribe-guardian.md`) define the ownership and responsibilities of different agent personas.

### Targeted Testing
To maintain high velocity while ensuring reliability:
- **Targeted Test Script**: Use `bash scripts/jules-test.sh` during development. It automatically identifies modified files and runs only the relevant tests.
- **Test Locations**:
  - Backend: `backend/src/__tests__` (Jest)
  - Frontend: `frontend/src/**/*.test.ts` (Vitest)
- **CI Enforcement**: The full suite of 100+ tests runs on every PR via GitHub Actions.

## Setup Instructions

### Frontend
1.  Navigate to the `frontend/` directory.
2.  Install dependencies: `pnpm install`
3.  Set up environment variables in a `.env` file:
    - `VITE_USER_POOL_ID`: Your AWS Cognito User Pool ID
    - `VITE_CLIENT_ID`: Your AWS Cognito Client ID
4.  Start development server: `pnpm run dev`
5.  Run tests: `pnpm test`

### Backend
1.  Navigate to the `backend/` directory.
2.  Install dependencies: `pnpm install`
3.  Build the project: `pnpm run build`
4.  Run tests: `pnpm test`

## Key Features

### Live Intelligence
- **Real-time Game Tracking**: Easy-to-use interface for logging shots, misses, rebounds, and more.
- **Defensive Momentum HUD**: Real-time tracking of **Defensive Stops** and **Kills** (3 consecutive stops).
- **Special Situations (ATO/SLOB/BLOB)**: Dedicated tracking and analytical engine for possessions following timeouts or dead balls.
- **Shot Quality & Process Tagging**: Tag shots as "Open" or "Contested" to move the conversation from results to quality.
- **Momentum & Run Alerts**: Automated detection of opponent scoring runs and scoring droughts.

### Deep Analytics
- **Shot Charts**: Visual representation of shot locations on a virtual court.
- **Advanced Analytics**: Automatic calculation of advanced metrics including **Effective Field Goal Percentage (eFG%)** and **True Shooting Percentage (TS%)**.
- **Lineup Efficiency Tracking**: Analyze the performance (Plus/Minus) of specific 5-player combinations.
- **Hot/Cold Streak Indicators**: Visual cues (🔥/❄️) help coaches identify players with scoring momentum.
- **Offline-First Synchronization**: Robust synchronization across devices with background conflict resolution.
