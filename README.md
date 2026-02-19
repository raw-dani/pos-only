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

Gunakan perintah CLI berikut untuk mengelola license aplikasi. Pastikan Anda berada di folder `backend` terlebih dahulu:

```
cd backend
```

### Menggunakan Node Langsung

| Command | Fungsi |
|---------|--------|
| `node utils/cli-commands.js status` | Cek status license |
| `node utils/cli-commands.js set-offline` | Set mode offline |
| `node utils/cli-commands.js set-online` | Set mode online |
| `node utils/cli-commands.js set-domain <domain>` | Set domain |
| `node utils/cli-commands.js set-active <password>` | Aktifkan license |
| `node utils/cli-commands.js revoke <password>` | Revoke license |

### Menggunakan npm scripts

| Command | Fungsi |
|---------|--------|
| `npm run license:status` | Cek status license |
| `npm run license:set-offline` | Set mode offline |
| `npm run license:set-online` | Set mode online |
| `npm run license:set-domain <domain>` | Set domain |
| `npm run license:set-active <password>` | Aktifkan license |
| `npm run license:revoke <password>` | Revoke license |

### Contoh Penggunaan

**Offline Mode:**
```
cd backend
node utils/cli-commands.js set-offline
node utils/cli-commands.js set-active POS_ACTIVATION_KEY_2024
```

**Online Mode:**
```
cd backend
node utils/cli-commands.js set-online
node utils/cli-commands.js set-domain tokoonline.com
node utils/cli-commands.js set-active POS_ACTIVATION_KEY_2024
```

**Cek Status:**
```
cd backend
node utils/cli-commands.js status
```

**Menggunakan npm scripts:**
```
cd backend
npm run license:set-offline
npm run license:set-active POS_ACTIVATION_KEY_2024
```

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