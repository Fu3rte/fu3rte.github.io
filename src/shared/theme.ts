export type Theme = 'light' | 'dark';

export const THEME_KEY = 'theme';

const MEDIA = '(prefers-color-scheme: dark)';

// useSyncExternalStore 要求快照在两次读取之间同值，字符串在这里做缓存即可
let cached: Theme | null = null;

export function currentTheme(): Theme {
  if (cached) return cached;
  const saved = localStorage.getItem(THEME_KEY);
  cached = saved === 'light' || saved === 'dark'
    ? saved
    : window.matchMedia(MEDIA).matches ? 'dark' : 'light';
  return cached;
}

export function applyTheme(theme: Theme): void {
  cached = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

// 未落过偏好时跟随系统：媒体查询的变化即最新意图；一旦显式选过，localStorage 说了算
export function subscribeTheme(onChange: (theme: Theme) => void): () => void {
  const media = window.matchMedia(MEDIA);
  const onSystemChange = (): void => {
    // 系统偏好换了，按系统值算的缓存要作废重读
    if (!localStorage.getItem(THEME_KEY)) cached = null;
    onChange(currentTheme());
  };
  const onSiteChange = (): void => onChange(currentTheme());
  media.addEventListener('change', onSystemChange);
  window.addEventListener('themechange', onSiteChange);
  return () => {
    media.removeEventListener('change', onSystemChange);
    window.removeEventListener('themechange', onSiteChange);
  };
}
