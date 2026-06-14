# System Architecture: CourtSight - Basketball

CourtSight is a **Tactical Operating System** for basketball, built with an offline-first, mobile-optimized architecture. It leverages a serverless AWS backend and a robust local storage layer to ensure reliability in environments with intermittent connectivity (e.g., high school gyms).

## Core Architectural Pillars

### 1. Offline-First Synchronization
The application is designed to be fully functional without a persistent network connection.

- **Local Storage (IndexedDB)**: The primary source of truth for the UI is a local **IndexedDB** instance, managed via **Dexie.js**. All user actions (stats, roster changes, game creation) are written to the local database immediately.
- **SyncService**: A background service that monitors network connectivity. When online, it pushes "unsynced" records to the AWS Lambda backend.
- **Push-then-Pull Strategy**:
    1. **Push**: Local changes are POSTed to REST endpoints.
    2. **Pull**: The service fetches the latest static snapshots and incremental updates to keep the local state in sync with other devices.

### 2. Snapshot-Based Data Distribution
To minimize DynamoDB read costs and improve initial load times, the system uses **S3 Snapshots**.

- **Write-Triggered Generation**: When a significant event occurs (e.g., a game is completed or a roster is updated), the backend Lambda generates a JSON snapshot of the relevant data set.
- **Global S3 Distribution**: These snapshots are stored in S3 and served via CloudFront. The frontend pulls these snapshots for bulk data (like historical game stats), benefiting from CDN caching and reducing API Gateway overhead.

### 3. Modular Serverless Backend
The backend is a collection of **Node.js 22 Lambda functions** organized by domain.

- **Domain Handlers**: Requests are routed by a core `index.ts` to specialized handlers (Teams, Players, Games, Stats, Cleanup).
- **Single-Table Design**: Utilizes Amazon DynamoDB with a single-table pattern for high performance and efficient relational modeling through GSIs (Global Secondary Indexes).

### 4. Intelligence Layers
CourtSight moves beyond reactive statistics by implementing proactive analytical layers that assist coaches in real-time.

- **Neural Governance**: Monitors the "Cognitive Switching Cost" of tactical shifts. By tracking the frequency of play-calling changes and defensive scheme pivots, the system calculates a **Neural Load** score to predict mental exhaustion and execution errors.
- **Predictive Self-Scouting**: Analyzes the team's own tactical patterns to identify a **Predictability Node**. This alerts the coach when the current strategy becomes "scoutable" by the opponent, suggesting "Algorithmic Breakers" to reset tactical entropy.
- **Causal Feedback Loop**: Bridges the gap between game events and practice. By requiring breakdown attribution (e.g., *Missed Rotation*) and tracking vocal engagement (**Verbal Velocity**), the system generates automated practice prescriptions focused on root-cause failures.

### 5. Security & Governance
- **Redaction Layer**: Sensitive fields (like IP addresses in headers) are automatically redacted in CloudWatch logs. Internal DynamoDB keys (PK/SK) are stripped from public API responses.
- **Rate Limiting & Sanitization**: Incoming payloads are limited to 512KB. All string inputs are subject to length validation (256 characters) to prevent DoS attacks.
- **Admin Security**: High-leverage endpoints (e.g., `/cleanup`) require an `x-api-key` with a minimum of 16 characters.

## Data Flow Diagram

Refer to [DATAFLOW.md](./DATAFLOW.md) for detailed sequence diagrams of the synchronization and snapshot processes.

## Tech Stack
- **Frontend**: React 19, Vite, MUI 6, Dexie.js, Recharts.
- **Backend**: Node.js 22, AWS Lambda, DynamoDB, S3.
- **Infrastructure**: Terraform, GitHub Actions.
