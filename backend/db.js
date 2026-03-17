import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'uxtest.json');

const defaultData = { tests: [], sessions: [] };

let _db = null;

export async function getDb() {
  if (!_db) {
    _db = await JSONFilePreset(dbPath, defaultData);
  }
  return _db;
}

