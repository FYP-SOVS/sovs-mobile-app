import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const theme = {
  colors: {
    background: '#fafaf8',
    surface: '#ffffff',
    surfaceMuted: '#f5f4f0',
    surfaceHover: '#f2f0ea',
    border: '#ebe8e1',
    borderStrong: '#d9d5cc',
    foreground: '#0f1419',
    textPrimary: '#0f1419',
    textSecondary: '#4f5562',
    textTertiary: '#8a8e98',
    textPlaceholder: '#b5b8c0',
    navy: '#10223d',
    navyHover: '#182e4d',
    gold: '#c08b10',
    goldHover: '#a87a0d',
    goldSoft: '#faf1d8',
    goldRing: 'rgba(192, 139, 16, 0.28)',
    success: '#15803d',
    successSoft: '#e8f5ee',
    warning: '#b45309',
    warningSoft: '#fef4e1',
    info: '#1e5fbf',
    infoSoft: '#e7f0ff',
    danger: '#b42318',
    dangerSoft: '#fdecec',
    white: '#ffffff',
    overlay: 'rgba(15, 20, 25, 0.45)',
  },
  radii: {
    sm: 8,
    md: 10,
    lg: 12,
    xl: 16,
    pill: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  fonts: {
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    semibold: 'DMSans_600SemiBold',
    bold: 'DMSans_700Bold',
  },
} as const;

export type Theme = typeof theme;
export type FontWeight = keyof typeof theme.fonts;
export type ShadowLevel = 'xs' | 'sm' | 'md' | 'lg';

export function font(weight: FontWeight = 'regular'): TextStyle {
  return {
    fontFamily: theme.fonts[weight],
  };
}

export function shadow(level: ShadowLevel = 'sm'): ViewStyle {
  const shadows: Record<ShadowLevel, ViewStyle> = {
    xs: {
      shadowColor: theme.colors.foreground,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: theme.colors.foreground,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: theme.colors.foreground,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: theme.colors.foreground,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 8,
    },
  };

  return Platform.OS === 'android'
    ? { elevation: shadows[level].elevation }
    : shadows[level];
}

export const fragments = {
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  } satisfies ViewStyle,
  header: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  } satisfies ViewStyle,
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...shadow('sm'),
  } satisfies ViewStyle,
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.lg,
    color: theme.colors.textPrimary,
    ...font('regular'),
  } satisfies TextStyle,
  primaryButton: {
    backgroundColor: theme.colors.navy,
    borderRadius: theme.radii.xl,
    ...shadow('md'),
  } satisfies ViewStyle,
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...shadow('xs'),
  } satisfies ViewStyle,
  iconBadge: {
    backgroundColor: theme.colors.goldSoft,
    borderWidth: 1,
    borderColor: theme.colors.goldRing,
  } satisfies ViewStyle,
  statusBadge: {
    borderRadius: theme.radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  } satisfies ViewStyle,
};
