# Start IZ Academy — Docker + Backend + Frontend
# Run this from the project root: .\start.ps1

Write-Host "Starting IZ Academy..." -ForegroundColor Cyan

# 1. Kill existing instances
Write-Host "Killing existing instances on ports 5000 and 5173..." -ForegroundColor Yellow
npx kill-port 5000 2>$null
npx kill-port 5173 2>$null
Start-Sleep -Seconds 1

# 2. Start Docker services (PostgreSQL + Redis)
Write-Host "Starting Docker services (PostgreSQL + Redis)..." -ForegroundColor Yellow
docker-compose up -d
Start-Sleep -Seconds 3

# 3. Start backend in a new PowerShell window
$backendDir = "$PSScriptRoot\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'BACKEND' -ForegroundColor Green; Set-Location '$backendDir'; npx ts-node src/server.ts"

# 4. Start frontend in a new PowerShell window
$frontendDir = "$PSScriptRoot\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'FRONTEND' -ForegroundColor Blue; Set-Location '$frontendDir'; npx vite"

Write-Host ""
Write-Host "  Backend  -> http://localhost:5000" -ForegroundColor Green
Write-Host "  Frontend -> http://localhost:5173" -ForegroundColor Blue
Write-Host ""
Write-Host "Deux fenetres sont ouvertes. Garde-les ouvertes !" -ForegroundColor Yellow
