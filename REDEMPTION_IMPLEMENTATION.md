# Reward Redemption Implementation

## Overview
This document describes the complete implementation of the reward redemption ("USE POINTS") system for the Smart Waste Management & Rewards System.

## Implementation Summary

### 1. Reward Catalog (System Controlled) ✅
- **Entity**: `RewardCatalog.java` with fields:
  - `rewardId` (Primary Key)
  - `rewardName` (Item name)
  - `pointsRequired` (Points needed to redeem)
  - `details` (Description)
  - `active` (Boolean flag for availability)

- **Seed Data**: Created `database/seed_reward_catalog.sql` with eco-friendly items:
  - **Reusable Bottle** - 10 points
  - **Cloth Bag** - 12 points
  - **Small Dustbin** - 20 points
  - **Plant Sapling** - 15 points

### 2. User "USE POINTS" Flow ✅
- **Endpoint**: `POST /api/rewards/redeem/{rewardId}`
- **Flow**:
  1. User views available reward items via `GET /api/rewards/catalog`
  2. User selects an item to redeem
  3. System validates:
     - User has sufficient points
     - Item is active
     - User role is "USER"
  4. Points are deducted immediately
  5. Redemption request is created with status "REQUESTED"
  6. Transaction is logged in `reward_transactions`

### 3. Point Validation ✅
- **Insufficient Points**: Prevents redemption if `user.points < reward.pointsRequired`
- **Inactive Item**: Prevents redemption if `reward.active == false`
- **Negative Balance Prevention**: Points are deducted only after validation, preventing negative balances
- **Role Check**: Only users with role "USER" can redeem rewards

### 4. Redemption History ✅
- **Storage**: `RedemptionRequest` entity stores:
  - `redemptionId` (Primary Key)
  - `user` (Foreign Key to users)
  - `reward` (Foreign Key to reward_catalog)
  - `pointsUsed` (Points deducted)
  - `status` (REQUESTED or FULFILLED)
  - `createdAt` (Timestamp)
  - `fulfilledAt` (Timestamp, set when admin fulfills)

- **User View**: `GET /api/rewards/my-redemptions`
  - Returns all redemption requests for the authenticated user
  - Ordered by creation date (newest first)
  - Displayed in User Dashboard

### 5. Admin Redemption Control ✅
- **View All Redemptions**: `GET /api/admin/rewards/redemptions`
  - Returns all redemption requests with user details
  - Displayed in Admin Dashboard

- **Fulfill Redemption**: `PUT /api/admin/rewards/redemptions/{id}/fulfill`
  - Admin-only operation
  - Marks redemption as "FULFILLED"
  - Sets `fulfilledAt` timestamp
  - Does NOT modify points (already deducted at request time)
  - Idempotent (can be called multiple times safely)

### 6. Role Safety ✅
- **USER**: Can redeem rewards (only role allowed)
- **COLLECTOR**: Cannot access redemption endpoints (AccessDeniedException)
- **ADMIN**: Cannot redeem rewards, but can fulfill redemptions
- **System Controlled**: Points are automatically deducted, no manual manipulation possible

## Database Schema

### Tables

#### reward_catalog
```sql
CREATE TABLE reward_catalog (
  reward_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reward_name VARCHAR(255),
  points_required INT,
  details TEXT,
  active BOOLEAN DEFAULT TRUE
);
```

#### redemption_requests
```sql
CREATE TABLE redemption_requests (
  redemption_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  reward_id BIGINT NOT NULL,
  points_used INT NOT NULL,
  status ENUM('REQUESTED','FULFILLED') DEFAULT 'REQUESTED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fulfilled_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (reward_id) REFERENCES reward_catalog(reward_id)
);
```

## API Endpoints

### User Endpoints
- `GET /api/rewards/catalog` - Get all active reward items
- `POST /api/rewards/redeem/{rewardId}` - Redeem a reward item
- `GET /api/rewards/my-redemptions` - Get user's redemption history
- `GET /api/rewards/my-transactions` - Get all reward transactions (ADD + REDEEM)

### Admin Endpoints
- `GET /api/admin/rewards/redemptions` - Get all redemption requests
- `PUT /api/admin/rewards/redemptions/{id}/fulfill` - Mark redemption as fulfilled

## Code Structure

