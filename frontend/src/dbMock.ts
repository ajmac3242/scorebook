import { Mock, vi } from "vitest";

/**
 * Configuration for a mock database table.
 */
export interface MockTableConfig {
  primaryKey: string; // e.g. 'id', 'playerId', 'teamId'
  indices?: string[]; // e.g. ['gameId', 'type']
  compoundIndices?: string[][]; // e.g. [['gameId', 'type']]
}

/**
 * Registry of table configurations mirroring db.ts.
 */
export const TABLE_CONFIG: Record<string, MockTableConfig> = {
  teams: {
    primaryKey: "id",
    indices: ["synced", "deletedAt", "isFavorite", "isArchived"],
  },
  players: {
    primaryKey: "id",
    indices: ["synced", "isArchived", "deletedAt"],
  },
  teamPlayers: {
    primaryKey: "id",
    indices: ["teamId", "playerId", "synced"],
    compoundIndices: [["teamId", "playerId"]],
  },
  games: {
    primaryKey: "id",
    indices: ["teamId", "opponentId", "completed", "synced", "deletedAt"],
  },
  stats: {
    primaryKey: "id",
    indices: ["gameId", "playerId", "synced", "deletedAt"],
  },
  opponents: {
    primaryKey: "id",
    indices: ["name", "synced", "isArchived"],
  },
};

/**
 * A specialized Promise-like object that resolves synchronously.
 */
export class SyncPromise<T> {
  public isSync = true;
  public status: "fulfilled" | "rejected" = "fulfilled";
  public value: T;

  /**
   *
   */
  constructor(value: T, status: "fulfilled" | "rejected" = "fulfilled") {
    this.value = value;
    this.status = status;
    this.flatten();
  }

  /**
   *
   */
  private flatten() {
    let iterations = 0;
    while (
      this.value &&
      typeof this.value === "object" &&
      "isSync" in (this.value as object) &&
      iterations < 10
    ) {
      const inner = this.value as unknown as SyncPromise<T>;
      this.status = inner.status;
      this.value = inner.value as T;
      iterations++;
    }
  }

  /**
   *
   */
  then<U>(onfulfilled?: (_value: T) => U | PromiseLike<U>): SyncPromise<U> {
    if (this.status === "rejected") return this as unknown as SyncPromise<U>;
    if (!onfulfilled) return this as unknown as SyncPromise<U>;
    try {
      const result = onfulfilled(this.value);
      return new SyncPromise(result as U);
    } catch (e) {
      return SyncPromise.reject(e) as unknown as SyncPromise<U>;
    }
  }

  /**
   *
   */
  catch<U>(
    onrejected?: (_reason: unknown) => U | PromiseLike<U>,
  ): SyncPromise<U | T> {
    if (this.status === "fulfilled") return this;
    if (!onrejected) return this;
    try {
      const result = onrejected(this.value);
      return new SyncPromise(result as U);
    } catch (e) {
      return SyncPromise.reject(e) as unknown as SyncPromise<U>;
    }
  }

  /**
   *
   */
  finally(onfinally?: () => void): SyncPromise<T> {
    if (onfinally) {
      try {
        onfinally();
      } catch {
        // ignore
      }
    }
    return this;
  }

  /**
   *
   */
  static resolve<T>(value: T): SyncPromise<T> {
    if (value && typeof value === "object" && "isSync" in (value as object)) {
      return value as unknown as SyncPromise<T>;
    }
    return new SyncPromise(value);
  }

  /**
   *
   */
  static reject<T = unknown>(error: T): SyncPromise<T> {
    return new SyncPromise(error, "rejected");
  }

  /**
   *
   */
  static all<U>(promises: (SyncPromise<U> | Promise<U> | U)[]) {
    const results: U[] = [];
    for (const p of promises) {
      if (p && typeof p === "object" && "isSync" in (p as object)) {
        const sp = p as unknown as SyncPromise<U>;
        if (sp.status === "rejected") return SyncPromise.reject(sp.value);
        results.push(sp.value);
      } else if (p instanceof Promise) {
        return Promise.all(promises);
      } else {
        results.push(p as U);
      }
    }
    return SyncPromise.resolve(results);
  }
}

