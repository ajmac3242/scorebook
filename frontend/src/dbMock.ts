/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from "vitest";

/**
 * A specialized Promise-like object that resolves synchronously.
 */
export class SyncPromise<T> {
  public isSync = true;
  public status: "fulfilled" | "rejected" = "fulfilled";
  public value: T;

  constructor(value: T, status: "fulfilled" | "rejected" = "fulfilled") {
    this.value = value;
    this.status = status;
    this.flatten();
  }

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
      this.value = inner.value;
      iterations++;
    }
  }

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

  catch<U>(onrejected?: (_reason: unknown) => U | PromiseLike<U>): SyncPromise<U | T> {
    if (this.status === "fulfilled") return this;
    if (!onrejected) return this;
    try {
      const result = onrejected(this.value);
      return new SyncPromise(result as U);
    } catch (e) {
      return SyncPromise.reject(e) as unknown as SyncPromise<U>;
    }
  }

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

  static resolve<T>(value: T): SyncPromise<T> {
    if (value && typeof value === "object" && "isSync" in (value as object)) {
      return value as unknown as SyncPromise<T>;
    }
    return new SyncPromise(value);
  }

  static reject<T = unknown>(error: T): SyncPromise<T> {
    return new SyncPromise(error, "rejected");
  }

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

// Helper to avoid 'any' in mock db structure
type MockTable = {
  data: any[];
  [key: string]: any;
};

function createCollection<T>(
  getData: () => T[],
  onDelete?: (_items: T[]) => void,
): any {
  const coll = {
    toArray: vi.fn(() => SyncPromise.resolve([...getData()])),
    first: vi.fn(() => SyncPromise.resolve(getData()[0])),
    last: vi.fn(() => SyncPromise.resolve(getData()[getData().length - 1])),
    count: vi.fn(() => SyncPromise.resolve(getData().length)),
    limit: vi.fn((n: number) =>
      createCollection(() => getData().slice(0, n), onDelete),
    ),
    offset: vi.fn((n: number) =>
      createCollection(() => getData().slice(n), onDelete),
    ),
    reverse: vi.fn(() =>
      createCollection(() => [...getData()].reverse(), onDelete),
    ),
    sortBy: vi.fn((key: string) =>
      SyncPromise.resolve(
        [...getData()].sort((a: any, b: any) => (a[key] > b[key] ? 1 : -1)),
      ),
    ),
    filter: vi.fn((cb: (_item: T) => boolean) =>
      createCollection(() => getData().filter(cb), onDelete),
    ),
    each: vi.fn((cb: (_item: T) => void) => {
      getData().forEach(cb);
      return SyncPromise.resolve(undefined);
    }),
    delete: vi.fn(() => {
      const data = getData();
      const len = data.length;
      if (onDelete) onDelete(data);
      if ((globalThis as any).mockDb) (globalThis as any).mockDb.notify();
      return SyncPromise.resolve(len);
    }),
    primaryKeys: vi.fn(() =>
      SyncPromise.resolve(
        getData().map(
          (i: any) => (i as any).id || (i as any).playerId,
        ),
      ),
    ),
    clone: vi.fn(() => createCollection(() => [...getData()], onDelete)),
  };
  return coll;
}

function createWhereClause<T>(table: { data: T[] }, key: string): any {
  const coll = createCollection(() => table.data);
  const onDelete = (items: T[]) => {
    const idsToDelete = new Set(
      items.map((i) => (i as any).id || (i as any).playerId),
    );
    table.data = table.data.filter(
      (i) => !idsToDelete.has((i as any).id || (i as any).playerId),
    );
  };

  return {
    ...coll,
    equals: vi.fn((val: any) =>
      createCollection(
        () => table.data.filter((i: any) => String(i[key]) === String(val)),
        onDelete,
      ),
    ),
    anyOf: vi.fn((vals: any[]) => {
      const strVals = vals.map(String);
      return createCollection(
        () => table.data.filter((i: any) => strVals.includes(String(i[key]))),
        onDelete,
      );
    }),
    above: vi.fn((val: any) =>
      createCollection(
        () => table.data.filter((i: any) => i[key] > val),
        onDelete,
      ),
    ),
    below: vi.fn((val: any) =>
      createCollection(
        () => table.data.filter((i: any) => i[key] < val),
        onDelete,
      ),
    ),
    between: vi.fn((l: any, u: any) =>
      createCollection(
        () => table.data.filter((i: any) => i[key] >= l && i[key] <= u),
        onDelete,
      ),
    ),
    startsWith: vi.fn((p: string) =>
      createCollection(
        () =>
          table.data.filter(
            (i: any) => typeof i[key] === "string" && i[key].startsWith(p),
          ),
        onDelete,
      ),
    ),
    notEqual: vi.fn((v: any) =>
      createCollection(
        () => table.data.filter((i: any) => String(i[key]) !== String(v)),
        onDelete,
      ),
    ),
  };
}

