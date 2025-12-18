# Smart Waste Management System - Start All Services
# Run this script to start Backend, Frontend, and ML Module

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Smart Waste Management System" -ForegroundColor Green
Write-Host "Starting All Services..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir "backend"
$frontendDir = Join-Path $scriptDir "frontend"
$mlServiceDir = Join-Path $scriptDir "ml-service"

# Check if directories exist
if (-not (Test-Path $backendDir)) {
    Write-Host "ERROR: Backend directory not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendDir)) {
    Write-Host "ERROR: Frontend directory not found!" -ForegroundColor Red
    exit 1
}

# Start Backend
Write-Host "[1/3] Starting Backend (Spring Boot)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; Write-Host 'Backend Starting...' -ForegroundColor Green; mvn spring-boot:run" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[2/3] Starting Frontend (React + Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; Write-Host 'Frontend Starting...' -ForegroundColor Green; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start ML Service (Auto-setup venv and dependencies if needed)
if (Test-Path $mlServiceDir) {
    Write-Host "[3/3] Starting ML Service (Flask)..." -ForegroundColor Yellow
    $venvPath = Join-Path $mlServiceDir "venv\Scripts\python.exe"
    $requirementsPath = Join-Path $mlServiceDir "requirements.txt"
    
    # Auto-setup venv if it doesn't exist
    if (-not (Test-Path $venvPath)) {
        Write-Host "  ML Service venv not found. Creating virtual environment..." -ForegroundColor Yellow
        try {
            Push-Location $mlServiceDir
            python -m venv venv
            Write-Host "  Virtual environment created successfully." -ForegroundColor Green
            Pop-Location
        } catch {
            Write-Host "  ERROR: Failed to create venv. Please install Python or check PATH." -ForegroundColor Red
            Write-Host "  Skipping ML Service startup." -ForegroundColor Yellow
            Pop-Location
        }
    }
    
    # Auto-install dependencies if venv exists
    if (Test-Path $venvPath) {
        Write-Host "  Checking ML Service dependencies..." -ForegroundColor Yellow
        try {
            # Check if Flask is installed by trying to import it
            $flaskCheck = & $venvPath -c "import flask; print('ok')" 2>&1
            if ($LASTEXITCODE -ne 0 -or ($flaskCheck -match "ModuleNotFoundError|ImportError")) {
                Write-Host "  Installing ML Service dependencies..." -ForegroundColor Yellow
                & $venvPath -m pip install --upgrade pip --quiet 2>&1 | Out-Null
                & $venvPath -m pip install -r $requirementsPath 2>&1 | Out-Null
                Write-Host "  Dependencies installed successfully." -ForegroundColor Green
            } else {
                Write-Host "  Dependencies already installed." -ForegroundColor Green
            }
        } catch {
            Write-Host "  WARNING: Failed to check/install dependencies. ML Service may not work correctly." -ForegroundColor Yellow
        }
        
        # Start ML service using python.exe directly to avoid PowerShell execution policy issues
        Write-Host "  Starting ML Service on port 5005..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$mlServiceDir'; `$env:VIRTUAL_ENV='$mlServiceDir\venv'; `$env:PATH='$mlServiceDir\venv\Scripts;' + `$env:PATH; Write-Host 'ML Service Starting...' -ForegroundColor Green; & '$venvPath' app.py" -WindowStyle Normal
    }
} else {
    Write-Host "[3/3] ML Service directory not found. Skipping..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All Services Starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:   http://localhost:8080" -ForegroundColor White
Write-Host "  API Health: http://localhost:8080/api/health" -ForegroundColor White
Write-Host "  ML Service:  http://localhost:5005" -ForegroundColor White
Write-Host ""
Write-Host "Note: Services are starting in separate windows." -ForegroundColor Yellow
Write-Host "Close those windows to stop the services." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this window (services will keep running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
