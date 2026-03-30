import { Colors } from '@/constants/theme';

const ThemeColors = {
  light: {
    background: Colors.lightBg,
    text: Colors.lightTextPrimary,
    tint: Colors.orange,
    icon: Colors.lightTextSecondary,
    tabIconDefault: Colors.lightTextSecondary,
    tabIconSelected: Colors.orange,
  },
  dark: {
    background: Colors.darkBg,
    text: Colors.textPrimary,
    tint: Colors.orange,
    icon: Colors.textSecondary,
    tabIconDefault: Colors.textSecondary,
    tabIconSelected: Colors.orange,
  },
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof ThemeColors.light & keyof typeof ThemeColors.dark
) {
  // Default to dark since the app uses ThemeContext for mode management
  const theme = 'dark';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return ThemeColors[theme][colorName];
  }
}