/**
 * Represents a mock Dexie Collection.
 */
interface MockCollection<T> {
  toArray: Mock<() => SyncPromise<T[]>>;
  first: Mock<() => SyncPromise<T | undefined>>;
  last: Mock<() => SyncPromise<T | undefined>>;
  count: Mock<() => SyncPromise<number>>;
  limit: Mock<(_n: number) => MockCollection<T>>;
  offset: Mock<(_n: number) => MockCollection<T>>;
  reverse: Mock<() => MockCollection<T>>;
  sortBy: Mock<(_key: string) => SyncPromise<T[]>>;
  filter: Mock<(_cb: (_item: T) => boolean) => MockCollection<T>>;
  each: Mock<(_cb: (_item: T) => void) => SyncPromise<void>>;
  delete: Mock<() => SyncPromise<number>>;
  primaryKeys: Mock<() => SyncPromise<unknown[]>>;
  clone: Mock<() => MockCollection<T>>;
}

/**
 * Creates a mock collection.
 */
function createCollection<T extends Record<string, unknown>>(
  getData: () => T[],
  primaryKey: string,
  onDelete?: (_items: T[]) => void,
): MockCollection<T> {
  const coll: MockCollection<T> = {
    toArray: vi.fn(() => SyncPromise.resolve([...getData()])),
    first: vi.fn(() => SyncPromise.resolve(getData()[0])),
    last: vi.fn(() => SyncPromise.resolve(getData()[getData().length - 1])),
    count: vi.fn(() => SyncPromise.resolve(getData().length)),
    limit: vi.fn((n: number) =>
      createCollection(() => getData().slice(0, n), primaryKey, onDelete),
    ),
    offset: vi.fn((n: number) =>
      createCollection(() => getData().slice(n), primaryKey, onDelete),
    ),
    reverse: vi.fn(() =>
      createCollection(() => [...getData()].reverse(), primaryKey, onDelete),
    ),
    sortBy: vi.fn((key: string) =>
      SyncPromise.resolve(
        [...getData()].sort((a: T, b: T) =>
          (a[key] as string | number) > (b[key] as string | number) ? 1 : -1,
        ),
      ),
    ),
    filter: vi.fn((cb: (_item: T) => boolean) =>
      createCollection(() => getData().filter(cb), primaryKey, onDelete),
    ),
    each: vi.fn((cb: (_item: T) => void) => {
      getData().forEach(cb);
      return SyncPromise.resolve(undefined);
    }),
    delete: vi.fn(() => {
      const data = getData();
      const len = data.length;
      if (onDelete) onDelete(data);
      const g = globalThis as unknown as { mockDb?: MockDatabase };
      if (g.mockDb) g.mockDb.notify();
      return SyncPromise.resolve(len);
    }),
    primaryKeys: vi.fn(() =>
      SyncPromise.resolve(getData().map((i: T) => i[primaryKey])),
    ),
    clone: vi.fn(() =>
      createCollection(() => [...getData()], primaryKey, onDelete),
    ),
  };
  return coll;
}
/**
 * Represents a mock Dexie WhereClause.
 */
interface MockWhereClause<T> extends MockCollection<T> {
  equals: Mock<(_val: unknown) => MockCollection<T>>;
  anyOf: Mock<(_vals: unknown[]) => MockCollection<T>>;
  above: Mock<(_val: unknown) => MockCollection<T>>;
  below: Mock<(_val: unknown) => MockCollection<T>>;
  between: Mock<(_l: unknown, _u: unknown) => MockCollection<T>>;
  startsWith: Mock<(_p: string) => MockCollection<T>>;
  notEqual: Mock<(_v: unknown) => MockCollection<T>>;
}

/**
 * Creates a mock where clause.
 */
