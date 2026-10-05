// Tiny JSON-file "database" so the project runs with zero setup.
// For production scale, swap this module for MongoDB/Postgres/Firebase etc.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
const FILE = path.join(dir, "registrations.json");

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
}

function save(list) {
  fs.mkdirSync(dir, { recursive: true });
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
  fs.renameSync(tmp, FILE);
}

export const db = {
  all: load,
  find: (fn) => load().find(fn),
  insert(rec) {
    const list = load();
    list.push(rec);
    save(list);
    return rec;
  },
  update(id, patch) {
    const list = load();
    const i = list.findIndex((r) => r.id === id);
    if (i === -1) return null;
    list[i] = { ...list[i], ...patch, updatedAt: new Date().toISOString() };
    save(list);
    return list[i];
  },
  paidCount: () => load().filter((r) => r.status === "paid").length,
};
