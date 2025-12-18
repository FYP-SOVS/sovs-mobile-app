# SOVS Mobile App - User Flow Documentation

This document explains how users register and login in the SOVS mobile app.

---

## 📱 Registration Flow

### Step 1: Identity Verification (`/register/identity`)
**What happens:**
- User opens the registration screen
- App requests camera permission
- User takes a **selfie** (front camera)
- User takes a photo of their **government ID** (back camera)
- App calls `verifyIdentity()` mock service (currently mocked)
- If successful, extracts `nationalIdNumber` from the ID
- Navigates to government data screen

**Current Status:** Uses mock identity verification service

---

### Step 2: Government Data Verification (`/register/government-data`)
**What happens:**
- App receives `nationalIdNumber` from previous step
- Calls **cloud function**: `GET /government-db/{national_id}`
- Retrieves government data:
  - Name
  - Surname
  - Date of Birth
  - Phone Number
  - Address
  - Place of Birth
- Displays the data to user for verification
- User can optionally add/update email address
- User clicks "Continue" → Navigates to confirmation screen

**API Call:**
```
GET http://72.60.37.106:8000/functions/v1/government-db/{national_id}
```

---

### Step 3: Confirm Registration (`/register/confirm`)
**What happens:**
- App displays all user information for final review:
  - Name, Surname, Date of Birth
  - Phone Number
  - Email (if provided)
  - Role: VOTER
- User clicks "Create Account"
- App calls `registerUser()` function

**Behind the scenes (`registerUser()`):**

1. **Creates user in `users` table:**
   - Calls cloud function: `POST /users`
   - Sends:
     ```json
     {
       "phone_number": "+1234567890",
       "email": "user@example.com",  // optional
       "name": "John",
       "surname": "Doe",
       "date_of_birth": "1990-05-15",
       "status": "pending"
     }
     ```
   - Receives back: `user_id` (UUID)

2. **Creates user in Supabase Auth:**
   - Calls `supabase.auth.signUp()`
   - Uses email (or generates placeholder: `{phone}@sovs.local`)
   - Generates temporary password
   - Stores metadata linking to `user_id` from step 1
   - This enables OTP-based login later

3. **Success:**
   - Navigates to success screen
   - User is now registered!

**API Calls:**
```
POST http://72.60.37.106:8000/functions/v1/users
```

---

### Step 4: Success Screen (`/register/success`)
**What happens:**
- Displays success message
- Shows checkmarks for:
  - ✓ Identity Verified
  - ✓ Account Created
  - ✓ Ready to Vote
- User clicks "Continue to Dashboard"
- Navigates to main app (`/(tabs)`)

---

## 🔐 Login Flow

### Step 1: Enter Phone/Email (`/login`)
**What happens:**
- User enters phone number OR email address
- User clicks "Send Code"
- App calls `getUserByPhoneOrEmail()` to verify user exists

**Behind the scenes:**
1. **Check if user exists:**
   - Calls cloud function: `GET /find-user?phone_or_email={value}`
   - If user not found → Shows error: "No account found"
   - If user found → Proceeds to send OTP

2. **Send OTP:**
   - Calls `sendOTP()` function
   - For **email**: Calls `supabase.auth.signInWithOtp({ email })`
   - For **phone**: Calls `supabase.auth.signInWithOtp({ phone })`
   - Supabase sends OTP via SMS (phone) or Email (email)
   - Navigates to OTP verification screen

**API Calls:**
```
GET http://72.60.37.106:8000/functions/v1/find-user?phone_or_email={value}
```

---

### Step 2: Verify OTP (`/login` - OTP screen)
**What happens:**
- User receives OTP code (SMS or Email)
- User enters 6-digit OTP code
- User clicks "Verify & Continue"
- App calls `verifyOTP()` function

**Behind the scenes:**
1. **Verify OTP:**
   - Calls `supabase.auth.verifyOtp()`
   - For email: `verifyOtp({ email, token, type: 'email' })`
   - For phone: `verifyOtp({ phone, token, type: 'sms' })`
   - Supabase validates the OTP code

2. **Success:**
   - Supabase creates an authenticated session
   - Session is stored in AsyncStorage
   - User is redirected to main app (`/(tabs)`)

3. **Failure:**
   - Shows error message
   - User can resend OTP (after 60 second countdown)

---

## 🗄️ Data Storage

### Where data is stored:

1. **`users` table** (PostgreSQL via Supabase):
   - `user_id` (UUID, primary key)
   - `phone_number`
   - `email`
   - `name`
   - `surname`
   - `date_of_birth`
   - `status` (pending/verified/suspended)
   - `created_at`

2. **Supabase Auth** (Supabase managed):
   - Auth user record (linked via email/phone)
   - Session tokens
   - OTP codes (temporary)

3. **Local Storage** (AsyncStorage):
   - Supabase session tokens
   - User preferences

---

## 🔄 Current Limitations & Notes

### Registration:
- ✅ User data stored in `users` table
- ✅ Auth user created in Supabase Auth
- ⚠️ Password is auto-generated (not user-set)
- ⚠️ Identity verification is currently mocked
- ⚠️ No email verification step

### Login:
- ✅ OTP-based authentication (SMS/Email)
- ✅ Session persistence
- ⚠️ Requires Supabase Auth SMS/Email providers to be configured
- ⚠️ No password-based login (only OTP)

### Future Improvements:
- Add password-based login option
- Implement real identity verification (replace mock)
- Add email verification step
- Add 2FA support
- Add password reset flow

---

## 🧪 Testing the Flow

### To test registration:
1. Start app: `npm run dev`
2. Navigate to registration
3. Take selfie and ID photo (mock verification)
4. Enter a national ID (will fetch from government-db)
5. Review and confirm
6. Account created!

### To test login:
1. Use a registered phone number or email
2. Click "Send Code"
3. Check console/logs for OTP (if SMS/Email not configured)
4. Enter OTP
5. Login successful!

---

## 📞 API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/government-db/{national_id}` | GET | Fetch government data |
| `/users` | POST | Create user record |
| `/find-user?phone_or_email={value}` | GET | Find user for login |
| Supabase Auth API | Various | OTP sending/verification |

---

## 🔐 Security Notes

- All API calls use SERVICE_ROLE_KEY (bypasses RLS)
- Sensitive fields (`password_hash`, `two_factor_secret`) never exposed
- OTP codes expire after 5 minutes
- Sessions stored securely in AsyncStorage
- User data encrypted at rest in database


