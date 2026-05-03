# Data Schema (DynamoDB Single Table Design)

## Table Name: `BasketballStats`

### Primary Key
- **PK**: Partition Key (String)
- **SK**: Sort Key (String)

### Entities

| Entity | PK | SK | Attributes |
| --- | --- | --- | --- |
| **Team** | `TEAM#<TeamId>` | `METADATA#<TeamId>` | Name, SeasonId, deletedAt? |
| **Player** | `PLAYER#<PlayerId>` | `METADATA#<PlayerId>` | Name, DefaultNumber, isArchived?, deletedAt? |
| **TeamPlayer** | `TEAM#<TeamId>` | `PLAYER#<PlayerId>` | JerseyNumber (1-3 digits), deletedAt? |
| **Game** | `GAME#<GameId>` | `METADATA#<GameId>` | TeamId, Opponent, Date, Location, completed (0/1), deletedAt? |
| **StatEvent** | `GAME#<GameId>` | `STAT#<Timestamp>#<StatId>` | PlayerId, Type, Points, LocationX, LocationY, Period, ClockTime, PlayName, ShotQuality, Situation, Timestamp |

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
- `GET /teams` - List all active teams.
- `POST /teams` - Create a team. Body: `{ "name": string }`.
- `DELETE /teams/{id}` - Soft delete a team.
- `PATCH /teams/{id}` - Restore a deleted team. Body: `{ "deletedAt": null }`.

### Team Players (Roster)
- `GET /teams/{teamId}/players` - List players assigned to a team.
- `POST /teams/{teamId}/players` - Add player to team. Body: `{ "playerId": UUID, "jerseyNumber": string (1-3 digits) }`.
- `DELETE /teams/{teamId}/players/{playerId}` - Remove player from team (soft delete association).

### Players
- `GET /players` - List all active players.
- `POST /players` - Create a player. Body: `{ "name": string }`.
- `DELETE /players/{id}` - Soft delete a player.
  - **Query Params**: `?archive=true` - Transition player to an archived state instead of soft deletion.
- `PATCH /players/{id}` - Restore a player.
  - **Body**: `{ "deletedAt": null }` to restore from soft-delete.
  - **Body**: `{ "isArchived": 0 }` to restore from archive.

### Games
- `GET /games?teamId={id}` - List games for a specific team.
- `POST /games` - Create a game. Body: `{ "teamId": UUID, "opponent": string, "location"?: string, "date"?: string }`.
- `DELETE /games/{id}` - Soft delete a game.
- `PATCH /games/{id}` - Restore a deleted game. Body: `{ "deletedAt": null }`.
- `POST /games/{id}/complete` - Mark a game as completed. Triggers final S3 snapshot.

### Game Stats
- `GET /games/{id}/stats` - List all active stats for a game.
- `POST /games/{id}/stats` - Record a stat event.
  - **Body**:
    ```json
    {
      "type": "MAKE" | "MISS" | "REBOUND" | "ASSIST" | "STEAL" | "TURNOVER" | "BLOCK" | "FOUL" | "TIMEOUT" | "SUB_IN" | "SUB_OUT" | "POSSESSION" | "TECHNICAL_FOUL",
      "playerId": "UUID" | "OPPONENT" | "OPPONENT:{jersey}" | "TEAM_TIMEOUT" | "OUR_TEAM",
      "points": 0 | 1 | 2 | 3,
      "locationX": number (0-100),
      "locationY": number (0-100),
      "period": number (>= 1),
      "clockTime": number (>= 0),
      "playName": string,
      "shotQuality": string,
      "situation": "ATO" | "SLOB" | "BLOB" | "EOP",
      "timestamp": "ISO8601 String"
    }
    ```
  - **Example Request**:
    ```json
    {
      "type": "MAKE",
      "playerId": "550e8400-e29b-41d4-a716-446655440000",
      "points": 3,
      "locationX": 25.5,
      "locationY": 10.0,
      "period": 1,
      "clockTime": 480,
      "playName": "Horns",
      "shotQuality": "OPEN",
      "situation": "ATO",
      "timestamp": "2024-03-21T10:00:00.000Z"
    }
    ```

#### Valid Action Types
`MAKE`, `MISS`, `REBOUND`, `OFF_REBOUND`, `DEF_REBOUND`, `ASSIST`, `STEAL`, `TURNOVER`, `BLOCK`, `FOUL`, `FOUL_SHOOTING`, `FOUL_NON_SHOOTING`, `TIMEOUT`, `SUB_IN`, `SUB_OUT`, `POSSESSION`, `TECHNICAL_FOUL`

### Administration
- `POST /cleanup` - Hard delete soft-deleted items older than 24 hours.
  - **Headers**: `x-api-key`: Admin API Key (Min 16 characters).

---

## Offline Synchronization & Snapshots

The API implements an offline-first strategy:
1. **Incremental Sync**: Clients post individual stat events or batches to the REST endpoints.
2. **S3 Snapshots**: Write operations (Team, Roster, Games, Stats) trigger the generation of static JSON snapshots in S3 for high-performance read access by the frontend.
3. **Optimistic UI**: The frontend uses IndexedDB (via Dexie.js) for immediate updates, syncing to the backend when a connection is available.
