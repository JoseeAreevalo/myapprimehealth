import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'checkout_sessions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string | null;
  role: string;
  created_at: string;
}

export interface CheckoutSession {
  id: number;
  user_email: string | null;
  stripe_session_id: string;
  amount_total: number | null;
  status: string;
  created_at: string;
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown): void {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = {
  findByEmail(email: string): User | undefined {
    const all = readJson<User[]>(USERS_FILE, []);
    return all.find(u => u.email === email);
  },
  findById(id: number): User | undefined {
    const all = readJson<User[]>(USERS_FILE, []);
    return all.find(u => u.id === id);
  },
  create(email: string, password_hash: string, name: string | null, role: string): User {
    const all = readJson<User[]>(USERS_FILE, []);
    const newUser: User = {
      id: (all[all.length - 1]?.id ?? 0) + 1,
      email,
      password_hash,
      name,
      role,
      created_at: new Date().toISOString(),
    };
    all.push(newUser);
    writeJson(USERS_FILE, all);
    return newUser;
  },
};

// ─── Checkout Sessions ────────────────────────────────────────────────────────

export const checkoutSessions = {
  create(user_email: string | null, stripe_session_id: string, amount_total: number | null): void {
    const all = readJson<CheckoutSession[]>(SESSIONS_FILE, []);
    all.push({
      id: (all[all.length - 1]?.id ?? 0) + 1,
      user_email,
      stripe_session_id,
      amount_total,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    writeJson(SESSIONS_FILE, all);
  },
};

