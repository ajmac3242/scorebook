# Scorebook - Basketball Stats

Scorebook is a mobile-first, offline-ready basketball statistics tracking application. It allows coaches and enthusiasts to track game events (shots, rebounds, assists, etc.) in real-time and provides detailed analytics for teams and players.

## Tech Stack

### Frontend
- **React 19** with **TypeScript**
- **Vite** for fast builds and hot module replacement
- **Material UI (MUI) 6** for a responsive, modern component system
- **Dexie.js** (IndexedDB wrapper) for robust offline-first data storage
- **Recharts** for performance visualizations
- **Day.js** for lightweight date and time formatting

### Backend
- **AWS Lambda** (Node.js 22 runtime) using a modular handler architecture
- **Amazon DynamoDB** for high-performance, scalable NoSQL storage
- **Amazon S3** for JSON snapshot distribution
- **Amazon Cognito** for secure user authentication

### Infrastructure
- **Terraform** for Infrastructure as Code (IaC)
- **GitHub Actions** for CI/CD pipelines (Backend Jest tests, Frontend Vitest tests, and automated deployment)

## Architecture

### Offline-First Strategy
The application is designed to function seamlessly without a network connection.
1.  **Local Storage**: All data is initially written to a local **IndexedDB** instance via Dexie.js.
2.  **Background Sync**: A custom `SyncService` monitors connectivity and pushes local changes to the backend when online. It processes updates in concurrent chunks to maximize throughput while maintaining backend stability.
3.  **Conflict Resolution**: Uses versioning and ETag-based caching to handle synchronization between multiple devices efficiently.

### Modular Backend Architecture
To ensure maintainability and performance as the API surface grows, the backend is organized into domain-specific handlers (e.g., `players.ts`, `games.ts`, `teams.ts`). This structure avoids the complexity of a monolithic router and allows for granular validation and optimization within each resource path.

### S3 Snapshot Distribution
To optimize read performance and reduce DynamoDB costs:
- When data (Roster, Games, Stats) is updated, the backend generates a static JSON snapshot.
- These snapshots are uploaded to an S3 bucket.
- The frontend pulls these snapshots for large data sets (like full game stats), utilizing browser caching and S3's global scale.

## Performance & Scalability
- **ETag Caching**: The application utilizes ETag-based caching (via `If-None-Match` headers) when pulling S3 snapshots. This ensures that the frontend only downloads data if it has changed since the last sync, significantly reducing data usage and processing time.
- **Parallelized Synchronization**: The `SyncService` parallelizes independent network requests (e.g., fetching multiple team rosters or game stats) to minimize total synchronization latency and fully utilize available bandwidth.
- **Efficient Aggregations**: Statistics are aggregated on-the-fly in the frontend using optimized `for` loops and `Map` objects, ensuring that complex calculations (like PPG, RPG, APG) remain fast even as the number of recorded events grows.
- **Reduced Backend Load**: By serving historical game stats and rosters directly from S3, the application offloads significant read traffic from DynamoDB, leading to lower costs and improved scalability.

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
4.  Run tests: `NODE_OPTIONS=--experimental-vm-modules pnpm test` (Required for ESM support in Jest)

## Testing Philosophy

To ensure high reliability and rapid development cycles, Scorebook follows a targeted testing approach:

- **Targeted Testing**: Developers should use the `bash scripts/jules-test.sh` script during local development. This script automatically detects changed files and runs only the relevant tests, significantly reducing feedback loops.
- **CI Enforcement**: The full test suite (100+ tests) is automatically executed by GitHub Actions on every Pull Request to ensure no regressions are introduced.
- **Behavior-Driven**: Tests focus on verifying business logic (e.g., statistical aggregations, defensive momentum) rather than internal implementation details.

## Technical Deep Dive: Performance & Security Patterns

To maintain high performance on low-end mobile devices and ensure enterprise-grade security for user data, Scorebook follows several strict engineering patterns:

