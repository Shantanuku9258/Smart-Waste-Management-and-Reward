# Reward Calculation & Crediting Implementation

## Overview
This document describes the complete implementation of the reward calculation and crediting system for the Smart Waste Management & Rewards System.

## Implementation Summary

### 1. Reward Calculation Logic ✅
- **Base Points**: 10 points
- **Waste Type Multipliers**:
  - DRY (PLASTIC, METAL, PAPER) → 1.0 multiplier → **10 points**
  - WET (ORGANIC) → 1.2 multiplier → **12 points**
  - E_WASTE → 2.0 multiplier → **20 points**
  - HAZARDOUS → 3.0 multiplier → **30 points**

- **Final Points Formula**: `Base Points × Multiplier`

### 2. Trigger Condition ✅
Rewards are generated **ONLY** when:
- Collector updates request status from `IN_PROGRESS` to `COLLECTED`
- This is enforced in `WasteRequestService.updateStatus()`

Rewards are **NOT** generated:
- On request creation
- On assignment
- On status change to `IN_PROGRESS`
- On any other status transition

### 3. Duplicate Prevention ✅
- Checks for existing reward transaction by `requestId` before awarding points
- Uses `RewardTransactionRepository.findByRequestId()` to prevent duplicates
- If a reward transaction already exists for a request, the reward process is skipped

### 4. User Point Crediting ✅
- Points are automatically added to user's total points balance
- User's `points` field is updated in the database
- Transaction is logged in `reward_transactions` table

### 5. Reward History Storage ✅
- Each reward transaction stores:
  - User ID (foreign key)
  - Request ID (for duplicate prevention)
  - Waste type (in description)
  - Points earned
  - Timestamp (auto-generated)
  - Transaction type ("ADD")

### 6. Role Safety ✅
- **Collector**: Cannot manually assign points (system-controlled)
- **Admin**: Cannot manually edit points (system-controlled)
- **User**: Cannot modify request status (read-only)
- Reward generation is **SYSTEM CONTROLLED** only

### 7. User Visibility ✅
- User dashboard displays:
  - Total reward points (in stats card)
  - Reward history (separate section showing all ADD transactions)
  - Redemption history (separate section)

## Database Changes

### Schema Updates
1. **reward_transactions table**:
   - Added `request_id BIGINT` column
   - Added foreign key constraint to `waste_requests(request_id)`

### Migration Script
- Created `database/migrations/add_request_id_to_reward_transactions.sql`
- Run this script on existing databases to add the new column

## API Endpoints

### New Endpoint
- `GET /api/rewards/my-transactions`
  - Returns all reward transactions for the authenticated user
  - Ordered by creation date (newest first)
  - Includes both ADD and REDEEM transactions

## Code Changes

### Backend Files Modified
1. **RewardTransaction.java**
   - Added `requestId` field with getter/setter

2. **RewardTransactionRepository.java**
   - Added `findByRequestId()` method
   - Added `findByUser_UserIdOrderByCreatedAtDesc()` method

3. **WasteRequestService.java**
   - Updated `applyRewards()` to check for existing transactions by requestId
   - Replaced `calculatePoints(double weightKg)` with `calculatePoints(String wasteType)`
   - Added `mapWasteTypeToCategory()` method for waste type mapping
   - Updated reward calculation to use Base Points × Multiplier formula

4. **RewardController.java**
   - Added `getMyTransactions()` endpoint
   - Added `UserTransactionHistoryItem` record

### Frontend Files Modified
1. **rewardsApi.js**
   - Added `getMyTransactions()` function

2. **UserDashboard.jsx**
   - Added state for transactions
   - Updated `loadRewards()` to fetch transactions
   - Added "Reward History" section displaying ADD transactions
   - Updated layout to show 3 columns: Available Rewards, Reward History, Redemption History

## Testing Checklist

- [ ] Create a waste request with PLASTIC type → Should not award points
- [ ] Collector marks request as IN_PROGRESS → Should not award points
- [ ] Collector marks request as COLLECTED → Should award 10 points (DRY multiplier)
- [ ] Create request with ORGANIC type → Should award 12 points (WET multiplier)
- [ ] Create request with E_WASTE type → Should award 20 points (E_WASTE multiplier)
- [ ] Try to mark same request as COLLECTED again → Should not award duplicate points
- [ ] Check user dashboard → Should show total points and reward history
- [ ] Verify reward history shows correct waste type and points

## Notes

- The system uses the existing waste types from the database (PLASTIC, METAL, PAPER, ORGANIC, E_WASTE)
- These are mapped to reward categories (DRY, WET, E_WASTE) for calculation purposes
- HAZARDOUS type is supported but not currently in the database schema
- User dashboard refreshes rewards when user profile is updated (e.g., after redemption)
- For real-time updates when a collector marks a request as COLLECTED, users may need to refresh the page

## Future Enhancements (Not in Scope)
- Real-time notifications when points are awarded
- Automatic dashboard refresh on status changes
- Reward redemption (already implemented separately)