function createWhereClause<T extends Record<string, unknown>>(
  table: { data: T[] },
  key: string,
  primaryKey: string,
): MockWhereClause<T> {
  const coll = createCollection(() => table.data, primaryKey);
  const onDelete = (items: T[]) => {
    const idsToDelete = new Set(items.map((i) => i[primaryKey]));
    table.data = table.data.filter((i) => !idsToDelete.has(i[primaryKey]));
  };

  const isCompound = key.startsWith("[") && key.endsWith("]");

  return {
    ...coll,
    equals: vi.fn((val: unknown) => {
      if (isCompound) {
        const fields = key.slice(1, -1).split("+");
        const vals = val as unknown[];
        return createCollection(
          () =>
            table.data.filter((record) =>
              fields.every((f, i) => record[f] === vals[i]),
            ),
          primaryKey,
          onDelete,
        );
      }
      return createCollection(
        () => table.data.filter((i: T) => String(i[key]) === String(val)),
        primaryKey,
        onDelete,
      );
    }),
    anyOf: vi.fn((vals: unknown[]) => {
      const strVals = vals.map(String);
      return createCollection(
        () => table.data.filter((i: T) => strVals.includes(String(i[key]))),
        primaryKey,
        onDelete,
      );
    }),
    above: vi.fn((val: unknown) =>
      createCollection(
        () =>
          table.data.filter(
            (i: T) => (i[key] as number | string) > (val as number | string),
          ),
        primaryKey,
        onDelete,
      ),
    ),
    below: vi.fn((val: unknown) =>
      createCollection(
        () =>
          table.data.filter(
            (i: T) => (i[key] as number | string) < (val as number | string),
          ),
        primaryKey,
        onDelete,
      ),
    ),
    between: vi.fn((l: unknown, u: unknown) =>
      createCollection(
        () =>
          table.data.filter(
            (i: T) =>
              (i[key] as number | string) >= (l as number | string) &&
              (i[key] as number | string) <= (u as number | string),
          ),
        primaryKey,
        onDelete,
      ),
    ),
    startsWith: vi.fn((p: string) =>
      createCollection(
        () =>
          table.data.filter(
            (i: T) =>
              typeof i[key] === "string" && (i[key] as string).startsWith(p),
          ),
        primaryKey,
        onDelete,
      ),
    ),
    notEqual: vi.fn((v: unknown) =>
      createCollection(
        () => table.data.filter((i: T) => String(i[key]) !== String(v)),
        primaryKey,
        onDelete,
      ),
    ),
  };
}

/**
 * Represents a mock Dexie Table.
 */
interface MockTable<T extends Record<string, unknown>> {
  data: T[];
  toArray: Mock<() => SyncPromise<T[]>>;
  get: Mock<(_id: unknown) => SyncPromise<T | undefined>>;
  add: Mock<(_item: T) => SyncPromise<unknown>>;
  put: Mock<(_item: T) => SyncPromise<unknown>>;
  update: Mock<(_id: unknown, _changes: Partial<T>) => SyncPromise<number>>;
  delete: Mock<(_id: unknown) => SyncPromise<number>>;
  bulkPut: Mock<(_items: T[]) => SyncPromise<unknown[]>>;
  bulkDelete: Mock<(_ids: unknown[]) => SyncPromise<number>>;
  count: Mock<() => SyncPromise<number>>;
  where: Mock<(_key: string) => MockWhereClause<T>>;
  orderBy: Mock<(_key: string) => MockCollection<T>>;
  limit: Mock<(_n: number) => MockCollection<T>>;
  clear: Mock<() => SyncPromise<void>>;
  toCollection: Mock<() => MockCollection<T>>;
}

/**
 * Creates a mock table.
 */
