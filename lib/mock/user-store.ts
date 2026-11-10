import fs from "fs";
import path from "path";

/**
 * Robust mock user store for development, hackathons, and demo mode.
 * Used when a live Neon PostgreSQL database is not connected or reachable.
 * Persists in memory across requests via globalThis and to local disk (.user-store.json).
 */

export type MockUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "donor" | "ngo" | "admin";
  createdAt: string;
};

// Pre-hashed bcrypt for "demo1234" (cost 10)
const DEMO_HASH = "$2b$10$bSnUBE8.Q6O8dyGLnVX8aeli7ZzhfExwCNtvDnk7GxaumLXXzH4ea";

export const DEFAULT_USERS: MockUser[] = [
  {
    id: "mock-donor-001",
    name: "Demo Donor",
    email: "donor@demo.com",
    passwordHash: DEMO_HASH,
    role: "donor",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-ngo-001",
    name: "Demo Relief NGO",
    email: "ngo@demo.com",
    passwordHash: DEMO_HASH,
    role: "ngo",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-admin-001",
    name: "ReliefTrack Admin",
    email: "admin@demo.com",
    passwordHash: DEMO_HASH,
    role: "admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-user-donor-dev",
    name: "Demo Donor",
    email: "donor@relieftrack.dev",
    passwordHash: DEMO_HASH,
    role: "donor",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-user-admin-dev",
    name: "Admin User",
    email: "admin@relieftrack.dev",
    passwordHash: DEMO_HASH,
    role: "admin",
    createdAt: new Date().toISOString(),
  },
];

const STORE_FILE = path.join(process.cwd(), ".user-store.json");

function loadUsers(): MockUser[] {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, "utf-8");
      const list = JSON.parse(data);
      if (Array.isArray(list) && list.length > 0) {
        const merged = [...DEFAULT_USERS];
        for (const u of list) {
          if (!merged.some((m) => m.email.toLowerCase() === u.email.toLowerCase())) {
            merged.push(u);
          }
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn("Could not read .user-store.json fallback:", err);
  }
  return [...DEFAULT_USERS];
}

function saveUsers(users: MockUser[]) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not save to .user-store.json:", err);
  }
}

// Global cache across Fast Refresh and Next.js dev server instances
const globalForStore = globalThis as unknown as { __mockUserStore?: MockUser[] };
if (!globalForStore.__mockUserStore) {
  globalForStore.__mockUserStore = loadUsers();
}

let counter = 200;

export const mockUserStore = {
  findByEmail(email: string): MockUser | undefined {
    const list = globalForStore.__mockUserStore || DEFAULT_USERS;
    return list.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  },

  findById(id: string): MockUser | undefined {
    const list = globalForStore.__mockUserStore || DEFAULT_USERS;
    return list.find((u) => u.id === id);
  },

  create(data: Omit<MockUser, "id" | "createdAt">): MockUser {
    const list = globalForStore.__mockUserStore || DEFAULT_USERS;
    const existing = this.findByEmail(data.email);
    if (existing) {
      return existing;
    }

    const newUser: MockUser = {
      ...data,
      email: data.email.trim().toLowerCase(),
      id: `user-${Date.now()}-${++counter}`,
      createdAt: new Date().toISOString(),
    };

    list.push(newUser);
    globalForStore.__mockUserStore = list;
    saveUsers(list);
    return newUser;
  },

  getAll(): MockUser[] {
    return globalForStore.__mockUserStore || DEFAULT_USERS;
  },
};
