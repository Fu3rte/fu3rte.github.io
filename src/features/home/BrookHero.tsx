import { useEffect, useRef } from 'react';
import lottie from 'lottie-web/build/player/lottie_light';
import { t } from '../../shared/i18n';
import hoodedSkull from './assets/hooded-skull.svg?raw';

// 只取 <svg> 内的图元，根标签上的 fill="none" 由承接的 <g> 补上，
// 否则原稿里未写 fill 的描边路径会被填成黑块
const art = hoodedSkull.replace(/^<svg[^>]*>|<\/svg>\s*$/g, '');
// 降低动效偏好下停在这一帧：第一缕热气走到画布中部、透明度已满
const STEAM_HOLD = 45;

export default function BrookHero() {
  const steam = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const anim = lottie.loadAnimation({
      container: steam.current!,
      renderer: 'svg',
      loop: true,
      autoplay: !reduced,
      path: '/lottie/steam.json',
    });
    if (reduced) {
      // 素材到位之前的 seek 会被丢掉，静态帧只能等 data_ready 再落
      anim.addEventListener('data_ready', () => anim.goToAndStop(STEAM_HOLD, true));
    }
    return () => {
      anim.destroy();
    };
  }, []);

  return (
    <section id="home" className="hero brook-hero" aria-label={t('hero.aria')}>
      <div className="brook-scene">
        <svg viewBox="0 0 1700 1254" aria-hidden="true">
          {/* 画稿 1254 见方，右移到 1700 宽画框的水平正中，左侧腾出咖啡位 */}
          <g
            transform="translate(223 0)"
            fill="none"
            dangerouslySetInnerHTML={{ __html: art }}
          />
          <g id="brook-props" fill="none" stroke="#141414" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
            <path id="brook-cup" d="M110 1000V1074C110 1121 145 1150 200 1150C255 1150 290 1121 290 1074V997" fill="#ffffff" />
            <path d="M128 983H268C281 983 290 989 290 997" />
            <path d="M290 1018C327 1021 356 1040 356 1061C356 1086 332 1102 290 1102" />
          </g>
          <path id="brook-desk" d="M50 1150H1370" stroke="#141414" strokeWidth="9" strokeLinecap="round" fill="none" />
        </svg>
        <div className="brook-steam" ref={steam} aria-hidden="true" />
      </div>
    </section>
  );
}
