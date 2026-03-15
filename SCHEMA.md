# Data Schema (DynamoDB Single Table Design)

## Table Name: `BasketballStats`

### Primary Key
- **PK**: Partition Key (String)
- **SK**: Sort Key (String)

### Entities

| Entity | PK | SK | Attributes |
| --- | --- | --- | --- |
| **Season** | `SEASON#<SeasonId>` | `METADATA#<SeasonId>` | Name, StartDate, EndDate |
| **Team** | `TEAM#<TeamId>` | `METADATA#<TeamId>` | Name, SeasonId |
| **Player** | `PLAYER#<PlayerId>` | `METADATA#<PlayerId>` | Name, DefaultNumber |
| **TeamPlayer** | `TEAM#<TeamId>` | `PLAYER#<PlayerId>` | JerseyNumber (Season specific) |
| **Game** | `GAME#<GameId>` | `METADATA#<GameId>` | TeamId, Opponent, Date, Location |
| **StatEvent** | `GAME#<GameId>` | `STAT#<Timestamp>#<StatId>` | PlayerId, Type (Shot, Rebound, etc.), Points, LocationX, LocationY, SubInPlayerId, SubOutPlayerId |

### Global Secondary Indexes (GSI)

#### GSI1: Entity Lookup & Hierarchy
- **GSI1PK**: `SK`
- **GSI1SK**: `PK`
- *Purpose*: Find all Teams in a Season, all Players in a Team, etc.

#### GSI2: Player Stats Aggregate
- **GSI2PK**: `PLAYER#<PlayerId>`
- **GSI2SK**: `STAT#<Timestamp>`
- *Purpose*: Get all stats for a specific player across all games.

## API Endpoints (REST)

### Auth
- `POST /auth/login` (Handled by Cognito)
- `POST /auth/refresh`

### Seasons
- `GET /seasons`
- `POST /seasons`
- `GET /seasons/{id}`

### Teams
- `GET /teams?seasonId={id}`
- `POST /teams`
- `GET /teams/{id}/players`
- `POST /teams/{id}/players` (Add player to team)

### Players
- `GET /players`
- `POST /players`
- `GET /players/{id}/stats`

### Games
- `GET /games?teamId={id}`
- `POST /games`
- `GET /games/{id}/stats`
- `POST /games/{id}/stats` (Record event)

### Sync
- `POST /sync` (Batch upload from offline IndexedDB)
