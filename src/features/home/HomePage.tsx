import { useEffect } from 'react';
import { t, useLanguage } from '../../shared/i18n';
import { initMotion } from '../../shared/motion';
import { Link } from '../../shared/router';
import BrookHero from './BrookHero';

function About() {
  return (
    <section id="about" className="section about">
      <h2 className="section-title">{t('about.title')}</h2>
      <div className="prose reveal">
        <p>{t('about.p1')}</p>
        <p>{t('about.p2')}</p>
      </div>
    </section>
  );
}

function Works() {
  const items = ['scroll', 'motion', 'toys', 'writing'];
  return (
    <section id="works" className="section works">
      <h2 className="section-title">{t('works.title')}</h2>
      <ul className="works-grid reveal">
        {items.map(key => (
          <li key={key}>
            <a className="work-card" href="https://github.com/Fu3rte" target="_blank" rel="noreferrer">
              <span className="work-name">{t(`works.${key}.name`)}</span>
              <span className="work-desc">{t(`works.${key}.desc`)}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Skills() {
  const groups = ['craft', 'tools', 'play'];
  return (
    <section id="skills" className="section skills">
      <h2 className="section-title">{t('skills.title')}</h2>
      <div className="skills-grid reveal">
        {groups.map(group => (
          <div key={group} className="skill-group">
            <h3 className="mono skill-group-title">{t(`skills.${group}.title`)}</h3>
            <ul className="skill-list">
              {[1, 2, 3].map(n => (
                <li key={n}>{t(`skills.${group}.${n}`)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  useLanguage();
  useEffect(initMotion, []);

  return (
    <main>
      <BrookHero />
      <About />
      <Works />
      <Skills />
      <footer className="site-foot">
        <Link className="mono" to="/contact">{t('contact.title')}</Link>
      </footer>
    </main>
  );
}