const createTable = (): MockTable => {
  const table: MockTable = {
    data: [] as any[],
    toArray: vi.fn(() => SyncPromise.resolve([...table.data])),
    get: vi.fn((id: any) =>
      SyncPromise.resolve(
        table.data.find((i: any) => String(i.id || i.playerId) === String(id)),
      ),
    ),
    add: vi.fn((itemToAdd: any) => {
      const id = itemToAdd.id || itemToAdd.playerId || Math.random().toString();
      table.data.push({ ...itemToAdd, id });
      if ((globalThis as any).mockDb) (globalThis as any).mockDb.notify();
      return SyncPromise.resolve(id);
    }),
    put: vi.fn((itemToPut: any) => {
      const id = itemToPut.id || itemToPut.playerId || Math.random().toString();
      const idx = table.data.findIndex(
        (i: any) => String(i.id || i.playerId) === String(id),
      );
      if (idx > -1) table.data[idx] = { ...itemToPut, id };
      else table.data.push({ ...itemToPut, id });
      if ((globalThis as any).mockDb) (globalThis as any).mockDb.notify();
      return SyncPromise.resolve(id);
    }),
    update: vi.fn((id: any, changes: any) => {
      const idx = table.data.findIndex(
        (i: any) => String(i.id || i.playerId) === String(id),
      );
      if (idx > -1) {
        table.data[idx] = { ...table.data[idx], ...changes };
        if ((globalThis as any).mockDb) (globalThis as any).mockDb.notify();
        return SyncPromise.resolve(1);
      }
      return SyncPromise.resolve(0);
    }),
    delete: vi.fn((id: any) => {
      const initial = table.data.length;
      table.data = table.data.filter(
        (i: any) => String(i.id || i.playerId) !== String(id),
      );
      if (table.data.length !== initial) {
        if ((globalThis as any).mockDb) (globalThis as any).mockDb.notify();
        return SyncPromise.resolve(1);
      }
      return SyncPromise.resolve(0);
    }),
    bulkPut: vi.fn((items: any[]) => {
      const ids = items.map((item) => {
        const id = item.id || item.playerId || Math.random().toString();
        const idx = table.data.findIndex(
          (i: any) => String(i.id || i.playerId) === String(id),
        );
        if (idx > -1) table.data[idx] = { ...item, id };
        else table.data.push({ ...item, id });
        return id;
      });
      if ((globalThis as any).mockDb) (globalThis as any).mockDb.notify();
      return SyncPromise.resolve(ids);
    }),
    bulkDelete: vi.fn((ids: any[]) => {
      const initial = table.data.length;
      const sIds = ids.map(String);
      table.data = table.data.filter(
        (i: any) => !sIds.includes(String(i.id || i.playerId)),
      );
      const deleted = initial - table.data.length;
      if (deleted > 0)
        if ((globalThis as any).mockDb) (globalThis as any).mockDb.notify();
      return SyncPromise.resolve(deleted);
    }),
    count: vi.fn(() => SyncPromise.resolve(table.data.length)),
    where: vi.fn((key: string) => createWhereClause(table, key)),
    orderBy: vi.fn((key: string) =>
      createCollection(
        () => [...table.data].sort((a, b) => (a[key] > b[key] ? 1 : -1)),
        (items) => {
          const ids = new Set(items.map((i) => i.id || i.playerId));
          table.data = table.data.filter((i) => !ids.has(i.id || i.playerId));
        },
      ),
    ),
    limit: vi.fn((n: number) => createCollection(() => table.data.slice(0, n))),
    clear: vi.fn(() => {
      const hadData = table.data.length > 0;
      table.data = [];
      if (hadData)
        if ((globalThis as any).mockDb) (globalThis as any).mockDb.notify();
      return SyncPromise.resolve(undefined);
    }),
    toCollection: vi.fn(() => createCollection(() => table.data)),
  };
  return table;
};

export const mockDb: any = {
  teams: createTable(),
  players: createTable(),
  teamPlayers: createTable(),
  games: createTable(),
  stats: createTable(),
  opponents: createTable(),
  version: vi.fn().mockReturnThis(),
  stores: vi.fn().mockReturnThis(),
  on: vi.fn(),
  open: vi.fn(() => SyncPromise.resolve(undefined)),
  delete: vi.fn(() => SyncPromise.resolve(undefined)),
  transaction: vi.fn((_mode, _tables, cb) => {
    try {
      const res = cb();
      if (res && typeof res.then === "function") return res;
      return SyncPromise.resolve(res);
    } catch (e) {
      return SyncPromise.reject(e);
    }
  }),
  subscribers: new Set<() => void>(),
  subscribe(cb: () => void) {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  },
  notify() {
    this.subscribers.forEach((cb) => cb());
  },
  seed(data: any) {
    Object.keys(data).forEach((k) => {
      if (this[k]) {
        this[k].data = JSON.parse(JSON.stringify(data[k]));
        this[k].data.forEach((i: any) => {
          if (!i.id && i.playerId) i.id = i.playerId;
        });
      }
    });
    this.notify();
  },
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
        if (t[k] && t[k]._isMockFunction) t[k].mockClear();
      });
    });
    this.subscribers.clear();
    vi.clearAllMocks();
  },
};
