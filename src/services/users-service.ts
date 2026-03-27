import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Mendaftarkan pengguna baru ke dalam sistem.
 * Fungsi ini akan mengecek apakah email sudah terdaftar, jika belum maka password akan di-hash menggunakan bcrypt,
 * dan data pengguna akan disimpan ke dalam database.
 * 
 * @param payload - Objek yang berisi informasi name, email, dan password pengguna baru.
 * @returns Object berisi { data: "OK" } jika registrasi sukses.
 * @throws Error jika email sudah terdaftar.
 */
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

/**
 * Mengautentikasi pengguna berdasarkan email dan password.
 * Fungsi ini mencari pengguna berdasarkan email dan memverifikasi kecocokan password yang di-hash.
 * Jika valid, sistem akan men-generate token unik UUID dan menyimpannya sebagai sesi (session).
 * 
 * @param payload - Objek yang berisi informasi email dan password.
 * @returns Token sesi (UUID string) yang dapat digunakan untuk proses autentikasi (Bearer token).
 * @throws Error jika email tidak ditemukan atau password salah.
 */
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

/**
 * Mengambil data profil dari pengguna yang sedang aktif/login saat ini.
 * Fungsi ini memeriksa eksistensi sesi token yang valid di database dengan melakukan join,
 * dan mengembalikan data profil pengguna yang terkait (tanpa mengembalikan password).
 * 
 * @param token - Bearer token sesi milik pengguna.
 * @returns Objek profil pengguna yang mencakup id, name, email, dan waktu pembuatan (createdAt).
 * @throws Error "Unauthorized" jika token tidak ditemukan atau tidak valid.
 */
export const getCurrentUser = async (token: string) => {
  // Join users and sessions to find the user associated with the token
  const [result] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .innerJoin(sessions, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (!result) {
    throw new Error("Unauthorized");
  }

  return result;
};

/**
 * Mengeluarkan pengguna (logout) dari sistem dan menghapus sesi mereka.
 * Fungsi ini melakukan validasi keberadaan token di database, lalu menghapus catatan tabel sesi
 * yang sesuai sehingga token yang lama langsung menjadi tidak berlaku (invalidated).
 * 
 * @param token - Bearer token sesi milik pengguna yang ingin dikeluarkan.
 * @returns String "OK" ketika proses penghapusan sesi berhasil.
 * @throws Error "Unauthorized" jika sesi atau token tersebut tidak ditemukan.
 */
export const logoutUser = async (token: string) => {
  // 1. Check if session exists
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session) {
    throw new Error("Unauthorized");
  }

  // 2. Delete the session
  await db.delete(sessions).where(eq(sessions.token, token));

  return "OK";
};
