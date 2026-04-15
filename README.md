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
- **AWS Lambda** (Node.js 22 runtime)
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
2.  **Background Sync**: A custom `SyncService` monitors connectivity and pushes local changes to the backend when online.
3.  **Conflict Resolution**: Uses versioning and ETags to handle synchronization between multiple devices.

### S3 Snapshot Distribution
To optimize read performance and reduce DynamoDB costs:
- When data (Roster, Games, Stats) is updated, the backend generates a static JSON snapshot.
- These snapshots are uploaded to an S3 bucket.
- The frontend pulls these snapshots for large data sets (like full game stats), utilizing browser caching and S3's global scale.

## Performance & Scalability
- **ETag Caching**: The application utilizes ETag-based caching (via `If-None-Match` headers) when pulling S3 snapshots. This ensures that the frontend only downloads data if it has changed since the last sync, significantly reducing data usage and processing time.
- **Efficient Aggregations**: Statistics are aggregated on-the-fly in the frontend using optimized `for` loops and `Map` objects, ensuring that complex calculations (like PPG, RPG, APG) remain fast even as the number of recorded events grows.
- **Reduced Backend Load**: By serving historical game stats and rosters directly from S3, the application offloads significant read traffic from DynamoDB, leading to lower costs and improved scalability.

## Setup Instructions

### Frontend
1.  Navigate to the `frontend/` directory.
2.  Install dependencies: `npm install`
3.  Set up environment variables in a `.env` file:
    - `VITE_USER_POOL_ID`: Your AWS Cognito User Pool ID
    - `VITE_CLIENT_ID`: Your AWS Cognito Client ID
4.  Start development server: `npm run dev`
5.  Run tests: `npm test`

### Backend
1.  Navigate to the `backend/` directory.
2.  Install dependencies: `npm install`
3.  Build the project: `npm run build`
4.  Run tests: `npm test`

## Key Features
- **Real-time Game Tracking**: Easy-to-use interface for logging shots, misses, rebounds, and more.
- **Shot Charts**: Visual representation of shot locations on a virtual court.
- **Advanced Analytics**: Automatic calculation of advanced metrics including **Effective Field Goal Percentage (eFG%)** and **True Shooting Percentage (TS%)** for deep efficiency analysis.
- **Defensive Momentum Tracking**: Real-time tracking of **Defensive Stops** and **Kills** (3 consecutive stops) to monitor defensive intensity.
- **Lineup Efficiency Tracking**: Analyze the performance (Plus/Minus) of specific 5-player combinations to optimize rotations.
- **Hot/Cold Streak Indicators**: Visual cues (🔥/❄️) help coaches identify players with scoring momentum in real-time.
- **Detailed Box Scores**: Symmetrical analytical parity with detailed stats for both your team and the opponent.
- **Secure Data**: User data is isolated and encrypted, with local database cleanup on logout.
- **Offline-First Synchronization**: Robust synchronization across devices with background conflict resolution.
