import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Paper } from '@/components/ui/paper';
import { t, useLanguage } from '../../shared/i18n';
import { Link } from '../../shared/router';
import ProjectCover from '../projects/ProjectCover';
import SectionHeading from './SectionHeading';
import { PROJECTS, pick } from './projects';

type Props = {
  activeSkill: string | null;
  onClearFilter?: () => void;
};

export default function Works({ activeSkill, onClearFilter }: Props) {
  useLanguage();

  return (
    <section id="works" className="section mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <SectionHeading
        index="02"
        eyebrow={t('works.eyebrow')}
        title={t('works.title')}
        intro={t('works.intro')}
        badgeTone="marker"
        underlineTone="marker"
      />

      {activeSkill ? (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Badge tone="lemon" size="default" seed="works-active-filter" className="text-ink">
            {t('works.filterPrefix')}: {activeSkill}
          </Badge>
          {onClearFilter ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              seed="works-clear-filter"
              onClick={onClearFilter}
              className="cursor-pointer"
            >
              {t('works.clearFilter')}
            </Button>
          ) : null}
        </div>
      ) : null}

      <Paper
        stock="parchment"
        edge="cut"
        rules="none"
        tape="both"
        tapeKind="masking"
        tilt={0}
        seed="works-folio-mat"
        data-st="folio-mat"
        className="works-folio-mat p-5 pt-10 sm:p-8 sm:pt-12 lg:p-10"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2" aria-label={t('works.aria')}>
          {PROJECTS.map((project, index) => {
            const related = activeSkill !== null && project.tech.includes(activeSkill);
            const muted = activeSkill !== null && !related;

            return (
              <Card
                key={project.id}
                stock="card"
                rules="none"
                tape="corner"
                tapeKind="washi-gingham"
                fastener="clip"
                fastenerTone={project.accent === 'sky' ? 'sky' : 'grass'}
                tilt={index === 0 ? -0.4 : 0.45}
                seed={`work-card-${project.id}`}
                data-st="work-card"
                className={`flex flex-col gap-0 pt-0 pb-6 transition-opacity duration-200 ${
                  muted ? 'opacity-45' : 'opacity-100'
                } ${related ? 'ring-2 ring-marker/80 ring-offset-4 ring-offset-transparent' : ''}`}
              >
                <ProjectCover project={project} index={index} />

                <CardHeader className="pt-6 pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={project.accent} size="sm" seed={`work-cat-${project.id}`} className="text-ink">
                        {pick(project.category)}
                      </Badge>
                      {related ? (
                        <Badge tone="lemon" size="sm" seed={`work-match-${project.id}`} className="text-ink">
                          {t('works.matchedBadge')}
                        </Badge>
                      ) : null}
                    </div>
                    <span className="font-mono text-xs text-ink-muted">{project.period}</span>
                  </div>

                  <CardTitle className="mt-2">
                    <Link
                      to={`/projects/${project.id}`}
                      className="cursor-pointer text-ink no-underline hover:text-ink-you"
                    >
                      {project.name}
                    </Link>
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-5">
                  <p className="text-[16px] leading-relaxed text-ink-soft">{pick(project.summary)}</p>

                  <ul className="flex flex-wrap gap-2" aria-label={t('works.tech')}>
                    {project.tech.map((item) => (
                      <li key={item}>
                        <Badge
                          variant={activeSkill === item ? 'secondary' : 'outline'}
                          size="sm"
                          seed={`work-tech-${project.id}-${item}`}
                          className="font-mono text-xs text-ink"
                        >
                          {item}
                        </Badge>
                      </li>
                    ))}
                  </ul>

                  <Accordion type="multiple" className="mt-1">
                    <AccordionItem
                      value="decisions"
                      tone={project.accent}
                      seed={`acc-dec-${project.id}`}
                    >
                      <AccordionTrigger className="cursor-pointer">{t('works.accDecisions')}</AccordionTrigger>
                      <AccordionContent>
                        <ul className="flex list-disc flex-col gap-1.5 ps-4">
                          {project.blocks.decisions.map((line, i) => (
                            <li key={i}>{pick(line)}</li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                      value="outcomes"
                      tone="hi"
                      seed={`acc-out-${project.id}`}
                    >
                      <AccordionTrigger className="cursor-pointer">{t('works.accOutcomes')}</AccordionTrigger>
                      <AccordionContent>
                        <ul className="flex list-disc flex-col gap-1.5 ps-4">
                          {project.blocks.outcomes.map((line, i) => (
                            <li key={i}>{pick(line)}</li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>

                <CardFooter className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
                  <Button asChild variant="default" size="sm" seed={`work-detail-btn-${project.id}`} className="cursor-pointer">
                    <Link to={`/projects/${project.id}`}>{t('works.detail')}</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" seed={`work-repo-btn-${project.id}`} className="cursor-pointer">
                    <a href={project.href} target="_blank" rel="noreferrer">
                      {t('works.open')}
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </Paper>
    </section>
  );
}
