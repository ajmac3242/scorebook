# Data Flow and System Architecture

This document describes the high-level architecture and detailed data flow for the Basketball Stats application.

## High-Level Architecture

The application is built using a serverless architecture on AWS, with a local-first frontend for offline capabilities.

```mermaid
graph TD
    User([User])
    subgraph "Frontend (Browser/iPad)"
        UI[React UI]
        IDB[(IndexedDB - Dexie.js)]
        Sync[SyncService]
    end
    subgraph "AWS Infrastructure"
        CF[CloudFront]
        S3_Static[S3 - Static Website]
        S3_Data[S3 - Snapshot Data]
        API[API Gateway]
        Lambda[Lambda Handler]
        DB[(DynamoDB)]
        Cognito[Cognito User Pool]
    end

    User <--> UI
    UI <--> IDB
    UI <--> Sync
    Sync <--> CF
    CF <--> S3_Static
    CF <--> S3_Data
    CF <--> API
    API <--> Lambda
    Lambda <--> DB
    Lambda <--> S3_Data
    API -.-> Cognito
```

## Detailed Data Flow

### Offline-First Synchronization

The application uses a "push-then-pull" strategy to synchronize local changes with the backend while ensuring data consistency.

#### 1. Push Updates (Local to Remote)

When a user performs an action (e.g., records a stat, creates a team), it is first saved to IndexedDB with `synced: 0`.

```mermaid
sequenceDiagram
    participant UI as React UI
    participant IDB as IndexedDB
    participant Sync as SyncService
    participant API as API Gateway / Lambda
    participant DB as DynamoDB
    participant S3 as S3 Data Bucket

    UI->>IDB: Write record (synced: 0)
    UI->>Sync: Trigger pushUpdates()
    Sync->>IDB: Query records where synced: 0
    IDB-->>Sync: Return unsynced records
    loop For each record
        Sync->>API: POST /api/{resource}
        API->>DB: PutItem
        DB-->>API: Success
        alt If Team/Game Created or Game Completed
            API->>S3: Update JSON Snapshots
        end
        API-->>Sync: 201 Created / 200 OK
        Sync->>IDB: Update record (synced: 1)
    end
```

#### 2. Pull Updates (Remote to Local)

The `pullAll` and `syncTeamDetails` processes fetch the latest snapshots and API data to populate the local database.

```mermaid
sequenceDiagram
    participant Sync as SyncService
    participant CF as CloudFront / S3 Data
    participant API as API Gateway / Lambda
    participant IDB as IndexedDB

    Sync->>API: GET /api/seasons
    API-->>Sync: Seasons List
    Sync->>IDB: Put Seasons (synced: 1)

    loop For each Season/Team
        Sync->>CF: GET /data/teams/{id}/roster.json (If-None-Match)
        alt 200 OK
            CF-->>Sync: Roster Snapshot + ETag
            Sync->>IDB: Bulk Put Players/TeamPlayers
        else 304 Not Modified
            CF-->>Sync: Use Local Cache
        end
    end

    Sync->>IDB: Update completed game stats via snapshots
```

### Snapshot Generation

Snapshots are pre-computed JSON files stored in S3 to facilitate fast, efficient data retrieval for the frontend, especially during initial sync or when viewing historical data.

- **Roster Snapshot:** Generated when a team is created or a player is added to a team.
- **Games Snapshot:** Generated when a game is created or completed.
- **Game Stats Snapshot:** Generated when a game is marked as completed. This includes calculated final scores and the W/L result.
