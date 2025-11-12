# Smart Waste Management System - Stop All Services
# Run this script to stop Backend, Frontend, and ML Module

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Stopping All Services..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop Backend (Java processes)
Write-Host "Stopping Backend..." -ForegroundColor Yellow
$javaProcesses = Get-Process java -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*SmartWasteManagement*" -or 
    $_.CommandLine -like "*backend*" -or
    $_.MainWindowTitle -like "*BackendApplication*"
}
if ($javaProcesses) {
    $javaProcesses | Stop-Process -Force
    Write-Host "  Backend stopped" -ForegroundColor Green
} else {
    Write-Host "  No backend process found" -ForegroundColor Gray
}

# Stop Frontend (Node processes)
Write-Host "Stopping Frontend..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    # Be careful - this stops ALL node processes
    Write-Host "  WARNING: This will stop ALL Node.js processes" -ForegroundColor Red
    $confirm = Read-Host "  Continue? (y/n)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        $nodeProcesses | Stop-Process -Force
        Write-Host "  Frontend stopped" -ForegroundColor Green
    } else {
        Write-Host "  Skipped" -ForegroundColor Gray
    }
} else {
    Write-Host "  No frontend process found" -ForegroundColor Gray
}

# Stop ML Module (Python processes)
Write-Host "Stopping ML Module..." -ForegroundColor Yellow
$pythonProcesses = Get-Process python -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*SmartWasteManagement*" -or
    $_.CommandLine -like "*ml-module*" -or
    $_.CommandLine -like "*app.py*"
}
if ($pythonProcesses) {
    $pythonProcesses | Stop-Process -Force
    Write-Host "  ML Module stopped" -ForegroundColor Green
} else {
    Write-Host "  No ML module process found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "All services stopped!" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2





