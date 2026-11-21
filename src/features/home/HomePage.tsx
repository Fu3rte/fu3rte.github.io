import { memo, useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../shared/i18n';
import { initMotion } from '../../shared/motion';
import AboutWorkbench from './AboutWorkbench';
import ContactWall from './ContactWall';
import InteractionLab from './InteractionLab';
import PhotosPreview from './PhotosPreview';
import SketchHero from './SketchHero';
import Works from './Works';

const MemoSketchHero = memo(SketchHero);
const MemoAboutWorkbench = memo(AboutWorkbench);
const MemoPhotosPreview = memo(PhotosPreview);
const MemoContactWall = memo(ContactWall);

export default function HomePage() {
  useLanguage();
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  useEffect(initMotion, []);

  const handleClearFilter = useCallback(() => setActiveSkill(null), []);

  return (
    <main className="pb-12">
      <MemoSketchHero />
      <MemoAboutWorkbench />
      <Works activeSkill={activeSkill} onClearFilter={handleClearFilter} />
      <InteractionLab activeSkill={activeSkill} onSelect={setActiveSkill} />
      <MemoPhotosPreview />
      <MemoContactWall />
    </main>
  );
}
