# Smart Waste Management & Rewards System
## Complete System Documentation

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Complete Workflow](#complete-workflow)
4. [Technology Stack](#technology-stack)
5. [Database Schema](#database-schema)
6. [Security & Access Control](#security--access-control)
7. [Design Principles](#design-principles)
8. [API Endpoints](#api-endpoints)
9. [ML Service Integration](#ml-service-integration)
10. [Google Maps Integration](#google-maps-integration)

---

## Project Overview

The **Smart Waste Management & Rewards System** is a full-stack web application designed to digitize waste pickup requests, improve collection efficiency, and encourage responsible waste disposal through a rewards-based incentive model.

### Key Objectives
- **Digitize Waste Collection**: Replace manual processes with an automated request management system
- **Improve Efficiency**: Enable systematic assignment and tracking of waste pickup requests
- **Incentivize Participation**: Reward users with points for responsible waste disposal
- **Role-Based Management**: Support three distinct user roles with appropriate access controls

### System Roles

1. **USER**: Creates waste pickup requests and earns reward points
2. **COLLECTOR**: Completes assigned pickup requests and updates status
3. **ADMIN**: Manages the system, assigns collectors, and monitors operations

---

## System Architecture

### Layered Architecture

The system follows a **three-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  React.js Frontend (Port 5173)                               │
│  - Role-based UI Components                                  │
│  - Protected Routes                                           │
│  - Google Maps Visualization                                 │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  Spring Boot Backend (Port 8080)                             │
│  - RESTful API Controllers                                   │
│  - Business Logic Services                                   │
│  - JWT Authentication & Authorization                         │
│  - File Upload Handling                                      │
└─────────────────────────────────────────────────────────────┘
                            ↕ JDBC
┌─────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                         │
│  MySQL Database (Port 3306)                                   │
│  - Relational Schema                                          │
│  - JPA/Hibernate ORM                                          │
│  - Transaction Management                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              INDEPENDENT ML MICROSERVICE                        │
│  Flask Service (Port 5005)                                     │
│  - Waste Quantity Prediction                                   │
│  - Waste Type Classification                                   │
│  - User Eco Score Calculation                                  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Request Flow**:
   - Frontend → REST API → Service Layer → Repository → Database
   - Response flows back through the same layers

2. **Authentication Flow**:
   - User credentials → AuthController → JWT Token Generation
   - Token stored in localStorage → Sent with subsequent requests
   - JwtFilter validates token on each protected request

3. **File Upload Flow**:
   - Multipart file → FileUploadUtil → Local filesystem (`uploads/` directory)
   - File path stored in database

4. **ML Service Integration**:
   - Backend → HTTP Request → Flask ML Service
   - ML predictions returned as JSON (non-blocking, optional)

---

## Complete Workflow

### 1. USER WORKFLOW

#### Registration & Authentication
1. **User Registration**:
   - Navigate to `/register` (or `/register?role=USER`)
   - Provide: Name, Email, Password
   - System validates email uniqueness
   - Password hashed with BCrypt (12 rounds)
   - User created with role `USER` and `points = 0`
   - Redirected to login page

2. **User Login**:
   - Navigate to `/login`
   - Provide: Email, Password
   - System validates credentials
   - JWT token generated (24-hour expiration)
   - Token stored in localStorage
   - Redirected to `/user/dashboard`

#### Creating Waste Pickup Requests
1. **Request Creation**:
   - User navigates to "Create Request" in dashboard
   - Fills form with:
     - **Waste Type**: PLASTIC, METAL, PAPER, ORGANIC, E_WASTE
     - **Quantity (Weight)**: In kilograms
     - **Zone**: Select from available zones
     - **Pickup Address**: Full address text
     - **Image** (Optional): Upload waste photo
   - Form submitted to `POST /api/requests/create`
   - Request created with status `CREATED` (legacy: `PENDING`)
   - Image saved to `uploads/user/` directory
   - Request stored in `waste_requests` table
   - `collector_id` is `NULL` (unassigned)

2. **Viewing Requests**:
   - User dashboard displays all their requests
   - Shows: Request ID, Waste Type, Weight, Status, Zone, Created Date
   - Status badges: PENDING, IN_PROGRESS, COLLECTED, REJECTED
   - User can view request history and current status

#### Earning Reward Points
1. **Automatic Reward Calculation**:
   - Rewards are **NOT** awarded on request creation
   - Rewards are **ONLY** awarded when collector marks request as `COLLECTED`
   - System calculates points based on waste type:
     - **Base Points**: 10
     - **Multipliers**:
       - DRY (PLASTIC, METAL, PAPER): 1.0 → **10 points**
       - WET (ORGANIC): 1.2 → **12 points**
       - E_WASTE: 2.0 → **20 points**
       - HAZARDOUS: 3.0 → **30 points**
   - Formula: `Points = Base Points × Multiplier`

2. **Point Crediting**:
   - Points automatically added to user's balance
   - Transaction logged in `reward_transactions` table
   - Duplicate prevention: System checks if reward already exists for request
   - User's `points` field updated in `users` table

3. **Viewing Points**:
   - User dashboard displays current point balance
   - Transaction history shows all point additions and redemptions
   - Points displayed prominently in dashboard header

#### Redeeming Rewards
1. **Viewing Reward Catalog**:
   - User navigates to rewards section
   - System fetches active rewards from `reward_catalog` table
   - Displays: Reward Name, Points Required, Description

2. **Redeeming Points**:
   - User selects a reward item
   - System validates:
     - User has sufficient points
     - Reward is active
     - User role is `USER`
   - Points deducted immediately from user balance
   - Redemption request created with status `REQUESTED`
   - Transaction logged in `reward_transactions` (type: `REDEEM`)
   - Admin can later mark redemption as `FULFILLED`

---

### 2. COLLECTOR WORKFLOW

#### Registration & Authentication
1. **Collector Registration**:
   - Navigate to `/register?role=COLLECTOR`
   - Provide: Name, Email, Password
   - System creates user with role `COLLECTOR`
   - **Note**: Collector profile must be separately created in `collectors` table by admin
   - Collector email must match user email for authentication

2. **Collector Login**:
   - Navigate to `/login`
   - Provide: Email, Password
   - System validates credentials
   - JWT token generated
   - Redirected to `/collector/dashboard`

#### Viewing Assigned Requests
1. **Dashboard Display**:
   - Collector dashboard shows **ONLY** requests assigned to them
   - Fetched via `GET /api/requests/collector/me`
   - System filters by `collector_id` matching logged-in collector
   - Collector **CANNOT** see unassigned requests or other collectors' requests

2. **Request Details Shown**:
   - Request ID, User Name, Waste Type, Weight
   - Pickup Address, Zone, Status
   - User-uploaded image (if available)
   - Google Maps visualization of pickup location

#### Updating Request Status
1. **Status Transitions Allowed**:
   - **PENDING/ASSIGNED** → **IN_PROGRESS**: "Start Pickup" button
   - **IN_PROGRESS** → **COLLECTED**: "Mark Collected" button
   - **IN_PROGRESS** → **REJECTED**: "Reject" button

2. **Status Update Process**:
   - Collector selects new status from dropdown
   - Optional: Upload proof photo (for COLLECTED status)
   - Form submitted to `PUT /api/requests/updateStatus/{id}`
   - System validates:
     - Request is assigned to this collector
     - Status transition is valid
     - Request is not already completed
   - Status updated in database
   - Proof photo saved to `uploads/collector/` directory

3. **Reward Trigger**:
   - When status changes to `COLLECTED`:
     - System automatically calculates and awards reward points
     - User's point balance updated
     - Reward transaction logged
     - Request's `reward_points` field updated

4. **Restrictions**:
   - Collector **CANNOT** self-assign requests
   - Collector **CANNOT** modify completed requests
   - Collector **CANNOT** access admin or user reward data
   - Collector **CANNOT** change status to CREATED or ASSIGNED

---

### 3. ADMIN WORKFLOW

#### Authentication
1. **Admin Login**:
   - Admin account is **pre-created** in database (not via registration)
   - Navigate to `/login`
   - Provide: Admin email, Password
   - System validates credentials
   - JWT token generated
   - Redirected to `/admin/dashboard`

2. **Security**:
   - Registration endpoint **BLOCKS** ADMIN role creation
   - Admin accounts can only be created via database initialization
   - Admin routes protected with `@PreAuthorize("hasRole('ADMIN')")`

#### Viewing System Data
1. **All Users**:
   - Admin dashboard displays all registered users
   - Shows: User ID, Name, Email, Role, Points, Created Date
   - Fetched via `GET /api/admin/users`

2. **All Collectors**:
   - Admin dashboard displays all collector profiles
   - Shows: Collector ID, Name, Email, Contact, Vehicle Number, Zone, Active Status
   - Fetched via `GET /api/admin/collectors`

3. **All Waste Requests**:
   - Admin dashboard displays all waste requests (all users, all statuses)
   - Shows enriched data: User Name, Collector Name, Zone Name, Status, Dates
   - Fetched via `GET /api/admin/requests`
   - Google Maps visualization shows all pickup locations

4. **Redemption Requests**:
   - Admin dashboard displays all redemption requests
   - Shows: User Name, Reward Name, Points Used, Status, Created Date
   - Fetched via `GET /api/admin/rewards/redemptions`

#### Assigning Collectors to Requests
1. **Assignment Process**:
   - Admin views unassigned requests (status: `CREATED` or `collector_id = NULL`)
   - Admin selects a collector from dropdown
   - Clicks "Assign" button
   - System validates:
     - Request is unassigned or in ASSIGNED status
     - Collector exists and is active
     - Request is not already completed
   - Request updated: `collector_id` set, status changed to `ASSIGNED` (if was CREATED)
   - Assignment saved via `PUT /api/admin/requests/{id}/assign?collectorId={collectorId}`

2. **Reassignment**:
   - Admin can reassign requests that are `ASSIGNED` but not yet `IN_PROGRESS`
   - Cannot reassign completed requests (`COLLECTED` or `CLOSED`)

#### Monitoring & Analytics
1. **Analytics Dashboard**:
   - Admin can view analytics via `/admin/analytics`
   - Metrics include:
     - Total requests, Total users, Total collectors
     - Waste by zone (chart)
     - Waste by type (chart)
     - Top eco-friendly users
     - Collector performance metrics
     - Prediction vs Actual waste comparison (from ML service)

2. **ML Integration**:
   - Admin can view ML predictions for waste quantity
   - Predictions are **advisory only** (non-blocking)
   - ML service runs independently on port 5005

#### Fulfilling Redemption Requests
1. **Fulfillment Process**:
   - Admin views redemption requests with status `REQUESTED`
   - Admin clicks "Mark Fulfilled" button
   - System updates redemption status to `FULFILLED`
   - `fulfilled_at` timestamp set
   - Updated via `PUT /api/admin/rewards/redemptions/{id}/fulfill`

---

## Technology Stack

### Frontend

#### Core Technologies
- **React.js 19.2.0**: Component-based UI library
- **Vite 7.2.2**: Build tool and development server
- **JavaScript (ES6+)**: Modern JavaScript features

#### UI & Styling
- **Tailwind CSS 4.1.17**: Utility-first CSS framework
- **Heroicons 2.2.0**: Icon library
- **React Hot Toast 2.6.0**: Toast notifications

#### Routing & State Management
- **React Router DOM 7.10.1**: Client-side routing
- **React Context API**: Global state management (AuthContext)

#### HTTP Communication
- **Axios 1.13.2**: HTTP client for API calls
- **Custom Axios Instance**: Configured with base URL and JWT interceptor

#### Data Visualization
- **Recharts 3.6.0**: Chart library for analytics

#### External Services
- **Google Maps JavaScript API**: Map visualization (non-blocking)

### Backend

#### Core Framework
- **Java 17**: Programming language
- **Spring Boot 3.3.5**: Application framework
- **Spring MVC**: Web layer framework
- **Spring Data JPA**: Data access abstraction

#### Security
- **Spring Security**: Authentication and authorization
- **JWT (jjwt 0.11.5)**: Token-based authentication
- **BCrypt**: Password hashing (12 rounds)

#### Database
- **MySQL**: Relational database
- **Hibernate**: JPA implementation
- **MySQL Connector/J**: Database driver

#### File Handling
- **Spring MultipartFile**: File upload support
- **Local File Storage**: Files saved to `uploads/` directory

#### Additional Libraries
- **Apache Commons CSV 1.10.0**: CSV processing
- **Spring Boot Actuator**: Health monitoring

### Database

#### Database System
- **MySQL 8.0+**: Relational database management system
- **Port**: 3306 (default)
- **Database Name**: `smart_waste`

#### Schema Design
- **8 Core Tables**: users, zones, collectors, waste_requests, reward_transactions, reward_catalog, redemption_requests, waste_logs
- **Foreign Key Relationships**: Enforced referential integrity
- **Indexes**: Performance indexes on frequently queried columns
- **ENUM Types**: Status and role constraints

### ML Service

#### Core Technologies
- **Python 3.12**: Programming language
- **Flask 3.1.2**: Web framework
- **Flask-CORS 6.0.1**: Cross-origin resource sharing

#### Machine Learning
- **Scikit-learn 1.7.2**: ML library
- **Joblib 1.5.2**: Model serialization
- **NumPy 2.3.4**: Numerical computing
- **Pandas 2.3.3**: Data manipulation

#### Model Storage
- **Pickle Files (.pkl)**: Trained models stored in `models/` directory
  - `waste_quantity_model.pkl`: Quantity prediction model
  - `waste_classification_model.pkl`: Type classification model
  - `waste_label_encoder.pkl`: Label encoder for classification
  - `eco_score_config.pkl`: Eco score configuration

#### Service Configuration
- **Port**: 5005
- **Host**: 0.0.0.0 (all interfaces)
- **CORS**: Enabled for frontend communication

### External Services

#### Google Maps API
- **Purpose**: Visualization only (non-blocking)
- **Usage**: Display pickup locations on maps
- **Features Used**:
  - Map rendering
  - Marker placement
  - Info windows
- **No Routing/Navigation**: Maps do not affect business logic

---

## Database Schema

### Core Tables

#### 1. `users`
- **Purpose**: Stores all system users (USER, COLLECTOR, ADMIN)
- **Key Fields**:
  - `user_id` (PK, Auto-increment)
  - `name`, `email` (Unique), `password_hash`
  - `role` (ENUM: USER, COLLECTOR, ADMIN)
  - `points` (Default: 0)
  - `created_at` (Timestamp)

#### 2. `zones`
- **Purpose**: Geographic zones for waste collection
- **Key Fields**:
  - `zone_id` (PK, Auto-increment)
  - `zone_name`, `city`, `state`

#### 3. `collectors`
- **Purpose**: Collector profiles (linked to users via email)
- **Key Fields**:
  - `collector_id` (PK, Auto-increment)
  - `name`, `email` (Unique), `contact`, `vehicle_number`
  - `zone_id` (FK to zones)
  - `is_active` (Boolean)

#### 4. `waste_requests`
- **Purpose**: Waste pickup requests
- **Key Fields**:
  - `request_id` (PK, Auto-increment)
  - `user_id` (FK to users), `collector_id` (FK to collectors, nullable)
  - `zone_id` (FK to zones)
  - `waste_type` (ENUM: PLASTIC, METAL, PAPER, ORGANIC, E_WASTE)
  - `weight_kg` (Double)
  - `status` (ENUM: PENDING, IN_PROGRESS, COLLECTED, REJECTED)
  - `pickup_address` (TEXT)
  - `image_url`, `collector_proof_url` (VARCHAR)
  - `scheduled_time`, `collected_time` (DATETIME, nullable)
  - `reward_points` (Default: 0)
  - `request_date` (Timestamp)

#### 5. `reward_transactions`
- **Purpose**: Logs all point additions and redemptions
- **Key Fields**:
  - `transaction_id` (PK, Auto-increment)
  - `user_id` (FK to users)
  - `request_id` (FK to waste_requests, nullable)
  - `points_added`, `points_spent` (INT)
  - `transaction_type` (ENUM: ADD, REDEEM)
  - `description` (VARCHAR)
  - `created_at` (Timestamp)

#### 6. `reward_catalog`
- **Purpose**: Available rewards for redemption
- **Key Fields**:
  - `reward_id` (PK, Auto-increment)
  - `reward_name`, `points_required`, `details`
  - `active` (Boolean)

#### 7. `redemption_requests`
- **Purpose**: User redemption requests
- **Key Fields**:
  - `redemption_id` (PK, Auto-increment)
  - `user_id` (FK to users), `reward_id` (FK to reward_catalog)
  - `points_used` (INT)
  - `status` (ENUM: REQUESTED, FULFILLED)
  - `created_at`, `fulfilled_at` (Timestamp, nullable)

#### 8. `waste_logs`
- **Purpose**: Historical waste collection data
- **Key Fields**:
  - `log_id` (PK, Auto-increment)
  - `zone_id` (FK to zones)
  - `waste_type`, `collected_weight_kg`
  - `collection_date`

### Relationships

- **users** → **waste_requests** (One-to-Many)
- **collectors** → **waste_requests** (One-to-Many, nullable)
- **zones** → **waste_requests** (One-to-Many)
- **zones** → **collectors** (One-to-Many)
- **users** → **reward_transactions** (One-to-Many)
- **waste_requests** → **reward_transactions** (One-to-Many, nullable)
- **users** → **redemption_requests** (One-to-Many)
- **reward_catalog** → **redemption_requests** (One-to-Many)

---

## Security & Access Control

### Authentication

#### JWT Token-Based Authentication
- **Token Generation**: Upon successful login
- **Token Storage**: localStorage (frontend)
- **Token Format**: `Bearer <token>` in Authorization header
- **Expiration**: 24 hours (86400000 ms)
- **Secret Key**: Configured in `application.properties`

#### Password Security
- **Hashing Algorithm**: BCrypt
- **Rounds**: 12 (high security)
- **Storage**: Only hashed passwords stored (never plaintext)

### Authorization

#### Role-Based Access Control (RBAC)
- **Three Roles**: USER, COLLECTOR, ADMIN
- **Method-Level Security**: `@PreAuthorize` annotations
- **URL-Based Protection**: Spring Security filter chain

#### Access Matrix

| Endpoint Pattern | USER | COLLECTOR | ADMIN |
|-----------------|------|-----------|-------|
| `/api/auth/**` | ✅ | ✅ | ✅ |
| `/api/requests/create` | ✅ | ❌ | ❌ |
| `/api/requests/me` | ✅ | ❌ | ❌ |
| `/api/requests/collector/me` | ❌ | ✅ | ❌ |
| `/api/requests/updateStatus/**` | ❌ | ✅ | ❌ |
| `/api/admin/**` | ❌ | ❌ | ✅ |
| `/api/rewards/redeem/**` | ✅ | ❌ | ❌ |
| `/api/rewards/catalog` | ✅ | ✅ | ✅ |

#### Security Filters
1. **JwtFilter**: Validates JWT token on each request
2. **SecurityHeadersFilter**: Adds security headers
3. **CORS Configuration**: Allows specific origins only

### Data Protection

#### Input Validation
- **Bean Validation**: `@Valid` annotations on request DTOs
- **Email Format**: Validated
- **Password Strength**: Enforced (minimum length)
- **File Upload**: Size and type restrictions

#### SQL Injection Prevention
- **JPA/Hibernate**: Parameterized queries
- **No Raw SQL**: All queries use JPA methods

#### XSS Prevention
- **React Escaping**: Automatic XSS protection
- **Content Security Policy**: Headers configured

---

## Design Principles

### 1. Separation of Concerns
- **Layered Architecture**: Presentation, Application, Persistence
- **Controller-Service-Repository Pattern**: Clear responsibility boundaries
- **DTO Pattern**: Data transfer objects separate from entities

### 2. Modular Architecture
- **Component-Based Frontend**: Reusable React components
- **Service Layer**: Business logic separated from controllers
- **Repository Pattern**: Data access abstraction

### 3. Scalability-Ready Design
- **Stateless Authentication**: JWT tokens enable horizontal scaling
- **Database Indexes**: Optimized for query performance
- **RESTful API**: Standard HTTP methods and status codes

### 4. Fail-Safe UI Handling
- **Error Boundaries**: React error handling
- **Toast Notifications**: User feedback for all actions
- **Loading States**: UI feedback during async operations
- **Graceful Degradation**: ML service failures don't break core system

### 5. Non-Blocking Optional Features
- **ML Service**: Independent microservice, optional predictions
- **Google Maps**: Visualization only, doesn't affect business logic
- **Analytics**: Informational, doesn't control workflows

### 6. Security by Design
- **Role-Based Access**: Enforced at multiple layers
- **Password Hashing**: Industry-standard BCrypt
- **Token Expiration**: Automatic token invalidation
- **Input Validation**: All user inputs validated

### 7. Maintainability
- **Clean Code**: Descriptive naming, comments
- **Logging**: Comprehensive logging for debugging
- **Error Handling**: Centralized exception handling
- **Documentation**: Inline code documentation

---

## API Endpoints

### Authentication Endpoints

#### `POST /api/auth/register`
- **Description**: User registration
- **Request Body**: `{ name, email, password, role? }`
- **Response**: `{ message, userId, role }`
- **Access**: Public
- **Note**: ADMIN role blocked

#### `POST /api/auth/login`
- **Description**: User login
- **Request Body**: `{ email, password }`
- **Response**: `{ token, role, userId, name, email }`
- **Access**: Public
- **Rate Limiting**: Enabled

### Waste Request Endpoints

#### `POST /api/requests/create`
- **Description**: Create waste pickup request
- **Content-Type**: `multipart/form-data`
- **Parameters**: `userId?`, `zoneId`, `wasteType`, `weightKg`, `pickupAddress`, `image?`
- **Response**: `WasteRequest` object
- **Access**: Authenticated USER

#### `GET /api/requests/me`
- **Description**: Get current user's requests
- **Response**: `List<WasteRequest>`
- **Access**: Authenticated USER

#### `GET /api/requests/collector/me`
- **Description**: Get collector's assigned requests
- **Response**: `List<WasteRequest>`
- **Access**: Authenticated COLLECTOR

#### `PUT /api/requests/updateStatus/{id}`
- **Description**: Update request status
- **Content-Type**: `multipart/form-data`
- **Parameters**: `status`, `proof?` (file)
- **Response**: `WasteRequest` object
- **Access**: Authenticated COLLECTOR

### Admin Endpoints

#### `GET /api/admin/users`
- **Description**: Get all users
- **Response**: `List<User>`
- **Access**: ADMIN only

#### `GET /api/admin/collectors`
- **Description**: Get all collectors
- **Response**: `List<Collector>`
- **Access**: ADMIN only

#### `GET /api/admin/requests`
- **Description**: Get all waste requests (enriched)
- **Response**: `List<AdminWasteRequestDTO>`
- **Access**: ADMIN only

#### `PUT /api/admin/requests/{id}/assign`
- **Description**: Assign collector to request
- **Query Parameter**: `collectorId`
- **Response**: `AdminWasteRequestDTO`
- **Access**: ADMIN only

### Reward Endpoints

#### `GET /api/rewards/catalog`
- **Description**: Get reward catalog
- **Response**: `List<RewardCatalog>`
- **Access**: Authenticated

#### `POST /api/rewards/redeem/{rewardId}`
- **Description**: Redeem reward
- **Response**: `RedemptionRequest`
- **Access**: Authenticated USER

#### `GET /api/rewards/my-transactions`
- **Description**: Get user's reward transactions
- **Response**: `List<RewardTransaction>`
- **Access**: Authenticated USER

#### `GET /api/admin/rewards/redemptions`
- **Description**: Get all redemption requests
- **Response**: `List<RedemptionRequest>`
- **Access**: ADMIN only

#### `PUT /api/admin/rewards/redemptions/{id}/fulfill`
- **Description**: Fulfill redemption request
- **Response**: `RedemptionRequest`
- **Access**: ADMIN only

### ML Service Endpoints

#### `POST /api/ml/predict/waste`
- **Description**: Predict waste quantity
- **Request Body**: `{ zoneId, historicalWaste, dayOfWeek?, month? }`
- **Response**: `{ predictedWasteKg, zoneId, timestamp }`
- **Access**: Authenticated

#### `POST /api/ml/classify/waste`
- **Description**: Classify waste type
- **Request Body**: `{ description, category? }`
- **Response**: `{ wasteType, confidence, timestamp }`
- **Access**: Authenticated

#### `POST /api/ml/score/user`
- **Description**: Calculate user eco score
- **Request Body**: `{ userId, userActivity, segregationAccuracy, requestFrequency, avgWeight }`
- **Response**: `{ ecoScore, userId, breakdown, timestamp }`
- **Access**: Authenticated

---

## ML Service Integration

### Service Architecture
- **Independent Microservice**: Runs on port 5005
- **Flask Framework**: Lightweight Python web framework
- **Model Storage**: Pickle files in `models/` directory

### ML Models

#### 1. Waste Quantity Prediction
- **Model**: `waste_quantity_model.pkl`
- **Input Features**: `[zoneId, dayOfWeek, month, historicalWaste]`
- **Output**: Predicted waste quantity (kg)
- **Use Case**: Admin analytics dashboard

#### 2. Waste Type Classification
- **Model**: `waste_classification_model.pkl`
- **Label Encoder**: `waste_label_encoder.pkl`
- **Input**: Description text and optional category hint
- **Output**: Waste type (DRY, WET, E_WASTE, HAZARDOUS) with confidence
- **Use Case**: Optional classification assistance

#### 3. User Eco Score
- **Config**: `eco_score_config.pkl`
- **Input**: User activity metrics
- **Output**: Eco score (0-100) with breakdown
- **Use Case**: User dashboard display (informational)

### Integration Pattern
- **Non-Blocking**: ML service failures don't affect core system
- **HTTP Communication**: Backend calls ML service via REST
- **Optional Features**: ML predictions are advisory only
- **Error Handling**: Graceful degradation if ML service unavailable

---

## Google Maps Integration

### Purpose
- **Visualization Only**: Maps do not affect business logic
- **Location Display**: Show pickup locations to admin and collectors
- **No Routing**: No navigation or route optimization

### Implementation

#### Frontend Integration
- **Google Maps JavaScript API**: Loaded dynamically
- **API Key**: Configured in frontend environment
- **Components**:
  - `AdminRequestMap`: Shows all requests (admin view)
  - `CollectorRequestMap`: Shows assigned request (collector view)

#### Coordinate Handling
- **Fallback System**: Zone-based coordinates if address not geocoded
- **Default Coordinates**: Predefined per zone
- **Future-Ready**: Supports latitude/longitude fields in requests

### Features Used
- **Map Rendering**: Display map with markers
- **Marker Placement**: One marker per request
- **Info Windows**: Show request details on marker click
- **Bounds Fitting**: Auto-zoom to show all markers (admin view)

### Non-Features
- **No Geocoding**: Addresses not automatically converted to coordinates
- **No Routing**: No navigation between locations
- **No Live Tracking**: No GPS tracking of collectors
- **No Directions**: No turn-by-turn navigation

---

## System Deployment

### Development Environment

#### Prerequisites
- **Java 17+**: JDK installed
- **Node.js 18+**: For frontend
- **Python 3.12+**: For ML service
- **MySQL 8.0+**: Database server
- **Maven**: For backend build

#### Running the System

1. **Database Setup**:
   ```sql
   -- Run schema.sql to create database and tables
   -- Run init.sql for initial data
   -- Run seed_reward_catalog.sql for reward catalog
   ```

2. **Backend**:
   ```bash
   cd backend
   mvn spring-boot:run
   # Runs on http://localhost:8080
   ```

3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   # Runs on http://localhost:5173
   ```

4. **ML Service**:
   ```bash
   cd ml-service
   python -m venv venv
   venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   python app.py
   # Runs on http://localhost:5005
   ```

### Configuration Files

#### Backend (`application.properties`)
- Database connection settings
- JWT secret and expiration
- ML service URL
- File upload paths

#### Frontend (`vite.config.js`)
- API base URL
- Google Maps API key (environment variable)

#### ML Service (`app.py`)
- Port configuration
- Model loading paths

---

## Conclusion

The Smart Waste Management & Rewards System is a fully functional, production-ready prototype that demonstrates:

- **Complete Workflow**: End-to-end waste pickup request management
- **Role-Based Access**: Secure separation of user, collector, and admin functions
- **Reward System**: Automated point calculation and redemption
- **Modern Tech Stack**: Industry-standard technologies
- **Scalable Architecture**: Ready for expansion
- **Security**: JWT authentication and role-based authorization

The system is suitable for academic evaluation, demonstration, and serves as a foundation for real-world deployment with additional features.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Project Status**: ✅ Production-Ready Prototype

