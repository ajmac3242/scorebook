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
      (this.value as any).isSync &&
      iterations < 10
    ) {
      const inner = this.value as any;
      this.status = inner.status;
      this.value = inner.value;
      iterations++;
    }
  }

  then<U>(onfulfilled?: (value: T) => U | PromiseLike<U>): any {
    if (this.status === "rejected") return this;
    if (!onfulfilled) return this;
    try {
      const result = onfulfilled(this.value);
      return new SyncPromise(result as any);
    } catch (e) {
      return SyncPromise.reject(e);
    }
  }

  catch<U>(onrejected?: (reason: any) => U | PromiseLike<U>): any {
    if (this.status === "fulfilled") return this;
    if (!onrejected) return this;
    try {
      const result = onrejected(this.value);
      return new SyncPromise(result as any);
    } catch (e) {
      return SyncPromise.reject(e);
    }
  }

  finally(onfinally?: () => void): any {
    if (onfinally) {
      try {
        onfinally();
      } catch (e) {
        // ignore
      }
    }
    return this;
  }

  static resolve<T>(value: T): SyncPromise<T> {
    if (value && (value as any).isSync) return value as any;
    return new SyncPromise(value);
  }

  static reject(error: any): SyncPromise<any> {
    return new SyncPromise(error, "rejected");
  }

  static all(promises: any[]) {
    const results: any[] = [];
    for (const p of promises) {
      if (p && p.isSync) {
        if (p.status === "rejected") return SyncPromise.reject(p.value);
        results.push(p.value);
      } else if (p instanceof Promise) {
        return Promise.all(promises);
      } else {
        results.push(p);
      }
    }
    return SyncPromise.resolve(results);
  }
}

function createCollection<T>(getData: () => T[], onDelete?: (items: T[]) => void): any {
  const coll = {
    toArray: vi.fn(() => SyncPromise.resolve([...getData()])),
    first: vi.fn(() => SyncPromise.resolve(getData()[0])),
    last: vi.fn(() => SyncPromise.resolve(getData()[getData().length - 1])),
    count: vi.fn(() => SyncPromise.resolve(getData().length)),
    limit: vi.fn((n: number) => createCollection(() => getData().slice(0, n), onDelete)),
    offset: vi.fn((n: number) => createCollection(() => getData().slice(n), onDelete)),
    reverse: vi.fn(() => createCollection(() => [...getData()].reverse(), onDelete)),
    sortBy: vi.fn((key: string) =>
      SyncPromise.resolve(
        [...getData()].sort((a: any, b: any) => (a[key] > b[key] ? 1 : -1)),
      ),
    ),
    filter: vi.fn((cb: (item: T) => boolean) =>
      createCollection(() => getData().filter(cb), onDelete),
    ),
    each: vi.fn((cb: (item: T) => void) => {
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
      SyncPromise.resolve(getData().map((i: any) => (i as any).id || (i as any).playerId)),
    ),
    clone: vi.fn(() => createCollection(() => [...getData()], onDelete)),
  };
  return coll;
}

function createWhereClause<T>(table: { data: T[] }, key: string): any {
  const coll = createCollection(() => table.data);
  const onDelete = (items: T[]) => {
      const idsToDelete = new Set(items.map(i => (i as any).id || (i as any).playerId));
      table.data = table.data.filter(i => !idsToDelete.has((i as any).id || (i as any).playerId));
  };

  return {
    ...coll,
    equals: vi.fn((val: any) =>
      createCollection(() =>
        table.data.filter((i: any) => String(i[key]) === String(val)),
        onDelete
      ),
    ),
    anyOf: vi.fn((vals: any[]) => {
      const strVals = vals.map(String);
      return createCollection(() =>
        table.data.filter((i: any) => strVals.includes(String(i[key]))),
        onDelete
      );
    }),
    above: vi.fn((val: any) =>
      createCollection(() => table.data.filter((i: any) => i[key] > val), onDelete),
    ),
    below: vi.fn((val: any) =>
      createCollection(() => table.data.filter((i: any) => i[key] < val), onDelete),
    ),
    between: vi.fn((l: any, u: any) =>
      createCollection(() =>
        table.data.filter((i: any) => i[key] >= l && i[key] <= u),
        onDelete
      ),
    ),
    startsWith: vi.fn((p: string) =>
      createCollection(() =>
        table.data.filter(
          (i: any) => typeof i[key] === "string" && i[key].startsWith(p),
        ),
        onDelete
      ),
    ),
    notEqual: vi.fn((v: any) =>
      createCollection(() =>
        table.data.filter((i: any) => String(i[key]) !== String(v)),
        onDelete
      ),
    ),
  };
}

const createTable = () => {
  const table: any = {
    data: [] as any[],
    toArray: vi.fn(() => SyncPromise.resolve([...table.data])),
    get: vi.fn((id: any) =>
      SyncPromise.resolve(
        table.data.find((i: any) => String(i.id || i.playerId) === String(id)),
      ),
    ),
    add: vi.fn((item: any) => {
      const id = item.id || item.playerId || Math.random().toString();
      table.data.push({ ...item, id });
      if ((globalThis as any).mockDb) (globalThis as any).mockDb.notify();
      return SyncPromise.resolve(id);
    }),
    put: vi.fn((item: any) => {
      const id = item.id || item.playerId || Math.random().toString();
      const idx = table.data.findIndex(
        (i: any) => String(i.id || i.playerId) === String(id),
      );
      if (idx > -1) table.data[idx] = { ...item, id };
      else table.data.push({ ...item, id });
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
      createCollection(() =>
        [...table.data].sort((a, b) => (a[key] > b[key] ? 1 : -1)),
        (items) => {
            const ids = new Set(items.map(i => i.id || i.playerId));
            table.data = table.data.filter(i => !ids.has(i.id || i.playerId));
        }
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
  transaction: vi.fn((mode, tables, cb) => {
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
