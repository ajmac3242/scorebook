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
| **StatEvent** | `GAME#<GameId>` | `STAT#<Timestamp>#<StatId>` | PlayerId, Type (Shot, Rebound, etc.), Points, LocationX, LocationY, SubInPlayerId, SubOutPlayerId, deletedAt |

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
  - Body: `{ name: string, id?: UUID }`
- `DELETE /teams/{id}`: Soft deletes a team.
- `PATCH /teams/{id}`: Restores a deleted team.
  - Body: `{ deletedAt: null }`

### Team Players
- `GET /teams/{id}/players`: Returns all players associated with a team.
- `POST /teams/{id}/players`: Adds a player to a team.
  - Body: `{ playerId: UUID, jerseyNumber?: string, id?: UUID }`
- `DELETE /teams/{id}/players/{playerId}`: Removes a player from a team (soft delete).

### Players
- `GET /players`: Returns all active players.
- `POST /players`: Creates a new player.
  - Body: `{ name: string, defaultNumber?: string, id?: UUID }`
- `DELETE /players/{id}`: Soft deletes or archives a player.
  - Use `?archive=true` query parameter to archive instead of soft delete.
- `PATCH /players/{id}`: Restores or unarchives a player.
  - Body: `{ deletedAt: null }` to restore from soft delete.
  - Body: `{ isArchived: 0 }` to restore from archive.

### Games
- `GET /games?teamId={id}`: Returns games for a specific team.
- `POST /games`: Creates a new game.
  - Body: `{ teamId: UUID, opponent: string, date: ISO8601, location: string, ... }`
- `DELETE /games/{id}`: Soft deletes a game.
- `PATCH /games/{id}`: Restores a deleted game.
  - Body: `{ deletedAt: null }`
- `POST /games/{id}/complete`: Marks a game as completed and triggers final snapshot generation.

### Game Stats
- `GET /games/{id}/stats`: Returns all stat events for a game.
- `POST /games/{id}/stats`: Records a new stat event.
  - Body: `{ type: string, playerId: string, points?: number, locationX?: number, locationY?: number, ... }`

### Cleanup (Admin)
- `POST /cleanup`: Performs hard cleanup of soft-deleted items older than 24 hours.
  - Requires `x-api-key` header matching the environment's `ADMIN_API_KEY`.
