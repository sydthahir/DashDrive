# OTP Verification - Common Implementation

## Summary
Created a common `verify-otp.ejs` file in the partials folder that can be used for both vendor-side and user-side OTP verification. Fixed issues with vendor signup OTP verification.

## Changes Made

### 1. Created Common OTP Verification Partial
**File:** `/home/sydthahir/Coding/DashDrive/views/partials/verify-otp.ejs`

- Moved the verify-otp page to the partials folder
- Made it reusable for both user and vendor flows
- Added dynamic parameters:
  - `userType`: 'user' or 'vendor' to determine API endpoints
  - `redirectUrl`: Where to redirect after successful verification
  - `email`: Email address for OTP verification
  - `message`: Optional error/success message

- Embedded JavaScript directly in the file to handle:
  - Dynamic API endpoint selection based on userType
  - OTP input handling (auto-focus, validation)
  - Form submission via AJAX
  - Resend OTP functionality with countdown timer
  - SweetAlert2 notifications

### 2. Updated Vendor Controller
**File:** `/home/sydthahir/Coding/DashDrive/controllers/vendor/vendorController.js`

#### Fixed in `registeration` function (line 120):
- Changed render path from `"verify-otp"` to `"partials/verify-otp"`
- Added parameters: `userType: 'vendor'`, `redirectUrl: '/vendor/login'`

#### Fixed in `verifyOTP` function (lines 152-177):
- Changed error responses from `res.render()` to `res.status(400).json()` for AJAX compatibility
- Fixed email case handling (using `Email` consistently instead of `email`)
- Now returns proper JSON responses for:
  - Invalid or expired OTP
  - OTP expired
  - Invalid OTP

#### Fixed in `registeration` function (line 109):
- Fixed email case inconsistency in TempVendor deletion
- Changed `await TempData.deleteOne({ email })` to `await TempData.deleteOne({ email: Email })`

### 3. Updated User Controller
**File:** `/home/sydthahir/Coding/DashDrive/controllers/user/userControllers.js`

#### Fixed in `signup` function (line 105):
- Changed render path from `"verify-otp"` to `"partials/verify-otp"`
- Added parameters: `userType: 'user'`, `redirectUrl: '/login'`

## How It Works

### For Vendor Signup:
1. Vendor fills signup form → `/vendor/register` (POST)
2. System generates OTP and stores in TempVendor collection
3. Renders `partials/verify-otp` with `userType: 'vendor'`
4. JavaScript detects vendor type and uses `/vendor/verify-otp` endpoint
5. On success, redirects to `/vendor/login`

### For User Signup:
1. User fills signup form → `/signup` (POST)
2. System generates OTP and stores in TempUser collection
3. Renders `partials/verify-otp` with `userType: 'user'`
4. JavaScript detects user type and uses `/verify-otp` endpoint
5. On success, redirects to `/login`

## API Endpoints

### Vendor Routes (from `/routes/vendorRouter.js`):
- `POST /vendor/verify-otp` - Verify vendor OTP
- `POST /vendor/resend-otp` - Resend vendor OTP

### User Routes (from `/routes/userRouter.js`):
- `POST /verify-otp` - Verify user OTP
- `POST /resend-otp` - Resend user OTP

## Issues Fixed

1. **Common OTP Page**: Now using a single common verify-otp.ejs file in partials folder
2. **Vendor OTP Verification Errors**: Fixed JSON response handling for AJAX submissions
3. **Email Case Consistency**: Fixed email variable case handling in vendor controller
4. **Dynamic Routing**: OTP verification now automatically uses correct endpoints based on userType
5. **Proper Redirects**: Each user type redirects to appropriate login page after verification

## Testing Recommendations

1. Test vendor signup flow:
   - Register new vendor
   - Verify OTP is sent
   - Enter correct OTP → should redirect to `/vendor/login`
   - Test invalid OTP → should show error message
   - Test expired OTP → should show error message
   - Test resend OTP functionality

2. Test user signup flow:
   - Register new user
   - Verify OTP is sent
   - Enter correct OTP → should redirect to `/login`
   - Test invalid OTP → should show error message
   - Test expired OTP → should show error message
   - Test resend OTP functionality

3. Test edge cases:
   - Duplicate email registration
   - OTP expiration (5 minutes)
   - Multiple resend requests
   - Email case sensitivity
