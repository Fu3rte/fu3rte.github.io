import { useEffect, useState } from 'react';
import { t, useLanguage } from '../../shared/i18n';
import { initMotion } from '../../shared/motion';
import CapabilityMap from './CapabilityMap';
import ContactWall from './ContactWall';
import DeskSignature from './DeskSignature';
import LatticeHero from './LatticeHero';
import PhotosPreview from './PhotosPreview';
import SectionHeading from './SectionHeading';
import StackBench from './StackBench';
import Works from './Works';

const META = ['now', 'here', 'off'] as const;

function About() {
  return (
    <section id="about" className="section about">
      <SectionHeading index="01" eyebrow="PROFILE" title={t('about.title')} />
      <div className="about-layout">
        <div>
          <p className="about-lead reveal">
            {t('about.lead')}
            <span className="about-lead-sub">{t('about.leadSub')}</span>
          </p>
          <dl className="about-meta reveal">
            {META.map(key => (
              <div key={key}>
                <dt>{t(`about.meta.${key}`)}</dt>
                <dd>{t(`about.meta.${key}Value`)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <DeskSignature />
      </div>
    </section>
  );
}

export default function HomePage() {
  useLanguage();
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  useEffect(initMotion, []);

  return (
    <main>
      <LatticeHero />
      <About />
      <CapabilityMap />
      <Works activeSkill={activeSkill} />
      <StackBench activeSkill={activeSkill} onSelect={setActiveSkill} />
      <PhotosPreview />
      <ContactWall />
    </main>
  );
}
