export const Colors = {
  // Dark backgrounds
  darkBg: '#0a0c0f',
  darkSecondary: '#1a1e24',
  darkCard: '#1e2329',
  darkBorder: '#2d3748',
  inputBg: '#2d3748',
  inputBorder: '#4a5568',

  // Light backgrounds
  lightBg: '#f5f7fa',
  lightSecondary: '#edf2f7',
  lightCard: '#ffffff',
  lightBorder: '#e2e8f0',
  lightInputBg: '#f0f4f8',
  lightInputBorder: '#cbd5e1',

  // Orange accent
  orange: '#f97316',
  orangeHover: '#fb923c',
  orangeLight: 'rgba(249, 115, 22, 0.1)',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',

  // Light text
  lightTextPrimary: '#1a202c',
  lightTextSecondary: '#4a5568',
  lightTextMuted: '#a0aec0',

  // Status colors
  errorBg: 'rgba(239, 68, 68, 0.1)',
  errorText: '#f87171',
  successBg: 'rgba(34, 197, 94, 0.1)',
  successText: '#4ade80',
  warningBg: 'rgba(251, 191, 36, 0.1)',
  warningText: '#fbbf24',

  // Status badges
  statusPending: '#fbbf24',
  statusInProgress: '#60a5fa',
  statusCompleted: '#4ade80',
  statusRejected: '#f87171',
};

export const StatusColors: Record<string, { bg: string; text: string }> = {
  pending:     { bg: 'rgba(251, 191, 36, 0.15)',  text: '#fbbf24' },
  in_progress: { bg: 'rgba(96, 165, 250, 0.15)',  text: '#60a5fa' },
  completed:   { bg: 'rgba(74, 222, 128, 0.15)',  text: '#4ade80' },
  rejected:    { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171' },
};

export const StatusLabels: Record<string, string> = {
  pending:     'Pending',
  in_progress: 'In Progress',
  completed:   'Completed',
  rejected:    'Rejected',
};

export const Fonts = {
  rounded: 'System',
  mono: 'monospace',
};

// Helper to get theme-aware colors
export function getThemeColors(isDark: boolean) {
  return {
    bg: isDark ? Colors.darkBg : Colors.lightBg,
    secondary: isDark ? Colors.darkSecondary : Colors.lightSecondary,
    card: isDark ? Colors.darkCard : Colors.lightCard,
    border: isDark ? Colors.darkBorder : Colors.lightBorder,
    inputBg: isDark ? Colors.inputBg : Colors.lightInputBg,
    inputBorder: isDark ? Colors.inputBorder : Colors.lightInputBorder,
    text: isDark ? Colors.textPrimary : Colors.lightTextPrimary,
    textSecondary: isDark ? Colors.textSecondary : Colors.lightTextSecondary,
    textMuted: isDark ? Colors.textMuted : Colors.lightTextMuted,
    orange: Colors.orange,
    orangeLight: Colors.orangeLight,
    errorBg: Colors.errorBg,
    errorText: Colors.errorText,
    statusBar: isDark ? 'light' as const : 'dark' as const,
  };
}
