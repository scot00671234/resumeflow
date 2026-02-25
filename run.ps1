# Start backend + frontend (run from project root or any folder)
Set-Location $PSScriptRoot
Write-Host "Starting API (4000) + Web (5173)..." -ForegroundColor Cyan
Write-Host "Open http://localhost:5173 when ready. Ctrl+C to stop." -ForegroundColor Gray
npm run dev
