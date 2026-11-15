// The theme choice: System follows the device, Light and Dark are saved in localStorage.
export const THEMES = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

// Must match --bg in App.css and public/theme.js.
export const THEME_COLORS = { dark: '#070b12', light: '#f3f6ef' };

export const parseTheme = (saved) => (saved === 'light' || saved === 'dark' ? saved : 'system');

export const resolveTheme = (choice, systemDark) => (choice === 'system' ? (systemDark ? 'dark' : 'light') : choice);

export const themeColor = (theme) => THEME_COLORS[theme === 'light' ? 'light' : 'dark'];
