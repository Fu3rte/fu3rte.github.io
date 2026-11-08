import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import gsap from 'gsap';
import { t } from '../../shared/i18n';
import { PROJECTS, pick } from './projects';
import SectionHeading from './SectionHeading';

export default function CapabilityMap() {
  const [selected, setSelected] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const project = PROJECTS[selected];

  useEffect(() => {
    if (!panel.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tween = gsap.fromTo(
      panel.current.querySelectorAll('.capability-node'),
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.07, ease: 'power3.out' },
    );
    return () => { tween.kill(); };
  }, [selected]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? PROJECTS.length - 1
        : (selected + (event.key === 'ArrowRight' ? 1 : -1) + PROJECTS.length) % PROJECTS.length;
    setSelected(next);
    document.getElementById(`capability-tab-${next}`)?.focus();
  };

  return (
    <section id="capabilities" className="section capabilities">
      <SectionHeading index="02" eyebrow="CAPABILITY MAP" title={t('capabilities.title')} />
      <p className="section-intro reveal">{t('capabilities.intro')}</p>
      <div className="capability-tabs" role="tablist" aria-label={t('capabilities.aria')} onKeyDown={onKeyDown}>
        {PROJECTS.map((item, index) => (
          <button
            id={`capability-tab-${index}`}
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected === index}
            aria-controls="capability-panel"
            tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)}
          >
            <span className="mono">0{index + 1}</span>{item.name}
          </button>
        ))}
      </div>
      <div
        id="capability-panel"
        className="capability-panel reveal"
        ref={panel}
        role="tabpanel"
        aria-labelledby={`capability-tab-${selected}`}
      >
        <div className="capability-flow">
          {project.nodes.map((node, index) => (
            <div
              className={`capability-node ${index === 0 ? 'is-input' : ''} ${index === project.nodes.length - 1 ? 'is-output' : ''}`}
              key={node}
            >
              <span className="node-dots" aria-hidden="true" />
              <span className="mono">{String(index + 1).padStart(2, '0')}</span>
              <strong>{node}</strong>
            </div>
          ))}
        </div>
        <p>{pick(project.summary)}</p>
      </div>
    </section>
  );
}
