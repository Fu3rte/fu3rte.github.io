import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Handwritten } from '@/components/ui/handwritten';
import { Paper } from '@/components/ui/paper';
import { Underline } from '@/components/ui/underline';
import CopyValue from '../../shared/CopyValue';
import { t, useLanguage } from '../../shared/i18n';
import SectionHeading from './SectionHeading';

const LINKS = [
  { key: 'github', value: 'Fu3rte', href: 'https://github.com/Fu3rte', tone: 'sky' as const },
  { key: 'instagram', value: 'cq777h', href: 'https://www.instagram.com/cq777h/', tone: 'bubblegum' as const },
] as const;

export default function ContactWall() {
  useLanguage();

  return (
    <section id="contact" className="section mx-auto max-w-6xl px-5 py-16 pb-24 sm:px-8 sm:py-24">
      <SectionHeading
        index="05"
        eyebrow={t('contact.eyebrow')}
        title={t('contact.title')}
        badgeTone="teal"
        underlineTone="marker"
      />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.35fr_0.65fr]">
        <Paper
          stock="paper"
          rules="ruled"
          tape="both"
          tapeKind="washi-dots"
          fastener="pin"
          fastenerTone="sky"
          tilt={-0.35}
          seed="contact-postcard"
          data-st="paper-drop"
          className="pt-11 pe-6 pb-8 ps-14 sm:pe-8 sm:ps-16"
        >
          <h3 className="font-script text-3xl font-bold text-ink sm:text-4xl">
            <Underline kind="single" tone="marker" seed="contact-me-ul">
              <Handwritten strength={0.5} seed="contact-me-hw">
                {t('contact.me')}
              </Handwritten>
            </Underline>
          </h3>

          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink-soft">
            {t('contact.lead')}
          </p>

          <div className="mt-7 flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="lemon" size="sm" seed="contact-email-badge" className="font-mono text-xs text-ink">
                {t('contact.channel.email')}
              </Badge>
              <a
                href="mailto:2575716528cqh@gmail.com"
                data-selectable="true"
                className="select-text font-hand text-lg font-bold text-ink-you underline decoration-2 underline-offset-4 hover:text-link-hover"
              >
                2575716528cqh@gmail.com
              </a>
              <CopyValue value="2575716528cqh@gmail.com" seed="copy-wall-email">
                {t('contact.copy')}
              </CopyValue>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="grass" size="sm" seed="contact-wechat-badge" className="font-mono text-xs text-ink">
                {t('contact.channel.wechat')}
              </Badge>
              <span data-selectable="true" className="select-text font-mono text-base font-bold text-ink">F1nnian_</span>
              <CopyValue value="F1nnian_" seed="copy-wall-wechat">
                {t('contact.copy')}
              </CopyValue>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {LINKS.map((item) => (
                <Button
                  key={item.key}
                  asChild
                  variant="outline"
                  size="sm"
                  seed={`contact-link-${item.key}`}
                >
                  <a href={item.href} target="_blank" rel="noreferrer">
                    <span>{t(`contact.channel.${item.key}`)}</span>
                    <span data-selectable="true" className="select-text font-mono text-xs text-ink-you">/{item.value}</span>
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </Paper>

        <Paper
          stock="sticky-blue"
          fastener="pin"
          fastenerTone="tomato"
          tilt={1.5}
          seed="contact-side-sticky"
          data-st="sticky-pop"
          className="p-6 pt-8"
        >
          <span className="font-mono text-xs font-bold tracking-[0.16em] text-ink-you uppercase">
            FINNIAN · UTC+8
          </span>
          <p className="mt-3 text-[16px] leading-relaxed text-ink">{t('contact.p')}</p>
          <p className="mt-5 font-mono text-xs font-bold tracking-widest text-ink-soft">
            DONGGUAN · CAT · COFFEE · BAR
          </p>
        </Paper>
      </div>
    </section>
  );
}
