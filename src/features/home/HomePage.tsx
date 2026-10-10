import { useEffect } from 'react';
import { t, useLanguage } from '../../shared/i18n';
import { initMotion } from '../../shared/motion';
import BrookHero from './BrookHero';
import ContactWall from './ContactWall';
import Works from './Works';

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

export default function App() {
  useLanguage();
  useEffect(initMotion, []);

  return (
    <main>
      <BrookHero />
      <About />
      <Works />
      <ContactWall />
    </main>
  );
}
