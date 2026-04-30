# Data Schema (DynamoDB Single Table Design)

## Table Name: `BasketballStats`

### Primary Key
- **PK**: Partition Key (String)
- **SK**: Sort Key (String)

### Entities

| Entity | PK | SK | Attributes |
| --- | --- | --- | --- |
| **Team** | `TEAM#<TeamId>` | `METADATA#<TeamId>` | Name, deletedAt |
| **Player** | `PLAYER#<PlayerId>` | `METADATA#<PlayerId>` | Name, DefaultNumber, deletedAt, isArchived |
| **TeamPlayer** | `TEAM#<TeamId>` | `PLAYER#<PlayerId>` | JerseyNumber, teamId, playerId, deletedAt |
| **Game** | `GAME#<GameId>` | `METADATA#<GameId>` | TeamId, Opponent, Date, Location, completed, deletedAt |
| **StatEvent** | `GAME#<GameId>` | `STAT#<Timestamp>#<StatId>` | PlayerId, Type, Points, clockTime, period, locationX, locationY, shotQuality, shotType, playType, playName, relatedPlayerId, subInPlayerId, subOutPlayerId, isBookmarked, defensiveScheme, deletedAt |

### Global Secondary Indexes (GSI)

#### GSI1: Entity Lookup & Hierarchy
- **GSI1PK**: `SK` or custom (e.g., `TEAM#<TeamId>`)
- **GSI1SK**: `PK` or `STAT#<Timestamp>#<StatId>`
- *Purpose*: Find all Players in a Team, all Stats in a Game, etc.

## API Endpoints (REST)

All write requests (`POST`, `PUT`, `PATCH`) require `Content-Type: application/json`.
Responses include a `X-Request-Id` header.

### Teams
- `GET /teams`: Returns all active teams.
- `POST /teams`: Creates a new team.
  - Body: `{ "name": string, "id"?: UUID }`
- `DELETE /teams/{id}`: Soft deletes a team and its snapshots.
- `PATCH /teams/{id}`: Restores a deleted team.
  - Body: `{ "deletedAt": null }`

### Team Players
- `GET /teams/{id}/players`: Returns all active player associations for a team.
- `POST /teams/{id}/players`: Adds a player to a team.
  - Body: `{ "playerId": UUID, "jerseyNumber"?: string, "id"?: UUID }`
- `DELETE /teams/{id}/players/{playerId}`: Removes a player from a team (soft delete).

### Players
- `GET /players`: Returns all active (non-deleted, non-archived) players.
- `POST /players`: Creates a new player.
  - Body: `{ "name": string, "defaultNumber"?: string, "id"?: UUID }`
- `DELETE /players/{id}`: Soft deletes or archives a player.
  - Use `?archive=true` query parameter to archive (sets `isArchived = 1`) instead of soft delete.
- `PATCH /players/{id}`: Restores or unarchives a player.
  - Body: `{ "deletedAt": null }` to restore from soft delete.
  - Body: `{ "isArchived": 0 }` to restore from archive.

### Games
- `GET /games?teamId={id}`: Returns all active games for a specific team.
- `POST /games`: Creates a new game.
  - Body:
    ```json
    {
      "teamId": "UUID",
      "opponent": "string",
      "date": "ISO8601",
      "location": "string",
      "completed"?: number (0|1),
      "id"?: "UUID"
    }
    ```
- `DELETE /games/{id}`: Soft deletes a game and its snapshots.
- `PATCH /games/{id}`: Restores a deleted game.
  - Body: `{ "deletedAt": null }`
- `POST /games/{id}/complete`: Marks a game as completed and triggers final snapshot generation.

### Game Stats
- `GET /games/{id}/stats`: Returns all active stat events for a game.
  - Response: `Array<StatEvent>` (sanitized, internal keys removed)
- `POST /games/{id}/stats`: Records a new stat event.
  - Body:
    ```json
    {
      "type": "MAKE" | "MISS" | "REBOUND" | "ASSIST" | "TURNOVER" | "SUB_IN" | "SUB_OUT" | ...,
      "playerId": "UUID" | "OPPONENT" | "OPPONENT:12",
      "points": number (0-3),
      "clockTime": number (seconds),
      "period": number (1-20),
      "locationX": number (0-100),
      "locationY": number (0-100),
      "shotQuality": "OPEN" | "CONTESTED",
      "shotType": "CATCH" | "DRIB",
      "playType": string,
      "relatedPlayerId": "UUID",
      "subInPlayerId": "UUID",
      "subOutPlayerId": "UUID",
      "timestamp": "ISO8601",
      "id": "UUID"
    }
    ```
  - Response: `201 Created` with the saved item.

### Cleanup (Admin)
- `POST /cleanup`: Performs hard cleanup of soft-deleted items older than 24 hours.
  - Requires `x-api-key` header matching the environment's `ADMIN_API_KEY`.
