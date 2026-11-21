import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CopyValue from './CopyValue';
import { t } from './i18n';

export const CONTACT_EMAIL = '2575716528cqh@gmail.com';
export const CONTACT_WECHAT = 'F1nnian_';

export const CONTACT_SOCIAL_LINKS = [
  { key: 'github', value: 'Fu3rte', href: 'https://github.com/Fu3rte' },
  { key: 'instagram', value: 'cq777h', href: 'https://www.instagram.com/cq777h/' },
] as const;

type ContactCopyRowsProps = {
  seedPrefix: string;
  size?: 'compact' | 'lg';
};

export function ContactCopyRows({ seedPrefix, size = 'compact' }: ContactCopyRowsProps) {
  const isLg = size === 'lg';
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          tone="lemon"
          size="sm"
          seed={`${seedPrefix}-email-badge`}
          className="font-mono text-xs text-ink"
        >
          {t('contact.channel.email')}
        </Badge>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          data-selectable="true"
          className={`select-text font-hand font-bold text-ink-you underline decoration-2 underline-offset-4 hover:text-link-hover ${
            isLg ? 'text-xl break-all' : 'text-lg'
          }`}
        >
          {CONTACT_EMAIL}
        </a>
        <CopyValue value={CONTACT_EMAIL} seed={`${seedPrefix}-copy-email`}>
          {t('contact.copy')}
        </CopyValue>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Badge
          tone="grass"
          size="sm"
          seed={`${seedPrefix}-wechat-badge`}
          className="font-mono text-xs text-ink"
        >
          {t('contact.channel.wechat')}
        </Badge>
        <span
          data-selectable="true"
          className={`select-text font-mono font-bold text-ink ${isLg ? 'text-lg' : 'text-base'}`}
        >
          {CONTACT_WECHAT}
        </span>
        <CopyValue value={CONTACT_WECHAT} seed={`${seedPrefix}-copy-wechat`}>
          {t('contact.copy')}
        </CopyValue>
      </div>
    </>
  );
}

type ContactSocialButtonsProps = {
  seedPrefix: string;
};

export function ContactSocialButtons({ seedPrefix }: ContactSocialButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-1">
      {CONTACT_SOCIAL_LINKS.map((item) => (
        <Button
          key={item.key}
          asChild
          variant="outline"
          size="sm"
          seed={`${seedPrefix}-link-${item.key}`}
        >
          <a href={item.href} target="_blank" rel="noreferrer">
            <span>{t(`contact.channel.${item.key}`)}</span>
            <span data-selectable="true" className="select-text font-mono text-xs text-ink-you">
              /{item.value}
            </span>
          </a>
        </Button>
      ))}
    </div>
  );
}
