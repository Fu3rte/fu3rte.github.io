import { t } from '../../shared/i18n';
import { Link } from '../../shared/router';
import ProjectCover from '../projects/ProjectCover';
import SectionHeading from './SectionHeading';
import { PROJECTS, pick } from './projects';

type Props = { activeSkill: string | null };

export default function Works({ activeSkill }: Props) {
  return (
    <section id="works" className="section works">
      <SectionHeading index="03" eyebrow="SELECTED WORKS" title={t('works.title')} />
      <p className="section-intro reveal">{t('works.intro')}</p>
      <div className="work-rail" tabIndex={0} aria-label={t('works.aria')}>
        <ul className="work-track">
          {PROJECTS.map((project, index) => {
            const related = activeSkill !== null && project.tech.includes(activeSkill);
            const muted = activeSkill !== null && !related;
            return (
              <li
                className={`work-item ${related ? 'is-related' : ''} ${muted ? 'is-muted' : ''}`}
                key={project.id}
              >
                <article className="work-card">
                  <ProjectCover project={project} index={index} />
                  <div className="work-body">
                    <div className="work-meta mono">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <span>{pick(project.category)}</span>
                    </div>
                    <h3>
                      <Link to={`/projects/${project.id}`}>{project.name}</Link>
                    </h3>
                    <p>{pick(project.summary)}</p>
                    <ul className="project-tech" aria-label={t('works.tech')}>
                      {project.tech.map(item => <li key={item}>{item}</li>)}
                    </ul>
                    <div className="work-actions">
                      <Link className="work-detail" to={`/projects/${project.id}`}>
                        {t('works.detail')}
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                      </Link>
                      <a className="work-repo" href={project.href} target="_blank" rel="noreferrer">
                        {t('works.open')}
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 3.5H3.5v9h9v-3M9.5 3.5h3v3M12.5 3.5 7 9" /></svg>
                      </a>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
