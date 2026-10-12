import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { t } from './i18n';

const HOLD = 1600;

export default function CopyValue({ value, children }: { value: string; children?: ReactNode }) {
  const timer = useRef<number | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    window.clearTimeout(timer.current);
    setCopied(true);
    timer.current = window.setTimeout(() => setCopied(false), HOLD);
  };

  return (
    <button
      type="button"
      className="copy-value"
      data-copied={copied}
      aria-label={`${t('contact.copy')}: ${value}`}
      aria-live="polite"
      onClick={copy}
    >
      {copied ? t('contact.copied') : (children ?? value)}
    </button>
  );
}
