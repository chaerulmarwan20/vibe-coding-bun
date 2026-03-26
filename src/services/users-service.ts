import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

export const registerUser = async (payload: any) => {
  const { name, email, password } = payload;

  // 1. Check if email already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("Email sudah terdaftar");
  }

  // 2. Hash password (using Bun's native password hashing)
  const passwordHash = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // 3. Insert user into database
  await db.insert(users).values({
    name,
    email,
    password: passwordHash,
  });

  return { data: "OK" };
};

export const loginUser = async (payload: any) => {
  const { email, password } = payload;

  // 1. Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new Error("Email atau password salah");
  }

  // 2. Verify password
  const isPasswordValid = await Bun.password.verify(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Email atau password salah");
  }

  // 3. Generate token and create session
  const token = crypto.randomUUID();
  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return token;
};
