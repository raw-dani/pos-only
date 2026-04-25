# Aplikasi POS Invoice

Aplikasi POS (Point of Sale) Invoice tanpa manajemen stok, fokus pada keuangan, menggunakan Node.js backend dan React PWA frontend.

## Fitur Utama
- **Authentication**: Login dengan JWT, roles Admin dan Kasir
- **POS/Invoice**: Buat invoice cepat, tambah produk, hitung total/diskon/pajak
- **Pembayaran**: Support cash, transfer, QRIS dengan konfirmasi pembayaran
- **Cetak Invoice**: Modal invoice dengan opsi print setelah pembayaran
- **Manajemen Produk**: CRUD produk dengan gambar, kategori, status aktif/nonaktif
- **Bulk Update**: Update massal status produk dan harga
- **Laporan Penjualan**: Halaman reports lengkap dengan filter tanggal, kasir, dan export PDF
- **Offline-Online**: Sync data menggunakan IndexedDB dan service worker
- **UI/UX**: Interface modern dengan color scheme yang menarik

## Teknologi
- Backend: Node.js HTTP Server, JWT authentication
- Frontend: React, PWA, IndexedDB, Service Worker
- Database: MySQL (dengan Sequelize ORM)

## Setup

### Persiapan Database (MySQL)
Aplikasi ini menggunakan MySQL. Pastikan WampServer atau XAMPP sudah terinstall dan MySQL service running (default port 3306).

1. Buat database baru di phpMyAdmin (misalnya: `pos_invoice`)
2. Update file `backend/.env` dengan kredensial MySQL Anda:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=  # kosongkan jika tidak ada password
   DB_NAME=pos_invoice
   ```
3. Jalankan aplikasi terlebih dahulu untuk membuat tabel
4. Seed data awal dengan menjalankan `seed-data.bat` atau menggunakan curl/Postman: `POST http://localhost:5000/api/seed`

### Otomatis (Windows)
Jalankan `run-app.bat` untuk menjalankan aplikasi secara otomatis. Script ini akan:
- Mengecek dan menghentikan proses yang menggunakan port 5000 dan 3000
- Menjalankan backend dan frontend

### Manual

#### Backend
1. cd backend
2. npm install
3. node server.js (server akan berjalan di port 5000)

#### Frontend
1. cd frontend
2. npm install
3. npm start (port 3000)

## Default Login
- Username: admin
- Password: admin123

## Troubleshooting

### Error 401 Unauthorized pada Products Page
Jika mendapat error "401 Unauthorized" saat mengakses halaman Products:

1. **Pastikan sudah login**: Akses halaman Products hanya setelah login berhasil
2. **Token tersimpan**: Sistem menyimpan token JWT di localStorage setelah login
3. **Token valid**: Token berlaku selama 8 jam

**Langkah-langkah:**
1. Buka `http://localhost:3000`
2. Login dengan username: `admin`, password: `admin123`
3. Setelah login berhasil, klik tombol "📦 Manage Products"
4. Halaman Products akan terbuka dengan akses penuh

### Testing API
Jalankan `test-api.bat` untuk test otomatis API authentication dan products.

### Debug Mode
Jalankan `debug-app.bat` untuk menjalankan aplikasi dengan logging detail untuk debug masalah authentication:

1. Script akan menampilkan log di backend terminal (DEBUG AUTH, DEBUG PRODUCTS)
2. Buka browser DevTools (F12) untuk melihat log frontend (DEBUG)
3. Ikuti langkah troubleshooting di terminal

**Debug Steps:**
1. Jalankan `debug-app.bat`
2. Buka http://localhost:3000
3. Login dengan admin/admin123
4. Buka halaman Products
5. Coba tambah product
6. Periksa log di kedua terminal dan browser console

## License Management

Gunakan perintah CLI berikut untuk mengelola license aplikasi.

### ⚠️ PENTING - Environment Variables

CLI commands membutuhkan environment variable LICENSE_KEY:

```
powershell
# Contoh:
$env:LICENSE_KEY="xxx"; node backend/utils/cli-commands.js status
```

### Menggunakan Node Langsung

| Command | Fungsi |
|---------|--------|
| `node backend/utils/cli-commands.js status` | Cek status license |
| `node backend/utils/cli-commands.js set-offline` | Set mode offline |
| `node backend/utils/cli-commands.js set-online` | Set mode online |
| `node backend/utils/cli-commands.js set-domain <domain> <password>` | Set domain (diperlukan password) |
| `node backend/utils/cli-commands.js set-active <password>` | Aktifkan license |
| `node backend/utils/cli-commands.js revoke <password>` | Revoke license |

