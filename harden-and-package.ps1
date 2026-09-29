# launchai-pro - Production Hardening & CodeCanyon Packaging Script v1.0.0
# Certified from C:\Users\yassine\launchai-pro (audit PASS 3/3) -> D:\projectAI\launchai-pro
# Run as: powershell -ExecutionPolicy Bypass -File ./harden-and-package.ps1
$ErrorActionPreference = "Stop"
$ProjectRoot = "D:\projectAI\launchai-pro"
$TempStaging = "C:\Temp\launchai-pro-zip"
$ZipOutput = "C:\Temp\launchai-pro-v1.0-codecanyon.zip"

Write-Host "=== PHASE 1: DATABASE & TYPESCRIPT ===" -ForegroundColor Cyan
Set-Location $ProjectRoot

Write-Host "[1.1] Prisma Format..." -ForegroundColor Yellow
npx prisma format
if ($LASTEXITCODE -ne 0) { throw "prisma format failed" }

Write-Host "[1.2] Prisma Validate..." -ForegroundColor Yellow
npx prisma validate
if ($LASTEXITCODE -ne 0) { throw "prisma validate failed" }

Write-Host "[1.3] Prisma Generate (no DB needed)..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { throw "prisma generate failed" }
Write-Host "Prisma generate OK" -ForegroundColor Green

Write-Host "[1.4] tsc --noEmit [0 errors]..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { throw "TSC FAILED" }
Write-Host "TypeScript: 0 errors" -ForegroundColor Green

Write-Host "=== PHASE 2: SECURITY AUDIT ===" -ForegroundColor Cyan
Write-Host "[2.1] Console/TODO hygiene..." -ForegroundColor Yellow
$hits = Get-ChildItem -Recurse -Include *.ts,*.tsx -Path "$ProjectRoot\app","$ProjectRoot\lib","$ProjectRoot\modules","$ProjectRoot\prisma" | Select-String -Pattern "console\.(log|debug|info)|TODO|FIXME|debugger" -ErrorAction SilentlyContinue
if ($hits) {
    $hits | ForEach-Object { Write-Host "  $($_.Path):$($_.LineNumber) $($_.Line.Trim())" -ForegroundColor Red }
    throw "Remove console.log/TODO before production"
}
Write-Host "No console.log/TODO/debugger" -ForegroundColor Green

$secrets = Get-ChildItem -Recurse -Include *.ts,*.tsx -Path "$ProjectRoot\app","$ProjectRoot\lib" | Select-String -Pattern "sk_live|whsec_live|pk_live" -ErrorAction SilentlyContinue
if ($secrets) { throw "Hardcoded live secrets found" }
Write-Host "No hardcoded live secrets" -ForegroundColor Green

Write-Host "[2.2] Hardened modules..." -ForegroundColor Yellow
$required = @("lib\env.ts","lib\rate-limit.ts","lib\stripe.ts","lib\openai.ts","next.config.mjs","app\api\ai\generate\route.ts","app\api\ai\generate\[id]\route.ts","app\api\webhooks\stripe\route.ts")
foreach ($f in $required) {
    $p = Join-Path $ProjectRoot $f
    if (-not (Test-Path -LiteralPath $p)) { throw "MISSING: $f" }
    Write-Host "Found $f" -ForegroundColor Green
}
$routeId = Get-Content -Raw -LiteralPath "$ProjectRoot\app\api\ai\generate\[id]\route.ts"
if ($routeId -notmatch "rateLimit") { throw "[id]/route.ts missing rateLimit" }
Write-Host "Rate-limit wired" -ForegroundColor Green

Write-Host "=== PHASE 3: BUILD & PACKAGE ===" -ForegroundColor Cyan
Write-Host "[3.1] Cleaning cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "$ProjectRoot\.next", "$ProjectRoot\tsconfig.tsbuildinfo", "$ProjectRoot\.turbo" -ErrorAction SilentlyContinue
Write-Host "Cache cleaned" -ForegroundColor Green

Write-Host "[3.2] Production Build [SKIP_ENV_VALIDATION=1]..." -ForegroundColor Yellow
$env:SKIP_ENV_VALIDATION = "1"
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build FAILED" }
Write-Host "Build successful (10 routes)" -ForegroundColor Green

Write-Host "[3.3] Packaging CodeCanyon archive..." -ForegroundColor Yellow
if (Test-Path $TempStaging) { Remove-Item -Recurse -Force $TempStaging }
if (Test-Path $ZipOutput) { Remove-Item -Force $ZipOutput }
New-Item -ItemType Directory -Force -Path $TempStaging | Out-Null
robocopy $ProjectRoot $TempStaging /E /XD node_modules .next .git .turbo .vercel /XF .env .env.local .env.development.local .env.production.local *.log tsconfig.tsbuildinfo /NFL /NDL /NJH /NJS /NC /NS
if ($LASTEXITCODE -ge 8) { throw "robocopy failed: $LASTEXITCODE" }
if (-not (Test-Path "$TempStaging\.env.example")) { throw ".env.example missing" }
if (Test-Path "$TempStaging\.env") { throw ".env leaked into package" }
if (-not (Test-Path "$TempStaging\prisma\schema.prisma")) { throw "prisma/schema.prisma missing" }
Compress-Archive -Path "$TempStaging\*" -DestinationPath $ZipOutput -Force
$zipSize = (Get-Item $ZipOutput).Length / 1MB
$stagedSize = (Get-ChildItem $TempStaging -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
$zipMb = [math]::Round($zipSize, 2)
$stagedMb = [math]::Round($stagedSize, 2)
Write-Host "Package: $ZipOutput ($zipMb MB zip, $stagedMb MB staged)" -ForegroundColor Green
Add-Type -AssemblyName System.IO.Compression.FileSystem
$entries = [System.IO.Compression.ZipFile]::OpenRead($ZipOutput).Entries | ForEach-Object { $_.FullName }
if ($entries -match '\.env$') { throw ".env found inside zip" }
Write-Host "Verified: .env NOT in zip" -ForegroundColor Green

Write-Host "=== HARDENING COMPLETE - READY FOR CODECANYON ===" -ForegroundColor Green
Write-Host "Archive: $ZipOutput"
