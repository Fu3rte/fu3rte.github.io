import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Handwritten } from '@/components/ui/handwritten';
import { Paper } from '@/components/ui/paper';
import { Separator } from '@/components/ui/separator';
import { Underline } from '@/components/ui/underline';
import { t, useLanguage } from '../../shared/i18n';
import { initCaseMotion } from '../../shared/motion';
import { Link, useRouter } from '../../shared/router';
import { CASE_BLOCK_KEYS, PROJECTS, pick } from '../home/projects';
import ProjectCover from './ProjectCover';

function slugOf(path: string): string {
  return path.replace(/^\/projects\/?/, '');
}

export default function ProjectPage() {
  useLanguage();
  useEffect(initCaseMotion, []);

  const { path } = useRouter();
  const current = PROJECTS.findIndex((project) => project.id === slugOf(path));
  const index = current < 0 ? 0 : current;
  const project = PROJECTS[index]!;
  const other = PROJECTS.find((item) => item.id !== project.id) ?? project;

  return (
    <main className="section mx-auto max-w-6xl px-5 py-10 pb-24 sm:px-8 sm:py-14" id="main-content">
      <Paper
        stock="parchment"
        rules="none"
        tape="both"
        tapeKind="washi-stripes"
        fastener="clip"
        fastenerTone={project.accent === 'sky' ? 'sky' : 'grass'}
        tilt={-0.2}
        seed={`case-hero-${project.id}`}
        data-st="paper-drop"
        className="p-6 pt-11 sm:p-10 sm:pt-12"
      >
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col items-start gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge tone={project.accent} size="default" seed={`case-idx-${project.id}`} className="font-mono text-xs text-ink">
                0{index + 1}
              </Badge>
              <span className="font-mono text-xs font-bold tracking-[0.14em] text-ink-muted uppercase">
                {pick(project.category)}
              </span>
            </div>

            <h1 className="font-script text-4xl leading-tight font-bold text-ink sm:text-6xl">
              <Underline kind="double" tone="marker" seed={`case-title-ul-${project.id}`}>
                <Handwritten strength={0.5} seed={`case-title-hw-${project.id}`}>
                  {project.name}
                </Handwritten>
              </Underline>
            </h1>

            <p className="max-w-xl text-[18px] leading-relaxed text-ink-soft">
              {pick(project.summary)}
            </p>

            <dl className="mt-2 grid w-full grid-cols-1 gap-4 border-t border-dashed border-pencil-mark/70 pt-4 sm:grid-cols-3">
              <div>
                <dt className="font-mono text-xs font-bold text-ink-muted uppercase">{t('case.role')}</dt>
                <dd className="mt-1 text-[15px] font-bold text-ink">{pick(project.role)}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs font-bold text-ink-muted uppercase">{t('case.period')}</dt>
                <dd className="mt-1 font-mono text-[15px] font-bold text-ink">{project.period}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs font-bold text-ink-muted uppercase">{t('case.status')}</dt>
                <dd className="mt-1 text-[15px] font-bold text-ink">{pick(project.status)}</dd>
              </div>
            </dl>

            <ul className="flex flex-wrap gap-2 pt-1" aria-label={t('works.tech')}>
              {project.tech.map((item) => (
                <li key={item}>
                  <Badge variant="outline" size="sm" seed={`case-tech-${project.id}-${item}`} className="font-mono text-xs text-ink">
                    {item}
                  </Badge>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button asChild variant="default" size="default" seed={`case-repo-${project.id}`}>
                <a href={project.href} target="_blank" rel="noreferrer">
                  {t('case.repository')}
                </a>
              </Button>
              <Button asChild variant="outline" size="default" seed={`case-back-${project.id}`}>
                <Link to="/">{t('case.back')}</Link>
              </Button>
            </div>
          </div>

          <Paper
            stock="photo"
            tape="corner"
            tapeKind="clear"
            tilt={0.85}
            seed={`case-cover-frame-${project.id}`}
            className="overflow-hidden p-3"
          >
            <ProjectCover project={project} index={index} />
          </Paper>
        </div>
      </Paper>

      <div className="mt-12 grid grid-cols-1 items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Paper
          stock="sticky-yellow"
          fastener="pin"
          fastenerTone="tomato"
          tilt={-1.1}
          seed={`case-toc-${project.id}`}
          data-st="sticky-pop"
          className="p-5 pt-8 lg:sticky lg:top-24"
        >
          <h2 className="font-script text-xl font-bold text-ink">{t('case.toc')}</h2>
          <ol className="mt-3 flex flex-col gap-2">
            {CASE_BLOCK_KEYS.map((key, blockIndex) => (
              <li key={key} className="border-b border-dashed border-ink/20 pb-2 last:border-b-0 last:pb-0">
                <a
                  href={`#case-${key}`}
                  data-st="case-toc-link"
                  data-active={blockIndex === 0 ? 'true' : 'false'}
                  className="-mx-1 flex items-baseline gap-2.5 px-1 font-hand text-[15px] font-bold text-ink-soft no-underline transition-colors hover:text-ink-you"
                >
                  <span className="font-mono text-xs text-orange-text">0{blockIndex + 1}</span>
                  <span>{t(`case.${key}`)}</span>
                </a>
              </li>
            ))}
          </ol>
        </Paper>

        <Paper
          stock="paper"
          rules="ruled"
          tape="top"
          tapeKind="masking"
          tilt={0.2}
          seed={`case-body-${project.id}`}
          data-st="paper-drop"
          className="flex flex-col gap-8 pt-10 pe-6 pb-10 ps-14 sm:pe-10 sm:ps-16"
        >
          {CASE_BLOCK_KEYS.map((key, blockIndex) => (
            <section className="scroll-mt-24" id={`case-${key}`} key={key} data-st="case-block">
              <h2 className="flex items-baseline gap-3 font-script text-2xl font-bold text-ink sm:text-3xl">
                <span className="font-mono text-sm text-orange-text">0{blockIndex + 1}</span>
                <span>{t(`case.${key}`)}</span>
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {project.blocks[key].map((line, lineIndex) => (
                  <p key={lineIndex} className="text-[17px] leading-[1.78] text-ink-soft">
                    {pick(line)}
                  </p>
                ))}
              </div>
              {blockIndex < CASE_BLOCK_KEYS.length - 1 ? (
                <Separator variant="dashed" seed={`case-sep-${project.id}-${key}`} className="mt-8 opacity-65" />
              ) : null}
            </section>
          ))}
        </Paper>
      </div>

      <nav className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2" aria-label={t('case.switch')} data-st="sticky-group">
        <Link to="/" className="no-underline" data-st="sticky-item">
          <Paper
            stock="slip"
            tape="corner"
            tilt={-0.6}
            seed={`case-nav-all-${project.id}`}
            className="flex flex-col gap-1.5 p-6 pt-7 transition-transform hover:-translate-y-0.5"
          >
            <span className="font-mono text-xs text-ink-muted uppercase">{t('case.back')}</span>
            <strong className="font-script text-2xl font-bold text-ink">{t('nav.home')}</strong>
          </Paper>
        </Link>

        <Link to={`/projects/${other.id}`} className="no-underline" data-st="sticky-item">
          <Paper
            stock={other.stickyStock}
            fastener="pin"
            fastenerTone="sky"
            tilt={0.7}
            seed={`case-nav-next-${project.id}`}
            className="flex flex-col items-end gap-1.5 p-6 pt-7 text-right transition-transform hover:-translate-y-0.5"
          >
            <span className="font-mono text-xs text-ink-soft uppercase">{t('case.next')}</span>
            <strong className="font-script text-2xl font-bold text-ink">{other.name}</strong>
          </Paper>
        </Link>
      </nav>
    </main>
  );
}
