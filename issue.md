# Perencanaan Fitur: Unit Test API Users

Tujuan dari spesifikasi dokumen ini adalah untuk merancang rincian skenario pengujian kode (*Unit Testing*) terhadap seluruh *endpoint* REST API yang saat ini telah beroperasi. 

Pengujian dilaksanakan secara utuh memakan *test runner* bawaan Bun (`bun test`). Berkas uji (`*.test.ts`) diwajibkan untuk diorganisir secara rapi di dalam *directory* `test/`. 

**Aturan Sangat Penting sebelum memulai (*Data Consistency*)**:
Dalam implementasinya, setiap awalan fungsi blok pengetesan (baik di level *test case* individu maupun via mekanisme semacam `beforeEach`/`afterEach`), pelaksana program kelak **wajib membersihkan/menghapus riwayat data *dummy*** (delete rows) di *database* (misalnya men-delete data dari tabel `users` atau `sessions` berbasis *email mocking* yang spesifik dipakai) sehingga proses pengujian dapat diulang (*rerun*) secara konsisten dan tak akan berbenturan satu sama lain.

Detail implementasi dan penulisan blok kode sepenuhnya diserahkan kepada programmer penugasan selanjutnya, asalkan menjangkau seluruh acuan skenario berikut:

## Daftar Skenario Pengujian

### 1. Endpoint Registrasi (`POST /api/users`)
- **[Skenario 1] Memastikan Pendaftaran Normal**: Eksekusi *hit* sistem dengan muatan data sempurna (name, email dan password baru). Periksa apakah status protokol menunjukan valid 200/201 dan body mencetak identitas "*OK*".
- **[Skenario 2] Penolakan Data Duplikat**: Rancang *hit* ganda secara berurutan memakai *email* presisif. Server tidak boleh teperdaya dan harus melempar keluhan `Email sudah terdaftar` berbasis kode HTTP 400.
- **[Skenario 3] Validasi Skema / Batas Teks**: Dorong pendaftaran baru di mana teks parameter `name` dibanjiri sengaja abjad melebihi kepatuhan batas 255. Sistem sewajibnya terinterupsi mendelegasikan Error 422 / 400 *Unprocessable Entity* (Bukan crash 500!).

### 2. Endpoint Membuka Sesi Login (`POST /api/users/login`)
- **[Skenario 1] Sanggup Membangun Koneksi Log-In**: Autentikasi masukan alamat *email* berserta paduan *password* murni. Memastikan bahwa sistem merespon status 200 dan mengekstraksi balasan UUID Token tulen di json balikan datanya.
- **[Skenario 2] Login Palsu / Tak Dikenali**: Dorong panggilan menggunakan *email* antah-berantah tak beralamat ke tabel db. Sistem menolak dengan frasa `"Email atau password salah"` dan kode 401.
- **[Skenario 3] Salah Password Semata**: Menggunakan *email* yang dikonfirmasi registrasi tapi keliru sandinya. Tuntutan sama, gagal di kode res 401.
- **[Skenario 4] Meredam Input Kepanjangan**: Sama polanya seperti registrasi, kirim permintaan via payload super melar ekstrim di param *password*/*email*. Antisipasi tangkapan peringatan balikan error skema 422.

### 3. Endpoint Intip Identitas / Current User (`GET /api/users/current`)
- **[Skenario 1] Membaca Profil Sah**: Akses link tersebut dilampiri Header otentikasi ("Authorization: Bearer <token_asli_login>"). Validasi format balasan 200 dan json *response* mengandung detail `name` serta `email` tapi mutlak TAK menampilkan *password*.
- **[Skenario 2] Ketiadaan Hak Tiket (Missing Header)**: Lakukan permintaan tanpa melempar sama sekali elemen header kelulusan otentikasi. Mutlak gagal dengan koda kesalahan 401 Unauthorized.
- **[Skenario 3] Sandi Tiket Palsu**: Permintaan tetap dikirim plus melempar baris Bearer tiket valid tetapi token UUID bersangkutan serampangan (tidak nyambung / terkonfirmasi di `tables.sessions`). Dibatalkan seketika sistem server 401.

### 4. Endpoint Tutup Sesi / Logout (`DELETE /api/users/logout`)
- **[Skenario 1] Penyingkiran Relasi Valid**: Lempar request Logout ber-Header dengan berisikan Bearer token nyata yang tengah eksis. Cek respons harus berbalas sukses `{"data": "OK"}`. (Konfirmasikan lewat skrip uji bila jejak di table database sesi itu sirna).
- **[Skenario 2] Coba Putus Tanpa Tanda Pengenal**: Aksi request bodong yang mencoba *mengetuk pintu* Delete ke path Logout tatkala Headernya ditanggalkan. Pastikan terespon keras HTTP 401.
- **[Skenario 3] Percobaan Ganda (Sudah Terlog-Out)**: Mencoba mengekspolitasi celah yakni melempar *Bearer Token* sama yang tadinya telah lunas dipakai meruntuhkan sesi Logout (Di skenario 1). Karena tidak ada record, diredam dengan balasan 401.
