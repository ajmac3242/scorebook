import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import * as dbModule from './db';

const { AppDatabase } = await vi.importActual<typeof dbModule>('./db');

describe('AppDatabase schema', () => {
  let db: AppDatabase;

  beforeEach(async () => {
    // Each test gets a fresh in-memory database
    db = new AppDatabase();
    await db.open();
  });

  afterEach(async () => {
    const dbName = db.name;
    if (db.isOpen()) {
      await db.close();
    }
    await Dexie.delete(dbName);
  });

  it('opens successfully on a fresh install', async () => {
    expect(db.isOpen()).toBe(true);
  });

  it('contains all expected tables', async () => {
    const tableNames = db.tables.map(t => t.name);
    expect(tableNames).toContain('teams');
    expect(tableNames).toContain('players');
    expect(tableNames).toContain('teamPlayers');
    expect(tableNames).toContain('games');
    expect(tableNames).toContain('stats');
    expect(tableNames).toContain('opponents');
  });

  it('players table has the correct primary key', async () => {
    const schema = db.players.schema;
    expect(schema.primKey.name).toBe('id');
  });

  it('stats table has an index on gameId', async () => {
    const schema = db.stats.schema;
    const indexNames = schema.indexes.map(i => i.name);
    expect(indexNames).toContain('gameId');
  });

  it('can write and read a player record', async () => {
    await db.players.add({ id: 'p1', name: 'Test Player' });
    const player = await db.players.get('p1');
    expect(player?.name).toBe('Test Player');
  });

  it('can write and read a stat record', async () => {
    await db.stats.add({
      id: 's1',
      gameId: 'g1',
      playerId: 'p1',
      type: 'PTS',
      period: 1,
      timestamp: new Date().toISOString()
    });
    const stats = await db.stats.where('gameId').equals('g1').toArray();
    expect(stats).toHaveLength(1);
    expect(stats[0].type).toBe('PTS');
  });

  it('cascades correctly when querying stats by gameId', async () => {
    await db.stats.bulkAdd([
      { id: 's1', gameId: 'g1', playerId: 'p1', type: 'PTS', period: 1, timestamp: new Date().toISOString() },
      { id: 's2', gameId: 'g1', playerId: 'p2', type: 'AST', period: 1, timestamp: new Date().toISOString() },
      { id: 's3', gameId: 'g2', playerId: 'p1', type: 'REB', period: 1, timestamp: new Date().toISOString() },
    ]);
    const g1Stats = await db.stats.where('gameId').equals('g1').toArray();
    expect(g1Stats).toHaveLength(2);
  });

  it('migrates data correctly from version 25 to current version', async () => {
    const dbName = db.name;
    // Close the db opened in beforeEach since we need to set up a legacy one
    await db.close();
    await Dexie.delete(dbName);

    // Create a v25 database manually with the v25 schema
    const v25db = new Dexie(dbName);
    v25db.version(25).stores({
      teams: "id, synced, deletedAt, isFavorite, isArchived",
      players: "id, synced, isArchived, deletedAt",
      teamPlayers: "id, [teamId+playerId], teamId, playerId, synced",
      games: "id, teamId, opponentId, completed, synced, deletedAt",
      stats: "id, gameId, playerId, synced, deletedAt",
      opponents: "id, name, synced",
    });
    await v25db.open();

    // Add legacy data
    await v25db.table('players').add({ id: 'p1', name: 'Legacy Player', synced: 1 });
    await v25db.table('opponents').add({ id: 'o1', name: 'Legacy Opponent', synced: 1 });
    await v25db.close();

    // Open with the current AppDatabase (which should auto-migrate to current version, e.g., 27)
    const currentDb = new AppDatabase();
    await currentDb.open();

    expect(currentDb.verno).toBe(27);

    // Verify data preservation
    const player = await currentDb.players.get('p1');
    expect(player?.name).toBe('Legacy Player');

    const opponent = await currentDb.opponents.get('o1');
    expect(opponent?.name).toBe('Legacy Opponent');

    // Verify schema update (e.g., opponents table now has isArchived index in v27)
    const opponentSchema = currentDb.opponents.schema;
    const opponentIndexNames = opponentSchema.indexes.map(i => i.name);
    expect(opponentIndexNames).toContain('isArchived');

    await currentDb.close();
  });
});
