import { Handwritten } from '@/components/ui/handwritten';
import { Paper } from '@/components/ui/paper';
import { Underline } from '@/components/ui/underline';
import { ContactCopyRows, ContactSocialButtons } from '../../shared/ContactChannels';
import { t, useLanguage } from '../../shared/i18n';
import SectionHeading from './SectionHeading';

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
            <ContactCopyRows seedPrefix="contact-wall" size="compact" />
            <ContactSocialButtons seedPrefix="contact-wall" />
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