export function createTable<T extends Record<string, unknown>>(
  tableName: string,
): MockTable<T> {
  const config = TABLE_CONFIG[tableName];
  if (!config) {
    throw new Error(
      `dbMock: no config registered for table "${tableName}". Add it to TABLE_CONFIG.`,
    );
  }
  const { primaryKey } = config;

  const table: MockTable<T> = {
    data: [] as T[],
    toArray: vi.fn(() => SyncPromise.resolve([...table.data])),
    get: vi.fn((id: unknown) =>
      SyncPromise.resolve(
        table.data.find((i: T) => String(i[primaryKey]) === String(id)),
      ),
    ),
    add: vi.fn((itemToAdd: T) => {
      const id =
        (itemToAdd[primaryKey] as string) ||
        (itemToAdd.playerId as string) ||
        Math.random().toString();
      const newItem = { ...itemToAdd, [primaryKey]: id };
      table.data.push(newItem);
      const g = globalThis as unknown as { mockDb?: MockDatabase };
      if (g.mockDb) g.mockDb.notify();
      return SyncPromise.resolve(id);
    }),
    put: vi.fn((itemToPut: T) => {
      const id =
        (itemToPut[primaryKey] as string) ||
        (itemToPut.playerId as string) ||
        Math.random().toString();
      const idx = table.data.findIndex(
        (i: T) => String(i[primaryKey]) === String(id),
      );
      const newItem = { ...itemToPut, [primaryKey]: id };
      if (idx > -1) table.data[idx] = newItem;
      else table.data.push(newItem);
      const g = globalThis as unknown as { mockDb?: MockDatabase };
      if (g.mockDb) g.mockDb.notify();
      return SyncPromise.resolve(id);
    }),
    update: vi.fn((id: unknown, changes: Partial<T>) => {
      const idx = table.data.findIndex(
        (i: T) => String(i[primaryKey]) === String(id),
      );
      if (idx > -1) {
        table.data[idx] = { ...table.data[idx], ...changes };
        const g = globalThis as unknown as { mockDb?: MockDatabase };
        if (g.mockDb) g.mockDb.notify();
        return SyncPromise.resolve(1);
      }
      return SyncPromise.resolve(0);
    }),
    delete: vi.fn((id: unknown) => {
      const initial = table.data.length;
      table.data = table.data.filter(
        (i: T) => String(i[primaryKey]) !== String(id),
      );
      if (table.data.length !== initial) {
        const g = globalThis as unknown as { mockDb?: MockDatabase };
        if (g.mockDb) g.mockDb.notify();
        return SyncPromise.resolve(1);
      }
      return SyncPromise.resolve(0);
    }),
    bulkPut: vi.fn((items: T[]) => {
      const ids = items.map((item) => {
        const id =
          (item[primaryKey] as string) ||
          (item.playerId as string) ||
          Math.random().toString();
        const idx = table.data.findIndex(
          (i: T) => String(i[primaryKey]) === String(id),
        );
        const newItem = { ...item, [primaryKey]: id };
        if (idx > -1) table.data[idx] = newItem;
        else table.data.push(newItem);
        return id;
      });
      const g = globalThis as unknown as { mockDb?: MockDatabase };
      if (g.mockDb) g.mockDb.notify();
      return SyncPromise.resolve(ids);
    }),
    bulkDelete: vi.fn((ids: unknown[]) => {
      const initial = table.data.length;
      const sIds = ids.map(String);
      table.data = table.data.filter(
        (i: T) => !sIds.includes(String(i[primaryKey])),
      );
      const deleted = initial - table.data.length;
      if (deleted > 0) {
        const g = globalThis as unknown as { mockDb?: MockDatabase };
        if (g.mockDb) g.mockDb.notify();
      }
      return SyncPromise.resolve(deleted);
    }),
    count: vi.fn(() => SyncPromise.resolve(table.data.length)),
    where: vi.fn((key: string) => createWhereClause(table, key, primaryKey)),
    orderBy: vi.fn((key: string) =>
      createCollection(
        () =>
          [...table.data].sort((a, b) =>
            (a[key] as string | number) > (b[key] as string | number) ? 1 : -1,
          ),
        primaryKey,
        (items) => {
          const ids = new Set(items.map((i) => i[primaryKey]));
          table.data = table.data.filter((i) => !ids.has(i[primaryKey]));
        },
      ),
    ),
    limit: vi.fn((n: number) =>
      createCollection(() => table.data.slice(0, n), primaryKey),
    ),
    clear: vi.fn(() => {
      const hadData = table.data.length > 0;
      table.data = [];
      if (hadData) {
        const g = globalThis as unknown as { mockDb?: MockDatabase };
        if (g.mockDb) g.mockDb.notify();
      }
      return SyncPromise.resolve(undefined);
    }),
    toCollection: vi.fn(() => createCollection(() => table.data, primaryKey)),
  };
  return table;
}

