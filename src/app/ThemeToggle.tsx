import { useSyncExternalStore } from 'react';
import { t } from '../shared/i18n';
import { applyTheme, currentTheme, subscribeTheme } from '../shared/theme';

export default function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(onChange => subscribeTheme(onChange), currentTheme);

  return (
    <label className={className ? `theme-switch ${className}` : 'theme-switch'}>
      <input
        className="theme-switch-input"
        type="checkbox"
        role="switch"
        checked={theme === 'dark'}
        aria-label={t('theme.aria')}
        onChange={event => applyTheme(event.target.checked ? 'dark' : 'light')}
      />
      <div className="theme-switch-hole">
        <div className="theme-switch-lever">
          <div className="theme-switch-cast is-top">
            <div className="theme-switch-blade is-top" />
          </div>
          <div className="theme-switch-cast is-bottom">
            <div className="theme-switch-blade is-bottom" />
          </div>
          <div className="theme-switch-face is-top">
            <div className="theme-switch-lip is-top" />
          </div>
          <div className="theme-switch-face is-bottom">
            <div className="theme-switch-lip is-bottom" />
          </div>
        </div>
      </div>
    </label>
  );
}
