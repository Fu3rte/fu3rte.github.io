import { useEffect } from 'react';
import { t, useLanguage } from '../../shared/i18n';
import { initMotion } from '../../shared/motion';
import BrookHero from './BrookHero';
import ContactWall from './ContactWall';
import StackMarquee from './StackMarquee';
import Works from './Works';

const META = ['now', 'here', 'off'] as const;

function About() {
  return (
    <section id="about" className="section about">
      <h2 className="section-title">{t('about.title')}</h2>
      <p className="about-lead reveal">
        {t('about.lead')}
        <span className="about-lead-sub">{t('about.leadSub')}</span>
      </p>
      <div className="prose reveal">
        <p>{t('about.p1')}</p>
        <p>{t('about.p2')}</p>
      </div>
      <dl className="about-meta reveal">
        {META.map(key => (
          <div key={key}>
            <dt>{t(`about.meta.${key}`)}</dt>
            <dd>{t(`about.meta.${key}Value`)}</dd>
          </div>
        ))}
      </dl>
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
      <StackMarquee />
      <ContactWall />
    </main>
  );
}
