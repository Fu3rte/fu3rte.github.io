import { t, useLanguage } from '../../shared/i18n';
import SectionHeading from './SectionHeading';
import StackBench from './StackBench';

type Props = {
  activeSkill: string | null;
  onSelect: (skill: string | null) => void;
};

export default function InteractionLab({ activeSkill, onSelect }: Props) {
  useLanguage();

  return (
    <section id="lab" className="section mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <SectionHeading
        index="03"
        eyebrow={t('lab.eyebrow')}
        title={t('lab.title')}
        intro={t('lab.intro')}
        badgeTone="bubblegum"
        underlineTone="green"
      />

      <StackBench activeSkill={activeSkill} onSelect={onSelect} />
    </section>
  );
}
