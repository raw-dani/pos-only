# Panduan Install Aplikasi POS-Only di CyberPanel

Panduan lengkap untuk menginstall dan mendeploy aplikasi POS Invoice di server CyberPanel agar dapat diakses melalui domain seperti `pos-only.gmteknologi.com`.

## Prasyarat

- VPS atau server dengan CyberPanel terinstall
- Akses ke CyberPanel admin panel
- Domain yang sudah mengarah ke IP server
- Pengetahuan dasar CyberPanel dan Linux

## 1. Persiapan CyberPanel

### 1.1. Login ke CyberPanel
- Akses `https://your-server-ip:8090`
- Login dengan credentials admin

### 1.2. Buat Website
1. Pergi ke **Websites** > **Create Website**
2. Masukkan detail:
   - Domain: `pos-only.gmteknologi.com`
   - Email: email Anda
   - PHP Version: pilih yang tersedia (tidak terlalu penting untuk Node.js)
3. Klik **Create Website**

### 1.3. Setup SSL
1. Pergi ke **Websites** > **List Websites**
2. Klik **Manage** di domain Anda
3. Pergi ke **SSL** > **Issue SSL**
4. Pilih **Let's Encrypt** dan ikuti instruksi

### 1.4. Akses File Manager
1. Dari **Manage Website**, klik **File Manager**
2. Atau akses via SFTP dengan credentials yang diberikan CyberPanel

## 2. Setup Database

### 2.1. Buat Database
1. Di CyberPanel, pergi ke **Databases** > **Create Database**
2. Masukkan detail:
   - Database Name: `pos_invoice`
   - Database User: `posuser`
   - Password: `passwordkuat123!`
3. Klik **Create Database**

### 2.2. Import Schema (Opsional)
Jika perlu, gunakan phpMyAdmin untuk import schema database.

## 3. Upload dan Setup Aplikasi

### 3.1. Upload Files
1. Buka File Manager CyberPanel
2. Upload seluruh folder proyek ke `/home/pos-only.gmteknologi.com/public_html/`
3. Struktur folder akan menjadi:
   ```
   public_html/
   ├── backend/
   ├── frontend/
   ├── README.md
   └── ...
   ```

