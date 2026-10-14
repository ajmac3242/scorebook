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

- **Domain Handlers**: Requests are routed by a core `index.ts` to specialized handlers (Teams, Players, Games, Stats, Cleanup). Each handler is responsible for the business logic and DynamoDB interactions for its specific domain, improving cold-start performance and modularity.
- **Single-Table Design**: Utilizes Amazon DynamoDB with a single-table pattern for high performance and efficient relational modeling through GSIs (Global Secondary Indexes).

### 4. Security & Governance
- **Redaction Layer**: Sensitive fields (like IP addresses in headers) are automatically redacted in CloudWatch logs. Internal DynamoDB keys (PK/SK) are stripped from public API responses.
- **Rate Limiting & Sanitization**: Incoming payloads are limited to 512KB. All string inputs are subject to length validation (256 characters) to prevent DoS attacks.
- **Admin Security**: High-leverage endpoints (e.g., `/cleanup`) require an `x-api-key` with a minimum of 16 characters.

## Tactical Philosophy & Core Game Loop Interlocks

CourtSight is designed as a **Tactical Operating System** that enforces **Causal Accountability**. This means the application's state is not just a passive record, but an active "Digital Twin" of the game environment. To guarantee statistical integrity during live gameplay, the system enforces several hard interlocks:

- **Whistle-Aware Clock Auto-Pause & Stoppage Timestamp Sync**: Core game whistle actions (Fouls, Timeouts, Held Balls) are interlocked with the game clock, automatically pausing it and binding any immediate follow-up stat events to the exact frozen whistle clock time snapshot to eliminate timing drift.
- **Personnel Floor & Disqualified Player Guard**: Enforces the 5-player on-court rule and blocks clock starts and period advancement if any active player on the floor has reached or exceeded the game's configured personal foul limit (`foulLimit`), launching a forced substitution drawer.
- **Free Throw Sequence State Recovery & Cancellation Rollback**: Persists active free throw sequence progress state to `db.games` on every attempt to recover from tab crashes, locks substitution and clock controls during shooting workflows, and automatically rolls back created stats and score snapshots if a sequence is cancelled prior to completion.
- **Period Transition Score Snapshot & Lineup Reconciliation Interlock**: During period verification, `VerifiedPeriodModal` re-aggregates active `db.stats` scoring events against `db.games` score snapshot fields to auto-heal desynchronizations, reconciles team fouls for bonus displays, and verifies active on-court lineup eligibility.
- **Data Finality & The Re-open Guard**: Once a game is marked as completed (`completed: 1`), its data is treated as immutable at the API level. However, to safeguard against accidental or premature completion, the frontend implements a **Completed Game Administrative Restoration (Re-open Guard)**. Tapping "Re-open Game" transitions the local-first IndexedDB record back to an active state (`completed: 0`, `synced: 0`), restoring editing controls. Because the backend enforces strict server-side immutability, any newly recorded stats or modifications pushed during a local re-open period will be rejected with a `403 Forbidden` until the server-side record is updated, ensuring high-fidelity data integrity boundaries.

## Data Flow Diagram

Refer to [DATAFLOW.md](./DATAFLOW.md) for detailed sequence diagrams of the synchronization and snapshot processes.

## Tech Stack
- **Frontend**: React 19, Vite, MUI 6, Dexie.js, Recharts.
- **Backend**: Node.js 22, AWS Lambda, DynamoDB, S3.
- **Infrastructure**: Terraform, GitHub Actions.
