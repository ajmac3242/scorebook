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

### Causal Accountability
Scorebook is built on the principle of **Causal Accountability**. Standard box scores tell you *what* happened; Scorebook tells you *why*. By capturing the environmental and tactical context of every action, Scorebook transforms raw data into actionable coaching intelligence.

- **Matchup Tracking & Efficiency Matrix**: Move beyond team-level defensive stats. Scorebook attributes every opponent bucket to a primary defender, generating a real-time **Holistic Matchup Matrix**. This identifies exactly which 1-on-1 battles are being won or lost, allowing for surgical defensive adjustments.
- **On/Off Impact Analytics**: Measure a player's true value using high-fidelity Net Rating. See how the team's offensive and defensive efficiency fluctuates when specific players or 5-man units are on the floor versus on the bench.
- **Shot Clock Process Analysis**: Evaluate offensive discipline by categorizing shots into **Early** (first 10s), **Mid**, or **Late** (final 5s) clock phases. This helps coaches identify if the team is settling for "rush" shots or successfully executing deep into the set.
- **Defensive Breakdown Attribution**: When an opponent scores, Scorebook prompts for a "Breakdown Reason" (e.g., *Missed Rotation*, *Transition Leak*, *Poor Closeout*). This creates a direct feedback loop between game events and practice focus.
- **Special Situation Engine (ATO/SLOB/BLOB)**: Track efficiency (**Execution Delta** and **Success %**) specifically for possessions following timeouts or out-of-bounds plays to measure the effectiveness of your set-play execution. See [ANALYTICS.md](./docs/ANALYTICS.md) for details.

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
Scorebook is maintained through an autonomous agent-centric model using **Jules**. Each agent has a specific persona and area of ownership, ensuring high code quality and documentation standards.

Coordination is managed through the `.Jules/` directory:
- **backlog.md**: The "Source of Truth" for project status, containing the active roadmap and feature acceptance criteria.
- **backlog-archive.md**: A historical record of completed missions, maintaining a lean context for active agents.
- **Agent Roles**: Personas like `Scout` (QA/Testing), `Forge` (Feature Development), and `Scribe & Guardian` (Documentation/Knowledge) have defined boundaries to prevent overlap and ensure specialized focus.
- **Coordination Journals**: Agents log learnings and patterns in their respective journal files (e.g., `scribe-guardian.md`) to maintain institutional memory across sessions.

### Targeted Testing
To maintain high velocity while ensuring reliability:
- **Targeted Test Script**: Use `bash scripts/jules-test.sh` during development. It automatically identifies modified files and runs only the relevant tests.
- **Test Locations**:
  - Backend: `backend/src/__tests__` (Jest)
  - Frontend: `frontend/src/**/*.test.ts` (Vitest)
- **CI Enforcement**: The full suite of 100+ tests runs on every PR via GitHub Actions.

## Detailed Documentation
- [Architecture Overview](./docs/ARCHITECTURE.md): Deep dive into the offline-first sync and snapshot distribution system.
- [Analytics Engine](./docs/ANALYTICS.md): Definitions and formulas for PPP, Spark Plug Index, xPTS, and Causal Accountability metrics.
- [Data Schema](./SCHEMA.md): Database entity definitions and API endpoint documentation.
- [Data Flow](./docs/DATAFLOW.md): Sequence diagrams for synchronization and snapshot processes.

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
- **Real-time Game Tracking**: High-frequency interface for logging shots, misses, and defensive actions.
- **Voice-Driven Scorekeeping**: Hands-free scoring using natural voice commands (e.g., "Five make three assist ten").
- **Defensive Momentum HUD**: Real-time tracking of **Defensive Stops**, **Kills**, and **Ref Tightness**.
- **Special Situations (ATO/SLOB/BLOB)**: Dedicated tracking for possessions following timeouts or dead balls.
- **Target Attack HUD**: Real-time identification of the opponent's "weak link" based on live Stop % data.
- **Momentum & Run Alerts**: Automated detection of opponent scoring runs and scoring droughts.

### Deep Analytics
- **Holistic Matchup Matrix**: 5x5 tactical HUD mapping unit-on-unit efficiency (Stop %) with one-tap reassignments.
- **Spark Plug Momentum Index**: Correlates "Blue Collar" hustle (dives, charges) with subsequent team scoring runs. See [ANALYTICS.md](./docs/ANALYTICS.md).
- **Paint Touches & Rim Pressure**: Measures offensive aggression via paint entries and Points Per Paint Touch (PPPT).
- **Shot Clock Process Analysis**: Categorizes shots by clock phase (Early/Mid/Late) to evaluate offensive discipline.
- **Substitution Timeline Audit**: Chronological editor to retroactively correct lineup errors for 100% accurate Net Rating.
- **Executive Halftime Talking Points**: Automated synthesis of game data into 3 actionable locker-room directives.
- **Offline-First Synchronization**: Robust background sync with IndexedDB and AWS S3 snapshots.
