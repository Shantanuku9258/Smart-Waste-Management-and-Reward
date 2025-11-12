# 🚀 How to Run Smart Waste Management System

Complete guide to start all components of the application.

---

## 📋 Prerequisites Check

Before starting, ensure you have:

- ✅ **Java 20** installed (`java -version`)
- ✅ **Node.js 18+** installed (`node -v`)
- ✅ **MySQL 8.0** running (`mysql --version`)
- ✅ **Python 3.x** installed (`python --version`)
- ✅ **Maven** installed (`mvn -v`)

---

## 🗄️ Step 1: Start MySQL Database

### Option A: Using MySQL Command Line
```bash
# Start MySQL service (Windows)
net start MySQL80

# Or if using MySQL as a service, it should already be running
```

### Option B: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Ensure server is running

### Verify Database Exists
```bash
# Connect to MySQL
mysql -u root -p

# Enter password: 0000

# Check if database exists
SHOW DATABASES;

# If smart_waste doesn't exist, create it:
# (The schema.sql should have already created it, but if not:)
CREATE DATABASE IF NOT EXISTS smart_waste;
USE smart_waste;
SHOW TABLES;  # Should show 7 tables
```

---

## 🔧 Step 2: Start Backend (Spring Boot)

### Open Terminal 1 (Backend)

```bash
# Navigate to backend directory
cd C:\Users\manav\Desktop\SmartWasteManagement\backend

# Option A: Using Maven
mvn spring-boot:run

# Option B: Using JAR file (if already built)
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Verify Backend is Running
- ✅ Look for: `Started BackendApplication in X.XXX seconds`
- ✅ Backend runs on: **http://localhost:8080**
- ✅ Test health endpoint: Open browser → http://localhost:8080/api/health

### Expected Output:
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| ) ) ) )
  '  |____| .__|_| |_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.3.5)

...
Started BackendApplication in 13.XXX seconds
```

---

## 🎨 Step 3: Start Frontend (React + Vite)

### Open Terminal 2 (Frontend)

```bash
# Navigate to frontend directory
cd C:\Users\manav\Desktop\SmartWasteManagement\frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

### Verify Frontend is Running
- ✅ Look for: `Local: http://localhost:5173/`
- ✅ Frontend runs on: **http://localhost:5173**
- ✅ Open browser → http://localhost:5173

### Expected Output:
```
  VITE v7.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🤖 Step 4: Start ML Module (Flask) - Optional

### Open Terminal 3 (ML Module)

```bash
# Navigate to ml-module directory
cd C:\Users\manav\Desktop\SmartWasteManagement\ml-module

# Activate virtual environment
.\venv\Scripts\activate

# Start Flask server
python app.py
```

### Verify ML Module is Running
- ✅ Look for: `Running on http://127.0.0.1:5000`
- ✅ ML Module runs on: **http://localhost:5000**
- ✅ Test ping endpoint: http://localhost:5000/ping

### Expected Output:
```
 * Running on http://127.0.0.1:5000
 * Press CTRL+C to quit
```

---

## 🧪 Step 5: Test the System

### Test 1: Health Check
```bash
# Backend health
curl http://localhost:8080/api/health

# ML Module health
curl http://localhost:5000/ping
```

### Test 2: User Registration
```bash
# Using PowerShell
$body = @{
    name = "Test User"
    email = "test@example.com"
    passwordHash = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/auth/register -ContentType 'application/json' -Body $body
```

### Test 3: User Login
```bash
# Using PowerShell
$body = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/auth/login -ContentType 'application/json' -Body $body
$token = $response.token
Write-Host "Token: $token"
```

### Test 4: Get User Profile (Protected Endpoint)
```bash
# Using PowerShell (with token from Test 3)
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Method Get -Uri http://localhost:8080/api/users/me -Headers $headers
```

---

## 🎯 Quick Start Script (Windows PowerShell)

Create a file `start-all.ps1` in project root:

