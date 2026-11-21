import { Handwritten } from '@/components/ui/handwritten';
import { Paper } from '@/components/ui/paper';
import { Underline } from '@/components/ui/underline';
import { t, tObject, useLanguage } from '../../shared/i18n';
import SectionHeading from './SectionHeading';

type HabitItem = { title: string; body: string };
type OffItem = { tag: string; title: string; body: string };

const HABIT_STOCKS = ['sticky-yellow', 'sticky-green', 'sticky-pink'] as const;
const HABIT_TILTS = [-1.4, 0.9, -1.1] as const;

function OffDoodle({ tag }: { tag: string }) {
  if (tag === 'CAT') {
    return (
      <svg aria-hidden="true" viewBox="0 0 48 48" className="size-10 shrink-0 text-ink" fill="none">
        <path
          d="M11 26C11 18 15 14 16 9L22 14C23.5 13.5 25.5 13.5 27 14L33 9C34 14 38 18 38 26C38 34 32 39 24.5 39C17 39 11 34 11 26Z"
          fill="#fff18f"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinejoin="round"
        />
        <path d="M18 24.5C19 23 20.5 23 21.5 24.5M27.5 24.5C28.5 23 30 23 31 24.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M23 29L24.5 30.5L26 29" stroke="#ee6c3b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (tag === 'COFFEE') {
    return (
      <svg aria-hidden="true" viewBox="0 0 48 48" className="size-10 shrink-0 text-ink" fill="none">
        <path
          d="M11 19H31V30C31 35 27 38 21 38C15 38 11 35 11 30V19Z"
          fill="#bde2ff"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinejoin="round"
        />
        <path d="M31 22H35C37.5 22 39 24 39 26.5C39 29 37.5 31 35 31H31" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
        <path d="M16 13C15.5 10.5 17.5 9.5 17 7M22 13C21.5 10.5 23.5 9.5 23 7M28 13C27.5 10.5 29.5 9.5 29 7" stroke="#ee6c3b" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-10 shrink-0 text-ink" fill="none">
      <path d="M8 12H40M12 12V40M36 12V40M9.5 40H14.5M33.5 40H38.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M17 12H20M28 12H31" stroke="#ee6c3b" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M18.5 12L21 21M29.5 12L27 21" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M22 31L20 36L22.5 39M26 31L28 36L25.5 39" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.5 22H27.5L26.5 31H21.5Z" fill="#c8f0c0" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="24" cy="18.5" r="3.2" fill="#fff18f" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function AboutWorkbench() {
  useLanguage();
  const habits = tObject<HabitItem[]>('about.habits');
  const nowItems = tObject<string[]>('about.nowItems');
  const offItems = tObject<OffItem[]>('about.off');

  return (
    <section id="about" className="section mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <SectionHeading
        index="01"
        eyebrow={t('about.eyebrow')}
        title={t('about.title')}
        badgeTone="tangerine"
        underlineTone="green"
      />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <Paper
          stock="paper"
          rules="ruled"
          tape="top"
          tapeKind="masking"
          tilt={-0.35}
          seed="about-bio-sheet"
          data-st="paper-drop"
          className="pt-10 pe-6 pb-8 ps-14 sm:pe-8 sm:ps-16"
        >
          <p className="font-script text-2xl leading-snug font-bold text-ink sm:text-[1.75rem]">
            <mark className="px-1">
              <Handwritten strength={0.5} seed="about-lead-hw">
                {t('about.lead')}
              </Handwritten>
            </mark>
          </p>
          <p className="mt-5 text-[17px] leading-[1.78] text-ink-soft">{t('about.p1')}</p>
          <p className="mt-4 text-[17px] leading-[1.78] text-ink-soft">{t('about.p2')}</p>
        </Paper>

        <Paper
          stock="pad"
          edge={{ top: 'torn' }}
          fastener="binder-clip"
          tilt={0.75}
          seed="about-now-pad"
          data-st="paper-drop"
          className="px-6 pt-11 pb-7"
        >
          <h3 className="font-script text-2xl font-bold text-ink">
            <Underline kind="single" tone="green" seed="about-now-ul">
              {t('about.nowTitle')}
            </Underline>
          </h3>
          <ul className="mt-5 flex flex-col gap-3.5">
            {nowItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-[16px] leading-relaxed text-ink">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="mt-1 size-4 shrink-0 text-green"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2.5" y="2.5" width="15" height="15" rx="3" stroke="var(--ll-ink)" strokeWidth="1.6" />
                  <path d="M5.5 10.2L8.6 13.2L15 6.8" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Paper>
      </div>

      <div className="mt-10">
        <h3 className="mb-5 font-mono text-xs font-bold tracking-[0.16em] text-ink-muted uppercase">
          {t('about.habitsTitle')}
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3" data-st="sticky-group">
          {habits.map((habit, index) => (
            <Paper
              key={habit.title}
              stock={HABIT_STOCKS[index % HABIT_STOCKS.length]}
              fastener="pin"
              fastenerTone={index === 0 ? 'tomato' : index === 1 ? 'grass' : 'sky'}
              tilt={HABIT_TILTS[index % HABIT_TILTS.length]}
              seed={`about-habit-${index}`}
              data-st="sticky-item"
              className="p-6 pt-8"
            >
              <h4 className="font-script text-xl font-bold text-ink">{habit.title}</h4>
              <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">{habit.body}</p>
            </Paper>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h3 className="mb-5 font-mono text-xs font-bold tracking-[0.16em] text-ink-muted uppercase">
          {t('about.offTitle')}
        </h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3" data-st="sticky-group">
          {offItems.map((item, index) => (
            <Paper
              key={item.tag}
              stock="slip"
              tape="corner"
              tapeKind="washi-stripes"
              tilt={index === 1 ? 0.65 : -0.55}
              seed={`about-off-${item.tag}`}
              data-st="sticky-item"
              className="flex items-start gap-4 p-5 pt-7"
            >
              <OffDoodle tag={item.tag} />
              <div className="min-w-0">
                <span className="font-mono text-[11px] font-bold tracking-widest text-ink-you uppercase">
                  {item.tag}
                </span>
                <h4 className="font-script text-xl font-bold text-ink">{item.title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.body}</p>
              </div>
            </Paper>
          ))}
        </div>
      </div>
    </section>
  );
}
