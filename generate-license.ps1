# POS Application License Generator
# Untuk Generate License Customer
# Usage: powershell -ExecutionPolicy Bypass -File generate-license.ps1 -CustomerName "John" -CustomerEmail "john@test.com" -Domain ""
# Catatan: CustomerEmail saat ini belum digunakan (bisa dikembangkan untuk auto-email)

param(
    [string]$CustomerName = "",
    [string]$CustomerEmail = "",
    [string]$Domain = ""
)

Write-Host "========================================"
Write-Host "  POS Application License Generator"
Write-Host "  Untuk Generate License Customer"
Write-Host "========================================"
Write-Host ""

# Load .env file if exists
$envFile = "backend/.env"
$LICENSE_KEY = $null

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    foreach ($line in $envContent) {
        if ($line -match "^LICENSE_KEY=(.*)") {
            $LICENSE_KEY = $matches[1].Trim()
        }
    }
}

# Generate LICENSE_KEY if not set
if (-not $LICENSE_KEY) {
    Write-Host "LICENSE_KEY belum diset, generate otomatis..." -ForegroundColor Yellow
    Write-Host ""
    
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    $LICENSE_KEY = -join ((1..32) | ForEach-Object { $chars[(Get-Random -Minimum 0 -Maximum $chars.Length)] })
    
    Write-Host "Generated LICENSE_KEY: $LICENSE_KEY" -ForegroundColor Green
    Write-Host ""
    
    # Add to .env
    if (Test-Path $envFile) {
        Add-Content $envFile ""
        Add-Content $envFile "LICENSE_KEY=$LICENSE_KEY"
    } else {
        "LICENSE_KEY=$LICENSE_KEY" | Out-File -FilePath $envFile -Encoding utf8
    }
    
    Write-Host "LICENSE_KEY sudah ditambahkan ke $envFile" -ForegroundColor Green
    Write-Host ""
}

Write-Host "Using LICENSE_KEY: $LICENSE_KEY" -ForegroundColor Cyan
Write-Host ""

# Input Data Customer (from params or interactive)
if (-not $CustomerName) {
    Write-Host "========================================"
    Write-Host "  Input Data Customer"
    Write-Host "========================================"
    Write-Host ""
    $CustomerName = Read-Host "Nama Customer"
    $CustomerEmail = Read-Host "Email Customer"
    $Domain = Read-Host "Domain (kosongkan untuk offline)"
} else {
    Write-Host "========================================"
    Write-Host "  Data Customer (from arguments)"
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Customer Name: $CustomerName"
    Write-Host "Customer Email: $CustomerEmail"
    Write-Host "Domain: $Domain"
    Write-Host ""
}

Write-Host "========================================"
Write-Host "  Generating Random Password..."
Write-Host "========================================"
Write-Host ""

# Generate random password (will be displayed to developer only)
$chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
$plainPassword = -join ((1..12) | ForEach-Object { $chars[(Get-Random -Minimum 0 -Maximum $chars.Length)] })

Write-Host "Generated Activation Password: $plainPassword" -ForegroundColor Green
Write-Host ""
Write-Host "CATATAN: Password ini HANYA dimiliki developer!" -ForegroundColor Yellow
Write-Host "Gunakan untuk: activate license, ubah domain, revoke license"
Write-Host ""

# Delete old license file
Write-Host "========================================"
Write-Host "  Step 1: Delete Old License File"
Write-Host "========================================"
Write-Host ""

