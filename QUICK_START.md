# ⚡ Quick Start Guide

## 🚀 Fastest Way to Start Everything

### Option 1: Use the Script (Easiest)
```powershell
# In project root directory
.\start-all.ps1
```

This opens 3 separate windows:
- Backend (Spring Boot)
- Frontend (React)
- ML Module (Flask)

### Option 2: Manual Start (3 Terminal Windows)

#### Terminal 1 - Backend
```bash
cd backend
mvn spring-boot:run
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

#### Terminal 3 - ML Module (Optional)
```bash
cd ml-module
.\venv\Scripts\activate
python app.py
```

---

## ✅ Verify Everything is Running

| Service | URL | What to See |
|--------|-----|-------------|
| **Frontend** | http://localhost:5173 | React app loads |
| **Backend** | http://localhost:8080/api/health | `{"status":"ok"}` |
| **ML Module** | http://localhost:5000/ping | `{"message":"pong"}` |

---

## 🧪 Quick Test

### 1. Register a User
```powershell
$body = @{
    name = "John Doe"
    email = "john@example.com"
    passwordHash = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/auth/register -ContentType 'application/json' -Body $body
```

### 2. Login
```powershell
$body = @{
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/auth/login -ContentType 'application/json' -Body $body
$token = $response.token
```

### 3. Get Profile (Protected)
```powershell
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Method Get -Uri http://localhost:8080/api/users/me -Headers $headers
```

---

## 🛑 Stop Everything

### Option 1: Use the Script
```powershell
.\stop-all.ps1
```

### Option 2: Manual Stop
- Press `Ctrl + C` in each terminal window
- Or close the terminal windows

---

## 📋 Prerequisites Checklist

Before starting, make sure:
- [ ] MySQL is running (`net start MySQL80`)
- [ ] Java 20 installed (`java -version`)
- [ ] Node.js installed (`node -v`)
- [ ] Maven installed (`mvn -v`)
- [ ] Python 3.x installed (`python --version`)

---

## 🔧 Common Issues

**Port already in use?**
```powershell
# Find what's using the port
netstat -ano | findstr :8080
netstat -ano | findstr :5173

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

**Backend won't start?**
- Check MySQL is running
- Check `application.properties` has correct database credentials
- Try: `mvn clean install` then `mvn spring-boot:run`

**Frontend won't start?**
- Run: `cd frontend && npm install`
- Then: `npm run dev`

---

## 📖 Full Documentation

For detailed instructions, see: **`HOW_TO_RUN.md`**

