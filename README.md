# Vibe Coding Bun - Backend API

Aplikasi ini adalah sebuah backend API (RESTful API) untuk manajemen aktivitas pengguna (Users) yang dibangun secara modern menggunakan environment JavaScript **Bun**. Aplikasi ini menyediakan fitur-fitur penting seperti registrasi pengguna baru, otentikasi (login/logout), dan pengambilan profil data pengguna yang sedang login dengan memanfaatkan token Bearer authorization.

## Technology Stack & Libraries

**Technology Stack:**
- **Runtime:** [Bun](https://bun.sh/) (Fast all-in-one JavaScript runtime)
- **Language:** TypeScript
- **Database:** MySQL

**Libraries:**
- **[ElysiaJS](https://elysiajs.com/):** Framework web backend yang sangat cepat, ringan, dan developer-friendly untuk Bun.
- **[Drizzle ORM](https://orm.drizzle.team/):** TypeScript ORM yang sangat ringan dan type-safe.
- **drizzle-kit:** CLI tool pelengkap Drizzle ORM (digunakan untuk migrasi/push skema ke database).
- **mysql2:** Driver koneksi dari aplikasi ke database MySQL.

## Arsitektur & Struktur Direktori

Aplikasi ini menerapkan pola pemisahan *concern* (secara arsitektural menggunakan pola Layered / Controller-Service-Repository) untuk membuat kode menjadi rapi, modular, dan mudah di-maintain.

```text
vibe-coding-bun/
├── src/
│   ├── db/                 # Konfigurasi database dan definisi skema
│   │   ├── index.ts        # Inisialisasi koneksi MySQL via Drizzle
│   │   └── schema.ts       # Definisi skema tabel-tabel database (Drizzle ORM)
│   ├── routes/             # Layer Controller / Routing (Endpoints Elysia)
│   │   └── users-route.ts  # Endpoint API untuk fitur Users
│   ├── services/           # Layer Service / Bisnis Logika
│   │   └── users-service.ts# Logika inti registrasi, login, auth, logout
│   └── index.ts            # Entry point aplikasi (Inisialisasi server & port)
├── test/                   # Direktori Testing (E2E / Integration / Unit testing)
│   └── users.test.ts       # File testing otomatis untuk semua endpoint API Users
├── drizzle/                # Folder hasil generate status database migrasi Drizzle
├── .env                    # Variabel environment (credential & koneksi db)
├── .env.example            # Contoh variabel environment untuk setup
├── drizzle.config.ts       # Konfigurasi setup Drizzle ORM & db push
├── package.json            # Daftar dependencies & scripts NPM/Bun
└── tsconfig.json           # Konfigurasi standar untuk compiler TypeScript
```

**Penamaan File & Struktur:**
Aplikasi ini secara seragam menggunakan konvensi **kebab-case** pada penamaan file dan foldernya (contoh: `users-route.ts`, `users-service.ts`). Penggunaan kebab-case adalah praktik standar yang *cross-platform* dan memudahkan pencarian serta meningkatkan keterbacaan file.

## Skema Database

Skema tabel database aplikasi didesain menggunakan *Drizzle ORM* yang dapat dilihat selengkapnya pada `src/db/schema.ts`. Tedapat dua tabel utama:

1. **Tabel `users`** (Menyimpan data otentikasi user)
   - `id` (`INT` / Serial) - Primary Key
   - `name` (`VARCHAR(255)`) - Nama pengguna yang tidak boleh kosong (Not Null)
   - `email` (`VARCHAR(255)`) - Alamat email pengguna. Kolom ini bersifat **Unique** dan Not Null
   - `password` (`VARCHAR(255)`) - Password pengguna
   - `created_at` (`TIMESTAMP`) - Waktu baris dibuat (Default: Now)

2. **Tabel `sessions`** (Menyimpan data token sesi aktif pengguna yang login)
   - `id` (`INT` / Serial) - Primary Key
   - `token` (`VARCHAR(255)`) - Token spesifik untuk autorisasi
   - `user_id` (`BIGINT UNSIGNED`) - Foreign Key yang mereferensikan tabel/kolom `users.id`
   - `created_at` (`TIMESTAMP`) - Waktu sesi/token dibuat (Default: Now)

## API yang Tersedia (Endpoints)

Base URL: `/api/users`

| HTTP Method | Endpoint Lengkap | Deskripsi | Headers Wajib | Body Request Wajib (JSON) |
|-------------|------------------|-----------|---------------|---------------------------|
| `POST` | `/api/users` | Registrasi / Daftar Akun Baru | - | `{ name, email, password }` |
| `POST` | `/api/users/login` | Login & Mendapatkan Token | - | `{ email, password }` |
| `GET` | `/api/users/current` | Akses Profil Pengguna (Current) | `Authorization: Bearer <token>` | - |
| `DELETE` | `/api/users/logout` | Logout (Hapus autentikasi/token)| `Authorization: Bearer <token>` | - |

## Cara Setup Project Secara Lokal

1. **Install Bun:** Pastikan di mesin/komputer Anda telah terinstall Bun runtime. Jika belum, install melalui terminal:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```
2. **Clone Project:** Download / clone repository ini dan pindah ke folder aplikasi.
3. **Install Dependencies:** Eksekusi perintah di bawah untuk menginstall packagenya:
   ```bash
   bun install
   ```
4. **Environment Variables:** Salin contoh `.env` bawaan.
   ```bash
   cp .env.example .env
   ```
5. **Config Database:** Buka `.env` dan atur property `DATABASE_URL` ke koneksi database MySQL lokal/remote Anda. Pastikan nama database tersebut (contoh: `vibe_coding_bun`) sudah terbuat.
   ```env
   DATABASE_URL=mysql://root:password_disini@localhost:3306/vibe_coding_bun
   ```
6. **Migrasi / Synchronize Database:** Gunakan script bawaan Drizzle untuk men-generate otomatis tabel-tabel ke dalam database Anda.
   ```bash
   bun run db:push
   ```

## Cara Run Aplikasi

Aplikasi memiliki dua mode yang disediakan di script `package.json`:

- **Menjalankan Mode Development (Hot-Reloading):**
  Untuk memantau setiap kali ada kode yang diganti, aplikasi akan me-restart secara independen dan instan.
  ```bash
  bun run dev
  ```
- **Menjalankan Normal / Production:**
  Menyalakan server mode standar tanpa *watcher*.
  ```bash
  bun run start
  ```
*(Secara default server ElysiaJS akan listen di alamat `http://localhost:3000`)*

## Cara Test Aplikasi

Proyek ini telah memiliki cakupan testing komprehensif untuk memastikan fitur Registrasi, Login, Access Profile, sampai Logout bertindak dengan semestinya baik saat *sukses* atau ketika diskenariokan *gagal*.
Testing dijalankan di mode lokal dan otomatis memanipulasi database (`tests/users.test.ts`), sehingga dirunning dengan toolset **built-in test bun** bawaan:

```bash
bun test
```