### Contoh Penggunaan

**Offline Mode:**
```
powershell
$env:LICENSE_KEY="xxx"; node backend/utils/cli-commands.js set-offline
$env:LICENSE_KEY="xxx"; node backend/utils/cli-commands.js set-active passwordanda
```

**Online Mode:**
```
powershell
$env:LICENSE_KEY="xxx"; node backend/utils/cli-commands.js set-online
$env:LICENSE_KEY="xxx"; node backend/utils/cli-commands.js set-domain tokoonline.com passwordanda
$env:LICENSE_KEY="xxx"; node backend/utils/cli-commands.js set-active passwordanda
```

**Ganti Domain (memerlukan password):**
```
powershell
$env:LICENSE_KEY="xxx"; node backend/utils/cli-commands.js revoke passwordlama
$env:LICENSE_KEY="xxx"; node backend/utils/cli-commands.js set-domain domainbaru.com passwordlama
$env:LICENSE_KEY="xxx"; node backend/utils/cli-commands.js set-active passwordlama
```

**Cek Status:**
```
powershell
$env:LICENSE_KEY="xxx"; node backend/utils/cli-commands.js status
```

### Generate License Otomatis (`generate-license.ps1`)

**Overview**: Script PowerShell yang mengotomatisasi seluruh proses pembuatan license — mulai dari generate `LICENSE_KEY`, konfigurasi mode (online/offline), setting domain, hingga aktivasi license.

#### Cara Kerja Script (Internal Workflow)

Script menjalankan langkah-langkah berikut secara otomatis:

**1. Inisialisasi LICENSE_KEY**
- Membaca file `backend/.env` untuk mencari `LICENSE_KEY` yang sudah ada
- Jika `LICENSE_KEY` belum ada, script generate otomatis string random **32 karakter** alphanumeric
- Menyimpan `LICENSE_KEY` ke `backend/.env`

**2. Input Data Customer**
- Jika parameter `-CustomerName`, `-CustomerEmail`, `-Domain` diberikan → gunakan nilai parameter
- Jika tidak → masuk ke **Mode Interaktif** (script akan meminta input Nama, Email, dan Domain via prompt)

**3. Generate Activation Password**
- Membuat password random **12 karakter** alphanumeric
- **⚠️ PENTING**: Password ini hanya ditampilkan di terminal. **TIDAK disimpan ke file manapun** (termasuk `.env`)

**4. Hapus License Lama**
- Menghapus file `backend/.license.enc` jika sudah ada
- Ini memastikan state license bersih sebelum generate yang baru

**5. Konfigurasi Mode**
- **Online Mode** (jika `-Domain` diisi):
  - `node backend/utils/cli-commands.js set-online`
  - `node backend/utils/cli-commands.js set-domain <domain> <password>`
- **Offline Mode** (jika `-Domain` kosong):
  - `node backend/utils/cli-commands.js set-offline`

**6. Aktivasi License**
- `node backend/utils/cli-commands.js set-active <password>`
- Password dikirim sebagai **argument CLI**, bukan dari environment variable

**7. Verifikasi Status**
- Menampilkan status license final dengan `node backend/utils/cli-commands.js status`

#### Parameter

| Parameter | Required | Default | Deskripsi |
|-----------|----------|---------|-----------|
| `-CustomerName` | Tidak | `""` | Nama customer |
| `-CustomerEmail` | Tidak | `""` | Email customer (saat ini belum digunakan, untuk pengembangan auto-email) |
| `-Domain` | Tidak | `""` | Domain untuk mode online. **Kosongkan untuk mode offline** |

#### Contoh Penggunaan

```powershell
# Mode Interaktif (akan meminta input satu per satu)
powershell -ExecutionPolicy Bypass -File generate-license.ps1

# Offline Mode dengan parameter
powershell -ExecutionPolicy Bypass -File generate-license.ps1 -CustomerName "Customer A" -CustomerEmail "customer@test.com"

# Online Mode dengan domain
powershell -ExecutionPolicy Bypass -File generate-license.ps1 -CustomerName "Customer B" -CustomerEmail "customer@test.com" -Domain "tokoonline.com"
```

#### Output & File yang Dihasilkan

**File yang dibuat/dimodifikasi:**
- `backend/.env` — Ditambahkan `LICENSE_KEY=<key>` (jika belum ada)
- `backend/.license.enc` — File license terenkripsi (file lama dihapus, dibuat baru)

