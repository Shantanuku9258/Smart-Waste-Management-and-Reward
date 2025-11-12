# Free Port Utility Script
# Usage: .\free-port.ps1 8080

param(
    [Parameter(Mandatory=$true)]
    [int]$Port
)

Write-Host "Checking port $Port..." -ForegroundColor Yellow

# Find process using the port
$connections = netstat -ano | findstr ":$Port"
if (-not $connections) {
    Write-Host "Port $Port is already free!" -ForegroundColor Green
    exit 0
}

# Extract PID
$pidLine = $connections | Select-Object -First 1
$pid = ($pidLine -split '\s+')[-1]

if ($pid) {
    Write-Host "Found process using port $Port (PID: $pid)" -ForegroundColor Yellow
    
    # Get process name
    try {
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Process: $($process.ProcessName) ($($process.Id))" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "Could not get process details" -ForegroundColor Gray
    }
    
    # Ask for confirmation
    $confirm = Read-Host "Kill this process? (y/n)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        try {
            Stop-Process -Id $pid -Force
            Write-Host "✅ Process killed! Port $Port is now free." -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to kill process: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "Cancelled." -ForegroundColor Yellow
    }
} else {
    Write-Host "Could not determine PID from port $Port" -ForegroundColor Red
}




