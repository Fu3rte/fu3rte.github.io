import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { t } from './i18n';

const HOLD = 1600;

export default function CopyValue({
  value,
  children,
  seed = 'copy-btn',
}: {
  value: string;
  children?: ReactNode;
  seed?: string;
}) {
  const timer = useRef<number | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      window.clearTimeout(timer.current);
      setCopied(true);
      timer.current = window.setTimeout(() => setCopied(false), HOLD);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button
      type="button"
      variant={copied ? 'secondary' : 'outline'}
      size="sm"
      seed={seed}
      data-copied={copied}
      aria-label={`${t('contact.copy')}: ${value}`}
      aria-live="polite"
      onClick={copy}
      className="font-hand"
    >
      {copied ? (
        <svg aria-hidden="true" viewBox="0 0 18 18" className="size-3.5 text-green" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 9.5L7.2 13.2L14.5 5" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 18 18" className="size-3.5 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="6" width="9" height="9" rx="1.5" />
          <path d="M12 6V4.5A1.5 1.5 0 0 0 10.5 3H4.5A1.5 1.5 0 0 0 3 4.5V10.5A1.5 1.5 0 0 0 4.5 12H6" />
        </svg>
      )}
      <span>{copied ? t('contact.copied') : (children ?? value)}</span>
    </Button>
  );
}