### 1. High-Performance Statistical Aggregation
- **Loop Inversion**: Frequent checks (like determining if an event is a score) are performed once per event, and then we iterate over active players or lineups. This reduces branching logic inside the inner-most loops.
- **O(N) Single-Pass Streams**: Complex metrics like Defensive Stops and Kills are calculated using a state-machine that processes the event stream in a single linear pass, avoiding expensive nested loops or look-aheads.
- **OFF-as-Difference Optimization**: On/Off impact statistics are derived by tracking global game totals and subtracting a player's "ON" stats. This reduces the complexity of On/Off calculation from $O(N \times P)$ to $O(N + P)$.
- **Bitwise Math**: Bitwise OR (`| 0`) is used for high-performance floor operations in clock formatting, providing a faster alternative to `Math.floor` for positive 32-bit integers.

### 2. Defense-in-Depth Security
- **Mass Assignment Protection**: Utility functions `stripLocalFields` (inbound) and `sanitizeOutput` (outbound) act as security boundaries, ensuring that internal database metadata (like DynamoDB PK/SK) and restricted state never cross the API perimeter.
- **Timing Attack Prevention**: All secret comparisons (like API keys) use `crypto.timingSafeEqual` after fixed-length hashing (SHA-256) to prevent character-by-character guessing via execution time analysis.
- **Strict Validation**: All IDs are validated as UUID v4 or strict jersey-prefixed formats (`OPPONENT:123`) to prevent injection and path traversal attacks.
- **Hardened Headers**: Every API response includes a comprehensive CSP and other security headers (HSTS, COOP, CORP) to isolate the application in the browser.

## Key Features
- **Real-time Game Tracking**: Easy-to-use interface for logging shots, misses, rebounds, and more.
- **Shot Charts**: Visual representation of shot locations on a virtual court.
- **Advanced Analytics**: Automatic calculation of advanced metrics including **Effective Field Goal Percentage (eFG%)** and **True Shooting Percentage (TS%)**. It utilizes a real-time possession estimation formula (`FGA + 0.44 * FTA + TO - OREB`) to provide deep efficiency insights (Points Per Possession) during live play.
- **Defensive Momentum Tracking**: Real-time tracking of **Defensive Stops** (defensive possessions without an opponent score) and **Kills** (3 consecutive stops). This uses a state-machine logic to accurately identify possession terminators across multi-miss sequences.
- **Holistic Matchup Efficiency Matrix**: A 5x5 visual matrix that maps our 5 active players against the opponent's unit, color-coded by defensive efficiency (Stop %) to reveal exploitable mismatches.
- **Locker Room Post-Game Learning System**: An interactive "Coaching Clinic" mode that identifies critical game-changing moments, execution wins, and tactical errors based on PPP and score flow.
- **Opponent Play-Type Breakdown**: Granular categorization of opponent scoring (PnR, ISO, Transition, etc.) with real-time efficiency alerts and shot chart filtering.
- **Momentum & Run Alerts**: Automated detection of opponent scoring runs (e.g. 8-0) and scoring droughts to assist with timeout management.
- **"Blue Collar" Hustle Stats**: Dedicated tracking for non-standard defensive impact events including **Deflections**, **Floor Dives**, **Charges Taken**, and **Great Contests**.
- **Special Situations Tracking**: One-tap tagging for critical tactical moments including **ATO** (After Timeout), **SLOB** (Side-Line Out of Bounds), **BLOB** (Base-Line Out of Bounds), and **EOP** (End of Period) to analyze execution efficiency under pressure.
- **Clutch Analytics**: Interactive filtering to analyze player and lineup performance during high-leverage "Clutch Time" situations.
- **Lineup Efficiency Tracking**: Analyze the performance (Plus/Minus) of specific 5-player combinations to optimize rotations.
- **Hot/Cold Streak Indicators**: Visual cues (🔥/❄️) help coaches identify players with scoring momentum in real-time.
- **Detailed Box Scores**: Symmetrical analytical parity with detailed stats for both your team and the opponent.
- **Secure Data**: User data is isolated and encrypted, with local database cleanup on logout.
- **Offline-First Synchronization**: Robust synchronization across devices with background conflict resolution.