```powershell
# Start All Services Script
Write-Host "Starting Smart Waste Management System..." -ForegroundColor Green

# Start Backend
Write-Host "Starting Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\manav\Desktop\SmartWasteManagement\backend'; mvn spring-boot:run"

Start-Sleep -Seconds 5

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\manav\Desktop\SmartWasteManagement\frontend'; npm run dev"

Start-Sleep -Seconds 3

# Start ML Module (Optional)
Write-Host "Starting ML Module..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\manav\Desktop\SmartWasteManagement\ml-module'; .\venv\Scripts\activate; python app.py"

Write-Host "All services starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "ML Module: http://localhost:5000" -ForegroundColor Cyan
```

### Run the script:
```powershell
.\start-all.ps1
```

---

## 🛑 How to Stop Services

### Stop Backend
- Press `Ctrl + C` in Terminal 1
- Or close the terminal window

### Stop Frontend
- Press `Ctrl + C` in Terminal 2
- Or close the terminal window

### Stop ML Module
- Press `Ctrl + C` in Terminal 3
- Or close the terminal window

### Stop All at Once (PowerShell)
```powershell
# Stop all Java processes (Backend)
Get-Process java | Where-Object {$_.Path -like "*SmartWasteManagement*"} | Stop-Process -Force

# Stop all Node processes (Frontend)
Get-Process node | Stop-Process -Force

# Stop all Python processes (ML Module)
Get-Process python | Where-Object {$_.Path -like "*SmartWasteManagement*"} | Stop-Process -Force
```

---

## 🔍 Troubleshooting

### Backend Won't Start

**Problem:** Port 8080 already in use
```bash
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Problem:** Database connection error
- Check MySQL is running: `net start MySQL80`
- Verify credentials in `backend/src/main/resources/application.properties`
- Check database exists: `mysql -u root -p` → `SHOW DATABASES;`

**Problem:** Maven build fails
```bash
# Clean and rebuild
cd backend
mvn clean install
mvn spring-boot:run
```

### Frontend Won't Start

**Problem:** Port 5173 already in use
```bash
# Kill Node process
Get-Process node | Stop-Process -Force

# Or use different port
npm run dev -- --port 3000
```

**Problem:** Dependencies not installed
```bash
cd frontend
npm install
npm run dev
```

**Problem:** CORS errors
- Ensure backend is running on port 8080
- Check `axiosInstance.js` has correct base URL
- Verify backend `@CrossOrigin` annotation is present

### ML Module Won't Start

**Problem:** Virtual environment not activated
```bash
cd ml-module
.\venv\Scripts\activate
python app.py
```

**Problem:** Flask not installed
```bash
cd ml-module
.\venv\Scripts\activate
pip install flask
python app.py
```

---

## 📱 Access Points

Once everything is running:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | Main application UI |
| **Backend API** | http://localhost:8080/api | REST API endpoints |
| **Backend Health** | http://localhost:8080/api/health | Health check |
| **ML Module** | http://localhost:5000 | ML predictions (future) |
| **ML Ping** | http://localhost:5000/ping | ML health check |

---

## 🧪 Quick Test Checklist

- [ ] MySQL is running
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:5173
- [ ] Can access http://localhost:8080/api/health
- [ ] Can register a new user
- [ ] Can login and get JWT token
- [ ] Can access protected endpoint with token

---

## 💡 Development Tips

### Hot Reload
- **Frontend:** Automatically reloads on file changes (Vite)
- **Backend:** Restart required for changes (or use Spring DevTools)
- **ML Module:** Restart required for changes

### View Logs
- **Backend:** Check `backend/logs/spring.log`
- **Frontend:** Check browser console (F12)
- **ML Module:** Check terminal output

### Database Management
- Use MySQL Workbench or DBeaver
- Connection: `localhost:3306`, user: `root`, password: `0000`
- Database: `smart_waste`

---

## 🎯 Typical Development Workflow

1. **Start MySQL** (if not running as service)
2. **Start Backend** → Terminal 1
3. **Start Frontend** → Terminal 2
4. **Start ML Module** (optional) → Terminal 3
5. **Open Browser** → http://localhost:5173
6. **Make Changes** → Files auto-reload (frontend)
7. **Test Features** → Use browser or Postman

---

## 📞 Need Help?

If something doesn't work:

1. Check all prerequisites are installed
2. Verify ports are not in use
3. Check log files for errors
4. Ensure database is running and accessible
5. Verify all dependencies are installed (`npm install`, `mvn install`)

---

**Last Updated:** November 2025  
**Status:** Ready to Run ✅





