# Example App Assets

This directory should contain the following PNG image files required by Expo:

| File | Size | Purpose |
|---|---|---|
| `icon.png` | 1024×1024 | App icon (iOS & Android) |
| `adaptive-icon.png` | 1024×1024 | Android adaptive icon foreground |
| `splash.png` | 1284×2778 | Splash screen |
| `favicon.png` | 48×48 | Web favicon |

## Generating assets

You can generate these from the included `icon.svg` placeholder:

```sh
# Install Inkscape or use an online converter to convert icon.svg to icon.png
# Then use Expo's image tool to generate all sizes:
npx expo-image-utils icon icon.png
```

Or use an online service like:
- https://www.appicon.co/ for app icons
- https://apetools.webprofusion.com/ for splash screens

## For local development

The Expo Go app works without custom icons/splash. These assets are only
required when building a **standalone** app with EAS Build or `expo build`.

You can start the app immediately with `npm start` without replacing these files.
