#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=================================================="
echo "🤖 Building MileStone Android APK via Capacitor"
echo "=================================================="

# Detect or set JAVA_HOME
if [ -z "$JAVA_HOME" ]; then
    if [ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]; then
        export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
    elif [ -d "/Library/Java/JavaVirtualMachines" ]; then
        export JAVA_HOME=$(/usr/libexec/java_home 2>/dev/null || true)
    fi
fi

# Detect or set ANDROID_HOME
if [ -z "$ANDROID_HOME" ]; then
    if [ -d "$HOME/Library/Android/sdk" ]; then
        export ANDROID_HOME="$HOME/Library/Android/sdk"
    fi
fi

if [ -n "$JAVA_HOME" ]; then
    export PATH="$JAVA_HOME/bin:$PATH"
    echo "☕ Using Java: $($JAVA_HOME/bin/java -version 2>&1 | head -n 1)"
else
    echo "⚠️ Warning: JAVA_HOME not set. If build fails, install Java 17+ or Android Studio."
fi

if [ -n "$ANDROID_HOME" ]; then
    echo "📱 Using Android SDK: $ANDROID_HOME"
else
    echo "⚠️ Warning: ANDROID_HOME not set."
fi

# Step 1: Build React Production bundle
echo "📦 Step 1/3: Building React production bundle..."
cd "$DIR/frontend"
npm run build

# Step 2: Sync Capacitor web assets into Android project
echo "🔄 Step 2/3: Syncing web assets with Capacitor Android..."
npx cap sync android

# Step 3: Compile Debug APK using Gradle
echo "🔨 Step 3/3: Assembling Debug APK with Gradle..."
cd "$DIR/frontend/android"
chmod +x ./gradlew
./gradlew assembleDebug

APK_PATH="$DIR/frontend/android/app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$APK_PATH" ]; then
    echo "=================================================="
    echo "🎉 SUCCESS: Debug APK successfully compiled!"
    echo "   File: $APK_PATH"
    echo "   Size: $(ls -lh "$APK_PATH" | awk '{print $5}')"
    echo "=================================================="
    echo ""
    echo "📲 How to install on your Android device:"
    echo "   1. Connect device via USB with USB Debugging enabled"
    echo "   2. Run: adb install -r \"$APK_PATH\""
    echo "   OR transfer the APK to your phone and tap to install."
    echo ""
    echo "🔐 To build a signed release APK for Google Play / Production:"
    echo "   cd frontend/android && ./gradlew assembleRelease"
else
    echo "❌ Error: APK compilation did not produce expected file at $APK_PATH"
    exit 1
fi