/**
 * Represents the mock database.
 */
interface MockDatabase {
  teams: MockTable<Record<string, unknown>>;
  players: MockTable<Record<string, unknown>>;
  teamPlayers: MockTable<Record<string, unknown>>;
  games: MockTable<Record<string, unknown>>;
  stats: MockTable<Record<string, unknown>>;
  opponents: MockTable<Record<string, unknown>>;
  version: Mock<() => MockDatabase>;
  stores: Mock<() => MockDatabase>;
  on: Mock<() => void>;
  open: Mock<() => SyncPromise<void>>;
  delete: Mock<() => SyncPromise<void>>;
  transaction: Mock<
    (
      _mode: string,
      _tables: string[],
      _cb: () => unknown,
    ) => SyncPromise<unknown>
  >;
  subscribers: Set<() => void>;
  subscribe: (_cb: () => void) => () => void;
  notify: () => void;
  seed: (_data: Record<string, unknown[]>) => void;
  reset: () => void;
  [key: string]: unknown;
}

export const mockDb: MockDatabase = {
  teams: createTable("teams"),
  players: createTable("players"),
  teamPlayers: createTable("teamPlayers"),
  games: createTable("games"),
  stats: createTable("stats"),
  opponents: createTable("opponents"),
  version: vi.fn().mockReturnThis(),
  stores: vi.fn().mockReturnThis(),
  on: vi.fn(),
  open: vi.fn(() => SyncPromise.resolve(undefined)),
  delete: vi.fn(() => SyncPromise.resolve(undefined)),
  transaction: vi.fn((_mode, _tables, cb) => {
    try {
      const res = cb();
      if (
        res &&
        typeof res === "object" &&
        "then" in (res as Record<string, unknown>)
      ) {
        return res as SyncPromise<unknown>;
      }
      return SyncPromise.resolve(res);
    } catch (e) {
      return SyncPromise.reject(e);
    }
  }),
  subscribers: new Set<() => void>(),
  /**
   *
   */
  subscribe(cb: () => void) {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  },
  /**
   *
   */
  notify() {
    this.subscribers.forEach((cb) => cb());
  },
  /**
   *
   */
  seed(data: Record<string, unknown[]>) {
    Object.keys(data).forEach((k) => {
      const table = this[k] as MockTable<Record<string, unknown>> | undefined;
      if (table) {
        table.data = JSON.parse(JSON.stringify(data[k])) as Record<
          string,
          unknown
        >[];
        table.data.forEach((i) => {
          const config = TABLE_CONFIG[k];
          if (config && !i[config.primaryKey] && i.playerId) {
            i[config.primaryKey] = i.playerId;
          }
        });
      }
    });
    this.notify();
  },
  /**
   *
   */
  reset() {
    [
      this.teams,
      this.players,
      this.teamPlayers,
      this.games,
      this.stats,
      this.opponents,
    ].forEach((t) => {
      t.data = [];
      Object.keys(t).forEach((k) => {
        const prop = t[k as keyof typeof t];
        if (
          prop &&
          typeof prop === "function" &&
          "_isMockFunction" in (prop as unknown as { _isMockFunction: boolean })
        ) {
          (prop as unknown as { mockClear: () => void }).mockClear();
        }
      });
    });
    this.subscribers.clear();
    vi.clearAllMocks();
  },
};
