# Running on Android with Expo

## Quick Start

1. **Start the Expo development server:**

   ```bash
   npm run dev
   ```

   or

   ```bash
   npx expo start
   ```

2. **Connect your Android device:**

   **Option A: Using Expo Go app (Recommended for development)**

   - Install "Expo Go" from Google Play Store on your Android device
   - Make sure your phone and computer are on the same Wi-Fi network
   - Scan the QR code shown in the terminal with Expo Go app
   - Or press `a` in the terminal to open on Android device/emulator

   **Option B: Using Android Emulator**

   - Make sure you have Android Studio installed with an emulator set up
   - Start an Android emulator
   - Press `a` in the terminal when Expo starts, or the app will automatically launch

   **Option C: Using USB Debugging**

   - Enable Developer Options and USB Debugging on your Android device
   - Connect device via USB
   - Run `adb devices` to verify connection
   - Press `a` in the Expo terminal

## Android Configuration

The app is configured with:

- ✅ Camera permissions for identity verification
- ✅ Package name: `com.securevotingsystem.app`
- ✅ All required Expo plugins (camera, router, etc.)

## Troubleshooting

**If camera doesn't work:**

- Make sure you granted camera permissions when prompted
- Check that `expo-camera` plugin is properly configured (it is in app.json)

**If app doesn't connect:**

- Ensure phone and computer are on same Wi-Fi network
- Try restarting Expo development server
- Check firewall settings aren't blocking connections

**If you see build errors:**

- Run `npx expo install --fix` to fix dependency versions
- Clear cache: `npx expo start -c`

## Building for Production

To create a production build for Android:

```bash
npx expo build:android
```

Or use EAS Build:

```bash
npm install -g eas-cli
eas build --platform android
```

