# Building APK for SOVS App

## Prerequisites

- ✅ EAS CLI installed
- ✅ Logged into Expo account
- ✅ Git repository initialized

## Build Steps

### 1. Initialize EAS Project (First time only)

```bash
eas init
```

This will:

- Create an EAS project linked to your Expo account
- Configure the project for builds

### 2. Build the APK

**Option A: Preview/Development APK (Recommended for testing)**

```bash
eas build --platform android --profile preview
```

**Option B: Production APK**

```bash
eas build --platform android --profile production
```

### 3. Build Process

The build will:

- Upload your code to Expo's servers
- Build the APK in the cloud
- Provide you with a download link when complete

**Build times:** Usually 10-20 minutes for the first build

### 4. Download the APK

Once the build completes:

- You'll receive a notification
- Download the APK from the provided URL
- Install it on your Android device

## Alternative: Local Build (Faster, but requires Android SDK)

If you want to build locally instead:

```bash
eas build --platform android --profile preview --local
```

This requires:

- Android SDK installed
- Java Development Kit (JDK)
- More setup, but builds are faster

## Build Configuration

The `eas.json` file is already configured with:

- ✅ APK build type (not AAB)
- ✅ Preview and production profiles
- ✅ All necessary settings

## Notes

- **First build:** May take longer (15-20 minutes)
- **Subsequent builds:** Faster if no major changes
- **APK location:** Download link will be provided in terminal and email
- **Installation:** Enable "Install from Unknown Sources" on Android device to install the APK

## Troubleshooting

If you encounter issues:

1. Make sure you're logged in: `eas whoami`
2. Check your Expo account has build credits (free tier has limits)
3. Verify app.json configuration is correct
4. Check EAS status: https://expo.dev/accounts/[your-account]/projects/sovs/builds
