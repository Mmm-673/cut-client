# ============================================================
#  APK Deploy Script (Windows PowerShell)
#  Usage: right-click -> Run with PowerShell
#      or: powershell -File .\scripts\apk.ps1
#  Require: OpenSSH (Windows 10 1803+ / Windows 11)
# ============================================================

$ErrorActionPreference = "Stop"

# ---- Config ----
$ProjectRoot  = Split-Path -Parent $PSScriptRoot
$SshKey       = Join-Path $ProjectRoot "ubutun-prod.pem"
$Server       = "root@114.67.69.228"

# Test environment
$TestRemoteDir  = "/opt/app_test/frontend/homepage/download"
$TestAccessUrl  = "https://www.qiulem.com/test/download/user.apk"

# Production environment
$ProdRemoteDir  = "/opt/app/frontend/homepage/download"
$ProdAccessUrl  = "https://www.qiulem.com/download/user.apk"

# Local APK search locations
$DownloadsApk   = Join-Path $env:USERPROFILE "Downloads\user.apk"
$UnpackageApk   = Join-Path $ProjectRoot "unpackage\release\apk\android\__UNI__0000000\android-release.apk"

# ---- Helpers ----
function Step($num, $total, $msg) { Write-Host ""; Write-Host "[$num/$total] $msg" -ForegroundColor Cyan }
function Ok($msg)               { Write-Host "       OK  - $msg" -ForegroundColor Green }
function Warn($msg)             { Write-Host "       WARN - $msg" -ForegroundColor Yellow }
function Die($msg)              { Write-Host ""; Write-Host "FAIL: $msg" -ForegroundColor Red; Write-Host ""; Read-Host "Press Enter to exit"; exit 1 }

# Auto-detect local APK file
function Find-LocalApk {
    $candidates = @()
    # Look for latest user*.apk in Downloads
    $dlDir = Join-Path $env:USERPROFILE "Downloads"
    if (Test-Path $dlDir) {
        Get-ChildItem -Path $dlDir -Filter "user*.apk" -File |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1 |
            ForEach-Object { $candidates += $_.FullName }
    }
    # Fixed path candidates
    $candidates += $DownloadsApk
    $candidates += $UnpackageApk

    foreach ($c in $candidates) {
        if (Test-Path $c) { return $c }
    }
    return $null
}

# Fix SSH key permissions on Windows (required by OpenSSH)
function Fix-SshKeyPermission($keyPath) {
    icacls $keyPath /inheritance:r /grant "$($env:USERNAME):F" | Out-Null
    icacls $keyPath /remove:g "Authenticated Users", "Users", "Everyone" 2>$null | Out-Null
    Ok "SSH key permissions fixed"
}

# Deploy APK to a target environment
function Deploy-Apk($localFile, $remoteDir, $accessUrl, $envName) {
    $remoteTmp = "$remoteDir/user.apk.tmp"
    $remoteDst = "$remoteDir/user.apk"

    Step 1 3 "Uploading APK to $envName..."
    & scp -i $SshKey -o StrictHostKeyChecking=no -o BatchMode=yes $localFile "${Server}:${remoteTmp}"
    if ($LASTEXITCODE -ne 0) { Die "Upload failed" }
    Ok "Upload complete"

    Step 2 3 "Atomically replacing APK and setting permissions..."
    $replaceCmd = "mv $remoteTmp $remoteDst && chmod 644 $remoteDst"
    & ssh -i $SshKey -o StrictHostKeyChecking=no -o BatchMode=yes $Server $replaceCmd
    if ($LASTEXITCODE -ne 0) { Die "Replace failed" }
    Ok "Replaced: $remoteDst"

    Step 3 3 "Verifying download URL..."
    try {
        $resp = Invoke-WebRequest -Uri $accessUrl -UseBasicParsing -Method Head -TimeoutSec 15
        Ok "HTTP $($resp.StatusCode)  ($($resp.Headers['Content-Length']) bytes)"
    } catch {
        Warn "URL check: $($_.Exception.Message)"
    }

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  $envName DEPLOY SUCCESS" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  APK : $localFile"
    Write-Host "  URL : $accessUrl"
    Write-Host "============================================================" -ForegroundColor Green
}

# ---- Banner ----
Clear-Host
Write-Host ""
Write-Host "============================================================" -ForegroundColor DarkCyan
Write-Host "         App APK 部署工具 (Windows)" -ForegroundColor DarkCyan
Write-Host "============================================================" -ForegroundColor DarkCyan

# ---- Pre-checks ----
if (-not (Test-Path $SshKey)) { Die "SSH key not found: $SshKey" }
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) { Die "ssh not found. Install OpenSSH client." }
if (-not (Get-Command scp -ErrorAction SilentlyContinue)) { Die "scp not found. Install OpenSSH client." }

Fix-SshKeyPermission $SshKey

# Find local APK
$localApk = Find-LocalApk
if (-not $localApk) {
    Write-Host ""
    Warn "未自动找到 APK 文件。请输入本地 APK 路径："
    $inputPath = Read-Host "APK path"
    if ([string]::IsNullOrWhiteSpace($inputPath)) { Die "未提供 APK 路径" }
    if (-not (Test-Path $inputPath)) { Die "文件不存在: $inputPath" }
    $localApk = $inputPath
}

$apkSize = [math]::Round((Get-Item $localApk).Length / 1MB, 2)
Write-Host ""
Write-Host "  Local APK: $localApk"
Write-Host "  Size     : $apkSize MB"
Write-Host "  Server   : $Server"
Write-Host ""

# ---- Menu ----
Write-Host "============================================================"
Write-Host "  1. 发布到【测试环境】"
Write-Host "  2. 发布到【生产环境】"
Write-Host "  Q. 退出"
Write-Host "============================================================"
Write-Host ""

$choice = Read-Host "请选择操作 [1/2/Q]"

switch -Wildcard ($choice) {
    "1" {
        Deploy-Apk -localFile $localApk -remoteDir $TestRemoteDir -accessUrl $TestAccessUrl -envName "TEST"
    }
    "2" {
        Write-Host ""
        Write-Host "  *** 警告：即将发布到生产环境 ***" -ForegroundColor Yellow
        $confirm = Read-Host "  输入 YES 确认发布到生产环境"
        if ($confirm -ne "YES") {
            Write-Host ""
            Write-Host "Cancelled." -ForegroundColor Yellow
            break
        }
        Deploy-Apk -localFile $localApk -remoteDir $ProdRemoteDir -accessUrl $ProdAccessUrl -envName "PRODUCTION"
    }
    "Q" { Write-Host "已取消操作。" }
    "q" { Write-Host "已取消操作。" }
    Default { Write-Host "无效的选择！" -ForegroundColor Red }
}

Write-Host ""
Write-Host "Press Enter to close..."
Read-Host