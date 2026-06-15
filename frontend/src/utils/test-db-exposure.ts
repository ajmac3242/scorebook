import { db } from "../db";

if (typeof window !== "undefined") {
  (window as any).db = db;
}
