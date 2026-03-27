# SOVS - Secure Online Voting System

A comprehensive mobile application for secure online voting with identity verification, built with React Native and Expo.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Development](#development)
- [Services & APIs](#services--apis)
- [Authentication Flow](#authentication-flow)
- [Registration Flow](#registration-flow)
- [Internationalization](#internationalization)
- [Building & Deployment](#building--deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🎯 Overview

SOVS (Secure Online Voting System) is a mobile application designed to enable secure, verified online voting—including **casting ballots on mobile**—alongside the SOVS web portal. The app implements a robust identity verification system using government databases and third-party verification services (Didit) to ensure only legitimate voters can participate in elections.

### Key Capabilities

- **Identity Verification**: Multi-step verification process using government ID and biometric verification (registration is completed in the mobile app)
- **Voting**: Cast votes in the app or on the web portal using the same verified account
- **Secure Authentication**: OTP-based login system (phone/email)
- **Multi-language Support**: English and Turkish
- **Cross-platform**: iOS, Android, and Web support
- **Real-time Verification**: Integration with government databases and Didit verification service

## ✨ Features

### Core Features

1. **Onboarding Experience**
   - Interactive splash screen with feature highlights
   - First-time user guidance
   - Skip functionality

2. **Identity Verification**
   - Didit integration for document verification
   - Selfie capture for liveness detection
   - Government database cross-referencing
   - Real-time verification status

3. **User Registration**
   - Multi-step registration process
   - Government data verification
   - Account creation with secure password
   - Email verification support

4. **Authentication**
   - Phone number or email login
   - OTP (One-Time Password) verification
   - Secure session management
   - Auto-logout functionality

5. **Dashboard & Voting**
   - Account status overview
   - Verification status display
   - Election information and **in-app voting** (same account as the web portal)

6. **Profile Management**
   - Personal information display
   - Verification status tracking
   - Language switching
   - Account logout

7. **Internationalization**
   - English and Turkish language support
   - Persistent language preference
   - Context-aware translations

## 🛠 Tech Stack

### Core Technologies

- **React Native**: 0.81.4
- **Expo**: ~54.0.30
- **TypeScript**: 5.9.2
- **Expo Router**: ~6.0.8 (File-based routing)

### Key Libraries

- **@supabase/supabase-js**: Backend authentication and database
- **@react-native-async-storage/async-storage**: Local data persistence
- **expo-camera**: Camera access for identity verification
- **expo-web-browser**: OAuth and external browser sessions
- **lucide-react-native**: Icon library
- **react-native-gesture-handler**: Gesture handling
- **react-native-reanimated**: Animations

### Development Tools

- **Expo CLI**: Development and build tools
- **EAS Build**: Cloud-based builds
- **TypeScript**: Type safety

## 🏗 Architecture

### Application Architecture

```
┌─────────────────────────────────────────┐
│         React Native App                │
│  (Expo Router - File-based routing)    │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│   Contexts │  │   Services  │
│            │  │             │
│ Language   │  │ Auth        │
│            │  │ API         │
│            │  │ Supabase    │
│            │  │ Didit       │
└────────────┘  └──────┬───────┘
                      │
         ┌────────────┴────────────┐
         │                         │
┌────────▼────────┐      ┌────────▼────────┐
│  Supabase       │      │  Cloud          │
│  (Auth + DB)    │      │  Functions      │
│                 │      │                 │
│  - Users        │      │  - User CRUD    │
│  - Sessions     │      │  - Gov DB       │
│  - Auth         │      │  - Didit API     │
└─────────────────┘      └─────────────────┘
```

### Data Flow

1. **Registration Flow**:
   - User → Identity Verification (Didit) → Government DB Verification → Account Creation → Supabase Auth

2. **Authentication Flow**:
   - User → Phone/Email Input → OTP Request → Supabase Auth → Session Creation

3. **Data Retrieval**:
   - App → Cloud Functions → Supabase Database → Response → App

## 📁 Project Structure

```
sovs-mobile/
├── app/                          # Expo Router pages
│   ├── _layout.tsx              # Root layout with providers
│   ├── _splash.tsx              # Onboarding splash screen
│   ├── index.tsx                 # Welcome/home screen
│   ├── (tabs)/                   # Tab navigation group
│   │   ├── _layout.tsx          # Tab layout
│   │   ├── index.tsx            # Dashboard/home tab
│   │   └── profile.tsx           # Profile tab
│   ├── register/                 # Registration flow
│   │   ├── identity.tsx          # Step 1: Identity verification
│   │   ├── confirmation.tsx     # Step 2: Confirm information
│   │   ├── password.tsx          # Step 2 (alt): Password setup
│   │   ├── government-data.tsx   # Step 2: Government data verification
│   │   ├── confirm.tsx           # Step 3: Final confirmation
│   │   ├── success.tsx           # Registration success
│   │   └── email-verified.tsx    # Email verification confirmation
│   └── +not-found.tsx            # 404 page
├── contexts/                     # React contexts
│   └── LanguageContext.tsx       # Language/i18n context
├── hooks/                        # Custom React hooks
│   └── useFrameworkReady.ts      # Framework initialization hook
├── i18n/                         # Internationalization
│   └── translations.ts          # Translation strings (EN/TR)
├── services/                     # Business logic & API services
│   ├── api.ts                   # API client & endpoints
│   ├── auth.ts                   # Authentication service
│   ├── supabase.ts              # Supabase client configuration
│   ├── diditSession.ts          # Didit session management
│   └── diditVerification.ts      # Didit verification service
├── app.json                      # Expo configuration
├── app.plugin.js                 # Expo config plugin (Android cleartext)
├── eas.json                      # EAS Build configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm** or **yarn**: Package manager
- **Expo CLI**: `npm install -g expo-cli` or use `npx expo`
- **Expo Go App**: For mobile testing (iOS/Android)
- **Supabase Project**: Backend setup (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd sovs-mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment** (optional):
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   EXPO_PUBLIC_FUNCTIONS_URL=https://your-project.supabase.co/functions/v1
   ```
   
   **Note**: Default values are already configured in `services/supabase.ts`, so this step is optional.

4. **Start the development server**:
   ```bash
   npm run dev
   # or
   npx expo start
   ```

5. **Run on your device**:
   - **iOS**: Press `i` in the terminal or scan QR code with Camera app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

## ⚙️ Configuration

### App Configuration (`app.json`)

Key configuration points:

- **App Name**: "SOVS"
- **Package Name**: `com.sovs.app` (Android)
- **Scheme**: `myapp` (for deep linking)
- **Permissions**: Camera (for identity verification)
- **Orientation**: Portrait

### Supabase Configuration

The app connects to Supabase for:
- User authentication
- Database operations
- Cloud functions

Configuration is in `services/supabase.ts`. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed setup.

### Didit Integration

The app uses Didit for identity verification:
- Document scanning
- Liveness detection
- Biometric verification

Configuration is handled through cloud functions. The app creates sessions and polls for results.

## 💻 Development

### Development Commands

```bash
# Start development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for web
npm run build:web
```

### Code Structure Guidelines

1. **Components**: Use functional components with hooks
2. **Styling**: StyleSheet API (no external CSS)
3. **Navigation**: Expo Router file-based routing
4. **State Management**: React Context API + Local State
5. **API Calls**: Centralized in `services/` directory
6. **Type Safety**: TypeScript throughout

### Adding New Features

1. **New Screen**: Create file in `app/` directory
2. **New Service**: Add to `services/` directory
3. **New Context**: Add to `contexts/` directory
4. **New Translation**: Add keys to `i18n/translations.ts`

### Testing

Currently, the app uses manual testing. For automated testing:

1. Set up Jest and React Native Testing Library
2. Create test files alongside components
3. Run tests with `npm test`

## 🔌 Services & APIs

### Authentication Service (`services/auth.ts`)

Handles all authentication operations:

- `registerUser()`: Register new user with Supabase Auth
- `sendOTP()`: Send OTP to phone/email
- `verifyOTP()`: Verify OTP and create session
- `signOut()`: Sign out current user
- `getCurrentUser()`: Get authenticated user
- `getCurrentSession()`: Get current session
- `validateNationalId()`: Validate national ID in government DB

### API Service (`services/api.ts`)

Centralized API client with endpoints:

**Users API**:
- `usersAPI.create()`: Create user
- `usersAPI.getById()`: Get user by ID
- `usersAPI.getByPhoneOrEmail()`: Find user by phone/email
- `usersAPI.update()`: Update user

**Government DB API**:
- `governmentDBAPI.getByNationalId()`: Get government record

**Didit Session API**:
- `diditSessionAPI.create()`: Create/resume Didit session
- `diditSessionAPI.getResults()`: Get session results

### Supabase Client (`services/supabase.ts`)

Supabase client configuration:
- URL and anon key
- Auth storage (AsyncStorage)
- Session management

### Didit Services

- `diditSession.ts`: Session creation and management
- `diditVerification.ts`: Document verification (legacy, not actively used)

## 🔐 Authentication Flow

### Registration Flow

```
1. User opens app → Onboarding (first time)
2. Welcome screen → "Get Started"
3. Identity Verification:
   - Enter phone & email
   - Open Didit verification window
   - Complete: selfie + ID photos
   - Poll for verification results
4. Confirmation Screen:
   - Review extracted data
   - Enter/confirm phone & email
5. Account Creation:
   - Validate national ID in government DB
   - Create Supabase Auth user
   - Call register-voter cloud function
   - Create user record in database
6. Success Screen → Dashboard
```

### Login Flow

```
1. User enters phone number or email
2. System sends OTP via Supabase Auth
3. User enters OTP code
4. System verifies OTP
5. Session created → Dashboard
```

### Voting (verified voters)

- Cast ballots **in the mobile app** during open elections, or use the **SOVS web portal** with the same account.
- Registration remains **mobile-only**; voting is available on **web and mobile**.

### Session Management

- Sessions stored in AsyncStorage (mobile) or localStorage (web)
- Auto-refresh enabled
- Session persistence across app restarts

## 📝 Registration Flow Details

### Step 1: Identity Verification (`register/identity.tsx`)

- User enters phone number and email
- Creates Didit verification session
- Opens Didit verification window (web browser)
- User completes:
  - Selfie capture
  - ID document photos (front/back)
- App polls for verification results
- On approval, extracts user data and proceeds

### Step 2: Confirmation (`register/confirmation.tsx`)

- Displays verified information from Didit
- User confirms/edits phone number and email
- Validates required fields
- Proceeds to account creation

### Step 3: Account Creation

- Validates national ID exists in government database
- Creates Supabase Auth user (email + auto-generated password)
- Calls `register-voter` cloud function which:
  - Creates user record in `users` table
  - Assigns "VOTER" role
  - Links to government database record
- On success, redirects to success screen

### Alternative Flow: Password Setup (`register/password.tsx`)

Alternative registration flow that includes password setup:
- User sets password with strength requirements
- Password validation and strength indicator
- Form persistence (survives page reloads)

## 🌍 Internationalization

### Language Support

- **English** (en): Default language
- **Turkish** (tr): Full translation

### Implementation

- **Context**: `LanguageContext` provides language state and translation function
- **Storage**: Language preference stored in AsyncStorage
- **Translations**: Centralized in `i18n/translations.ts`

### Usage

```typescript
import { useTranslation } from '@/contexts/LanguageContext';

function MyComponent() {
  const { t, language, setLanguage } = useTranslation();
  
  return (
    <Text>{t('welcome.title')}</Text>
  );
}
```

### Adding New Languages

1. Add language code to `Language` type in `i18n/translations.ts`
2. Add translation object to `translations` object
3. Update language switcher UI

## 🏗 Building & Deployment

### Development Build

```bash
# Start development server
npm run dev
```

### Web Build

```bash
npm run build:web
```

Output: `dist/` directory with static files.

### Android Build

See [BUILD_APK.md](./BUILD_APK.md) for detailed instructions.

**Quick build**:
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build
eas build --platform android --profile preview
```

### iOS Build

```bash
eas build --platform ios --profile preview
```

### EAS Build Profiles

Configured in `eas.json`:
- **development**: Development client builds
- **preview**: Internal distribution (APK/IPA)
- **production**: Production builds

## 🐛 Troubleshooting

### Common Issues

#### 1. "Network request failed"

**Cause**: Backend not accessible or wrong URL

**Solution**:
- Check `EXPO_PUBLIC_FUNCTIONS_URL` in `services/supabase.ts`
- Verify backend is running
- Check network connectivity

#### 2. "User already exists" during registration

**Cause**: User was previously registered or registration partially completed

**Solution**: The app handles this automatically by retrieving existing user

#### 3. Camera not working

**Cause**: Permissions not granted

**Solution**:
- Grant camera permissions when prompted
- Check `app.json` camera configuration
- On Android: Check app permissions in Settings

#### 4. OTP not received

**Cause**: Supabase Auth not configured for SMS/Email

**Solution**:
- Configure SMS provider in Supabase (Twilio, etc.)
- Configure email provider in Supabase
- Check Supabase logs for delivery errors

#### 5. Didit verification fails

**Cause**: Network issues or Didit service unavailable

**Solution**:
- Check Didit API status
- Verify cloud function is deployed
- Check network connectivity

#### 6. TypeScript errors

**Solution**:
```bash
npm run typecheck
# Fix reported errors
```

#### 7. Build errors

**Solution**:
```bash
# Clear cache
npx expo start -c

# Fix dependencies
npx expo install --fix
```

### Debug Mode

Enable debug logging:
- Check browser console (web)
- Check React Native Debugger
- Check Expo DevTools

## 📚 Additional Documentation

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md): Supabase configuration guide
- [ANDROID_SETUP.md](./ANDROID_SETUP.md): Android development setup
- [BUILD_APK.md](./BUILD_APK.md): APK building instructions

## 🤝 Contributing

### Development Workflow

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

### Code Style

- Use TypeScript
- Follow React Native best practices
- Use functional components
- Add comments for complex logic
- Keep components focused and small

### Commit Messages

Use clear, descriptive commit messages:
```
feat: Add password strength indicator
fix: Resolve camera permission issue
docs: Update README with new setup steps
```

## 📄 License

[Add your license information here]

## 👥 Team

[Add team/contributor information here]

## 🔗 Links

- **Backend API**: [API Documentation]
- **Supabase Dashboard**: [Supabase Project]
- **Expo Dashboard**: [Expo Project]

---

**Last Updated**: [Current Date]

**Version**: 1.0.0