$licenseFile = "backend/.license.enc"
if (Test-Path $licenseFile) {
    Write-Host "Deleting old license file..." -ForegroundColor Yellow
    Remove-Item $licenseFile -Force
    Write-Host "Old license deleted." -ForegroundColor Green
} else {
    Write-Host "No old license file found." -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Step 2: Generate New License"
Write-Host "========================================"
Write-Host ""

# Set environment for Node.js - Only LICENSE_KEY is needed
$env:LICENSE_KEY = $LICENSE_KEY
# NOTE: Password is NOT saved to .env - only developer has it

if ($Domain) {
    Write-Host "Mode: ONLINE - Domain: $Domain" -ForegroundColor Cyan
    
    # Set online mode
    Write-Host "Setting mode to ONLINE..."
    node backend/utils/cli-commands.js set-online
    
    # Set domain - NOW REQUIRES PASSWORD for security
    Write-Host "Setting domain to: $Domain (requires password)..."
    node backend/utils/cli-commands.js set-domain $Domain $plainPassword
} else {
    Write-Host "Mode: OFFLINE - Localhost only" -ForegroundColor Cyan
    
    # Set offline mode
    Write-Host "Setting mode to OFFLINE..."
    node backend/utils/cli-commands.js set-offline
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Step 3: Activate License"
Write-Host "========================================"
Write-Host ""

# Activate with PLAIN password - passed as argument, NOT from env
# IMPORTANT: Must set env vars again because each node call is a new process
$env:LICENSE_KEY = $LICENSE_KEY
# Password is passed as CLI argument, not from env var
node backend/utils/cli-commands.js set-active $plainPassword

Write-Host ""
Write-Host "========================================"
Write-Host "  License Berhasil Dihasilkan!"
Write-Host "========================================"
Write-Host ""

Write-Host "--- INFORMASI LICENSE ---" -ForegroundColor Yellow
Write-Host "Customer: $CustomerName"
Write-Host "Email: $CustomerEmail"
if ($Domain) {
    Write-Host "Mode: ONLINE - Domain: $Domain"
} else {
    Write-Host "Mode: OFFLINE - Localhost only"
}
Write-Host "Activation Password: $plainPassword" -ForegroundColor Green
Write-Host ""

Write-Host "--- CONFIG UNTUK SERVER (Anda) ---" -ForegroundColor Yellow
Write-Host "Simpan di backend/.env:"
Write-Host "LICENSE_KEY=$LICENSE_KEY"
Write-Host ""
Write-Host "CATATAN: Activation Password $plainPassword" -ForegroundColor Yellow
Write-Host "HANYA DISIMPAN OLEH DEVELOPER (tidak di .env)"
Write-Host ""

Write-Host "--- INFORMASI UNTUK CUSTOMER ---" -ForegroundColor Yellow
Write-Host ""
Write-Host "Berikan informasi ini ke customer:"
Write-Host ""
Write-Host "========================================"
Write-Host "  LICENSE INFO"
Write-Host "========================================"
Write-Host ""
Write-Host "License sudah AKTIF dan siap digunakan." -ForegroundColor Green
Write-Host ""
Write-Host "Yang perlu customer lakukan:" -ForegroundColor Cyan
Write-Host "1. Pastikan file backend/.env berisi:"
Write-Host "   LICENSE_KEY=$LICENSE_KEY"
Write-Host "2. Pastikan file backend/.license.enc ada di project"
Write-Host "3. Jalankan aplikasi seperti biasa (run-app.bat atau manual)"
Write-Host ""
Write-Host "CATATAN: Jangan hapus file backend/.license.enc" -ForegroundColor Yellow
Write-Host "         dan jangan ubah LICENSE_KEY di backend/.env"
Write-Host ""
if ($Domain) {
    Write-Host "Mode: ONLINE - Domain: $Domain" -ForegroundColor Cyan
    Write-Host "Aplikasi hanya bisa diakses dari domain yang terdaftar."
} else {
    Write-Host "Mode: OFFLINE - Localhost only" -ForegroundColor Cyan
    Write-Host "Aplikasi hanya bisa dijalankan di localhost (127.0.0.1)."
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Status License:"
Write-Host "========================================"
Write-Host ""

# Show final status
$env:LICENSE_KEY = $LICENSE_KEY
node backend/utils/cli-commands.js status

Write-Host ""
Write-Host "License file: backend/.license.enc" -ForegroundColor Green
Write-Host ""
