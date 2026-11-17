import { ChromeIconSvg, ChromePill } from './ChromePill';
import { themeStore, useThemePreference, type ThemePreference } from './theme';

const LABEL: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

/**
 * Home's theme control: one ChromePill, top-left. Each tap cycles
 * System → Light → Dark. The icon and aria-label show the current mode.
 */
export function ThemeToggle() {
  const pref = useThemePreference();
  return (
    <ChromePill
      corner="top-left"
      ariaLabel={`Theme: ${LABEL[pref]}`}
      onClick={() => themeStore.cycle()}
    >
      {pref === 'system' ? <SystemIcon /> : pref === 'light' ? <SunIcon /> : <MoonIcon />}
    </ChromePill>
  );
}

/** Half-filled circle — System. */
function SystemIcon() {
  return (
    <ChromeIconSvg>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
    </ChromeIconSvg>
  );
}

function SunIcon() {
  return (
    <ChromeIconSvg>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </ChromeIconSvg>
  );
}

function MoonIcon() {
  return (
    <ChromeIconSvg>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
    </ChromeIconSvg>
  );
}
