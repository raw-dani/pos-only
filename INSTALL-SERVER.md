# Panduan Deployment Aplikasi POS-Only

Panduan lengkap untuk mendeploy aplikasi POS Invoice ke server produksi agar dapat diakses melalui domain publik seperti `pos-only.gmteknologi.com`.

## Prasyarat

- VPS Ubuntu 20.04+ dengan akses root
- Domain yang sudah mengarah ke IP server
- Pengetahuan dasar Linux dan terminal

## 1. Persiapan Server

### 1.1. Update Sistem
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2. Install Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Verifikasi instalasi
```

### 1.3. Install MySQL Server
```bash
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation
```

### 1.4. Install nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.5. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
pm2 --version  # Verifikasi instalasi
```

## 2. Setup Database MySQL

### 2.1. Buat Database dan User
```bash
sudo mysql -u root -p
```

```sql
-- Jalankan di MySQL shell
CREATE DATABASE pos_invoice;
CREATE USER 'posuser'@'localhost' IDENTIFIED BY 'passwordkuat123!';
GRANT ALL PRIVILEGES ON pos_invoice.* TO 'posuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.2. Test Koneksi Database
```bash
mysql -u posuser -p pos_invoice -e "SELECT 1;"
```

## 3. Deploy Aplikasi

### 3.1. Clone Repository
```bash
cd /var/www
sudo mkdir pos-only
sudo chown -R $USER:$USER pos-only
cd pos-only
git clone https://github.com/your-username/pos-only.git .  # Ganti dengan URL repo Anda
```

### 3.2. Konfigurasi Environment Backend
```bash
cd backend
cp .env.example .env  # Jika ada template
```

Edit file `backend/.env`:
```env
NODE_ENV=production
PORT=5000
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

**⚠️ PENTING**: 
- Ganti `JWT_SECRET` dengan string acak yang kuat
- Ganti `LICENSE_KEY` dengan key yang diberikan developer
- Pastikan password database sesuai dengan yang dibuat di MySQL

### 3.3. Install Dependencies Backend
```bash
cd backend
npm install --production
```

### 3.4. Build Frontend untuk Production
```bash
cd ../frontend
npm install
npm run build
```

## 4. Konfigurasi nginx sebagai Reverse Proxy

### 4.1. Buat Konfigurasi Site
```bash
sudo nano /etc/nginx/sites-available/pos-only
```

Isi dengan konfigurasi berikut:
```nginx
server {
    listen 80;
    server_name pos-only.gmteknologi.com;

    # Frontend static files
    root /var/www/pos-only/frontend/build;
    index index.html;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Handle WebSocket connections jika diperlukan
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### 4.2. Aktifkan Site
```bash
sudo ln -s /etc/nginx/sites-available/pos-only /etc/nginx/sites-enabled/
sudo nginx -t  # Test konfigurasi
sudo systemctl reload nginx
```

### 4.3. Hapus Default Site (Opsional)
```bash
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl reload nginx
```

## 5. Konfigurasi SSL dengan Let's Encrypt

### 5.1. Install Certbot
```bash
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 5.2. Dapatkan SSL Certificate
```bash
sudo certbot --nginx -d pos-only.gmteknologi.com
```

Ikuti instruksi di layar. Certbot akan:
- Mendapatkan certificate dari Let's Encrypt
- Mengupdate konfigurasi nginx otomatis
- Setup auto-renewal

### 5.3. Verifikasi SSL
```bash
curl -I https://pos-only.gmteknologi.com
```

## 6. Jalankan Backend dengan PM2

### 6.1. Start Aplikasi
```bash
cd /var/www/pos-only/backend
pm2 start server.js --name "pos-backend"
pm2 startup  # Setup PM2 untuk auto-start saat boot
pm2 save     # Simpan konfigurasi PM2
```

### 6.2. Monitor dan Logs
```bash
pm2 status
pm2 logs pos-backend
pm2 monit  # Monitor real-time (Ctrl+C untuk keluar)
```

