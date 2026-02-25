# Resume Builder - Setup and run (PowerShell)
# Run from project root: .\setup-and-run.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "`n=== 1. Env ===" -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example"
} else {
    Write-Host ".env exists"
}

Write-Host "`n=== 2. Install dependencies ===" -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n=== 3. Build shared package ===" -ForegroundColor Cyan
npm run build -w packages/shared
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n=== 4. PostgreSQL (Docker) ===" -ForegroundColor Cyan
docker info 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker is not running. Start Docker Desktop, then run this script again." -ForegroundColor Yellow
    Write-Host "Or set DATABASE_URL in .env to a cloud Postgres (e.g. Neon.tech free tier)." -ForegroundColor Yellow
    $cont = Read-Host "Continue without DB? (y/n)"
    if ($cont -ne "y") { exit 1 }
} else {
    docker compose up -d 2>$null
    if ($LASTEXITCODE -ne 0) {
      Write-Host "Tip: Start Docker Desktop, then run this script again." -ForegroundColor Yellow
    }
    Write-Host "Waiting 5s for Postgres..."
    Start-Sleep -Seconds 5
}

Write-Host "`n=== 5. Database migration ===" -ForegroundColor Cyan
npm run db:migrate --workspace=apps/api
if ($LASTEXITCODE -ne 0) {
    Write-Host "Migration failed. Is Postgres running? (docker compose up -d)" -ForegroundColor Yellow
    $cont = Read-Host "Continue and start app anyway? (y/n)"
    if ($cont -ne "y") { exit 1 }
}

Write-Host "`n=== 6. Start API + Web ===" -ForegroundColor Cyan
Write-Host "API: http://localhost:4000  |  Web: http://localhost:5173" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop.`n" -ForegroundColor Gray
npm run dev
