// Must match --bg in App.css and public/theme.js.
export const THEME_COLORS = { dark: '#070b12', light: '#f3f6ef' };

export const themeColor = (theme) => THEME_COLORS[theme === 'light' ? 'light' : 'dark'];
