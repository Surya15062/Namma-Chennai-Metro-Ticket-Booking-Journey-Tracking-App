export const DarkColors = {
  bgBase:       '#1C191A', // Main background - slightly warm, not pure black
  bgSurface:    '#252223', // Layer 1 (Card surface) - clear separation
  bgCard:       '#2E2B2C', // Layer 2 (Elevated modal/card)
  bgCardHover:  '#373435', // Highlight state
  bgInput:      'rgba(255, 255, 255, 0.06)', // Input surface

  greenLine:    '#10B981', 
  greenDim:     'rgba(16, 185, 129, 0.15)',
  blueLine:     '#3B82F6', 
  blueDim:      'rgba(59, 130, 246, 0.15)',
  interchange:  '#F59E0B', 
  interchangeDim: 'rgba(245, 158, 11, 0.15)',

  textPrimary:   '#FDFDFD', // Bright readable soft white
  textSecondary: '#AFAAB0', // Muted light gray with slight warmth
  textMuted:     '#807C81', // Visible but subtle placeholder

  accent:       '#FF0A54', // Primary Brand Color
  accentGlow:   'rgba(255, 10, 84, 0.25)', // Increased glow visibility for dark mode
  danger:       '#EF4444', 
  success:      '#10B981', 
  warning:      '#F59E0B', 

  border:       'rgba(255, 255, 255, 0.10)', // Visible borders
  borderHover:  'rgba(255, 255, 255, 0.18)',

  transparent:  'transparent',
  white:        '#ffffff',
  black:        '#000000',
};

export const LightColors = {
  bgBase:       '#FCF7F8', // Crisp very light pinkish-white
  bgSurface:    '#FFFFFF', // Layer 1
  bgCard:       '#FFFFFF', // Elevated Layer 2
  bgCardHover:  '#F8F0F2',
  bgInput:      'rgba(0, 0, 0, 0.03)',

  greenLine:    '#059669', 
  greenDim:     'rgba(5, 150, 105, 0.12)',
  blueLine:     '#2563EB', 
  blueDim:      'rgba(37, 99, 235, 0.12)',
  interchange:  '#D97706', 
  interchangeDim: 'rgba(217, 119, 6, 0.12)',

  textPrimary:   '#0F172A', 
  textSecondary: '#475569', 
  textMuted:     '#94A3B8', 

  accent:       '#FF0A54', // Primary Brand Color
  accentGlow:   'rgba(255, 10, 84, 0.12)',
  danger:       '#DC2626', 
  success:      '#059669', 
  warning:      '#D97706', 

  border:       'rgba(0, 0, 0, 0.08)',
  borderHover:  'rgba(0, 0, 0, 0.15)',

  transparent:  'transparent',
  white:        '#ffffff',
  black:        '#000000',
};

// Default fallback to prevent missing imports before rewrite completes
export const Colors = DarkColors;

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  xxxl: 48,
} as const;

export const Radius = {
  sm:   8,
  md:   12,
  lg:   20,
  xl:   32,
  pill: 999,
} as const;

export const Typography = {
  xs:   { fontSize: 12, lineHeight: 16 },
  sm:   { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 24 },
  md:   { fontSize: 18, lineHeight: 26 },
  lg:   { fontSize: 22, lineHeight: 28 },
  xl:   { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  xxl:  { fontSize: 36, lineHeight: 40, fontWeight: '800' },
  display: { fontSize: 52, lineHeight: 56, fontWeight: '800', letterSpacing: -1.5 },
} as const;

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  glow: {
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
