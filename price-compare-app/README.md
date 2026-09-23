# price-compare app

A React Native (Expo) dashboard: search a product, the app calls the
price-compare backend, and shows a live Blinkit vs Zepto comparison —
biggest saving first, full sortable list below, plus what's exclusive to
each platform.

There is no bundled sample data. Every result on screen comes from a live
call to the backend; before a search, the screen just says so.

## Tech stack

- Expo SDK 57 / React Native 0.86 / React 19
- `react-native-safe-area-context` (the core `SafeAreaView` is deprecated in
  this RN version)
- `@expo-google-fonts/ibm-plex-sans` + `@expo-google-fonts/ibm-plex-mono` —
  sans for names/labels, mono for prices (a deliberate "ledger" look, not
  decoration — see `src/theme.js`)
- No navigation library, no state management library — one screen, plain
  `useState`. Nothing here justified the extra dependency.

## Running it

You need the backend running first (see its own README) — this app has
nothing to show without it.

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (Android/iOS), or press `i` / `a` for a
simulator if you have Xcode/Android Studio set up.

### Pointing the app at the backend

Edit `API_BASE_URL` in `src/api.js`:

- iOS Simulator: `http://localhost:8000` works as-is.
- Android Emulator: use `http://10.0.2.2:8000`.
- Physical phone via Expo Go: your computer's LAN IP, e.g.
  `http://192.168.1.23:8000` — the phone and computer need to be on the
  same Wi-Fi network. Find your IP with `ipconfig getifaddr en0` (Mac),
  `hostname -I` (Linux), or `ipconfig` (Windows, look for IPv4 Address).

## Project layout

```
App.js                        loads fonts, renders DashboardScreen
src/theme.js                  colors, type, spacing tokens + platform-color helpers
src/api.js                    the only file that knows the backend's URL/shape
src/constants.js              sort options, example search queries
src/hooks/useComparisonSearch.js   owns the search state machine (idle/loading/error/success)
src/utils/
  comparisonSelectors.js       pure functions: win counts, biggest saving, sorting
  formatRelativeTime.js        "3m ago" style formatting
src/screens/DashboardScreen.js  orchestration only — hook + selectors + composed components
src/components/
  SearchBar.js                  the query input
  IdleState.js / LoadingState.js / ErrorState.js / NoMatchesFound.js
                                 the four states a search can be in, sharing StatusMessage.js's layout
  SortSelector.js               the sort chip row
  PlatformErrorBanner.js        surfaces a partial backend failure (one platform failed, not both)
  BestDealBanner.js             highlights the single biggest saving
  ScoreBoard.js                 "cheaper on N of M" head-to-head strip
  ComparisonCard.js             one matched product, both prices, winner highlighted
  CollapsibleSection.js         wrapper for the "Only on Blinkit/Zepto" lists
  PlatformOnlyRow.js            a row inside those sections
```

`DashboardScreen.js` holds no business logic itself — state lives in
`useComparisonSearch`, derived data (win counts, sorting, the biggest
saving) lives in `comparisonSelectors`, and every visual state is its own
named component. The screen's only job is wiring those together.

## Verified, not just written

This was scaffolded with `create-expo-app`, the real font packages were
installed, and the whole thing was run through Metro (`npx expo export`),
which bundled every module and produced a real Hermes bytecode bundle —
so it's confirmed to compile, even without a simulator on hand to show it
running.

There's no way to preview a React Native app from inside a chat interface —
it's a native mobile runtime, not a web page — so `npx expo start` on your
own machine is the only way to actually see this on a screen.
