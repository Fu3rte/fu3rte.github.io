import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clipboard, ClipboardPaper } from '@/components/ui/clipboard';
import { Handwritten } from '@/components/ui/handwritten';
import { Paper } from '@/components/ui/paper';
import { Underline } from '@/components/ui/underline';
import { ContactCopyRows, ContactSocialButtons } from '../../shared/ContactChannels';
import { t, useLanguage } from '../../shared/i18n';
import { initContactMotion } from '../../shared/motion';

export default function ContactPage() {
  useLanguage();
  useEffect(initContactMotion, []);

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 pb-24 sm:px-8 sm:py-16">
      <section className="section">
        <div className="mb-10 flex flex-wrap items-center gap-3" data-st="sec-badge">
          <Badge tone="teal" size="default" seed="contact-page-badge" className="font-mono text-xs text-ink">
            01
          </Badge>
          <span className="font-mono text-xs font-bold tracking-[0.16em] text-ink-muted uppercase">
            {t('contact.eyebrow')}
          </span>
        </div>

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          <div data-st="paper-drop">
            <Clipboard tone="hardboard" tilt={-0.5} seed="contact-clipboard" className="max-w-none">
              <ClipboardPaper stock="paper" rules="ruled" tilt={0.3} seed="contact-clipboard-paper" className="pb-9">
                <h1 className="section-title font-script text-4xl font-bold text-ink sm:text-5xl">
                  <Underline kind="double" tone="marker" seed="contact-page-ul">
                    <Handwritten strength={0.5} seed="contact-page-hw">
                      {t('contact.title')}
                    </Handwritten>
                  </Underline>
                </h1>

                <p className="mt-5 max-w-xl text-[18px] leading-relaxed text-ink-soft">
                  {t('contact.lead')}
                </p>

                <div className="mt-7 flex flex-col gap-5">
                  <ContactCopyRows seedPrefix="cp" size="lg" />
                </div>
              </ClipboardPaper>
            </Clipboard>
          </div>

          <div className="flex flex-col gap-6">
            <Paper
              stock="sticky-pink"
              fastener="pin"
              fastenerTone="sky"
              tilt={1.6}
              seed="contact-page-sticky"
              data-st="sticky-pop"
              className="p-6 pt-8"
            >
              <h2 className="font-script text-2xl font-bold text-ink">{t('contact.me')}</h2>
              <p className="mt-2.5 text-[16px] leading-relaxed text-ink-soft">{t('contact.p')}</p>
            </Paper>

            <Paper
              stock="slip"
              tape="top"
              tapeKind="washi-dots"
              tilt={-0.9}
              seed="contact-page-links"
              data-st="paper-drop"
              className="flex flex-col gap-3 p-6 pt-8"
            >
              <span className="font-mono text-xs font-bold tracking-[0.14em] text-ink-muted uppercase">
                FINNIAN · DONGGUAN · UTC+8
              </span>
              <ContactSocialButtons seedPrefix="cp" />
            </Paper>
          </div>
        </div>
      </section>
    </main>
  );
}