### 3.2. Setup Backend Environment
1. Via File Manager atau SFTP, edit `backend/.env`:
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=generate-strong-secret-here-make-it-long-and-random
DB_HOST=localhost
DB_USER=posuser
DB_PASSWORD=passwordkuat123!
DB_NAME=pos_invoice
CORS_ORIGIN=https://pos-only.gmteknologi.com
PRODUCTION_URL=https://pos-only.gmteknologi.com
LICENSE_KEY=your-license-key-from-developer
DEFAULT_ADMIN_PASSWORD=Admin@12345!
```

## 4. Install Node.js di Server

### 4.1. Akses Terminal
1. Di CyberPanel, pergi ke **Server** > **Terminal**
2. Atau akses via SSH dengan credentials server

### 4.2. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### 4.3. Install PM2
```bash
sudo npm install -g pm2
```

## 5. Setup Aplikasi

### 5.1. Install Dependencies Backend
```bash
cd /home/pos-only.gmteknologi.com/public_html/backend
npm install --production
```

### 5.2. Build Frontend
```bash
cd ../frontend
npm install
npm run build
```

### 5.3. Setup Frontend di public_html
Karena CyberPanel menggunakan public_html sebagai root web, pindahkan build frontend:
```bash
cd /home/pos-only.gmteknologi.com/public_html
mv frontend/build/* ./
rm -rf frontend  # Opsional, hapus folder frontend setelah build
```

## 6. Konfigurasi OpenLiteSpeed

### 6.1. Setup Reverse Proxy untuk API
1. Di CyberPanel, pergi ke **Websites** > **List Websites**
2. Klik **Manage** > **Configurations** > **Rewrite Rules**
3. Tambahkan rewrite rule untuk proxy API:

```
RewriteRule ^/api/(.*)$ http://127.0.0.1:3001/api/$1 [P,L]
RewriteRule ^/socket.io/(.*)$ http://127.0.0.1:3001/socket.io/$1 [P,L]
```

### 6.2. Setup Context untuk API (Alternatif)
1. Pergi ke **Configurations** > **Context**
2. Tambahkan External App:
   - URI: `/api`
   - External App Type: Proxy
   - Address: `127.0.0.1:3001`

## 7. Jalankan Backend dengan PM2

### 7.1. Start Aplikasi
```bash
cd /home/pos-only.gmteknologi.com/public_html/backend
pm2 start server.js --name "pos-backend"
pm2 startup
pm2 save
```

### 7.2. Setup Auto-start (Opsional)
Jika PM2 tidak auto-start, tambahkan ke crontab:
```bash
crontab -e
@reboot pm2 resurrect
```

## 8. Konfigurasi License

### 8.1. Setup License untuk Domain
Jika Anda memiliki akses developer tools, jalankan:
```bash
cd /home/pos-only.gmteknologi.com/public_html/backend
# Contoh commands:
# export LICENSE_KEY="your-key"
# node utils/cli-commands.js set-online
# node utils/cli-commands.js set-domain pos-only.gmteknologi.com your-password
# node utils/cli-commands.js set-active your-password
```

Atau hubungi developer untuk setup license domain.

## 9. Konfigurasi Firewall

### 9.1. Setup Firewall Rules
1. Di CyberPanel, pergi ke **Firewall** > **Firewall Rules**
2. Pastikan port 80, 443, dan 22 terbuka
3. Jika perlu port khusus untuk Node.js, buka port 3001

## 10. Test dan Verifikasi

### 10.1. Test Akses Aplikasi
- Buka `https://pos-only.gmteknologi.com` di browser
- Login dengan:
  - Username: `admin`
  - Password: `Admin@12345!`

### 10.2. Test API
```bash
curl https://pos-only.gmteknologi.com/api/health
```

### 10.3. Monitor Logs
```bash
# PM2 logs
pm2 logs pos-backend

# OpenLiteSpeed logs
tail -f /usr/local/lsws/logs/error.log
tail -f /usr/local/lsws/logs/access.log
```

## 11. Troubleshooting CyberPanel

### 11.1. Error 502/503
- Backend tidak berjalan: `pm2 status`
- Port salah di rewrite rules
- Firewall blocking port 3001

### 11.2. Frontend Tidak Load
- Build frontend gagal
- Files tidak di public_html
- Permissions issue: `chmod -R 755 /home/domain.com/public_html`

### 11.3. Database Connection Error
- Cek credentials di .env
- Pastikan database user punya akses dari localhost

### 11.4. SSL Issues
- Re-issue SSL dari CyberPanel
- Cek DNS propagation

### 11.5. PM2 Tidak Start Otomatis
- Setup crontab untuk pm2 resurrect
- Atau gunakan systemd service

## 12. Maintenance

### 12.1. Update Aplikasi
```bash
cd /home/pos-only.gmteknologi.com/public_html
git pull origin main
cd backend && npm install --production
cd ../frontend && npm install && npm run build
cp -r frontend/build/* ../public_html/
pm2 restart pos-backend
```

### 12.2. Backup Database
Gunakan CyberPanel backup tools atau:
```bash
mysqldump -u posuser -p pos_invoice > backup.sql
```

### 12.3. Monitor Resources
- Gunakan CyberPanel dashboard untuk monitor CPU/Memory
- Setup alerts untuk resource usage tinggi

## 13. Security Best Practices

- ✅ Selalu update CyberPanel dan server
- ✅ Gunakan strong passwords
- ✅ Enable 2FA untuk CyberPanel admin
- ✅ Monitor logs regularly
- ✅ Backup regularly
- ✅ Limit SSH access
- ✅ Update dependencies aplikasi

## 14. Performance Tips

- ✅ Enable gzip compression di OpenLiteSpeed
- ✅ Setup caching untuk static assets
- ✅ Monitor PM2 processes
- ✅ Optimize database queries
- ✅ Use CDN untuk assets jika perlu

## Support

Jika mengalami masalah:
1. Cek CyberPanel error logs
2. Verifikasi PM2 status
3. Test koneksi database
4. Cek firewall rules
5. Hubungi tim development untuk issues aplikasi

---

**Catatan**: Panduan ini spesifik untuk CyberPanel. Untuk versi CyberPanel berbeda, beberapa langkah mungkin sedikit berbeda.</content>
<parameter name="filePath">CYBERPANEL-INSTALL.md