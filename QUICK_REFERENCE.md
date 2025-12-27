# Smart Waste Management System - Quick Reference Guide

## System Overview

**Three-Tier Architecture**: React Frontend → Spring Boot Backend → MySQL Database  
**Additional Service**: Flask ML Service (Port 5005) - Optional/Advisory

---

## User Roles & Capabilities

### 👤 USER
- ✅ Register/Login
- ✅ Create waste pickup requests
- ✅ View request history and status
- ✅ Earn reward points automatically (on collection)
- ✅ View point balance and transaction history
- ✅ Redeem points for rewards
- ❌ Cannot assign collectors
- ❌ Cannot modify request status

### 🚛 COLLECTOR
- ✅ Register/Login (with COLLECTOR role)
- ✅ View **only** assigned requests
- ✅ Update request status (PENDING → IN_PROGRESS → COLLECTED/REJECTED)
- ✅ Upload proof photos
- ✅ View pickup location on map
- ❌ Cannot self-assign requests
- ❌ Cannot see unassigned requests
- ❌ Cannot access admin functions

### 👨‍💼 ADMIN
- ✅ Login (pre-created account, no registration)
- ✅ View all users, collectors, and requests
- ✅ **Manually assign** collectors to requests
- ✅ View analytics and reports
- ✅ Fulfill redemption requests
- ✅ View ML predictions (advisory)
- ❌ Cannot create admin accounts via UI
- ❌ Cannot directly mark requests as collected

---

## Request Lifecycle

```
CREATED (Unassigned)
    ↓ [Admin assigns collector]
ASSIGNED
    ↓ [Collector starts pickup]
IN_PROGRESS
    ↓ [Collector marks collected]
COLLECTED → 🎁 Reward Points Awarded
```

**Status Transitions**:
- **USER**: Creates request → Status: CREATED
- **ADMIN**: Assigns collector → Status: ASSIGNED
- **COLLECTOR**: Starts pickup → Status: IN_PROGRESS
- **COLLECTOR**: Marks collected → Status: COLLECTED → **Rewards Triggered**

---

## Reward Points System

### Earning Points
- **Trigger**: Only when collector marks request as `COLLECTED`
- **Base Points**: 10
- **Multipliers**:
  - DRY (PLASTIC, METAL, PAPER): ×1.0 = **10 points**
  - WET (ORGANIC): ×1.2 = **12 points**
  - E_WASTE: ×2.0 = **20 points**
  - HAZARDOUS: ×3.0 = **30 points**

### Redeeming Points
- User selects reward from catalog
- System validates sufficient points
- Points deducted immediately
- Redemption request created (status: REQUESTED)
- Admin fulfills redemption (status: FULFILLED)

---

## Tech Stack Summary

### Frontend
- React 19.2.0 + Vite 7.2.2
- Tailwind CSS 4.1.17
- React Router 7.10.1
- Axios 1.13.2
- Google Maps API (visualization)

### Backend
- Java 17 + Spring Boot 3.3.5
- Spring Security + JWT
- MySQL + JPA/Hibernate
- BCrypt password hashing

### ML Service
- Python 3.12 + Flask 3.1.2
- Scikit-learn 1.7.2
- Models: Quantity prediction, Classification, Eco score

---

## Key API Endpoints

### Authentication
- `POST /api/auth/register` - Register (USER/COLLECTOR only)
- `POST /api/auth/login` - Login (all roles)

### Requests
- `POST /api/requests/create` - Create request (USER)
- `GET /api/requests/me` - My requests (USER)
- `GET /api/requests/collector/me` - Assigned requests (COLLECTOR)
- `PUT /api/requests/updateStatus/{id}` - Update status (COLLECTOR)

### Admin
- `GET /api/admin/requests` - All requests (ADMIN)
- `PUT /api/admin/requests/{id}/assign` - Assign collector (ADMIN)
- `GET /api/admin/users` - All users (ADMIN)
- `GET /api/admin/collectors` - All collectors (ADMIN)

### Rewards
- `GET /api/rewards/catalog` - View rewards (all)
- `POST /api/rewards/redeem/{rewardId}` - Redeem (USER)
- `GET /api/rewards/my-transactions` - Transaction history (USER)

---

## Database Tables

1. **users** - All system users (USER, COLLECTOR, ADMIN)
2. **zones** - Geographic zones
3. **collectors** - Collector profiles
4. **waste_requests** - Pickup requests
5. **reward_transactions** - Point transactions log
6. **reward_catalog** - Available rewards
7. **redemption_requests** - Redemption requests
8. **waste_logs** - Historical data

---

## Security Features

- ✅ JWT token authentication (24-hour expiration)
- ✅ BCrypt password hashing (12 rounds)
- ✅ Role-based access control (RBAC)
- ✅ Method-level security (`@PreAuthorize`)
- ✅ Input validation
- ✅ SQL injection prevention (JPA)
- ✅ CORS configuration

---

## Important Notes

### Admin Accounts
- ❌ **Cannot** be created via registration endpoint
- ✅ Must be created directly in database
- ✅ Registration endpoint blocks ADMIN role

### Request Assignment
- ✅ **Only ADMIN** can assign collectors
- ❌ Collectors **cannot** self-assign
- ✅ Admin assigns via dropdown in dashboard

### Reward Points
- ✅ **Only** awarded when status changes to `COLLECTED`
- ❌ **Not** awarded on request creation
- ✅ Duplicate prevention (one reward per request)

### ML Service
- ✅ **Optional/Advisory** only
- ✅ Non-blocking (system works without it)
- ✅ Used for analytics and predictions
- ❌ Does not control business logic

### Google Maps
- ✅ **Visualization only**
- ✅ Shows pickup locations
- ❌ No routing or navigation
- ❌ Does not affect business logic

---

## Default Ports

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8080
- **ML Service**: http://localhost:5005
- **MySQL**: localhost:3306

---

## Quick Start Commands

```bash
# Backend
cd backend
mvn spring-boot:run

# Frontend
cd frontend
npm install
npm run dev

# ML Service
cd ml-service
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py
```

---

**For detailed documentation, see `SYSTEM_DOCUMENTATION.md`**

