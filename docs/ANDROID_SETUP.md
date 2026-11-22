# MileStone — Android APK Build & Installation Guide

MileStone packages the modern React web application into a native Android container using **Capacitor**, providing hardware back-button support, status bar theming, and local notifications.

---

## 1. Prerequisites
- **Android Studio** (Koala / Ladybug or newer)
- **Android SDK** (API level 33 or 34 recommended)
- **Java Development Kit (JDK 17 or 21)** (Bundled inside Android Studio at `/Applications/Android Studio.app/Contents/jbr/Contents/Home`)

---

## 2. Compiling the Debug APK

### Automated Script (Recommended)
From the project root directory, run:
```bash
./scripts/build_apk.sh
```
This script will:
1. Build the React production bundle in `frontend/dist`.
2. Sync web assets into the Capacitor Android container (`npx cap sync android`).
3. Compile the debug APK using Gradle wrapper.
4. Output the compiled APK to:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Manual Gradle Build:
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$PATH"

cd frontend
npm run build
npx cap sync android

cd android
chmod +x ./gradlew
./gradlew assembleDebug
```

---

## 3. Installing on an Android Device

### Method A: Direct USB Installation via ADB
1. Enable **Developer Options** and **USB Debugging** on your Android device:
   - Go to *Settings* > *About phone* > Tap *Build number* 7 times.
   - Go to *Settings* > *System* > *Developer options* > Enable *USB Debugging*.
2. Connect your phone to your MacBook via USB cable.
3. Install the APK directly:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Method B: Manual File Transfer
1. Copy `android/app/build/outputs/apk/debug/app-debug.apk` to your phone via Google Drive, AirDrop-alternative, or USB transfer.
2. Open the file on your device and tap **Install** (allow installation from unknown sources if prompted).

---

## 4. Connecting the Android App to Your Backend
When launching the app for the first time on Android:
1. Tap the **Settings** icon on the bottom navigation bar.
2. Under **Backend API Server URL**, input your backend address:
   - **Android Emulator**: `http://10.0.2.2:8000` (maps directly to host MacBook).
   - **Physical Phone on same Wi-Fi**: `http://192.168.x.x:8000` (your MacBook's local Wi-Fi IP).
   - **Production / Cloud Server**: `https://milestone.yourdomain.com`.
3. Tap **Test & Save**. A green success notification will confirm the live connection!

---

## 5. Generating a Signed Release APK for Production
To generate an optimized, signed APK for distribution or Google Play:

1. Generate a signing keystore (if you don't have one):
   ```bash
   keytool -genkey -v -keystore milestone-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias milestone
   ```
2. Build the release APK with Gradle:
   ```bash
   cd frontend/android
   ./gradlew assembleRelease
   ```
   Output: `android/app/build/outputs/apk/release/app-release-unsigned.apk`
3. Sign the APK using `apksigner`:
   ```bash
   $ANDROID_HOME/build-tools/34.0.0/apksigner sign --ks milestone-release-key.jks --out app-release-signed.apk app-release-unsigned.apk
   ```
