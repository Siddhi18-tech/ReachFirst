/**
 * In-memory mock user store for development without a real database.
 * Used when NEXT_PUBLIC_USE_MOCK=true or DATABASE_URL is not configured.
 * Persists only within the Node.js process lifetime (dev server session).
 */

export type MockUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "donor" | "ngo" | "admin";
  createdAt: string;
};

// Seed one admin and one demo donor so the app is usable out of the box
// Passwords are pre-hashed bcrypt values for "password123" (cost 10)
const DEMO_HASH = "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi"; // "password"

const store: MockUser[] = [
  {
    id: "mock-user-admin-001",
    name: "Admin User",
    email: "admin@relieftrack.dev",
    passwordHash: DEMO_HASH,
    role: "admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-user-donor-001",
    name: "Demo Donor",
    email: "donor@relieftrack.dev",
    passwordHash: DEMO_HASH,
    role: "donor",
    createdAt: new Date().toISOString(),
  },
];

let counter = 100;

export const mockUserStore = {
  findByEmail(email: string): MockUser | undefined {
    return store.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  findById(id: string): MockUser | undefined {
    return store.find((u) => u.id === id);
  },

  create(data: Omit<MockUser, "id" | "createdAt">): MockUser {
    const user: MockUser = {
      ...data,
      id: `mock-user-${++counter}-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    store.push(user);
    return user;
  },
};

