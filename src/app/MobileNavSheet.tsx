import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { t, useLanguage } from '../shared/i18n';
import { Link } from '../shared/router';
import { routes, type RouteKey } from './routes';

type MobileNavSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  active: RouteKey;
};

export default function MobileNavSheet({ open, onOpenChange, active }: MobileNavSheetProps) {
  useLanguage();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        binding="spiral"
        stock="paper"
        rules="ruled"
        seed="mobile-nav-sheet"
        className="w-[82vw] max-w-xs"
      >
        <SheetHeader>
          <SheetTitle>{t('brand')}</SheetTitle>
          <SheetDescription className="sr-only">{t('nav.aria')}</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-3 px-5 pt-2" aria-label={t('nav.aria')}>
          {routes.map((route, index) => {
            const isCurrent = route.key === active;
            return (
              <Link
                key={route.key}
                to={route.path}
                onClick={() => onOpenChange(false)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`flex cursor-pointer items-baseline gap-3 border-b border-dashed border-pencil-mark/60 py-3 font-hand text-xl font-bold no-underline ${
                  isCurrent ? 'text-ink-you' : 'text-ink-soft hover:text-ink'
                }`}
              >
                <span className="font-mono text-xs text-orange-text">0{index + 1}</span>
                <span>{t(`nav.${route.key}`)}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
