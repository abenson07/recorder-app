# Recorder App - React Native/Expo

Native mobile application for audio recording and playback, built with React Native and Expo.

## Features

- ✅ Audio Recording (start, pause, resume, stop)
- ✅ Audio Playback (play, pause, stop, seek)
- ✅ Real-time Waveform Visualization (recording & playback)
- ✅ Persistent Storage (recordings saved locally)
- ✅ Dark Theme UI with React Native Paper

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your device (for testing)

### Installation

```bash
cd native
npm install
```

### Running the App

#### Development Mode
```bash
npm start
# or
npx expo start
```

Then scan the QR code with Expo Go app (iOS) or Camera app (Android).

#### Platform-Specific
```bash
npm run android  # Android
npm run ios       # iOS
npm run web       # Web (experimental)
```

## Project Structure

```
native/
├── src/
│   ├── components/      # React Native components
│   │   ├── Dashboard.tsx
│   │   ├── Recording.tsx
│   │   ├── Playback.tsx
│   │   ├── RecordingWaveform.tsx
│   │   ├── PlaybackWaveform.tsx
│   │   └── Timestamp.tsx
│   ├── hooks/           # Custom hooks
│   │   ├── useRecorder.ts
│   │   ├── usePlayer.ts
│   │   └── useRealtimeWaveform.ts
│   ├── lib/             # Utilities
│   │   ├── storageAdapter.ts
│   │   └── audioUtils.ts
│   ├── store/           # State management
│   │   └── useStore.ts
│   └── shared/          # Shared code (types, store logic)
├── assets/              # Images, icons
├── app.json             # Expo configuration
└── package.json
```

## Build for Production

### Android
```bash
npx expo build:android
# or use EAS Build (recommended)
eas build --platform android
```

### iOS
```bash
npx expo build:ios
# or use EAS Build (recommended)
eas build --platform ios
```

## Configuration

### Permissions

The app requires:
- **Microphone**: For audio recording
- **Storage** (Android): For saving audio files

Permissions are automatically requested when needed via Expo AV.

### Storage

- Recordings are saved to the device's document directory
- Metadata is stored in AsyncStorage
- Audio files use M4A format (native) or WebM (web)

## Known Limitations

1. **Waveform Peaks**: Currently using synthetic peaks. Real audio processing requires additional native modules or libraries.

2. **File Size Limit**: Recordings are limited to 25MB to prevent storage issues.

## Troubleshooting

### Clear Cache
```bash
npx expo start --clear
```

### Reset Metro Bundler
```bash
npm start -- --reset-cache
```

### Common Issues

- **"Property 'StyleSheet' doesn't exist"**: Ensure all imports are correct
- **"Module not found"**: Clear cache and reinstall dependencies
- **Permission errors**: Check app.json permissions configuration

## Development Notes

- Shared code must be manually synced to `native/src/shared/` (Metro bundler limitation)
- Use `expo-file-system/legacy` for FileSystem API to avoid deprecation warnings
- Audio recording uses Expo AV Recording API
- Audio playback uses Expo AV Sound API

