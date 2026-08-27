# ============================================================
#  H5 Deploy Script - Production (PowerShell)
#  Usage: right-click -> Run with PowerShell
#      or: powershell -File .\scripts\deploy-h5-prod.ps1
#  Require: OpenSSH + tar (Windows 10 1803+ / Windows 11)
# ============================================================

$ErrorActionPreference = "Stop"

# ---- Config ----
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$H5BuildDir  = Join-Path $ProjectRoot "unpackage\dist\build\web"
$ReleaseTag  = "h5-user-" + (Get-Date -Format "yyyyMMddHHmmss")
$SshKey      = Join-Path $ProjectRoot "ubutun-prod(1).pem"
$Server      = "root@114.67.69.228"
$ReleaseBase = "/opt/app/frontend/releases"
$LinkPath    = "/opt/app/frontend/h5"
$AccessUrl   = "https://www.qiulem.com/h5/"

# ---- Helpers ----
function Step($num, $msg) { Write-Host ""; Write-Host "[$num/5] $msg" -ForegroundColor Cyan }
function Ok($msg)         { Write-Host "       OK  - $msg" -ForegroundColor Green }
function Warn($msg)       { Write-Host "       WARN - $msg" -ForegroundColor Yellow }
function Die($msg)        { Write-Host ""; Write-Host "FAIL: $msg" -ForegroundColor Red; Write-Host ""; Read-Host "Press Enter to exit"; exit 1 }

# ---- Banner ----
Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  H5 PRODUCTION Deploy" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  Release : $ReleaseTag"
Write-Host "  Build   : $H5BuildDir"
Write-Host "  URL     : $AccessUrl"
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "  *** WARNING: This will deploy to PRODUCTION ***" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "  Type YES to confirm production deploy"
if ($confirm -ne "YES") {
    Write-Host ""
    Write-Host "Cancelled." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 0
}

# ---- Pre-checks ----
if (-not (Test-Path (Join-Path $H5BuildDir "index.html"))) { Die "index.html not found. Build H5 first." }
if (-not (Test-Path (Join-Path $H5BuildDir "assets")))     { Die "assets/ dir not found." }
if (-not (Test-Path $SshKey))  { Die "SSH key not found: $SshKey" }
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) { Die "ssh not found. Install OpenSSH client." }
if (-not (Get-Command tar -ErrorAction SilentlyContinue)) { Die "tar not found. Requires Windows 10 1803+." }

# Fix SSH key permissions on Windows (required by OpenSSH)
icacls $SshKey /inheritance:r /grant "$($env:USERNAME):F" | Out-Null
icacls $SshKey /remove:g "Authenticated Users", "Users", "Everyone" 2>$null | Out-Null

# ---- Step 1: Check current release ----
Step 1 "Checking current production release..."
$prevCmd = "readlink -f $LinkPath 2>/dev/null || echo '(none)'"
$CurrentRelease = & ssh -i $SshKey -o StrictHostKeyChecking=no -o BatchMode=yes $Server $prevCmd
if ($LASTEXITCODE -ne 0) { Die "Failed to connect to server or check current release" }
$CurrentRelease = $CurrentRelease.Trim()
Ok "Current: $CurrentRelease"

# ---- Step 2: Create release dir ----
Step 2 "Creating release dir on server..."
& ssh -i $SshKey -o StrictHostKeyChecking=no -o BatchMode=yes $Server "mkdir -p ${ReleaseBase}/${ReleaseTag}"
if ($LASTEXITCODE -ne 0) { Die "Failed to create release dir" }
Ok "Created: ${ReleaseBase}/${ReleaseTag}"

# ---- Step 3: Upload via tar+ssh pipe ----
# Use cmd /c to run the pipe -- PowerShell's pipe corrupts binary data
Step 3 "Uploading build artifacts (this may take a while)..."
$keyQuoted = "`"$SshKey`""
$dirQuoted = "`"$H5BuildDir`""
$cmdText = "tar cf - -C $dirQuoted . | ssh -i $keyQuoted -o StrictHostKeyChecking=no -o BatchMode=yes $Server `"tar xf - -C ${ReleaseBase}/${ReleaseTag}/`""
& cmd /c $cmdText
if ($LASTEXITCODE -ne 0) { Die "Upload failed" }
Ok "Upload complete"

# ---- Step 4: Verify & switch symlink ----
Step 4 "Verifying artifacts and switching symlink..."
$verifyCmd = "set -e; test -f ${ReleaseBase}/${ReleaseTag}/index.html; test -d ${ReleaseBase}/${ReleaseTag}/assets; ln -sfn ${ReleaseBase}/${ReleaseTag} $LinkPath; readlink -f $LinkPath"
$result = & ssh -i $SshKey -o StrictHostKeyChecking=no -o BatchMode=yes $Server $verifyCmd
if ($LASTEXITCODE -ne 0) { Die "Failed to verify or switch symlink" }
$lines = $result.Trim() -split "`n"
$newTarget = $lines[$lines.Length - 1].Trim()
Ok "Symlink now -> $newTarget"

# ---- Step 5: Online verification ----
Step 5 "Verifying production homepage..."
try {
    $resp = Invoke-WebRequest -Uri $AccessUrl -UseBasicParsing -Method Head -TimeoutSec 15
    Ok "Homepage HTTP $($resp.StatusCode)"
} catch {
    Warn "Homepage check: $($_.Exception.Message)"
}

# ---- Done ----
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  PRODUCTION DEPLOY SUCCESS" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Release : $ReleaseTag"
Write-Host "  URL     : $AccessUrl"
Write-Host "  Previous: $CurrentRelease"
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Please run smoke tests on production ASAP."
Write-Host ""
Write-Host "Press Enter to close..."
Read-Host