### Backend Files
1. **RewardCatalog.java** - Entity for reward items
2. **RedemptionRequest.java** - Entity for redemption requests
3. **RewardService.java** - Business logic:
   - `getActiveCatalog()` - Get available items
   - `redeemReward()` - Process redemption
   - `fulfillRedemption()` - Admin fulfillment
   - `getUserRedemptions()` - User history
   - `getAllRedemptions()` - Admin view
4. **RewardController.java** - User-facing endpoints
5. **AdminRewardController.java** - Admin-facing endpoints

### Frontend Files
1. **UserDashboard.jsx** - User redemption interface:
   - Available Rewards section
   - Reward History section (points earned)
   - Redemption History section (points spent)
2. **AdminDashboard.jsx** - Admin fulfillment interface:
   - Reward Redemptions section with fulfill button

## User Experience Flow

### User Redemption Flow
1. User logs in and navigates to dashboard
2. Views "Available Rewards" section
3. Sees reward items with required points
4. Clicks "Redeem" button (disabled if insufficient points)
5. Points are deducted immediately
6. Redemption request created with status "REQUESTED"
7. User sees updated point balance
8. Redemption appears in "Redemption History" section

### Admin Fulfillment Flow
1. Admin logs in and navigates to dashboard
2. Views "Reward Redemptions" section
3. Sees all redemption requests with user details
4. Clicks "Mark Fulfilled" button for completed redemptions
5. Status changes to "FULFILLED"
6. `fulfilledAt` timestamp is set

## Security & Validation

### Point Validation
- ✅ Checks user has sufficient points before redemption
- ✅ Prevents negative point balances
- ✅ Validates reward item is active
- ✅ Validates reward item exists

### Role Validation
- ✅ Only "USER" role can redeem rewards
- ✅ Only "ADMIN" role can fulfill redemptions
- ✅ AccessDeniedException thrown for unauthorized roles

### Transaction Safety
- ✅ `@Transactional` annotation ensures atomicity
- ✅ Points deducted and redemption created in single transaction
- ✅ Rollback on any error

## Database Migrations

### For New Databases
Run `database/schema.sql` which includes:
- `reward_catalog` table with `active` column
- `redemption_requests` table

### For Existing Databases
Run `database/migrations/add_redemption_requests_table.sql` to:
- Add `active` column to `reward_catalog`
- Create `redemption_requests` table

### Seed Data
Run `database/seed_reward_catalog.sql` to populate initial reward items:
- Reusable Bottle (10 points)
- Cloth Bag (12 points)
- Small Dustbin (20 points)
- Plant Sapling (15 points)

## Testing Checklist

- [ ] User can view available reward catalog
- [ ] User with sufficient points can redeem reward
- [ ] User with insufficient points cannot redeem (button disabled)
- [ ] Points are deducted immediately on redemption
- [ ] Redemption request is created with status "REQUESTED"
- [ ] User can view redemption history
- [ ] Admin can view all redemption requests
- [ ] Admin can mark redemption as "FULFILLED"
- [ ] Collector cannot access redemption endpoints
- [ ] Admin cannot redeem rewards (only fulfill)
- [ ] Inactive rewards are not shown in catalog
- [ ] Transaction history shows both ADD and REDEEM entries

## Constraints Met

- ✅ No shopping cart (simple one-item redemption)
- ✅ No payment gateway (points-only system)
- ✅ No address/shipping logic (prototype)
- ✅ Minimal UI additions (used existing dashboard sections)
- ✅ Minimal DB changes (only added missing tables/columns)
- ✅ Existing functionality preserved

## End-to-End Flow

1. **User earns points** → Waste request collected → Points added
2. **User views catalog** → Sees available eco-friendly items
3. **User redeems item** → Points deducted → Redemption request created
4. **Admin views requests** → Sees pending redemptions
5. **Admin fulfills** → Marks as fulfilled → User sees status update

## Notes

- All rewards are eco-friendly items (no money involved)
- Points are deducted at redemption time (not at fulfillment)
- Admin fulfillment is a status update only (doesn't affect points)
- System is designed for prototype/demo use
- No delivery tracking (as per requirements)
- Admin controls fulfillment manually

## Future Enhancements (Not in Scope)
- Automatic fulfillment workflows
- Email notifications
- Reward inventory management
- Bulk redemption
- Reward categories/filtering

