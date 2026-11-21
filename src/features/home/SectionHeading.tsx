import { Badge } from '@/components/ui/badge';
import { Handwritten } from '@/components/ui/handwritten';
import { Separator } from '@/components/ui/separator';
import { Underline } from '@/components/ui/underline';
import type { BadgeTone } from '@/lib/ink/recipes/badge-ink';
import type { MarkPen } from '@/lib/ink/recipes/text-marks-ink';

type Props = {
  index: string;
  eyebrow: string;
  title: string;
  intro?: string;
  badgeTone?: BadgeTone;
  underlineTone?: MarkPen;
};

export default function SectionHeading({
  index,
  eyebrow,
  title,
  intro,
  badgeTone = 'sky',
  underlineTone = 'marker',
}: Props) {
  return (
    <header className="mb-10 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3" data-st="sec-badge">
        <Badge tone={badgeTone} size="default" seed={`sec-badge-${index}`} className="font-mono text-xs tracking-wider text-ink">
          {index}
        </Badge>
        <span className="font-mono text-xs font-semibold tracking-[0.16em] text-ink-muted uppercase">
          {eyebrow}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="section-title font-script text-4xl leading-tight font-bold tracking-tight text-ink sm:text-5xl">
          <Underline kind="wavy" tone={underlineTone} seed={`sec-ul-${index}`}>
            <Handwritten strength={0.55} seed={`sec-hw-${index}`}>
              {title}
            </Handwritten>
          </Underline>
        </h2>
        {intro ? (
          <p className="reveal max-w-2xl text-[17px] leading-relaxed text-ink-soft">
            {intro}
          </p>
        ) : null}
      </div>

      <div data-st="sec-rule">
        <Separator variant="dashed" seed={`sec-sep-${index}`} className="mt-2 opacity-75" />
      </div>
    </header>
  );
}
