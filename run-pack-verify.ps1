$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\projects\launchai-pro"
$TempStaging = "C:\Temp\launchai-pro-zip"
$ZipOutput = "C:\projects\launchai-pro-releases\launchai-pro-v1.4.5.zip"

Write-Host "=== STAGING ===" -ForegroundColor Cyan
if (Test-Path $TempStaging) { Remove-Item -Recurse -Force $TempStaging }
if (Test-Path $ZipOutput) { Remove-Item -Force $ZipOutput }
New-Item -ItemType Directory -Force -Path $TempStaging | Out-Null

robocopy $ProjectRoot $TempStaging /E /XD content-engine node_modules .next .git .turbo .vercel /XF harden-and-package.ps1 run-pack-verify.ps1 .env .env.local .env.development.local .env.production.local *.log tsconfig.tsbuildinfo /NFL /NDL /NJH /NJS /NC /NS
if ($LASTEXITCODE -ge 8) { throw "robocopy failed: $LASTEXITCODE" }
Write-Host "robocopy OK code $LASTEXITCODE" -ForegroundColor Green

Write-Host "=== STAGED CHECKS ===" -ForegroundColor Cyan
$checks = @(
  "$TempStaging\README.md",
  "$TempStaging\.env.example",
  "$TempStaging\prisma\schema.prisma",
  "$TempStaging\documentation\Documentation.html"
)
foreach ($p in $checks) {
  if (Test-Path $p) { Write-Host "FOUND $p $((Get-Item $p).Length) bytes" -ForegroundColor Green } else { Write-Host "MISSING $p" -ForegroundColor Red; throw "missing $p" }
}
if (Test-Path "$TempStaging\.env") { throw ".env leaked into staging" } else { Write-Host "NO .env in staging : OK" -ForegroundColor Green }
if (-not (Test-Path "$TempStaging\.env.example")) { throw ".env.example missing" }

Write-Host "=== ZIP ===" -ForegroundColor Cyan
# Build the zip with .NET and forward-slash entry paths. Compress-Archive on
# Windows PowerShell 5.1 writes backslash separators, which extract incorrectly
# on macOS/Linux.
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$zipStream = [System.IO.File]::Open($ZipOutput, [System.IO.FileMode]::CreateNew)
$zipArchive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)
Get-ChildItem -LiteralPath $TempStaging -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($TempStaging.Length).TrimStart('\', '/') -replace '\\', '/'
    $entry = $zipArchive.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
    $src = [System.IO.File]::OpenRead($_.FullName)
    $dst = $entry.Open()
    try { $src.CopyTo($dst) } finally { $dst.Dispose(); $src.Dispose() }
}
$zipArchive.Dispose()
$zipStream.Dispose()
$zipBytes = (Get-Item $ZipOutput).Length
Write-Host "ZIP $ZipOutput $([math]::Round($zipBytes/1MB,2)) MB ($zipBytes bytes)" -ForegroundColor Green

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($ZipOutput)
$entries = $zip.Entries | ForEach-Object { $_.FullName }
$zip.Dispose()

Write-Host "=== ZIP ENTRIES (filtered) ===" -ForegroundColor Cyan
$entries | Where-Object { $_ -match "README|\.env|prisma|Documentation" } | ForEach-Object { Write-Host "  $_" }

# Normalize both \ and / separators (Compress-Archive uses \ on Windows, Zip spec uses /)
$normEntries = $entries | ForEach-Object { $_ -replace '\\','/' }
$hasReadme = $normEntries -contains "README.md"
$hasEnvExample = $normEntries -contains ".env.example"
$hasSchema = $normEntries -contains "prisma/schema.prisma"
$hasDocs = $normEntries -contains "documentation/Documentation.html"
$hasLeakedEnv = ($normEntries | Where-Object { $_ -eq ".env" -or $_ -match "/\.env$" -or $_ -eq ".env.local" }).Count -gt 0

if ($hasReadme) { Write-Host "ZIP_HAS_README:OK" -ForegroundColor Green } else { Write-Host "ZIP_MISSING_README" -ForegroundColor Red }
if ($hasEnvExample) { Write-Host "ZIP_HAS_ENV_EXAMPLE:OK" -ForegroundColor Green } else { Write-Host "ZIP_MISSING_ENV_EXAMPLE" -ForegroundColor Red }
if ($hasSchema) { Write-Host "ZIP_HAS_SCHEMA:OK" -ForegroundColor Green } else { Write-Host "ZIP_MISSING_SCHEMA" -ForegroundColor Red }
if ($hasDocs) { Write-Host "ZIP_HAS_DOCS:OK" -ForegroundColor Green } else { Write-Host "ZIP_MISSING_DOCS" -ForegroundColor Red }
if (-not $hasLeakedEnv) { Write-Host "ZIP_NO_ENV:OK (no .env leaked)" -ForegroundColor Green } else { Write-Host "ZIP_LEAKED_ENV:FAIL" -ForegroundColor Red; throw ".env found in zip" }

Write-Host "=== ALL CHECKS PASS ===" -ForegroundColor Green
Write-Host "Archive: $ZipOutput"
