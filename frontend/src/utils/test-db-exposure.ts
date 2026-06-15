import { db } from "../db";

if (typeof window !== "undefined") {
  const win = window as unknown as { db: typeof db };
  win.db = db;
}
