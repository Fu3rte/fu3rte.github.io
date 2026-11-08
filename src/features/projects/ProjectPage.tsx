import { t, useLanguage } from '../../shared/i18n';
import { Link, useRouter } from '../../shared/router';
import { CASE_BLOCK_KEYS, PROJECTS, pick } from '../home/projects';
import ProjectCover from './ProjectCover';

function slugOf(path: string): string {
  return path.replace(/^\/projects\/?/, '');
}

export default function ProjectPage() {
  useLanguage();
  const { path } = useRouter();
  const current = PROJECTS.findIndex(project => project.id === slugOf(path));
  const index = current < 0 ? 0 : current;
  const project = PROJECTS[index]!;
  const previous = PROJECTS[(index - 1 + PROJECTS.length) % PROJECTS.length]!;
  const next = PROJECTS[(index + 1) % PROJECTS.length]!;

  return (
    <main className="case-page" id="main-content">
      <section className="case-hero">
        <div className="case-hero-copy">
          <p className="section-eyebrow">
            <span>{String(index + 1).padStart(2, '0')}</span>
            {pick(project.category)}
          </p>
          <h1 className="case-title">{project.name}</h1>
          <p className="case-summary">{pick(project.summary)}</p>
          <dl className="case-facts">
            <div>
              <dt>{t('case.role')}</dt>
              <dd>{pick(project.role)}</dd>
            </div>
            <div>
              <dt>{t('case.period')}</dt>
              <dd className="mono keepcase">{project.period}</dd>
            </div>
            <div>
              <dt>{t('case.status')}</dt>
              <dd>{pick(project.status)}</dd>
            </div>
          </dl>
          <ul className="project-tech" aria-label={t('works.tech')}>
            {project.tech.map(item => <li key={item}>{item}</li>)}
          </ul>
          <div className="case-actions">
            <a className="button button-primary" href={project.href} target="_blank" rel="noreferrer">
              {t('case.repository')}
            </a>
            <Link className="button button-secondary" to="/">
              {t('case.back')}
            </Link>
          </div>
        </div>
        <div className="case-hero-art">
          <ProjectCover project={project} index={index} />
        </div>
      </section>

      <section className="case-body">
        <nav className="case-toc" aria-label={t('case.toc')}>
          <ol>
            {CASE_BLOCK_KEYS.map((key, blockIndex) => (
              <li key={key}>
                <a href={`#case-${key}`}>
                  <span className="mono">{String(blockIndex + 1).padStart(2, '0')}</span>
                  {t(`case.${key}`)}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="case-content">
          {CASE_BLOCK_KEYS.map((key, blockIndex) => (
            <section className="case-block" id={`case-${key}`} key={key}>
              <h2>
                <span className="mono">{String(blockIndex + 1).padStart(2, '0')}</span>
                {t(`case.${key}`)}
              </h2>
              {project.blocks[key].map((line, lineIndex) => (
                <p key={lineIndex}>{pick(line)}</p>
              ))}
            </section>
          ))}
        </div>
      </section>

      <nav className="case-switch" aria-label={t('case.switch')}>
        <Link className="switch-card" to={`/projects/${previous.id}`}>
          <span className="mono">{t('case.previous')}</span>
          <strong>{previous.name}</strong>
        </Link>
        <Link className="switch-card is-next" to={`/projects/${next.id}`}>
          <span className="mono">{t('case.next')}</span>
          <strong>{next.name}</strong>
        </Link>
      </nav>
    </main>
  );
}
