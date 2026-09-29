export const lightColors = {
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    iconBg: '#F2F2F7',
    divider: '#C6C6C8',
    chevron: '#C7C7CC',
    danger: '#FF3B30',
    dangerBg: 'rgba(255, 59, 48, 0.08)',
    dangerBadgeBg: 'rgba(255, 59, 48, 0.12)',
    switchTrackOff: '#E5E5EA',
};

export const darkColors: typeof lightColors = {
    background: '#000000',
    surface: '#28282e',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    iconBg: '#2C2C2E',
    divider: '#38383A',
    chevron: '#48484A',
    danger: '#FF453A',
    dangerBg: 'rgba(255, 69, 58, 0.12)',
    dangerBadgeBg: 'rgba(255, 69, 58, 0.18)',
    switchTrackOff: '#58585a',
};

export type ThemeColors = typeof lightColors;