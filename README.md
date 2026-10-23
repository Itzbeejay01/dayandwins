# Days & Wins ✦

**Every little win matters.**

A compact, thoughtful mobile journal for capturing the day, checking in with your mood, and celebrating your progress.

Built with **Laravel 13, Inertia 3, React, TypeScript, Tailwind 4, SQLite and NativePHP Mobile 4**.

## What is included

- Branded splash animation shown once per app session before login or the journal
- Laravel Fortify sign-in, registration, forgotten password and existing account settings
- Three main tabs: **Today**, **Journal**, **Growth**
- One entry per calendar day per user, with edit, delete, mood and little-win fields
- Optional private photo per journal entry; replace/remove supported
- Date calendar, text search, wins/reflections/saved filters and entry bookmarking
- Streaks, entry/win totals, actual seven-day mood graph and milestone progress
- Distinctive Days & Wins iOS design using Plus Jakarta Sans, Fraunces and Manrope
- Original externally hosted Stitch illustrations with local fallback art
- Generated NativePHP icons and launch screen in matching brand colors
- Automated feature tests for validation, privacy, ownership and uploads

## Start locally

Requires PHP **8.3+**, Composer 2, Node.js **22+**, SQLite and the PHP **GD** extension (used by NativePHP for images).

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
npm install
npm run build
composer native:art
composer run dev
```

Or run `composer setup` after setting up `.env`: it installs dependencies, runs migrations/build and generates native art.

### Test

```bash
php artisan test --filter=JournalEntryTest
npm run types:check
npm run build
composer ci:check
```

## Build for iPhone

Requires macOS, Xcode and a configured NativePHP Mobile environment.

```bash
npm run build
composer native:art
php artisan native:run ios
```

`composer native:art` produces:

- `public/icon.png` — **1024 × 1024**, for the home-screen app icon
- `public/splash.png` — **1080 × 1920**, static iOS/Android light splash
- `public/splash-dark.png` — same warm branding for dark system appearance

The native launch screen is **static** by iOS design. The journal-and-star animation that follows is React-driven in `resources/js/components/brand-splash.tsx`. There is no requirement to modify or reinstall Xcode.

If you have already run `native:install`, regenerate the art and then rebuild the app.

Set `NATIVEPHP_APP_ID` in your local `.env` to your desired bundle identifier. The example uses `com.beetechhub.daysandwins`. Update `APP_NAME` and `VITE_APP_NAME` for production branding.

## Privacy

Journal entries are always scoped to the authenticated account. Photos use the private `local` storage disk (not the public filesystem) and are served only through `GET /journal-entries/{entry}/photo` after an ownership check. On replacing, removing or deleting the entry, the associated photo is deleted.

Photos accept JPEG, PNG, WebP and HEIC/HEIF up to **10 MB**. The picker uses the web-view file input; test its integration on your actual iPhone simulator and device before App Store submission.

The image illustrations from Stitch are externally hosted Google URLs because the uploaded ZIP contains screenshots and HTML, not separate image binaries. A local SVG illustration is bundled to ensure the Today hero remains usable without internet. For a fully offline build, export licensed original images as local assets and replace the remote URLs.

## Design source and scope

Based on the uploaded Stitch export: **Today**, **My Journal**, **My Growth** and **Animated Logo Loading Screen**. Login, registration and Capture Today were built to match this established visual system because those screens were not included in the export.

Do not merge into `main` until checks pass and the design is reviewed on an actual simulator.

## Routes

| Endpoint | Purpose |
| --- | --- |
| `GET /dashboard` | Authenticated Today / Journal / Growth |
| `POST /journal-entries` | Create or update own day |
| `GET /journal-entries/{entry}/photo` | Privately view own photo |
| `PATCH /journal-entries/{entry}/favorite` | Toggle saved status |
| `DELETE /journal-entries/{entry}` | Delete own entry |