**Informasi yang ditampilkan di terminal:**

```
--- INFORMASI LICENSE ---
Customer: <nama>
Email: <email>
Mode: ONLINE/OFFLINE
Activation Password: <password>

--- CONFIG UNTUK SERVER (Developer) ---
Simpan di backend/.env:
LICENSE_KEY=<key>

--- INFORMASI UNTUK CUSTOMER ---
Activation Password: <password>
[Langkah-langkah aktivasi sesuai mode]
```

#### Model Keamanan

| Aspek | Detail |
|-------|--------|
| **LICENSE_KEY** | Disimpan di `backend/.env`, dibutuhkan untuk enkripsi/dekripsi file license. Dibagikan ke customer. |
| **Activation Password** | Hanya developer yang tahu. Digunakan untuk aktivasi (`set-active`), ubah domain (`set-domain`), dan revoke (`revoke`). |
| **Password Storage** | Password **TIDAK pernah** ditulis ke file apapun. Hanya muncul di output terminal saat generate. |
| **License Encryption** | File `.license.enc` dienkripsi dengan **AES-256-CBC** menggunakan hash SHA-256 dari `LICENSE_KEY`. |

#### Alur License (Developer → Customer)

1. **Generate License**:
   - Developer jalankan `generate-license.ps1`
   - Script otomatis generate `LICENSE_KEY` dan `Activation Password`
   - Simpan `LICENSE_KEY` untuk diberikan ke customer
   - Simpan `Activation Password` dengan aman (jangan diberi ke customer)

2. **Kirim ke Customer**:
   - Kirim file aplikasi lengkap
   - Berikan `LICENSE_KEY` untuk customer simpan di `backend/.env`
   - `Activation Password` **TIDAK** diberikan ke customer (mencegah penyalahgunaan)

3. **Aplikasi Siap Pakai**:
   - Setelah script dijalankan, aplikasi sudah dalam keadaan **aktif**
   - Customer tinggal menjalankan aplikasi dengan `LICENSE_KEY` yang diberikan
   - Tidak perlu aktivasi manual lagi

4. **Maintenance (Ganti Domain / Revoke)**:
   - Jika customer perlu ganti domain, developer jalankan:
     ```powershell
     $env:LICENSE_KEY="xxx"; node backend/utils/cli-commands.js set-domain domainbaru.com <password>
     ```
   - Ganti domain memerlukan `Activation Password` (hanya developer yang tahu)

#### Troubleshooting

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| `ExecutionPolicy` error | PowerShell tidak mengizinkan script | Gunakan flag `-ExecutionPolicy Bypass` |
| `LICENSE_KEY` tidak generate | File `.env` tidak bisa ditulis | Pastikan permission write ke folder `backend/` |
| Node.js error | Node.js tidak terinstall atau tidak di PATH | Install Node.js dan pastikan tersedia di terminal |
| `cli-commands.js` not found | Menjalankan script dari folder salah | Pastikan berada di root folder project (tempat `generate-license.ps1` berada) |

## 📋 Workflow Lengkap:
1. **Login** → 2. **Pilih produk** → 3. **Tambah ke cart** → 4. **Create Invoice** (status: PENDING) → 5. **Confirm Payment** (status: PAID) → 6. **Print Invoice**

## Cara Menggunakan

### Akses Halaman Reports
1. Login ke aplikasi
2. Dari halaman POS, klik tombol **"📊 Reports"**
3. Atau akses langsung: `http://localhost:3000/reports`

### Fitur Halaman Reports
- **Filter Tanggal**: Pilih rentang tanggal atau gunakan preset (Today, This Week, This Month)
- **Filter Kasir**: Filter berdasarkan nama kasir (opsional)
- **Summary Cards**: Total sales, jumlah transaksi, rata-rata per transaksi
- **Tabel Detail**: Daftar semua transaksi dengan status
- **Export PDF**: Download laporan dalam format PDF

## API Endpoints
- POST /api/auth/login - Login user
- GET /api/test - Test server connection
- GET /api/products - Get all products
- POST /api/invoices - Create new invoice (status: pending)
- PUT /api/invoices/:id/pay - Confirm payment (status: paid)
- GET /api/reports/sales - Get sales reports with filters
- GET /api/reports/sales/pdf - Export sales report as PDF

## Deployment
- Backend: Deploy ke server dengan MongoDB
- Frontend: Build dengan npm run build, deploy ke hosting PWA