## 7. Konfigurasi License untuk Domain

### 7.1. Setup License (Hubungi Developer)
Jika Anda memiliki akses ke tools developer, jalankan:
```bash
cd /var/www/pos-only
# Jalankan generate-license.ps1 atau commands manual
# Contoh:
# $env:LICENSE_KEY="your-key"; node backend/utils/cli-commands.js set-online
# $env:LICENSE_KEY="your-key"; node backend/utils/cli-commands.js set-domain pos-only.gmteknologi.com your-activation-password
# $env:LICENSE_KEY="your-key"; node backend/utils/cli-commands.js set-active your-activation-password
```

### 7.2. Verifikasi License
```bash
curl https://pos-only.gmteknologi.com/api/health
```

## 8. Konfigurasi Firewall

### 8.1. Setup UFW
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

## 9. Test dan Verifikasi

### 9.1. Test Akses Aplikasi
- Buka `https://pos-only.gmteknologi.com` di browser
- Login dengan credentials default:
  - Username: `admin`
  - Password: `Admin@12345!`

### 9.2. Test API Endpoints
```bash
# Health check
curl -k https://pos-only.gmteknologi.com/api/health

# Test login
curl -k -X POST https://pos-only.gmteknologi.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@12345!"}'
```

### 9.3. Test Database Connection
Pastikan aplikasi dapat connect ke database dengan menjalankan query sederhana melalui API.

## 10. Maintenance dan Backup

### 10.1. Backup Database
```bash
mysqldump -u posuser -p pos_invoice > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 10.2. Update Aplikasi
```bash
cd /var/www/pos-only
git pull origin main
cd backend && npm install --production
cd ../frontend && npm install && npm run build
pm2 restart pos-backend
sudo systemctl reload nginx
```

### 10.3. Monitor Logs
```bash
# nginx logs
sudo tail -f /var/log/nginx/pos-only.access.log
sudo tail -f /var/log/nginx/pos-only.error.log

# PM2 logs
pm2 logs pos-backend
```

## 11. Troubleshooting

### 11.1. Error 502 Bad Gateway
- Backend tidak berjalan: `pm2 status`
- Port 5000 tidak terbuka: `netstat -tlnp | grep 5000`

### 11.2. Error 403 License
- Domain belum terdaftar di license
- LICENSE_KEY salah di .env
- Hubungi developer untuk aktivasi domain

### 11.3. SSL Certificate Expired
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### 11.4. Database Connection Error
- Cek credentials di `backend/.env`
- Test koneksi: `mysql -u posuser -p pos_invoice -e "SELECT 1;"`

### 11.5. CORS Error
- Pastikan `CORS_ORIGIN` di .env sesuai domain
- Restart backend: `pm2 restart pos-backend`

### 11.6. Static Files Tidak Load
- Pastikan build frontend berhasil
- Cek path di nginx config
- Reload nginx: `sudo systemctl reload nginx`

## 12. Security Best Practices

- ✅ Ganti password default admin setelah login pertama
- ✅ Gunakan firewall (UFW)
- ✅ Enable SSL/TLS
- ✅ Update sistem secara berkala
- ✅ Backup database regularly
- ✅ Monitor logs untuk aktivitas mencurigakan
- ✅ Gunakan strong JWT_SECRET dan database password

## 13. Performance Optimization

- ✅ Enable gzip compression di nginx
- ✅ Setup caching untuk static assets
- ✅ Monitor memory usage dengan PM2
- ✅ Database indexing untuk query yang sering digunakan
- ✅ Load balancing jika traffic tinggi (future)

## Support

Jika mengalami masalah selama deployment:
1. Cek logs aplikasi dan server
2. Pastikan semua prasyarat terpenuhi
3. Verifikasi konfigurasi file
4. Hubungi tim development jika diperlukan

---

**Catatan**: Panduan ini untuk Ubuntu 20.04+. Untuk distro lain, sesuaikan commands instalasi paket.</content>
<parameter name="filePath">INSTALL-SERVER.md