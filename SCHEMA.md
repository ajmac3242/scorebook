# Data Schema (DynamoDB Single Table Design)

## Table Name: `BasketballStats`

### Primary Key
- **PK**: Partition Key (String)
- **SK**: Sort Key (String)

### Entities

| Entity | PK | SK | Attributes |
| --- | --- | --- | --- |
| **Team** | `TEAM#<TeamId>` | `METADATA#<TeamId>` | name, seasonId, primaryColor, fouls, deletedAt? |
| **Player** | `PLAYER#<PlayerId>` | `METADATA#<PlayerId>` | name, defaultNumber, isStar (0/1), isArchived (0/1), deletedAt? |
| **TeamPlayer** | `TEAM#<TeamId>` | `PLAYER#<PlayerId>` | id (assoc-uuid), teamId, playerId, jerseyNumber (1-3 digits), deletedAt? |
| **Game** | `GAME#<GameId>` | `METADATA#<GameId>` | teamId, opponent, date, location, completed (0/1), periodLength, foulLimit, deletedAt? |
| **StatEvent** | `GAME#<GameId>` | `STAT#<Timestamp>#<StatId>` | id, playerId, type, points, locationX, locationY, timestamp, situation?, shotClockPhase?, primaryDefenderId?, defensiveScheme?, opponentPlayType?, breakdownReason? |

### Entity Examples (JSON)

#### Team
```json
{
  "PK": "TEAM#550e8400-e29b-41d4-a716-446655440000",
  "SK": "METADATA#550e8400-e29b-41d4-a716-446655440000",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "City Varsity",
  "primaryColor": "#023246",
  "fouls": 5
}
```

#### Player
```json
{
  "PK": "PLAYER#7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "SK": "METADATA#7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "name": "Stephen Curry",
  "isStar": 1,
  "isArchived": 0
}
```

#### Game
```json
{
  "PK": "GAME#f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "SK": "METADATA#f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "teamId": "550e8400-e29b-41d4-a716-446655440000",
  "opponent": "Lakers",
  "location": "Home",
  "date": "2024-11-15",
  "completed": 1,
  "periodLength": 8,
  "foulLimit": 5
}
```

#### StatEvent
```json
{
  "PK": "GAME#f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "SK": "STAT#2024-11-15T19:05:00.000Z#a3f12b",
  "id": "a3f12b",
  "playerId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "type": "MAKE",
  "points": 3,
  "period": 1,
  "clockTime": 420.5,
  "locationX": 85.0,
  "locationY": 25.0,
  "situation": "ATO",
  "shotClockPhase": "MID"
}
```

### Global Secondary Indexes (GSI)

#### GSI1: Entity Lookup & Hierarchy
- **GSI1PK**: `SK` (or `PK` for sub-resources)
- **GSI1SK**: `PK` (or `SK` for sub-resources)
- *Purpose*: Find all Teams (`GSI1PK=TEAM`), all Players (`GSI1PK=PLAYER`), all Games for a Team (`GSI1PK=TEAM#<id>`), all Players in a Team (`GSI1PK=TEAM#<id>`).

#### GSI2: Player Stats Aggregate (Reserved)
- **GSI2PK**: `PLAYER#<PlayerId>`
- **GSI2SK**: `STAT#<Timestamp>`
- *Purpose*: Get all stats for a specific player across all games.

---

## API Endpoints (REST)

All write endpoints (`POST`, `PUT`, `PATCH`) require `Content-Type: application/json`.

### Teams

#### `GET /teams`
- **Description**: List all active teams.
- **Response**: `200 OK`
- **Response Shape**:
```json
[
  {
    "id": "team-uuid",
    "name": "Warriors",
    "primaryColor": "#1D428A",
    "fouls": 5
  }
]
```

#### `POST /teams`
- **Description**: Create a team.
- **Request Body**:
```json
{
  "name": "Warriors",
  "description": "City High Varsity",
  "primaryColor": "#1D428A",
  "fouls": 5
}
```
- **Response**: `201 Created` with the created Team object.

#### `DELETE /teams/{id}`
- **Description**: Soft delete a team.
- **Response**: `200 OK`

#### `PATCH /teams/{id}`
- **Description**: Restore a deleted team.
- **Request Body**: `{ "deletedAt": null }`
- **Response**: `200 OK`

### Team Players (Roster)

#### `GET /teams/{teamId}/players`
- **Description**: List players assigned to a team.
- **Response**: `200 OK` with an array of TeamPlayer objects.

#### `POST /teams/{teamId}/players`
- **Description**: Add player to team roster.
- **Request Body**:
```json
{
  "playerId": "uuid-v4-string",
  "jerseyNumber": "30"
}
```
- **Response**: `201 Created` with the association object.

