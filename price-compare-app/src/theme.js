// Design tokens for the price-comparison dashboard.
// Treat this screen as a scoreboard/ledger, not a shopping catalogue: numbers
// are the hero, brand colors are functional wayfinding (which column is
// which), not decoration.

export const colors = {
  background: '#FAFAF9',
  surface: '#FFFFFF',
  border: '#E7E5E0',
  ink: '#1C1B1F',
  inkMuted: '#6B6A66',
  inkFaint: '#A6A49D',

  blinkit: '#F6C445',
  blinkitInk: '#4A3A00', // dark text used ON the yellow chip, for contrast
  zepto: '#7C3AED',
  zeptoInk: '#FFFFFF', // light text used ON the violet chip

  win: '#1F8A5F',
  winSoft: '#E7F5EE',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
};

// Font family keys — registered via useFonts() in App.js.
export const fonts = {
  sans: 'IBMPlexSans_400Regular',
  sansMedium: 'IBMPlexSans_500Medium',
  sansSemiBold: 'IBMPlexSans_600SemiBold',
  sansBold: 'IBMPlexSans_700Bold',
  mono: 'IBMPlexMono_500Medium',
  monoBold: 'IBMPlexMono_700Bold',
};

export function platformAccent(platform) {
  return platform === 'blinkit' ? colors.blinkit : colors.zepto;
}

export function platformInkOnAccent(platform) {
  return platform === 'blinkit' ? colors.blinkitInk : colors.zeptoInk;
}

export function platformLabel(platform) {
  return platform === 'blinkit' ? 'Blinkit' : 'Zepto';
}
