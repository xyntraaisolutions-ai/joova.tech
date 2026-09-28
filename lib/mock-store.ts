import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
};

export type MockSession = {
  token: string;
  userId: string;
  expiresAt: string;
};

export type MockOrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
};

export type MockOrder = {
  id: string;
  userId: string | null;
  email: string;
  guest: boolean;
  items: MockOrderItem[];
  subtotal: number;
  createdAt: string;
};

type Store = {
  users: MockUser[];
  sessions: MockSession[];
  orders: MockOrder[];
};

const filePath = path.join(process.cwd(), "data", "mock-store.json");
const emptyStore = (): Store => ({ users: [], sessions: [], orders: [] });

let queue: Promise<unknown> = Promise.resolve();

async function readStore(): Promise<Store> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Store;
    return {
      users: parsed.users ?? [],
      sessions: parsed.sessions ?? [],
      orders: parsed.orders ?? [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: Store) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(store, null, 2));
}

function updateStore<T>(mutate: (store: Store) => T): Promise<T> {
  const run = queue.then(async () => {
    const store = await readStore();
    const result = mutate(store);
    await writeStore(store);
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const passwordHash = scryptSync(password, salt, 32).toString("hex");
  return { salt, passwordHash };
}

export function passwordMatches(password: string, user: MockUser) {
  const next = scryptSync(password, user.salt, 32);
  const prev = Buffer.from(user.passwordHash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

export function publicUser(user: MockUser) {
  return { id: user.id, name: user.name, email: user.email };
}

export async function createUser(input: { name: string; email: string; password: string }) {
  const email = input.email.toLowerCase();
  return updateStore((store) => {
    if (store.users.some((user) => user.email === email)) {
      return { error: "An account with that email already exists." as const };
    }
    const { salt, passwordHash } = hashPassword(input.password);
    const user: MockUser = {
      id: randomBytes(8).toString("hex"),
      name: input.name.trim(),
      email,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    return { user };
  });
}

export async function findUserByEmail(email: string) {
  const store = await readStore();
  return store.users.find((user) => user.email === email.toLowerCase()) ?? null;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  await updateStore((store) => {
    store.sessions.push({ token, userId, expiresAt });
  });
  return token;
}

export async function userFromToken(token: string | undefined) {
  if (!token) return null;
  const store = await readStore();
  const session = store.sessions.find((row) => row.token === token);
  if (!session || Date.parse(session.expiresAt) < Date.now()) return null;
  return store.users.find((user) => user.id === session.userId) ?? null;
}

export async function deleteSession(token: string | undefined) {
  if (!token) return;
  await updateStore((store) => {
    store.sessions = store.sessions.filter((row) => row.token !== token);
  });
}

export async function createOrder(input: {
  userId: string | null;
  email: string;
  guest: boolean;
  items: MockOrderItem[];
}) {
  const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order: MockOrder = {
    id: `JO-${Date.now().toString(36).toUpperCase()}`,
    userId: input.userId,
    email: input.email.toLowerCase(),
    guest: input.guest,
    items: input.items,
    subtotal: Math.round(subtotal * 100) / 100,
    createdAt: new Date().toISOString(),
  };
  await updateStore((store) => {
    store.orders.push(order);
  });
  return order;
}

export async function ordersForUser(userId: string) {
  const store = await readStore();
  return store.orders
    .filter((order) => order.userId === userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(({ id, items, subtotal, createdAt, guest }) => ({
      id,
      items,
      subtotal,
      createdAt,
      guest,
    }));
}