#### `DELETE /teams/{teamId}/players/{playerId}`
- **Description**: Remove player from team (soft delete association).
- **Response**: `200 OK`

### Players

#### `GET /players`
- **Description**: List all active players.
- **Response**: `200 OK` with an array of Player objects.

#### `POST /players`
- **Description**: Create a global player entity.
- **Request Body**:
```json
{
  "name": "Stephen Curry"
}
```
- **Response**: `201 Created` with the created Player object.

#### `DELETE /players/{id}`
- **Description**: Soft delete a player.
- **Query Params**: `?archive=true` - Transitions player to an archived state instead of soft deletion.
- **Response**: `200 OK`

#### `PATCH /players/{id}`
- **Description**: Update/Restore a player.
- **Request Body (Restore from Soft Delete)**: `{ "deletedAt": null }`
- **Request Body (Restore from Archive)**: `{ "isArchived": 0 }`
- **Response**: `200 OK`

### Games

#### `GET /games?teamId={id}`
- **Description**: List games for a specific team.
- **Query Params**: `teamId` (Required UUID)
- **Response Shape**:
```json
[
  {
    "id": "game-uuid",
    "teamId": "team-uuid",
    "opponent": "Lakers",
    "date": "2024-11-15",
    "completed": 1
  }
]
```

#### `POST /games`
- **Description**: Create a new game.
- **Request Body**:
```json
{
  "teamId": "team-uuid",
  "opponent": "Lakers",
  "location": "Home",
  "date": "2024-11-15",
  "time": "19:00",
  "periodLength": 8,
  "foulLimit": 5
}
```
- **Response**: `201 Created`

#### `DELETE /games/{id}`
- **Description**: Soft delete a game.
- **Response**: `200 OK`

#### `PATCH /games/{id}`
- **Description**: Restore a deleted game.
- **Request Body**: `{ "deletedAt": null }`
- **Response**: `200 OK`

#### `POST /games/{id}/complete`
- **Description**: Mark a game as completed. Triggers final S3 snapshot.
- **Response**: `200 OK`

### Game Stats

#### `GET /games/{id}/stats`
- **Description**: List all stats for a game.
- **Response Shape**:
```json
[
  {
    "id": "stat-uuid",
    "playerId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "type": "MAKE",
    "points": 3,
    "timestamp": "2024-11-15T19:05:00.000Z"
  }
]
```

#### `POST /games/{id}/stats`
- **Description**: Record a stat event.
- **Request Body**:
```json
{
  "type": "MAKE",
  "playerId": "player-uuid",
  "points": 3,
  "period": 1,
  "clockTime": 420.5,
  "locationX": 85.0,
  "locationY": 25.0,
  "situation": "ATO",
  "shotClockPhase": "MID",
  "primaryDefenderId": "defender-uuid"
}
```
- **Response**: `201 Created`

#### Stat Event Field Definitions

- **playerId**: ID of the player performing the action.
  - `UUID`: Standard for registered team players.
  - `OPPONENT`: General tracking for unidentified opponents.
  - `OPPONENT:{jersey}`: Specific opponent identified by jersey number (e.g., `OPPONENT:12`).
- **situation**: Tactical context of the possession.
  - `ATO`: After Time Out
  - `SLOB`: Sideline Out of Bounds
  - `BLOB`: Baseline Out of Bounds
  - `EOP`: End of Period
- **shotClockPhase**: Timing of the shot within the possession.
  - `EARLY`: First 10 seconds of the clock
  - `MID`: Middle of the clock
  - `LATE`: Final 5 seconds of the clock
- **primaryDefenderId**: The ID of the opponent player primarily responsible for defending the action (used in Matchup Tracking).
- **defensiveScheme**: The active defensive set during the event.
  - `MAN`, `ZONE`, `PRESS`, `DOUBLE`
- **opponentPlayType**: The offensive action type executed by the opponent.
  - `PnR`, `ISO`, `POST`, `TRANSITION`, `OFF_SCREEN`
- **breakdownReason**: The specific tactical failure attributed to a points-allowed event.
  - `Missed Rotation`, `Transition Leak`, `Poor Closeout`, `Out-Hustled`, `Great Contest`

### Administration

#### `POST /cleanup`
- **Description**: Hard delete soft-deleted items older than 24 hours.
- **Headers**: `x-api-key`: Admin API Key (Min 16 characters).
- **Response**: `200 OK`

---

## Offline Synchronization & Snapshots

The API implements an offline-first strategy:
1. **Incremental Sync**: Clients post individual stat events or batches to the REST endpoints.
2. **S3 Snapshots**: Write operations (Team, Roster, Games, Stats) trigger the generation of static JSON snapshots in S3 for high-performance read access by the frontend.
3. **Optimistic UI**: The frontend uses IndexedDB (via Dexie.js) for immediate updates, syncing to the backend when a connection is available.
