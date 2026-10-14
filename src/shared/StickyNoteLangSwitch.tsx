import { useId, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Lang } from './i18n';

type Props = {
  lang: Lang;
  onToggle: (nextLang: Lang) => void;
  className?: string;
};

const GLYPH: Record<Lang, string> = { zh: '中', en: 'EN' };
const OTHER: Record<Lang, Lang> = { zh: 'en', en: 'zh' };
const ARIA: Record<Lang, string> = { zh: '切换到 English', en: 'Switch to 中文' };

// 静止态：纸身 -2.5 度、胶带 +1.6 度，两者各自倾角，动效全部回到这两条基线
const NOTE_TILT = -2.5;
const TAPE_TILT = 1.6;
const SHADOW_REST = { x: 3, y: 4, opacity: 0.2, filter: 'blur(0px)' };

// 一页翻到底，抄的是挂历的结构：叶片只有一片，正面印中文的上半页、背面印英文的下半页；
// 底纸的两半各预先印好叶片离开后该露出来的那一面——上半页是英文，下半页是中文。
// 于是掀开的半页下面早就摆着新字形，翻过来的那面只盖住旧字形，任何一瞬间每个半页上都只有一张画稿。
// 只有 transform 在动，没有透明度也没有缩放，所以连点时浏览器自己从当前角度接着补，无从重播。
const LEAF =
  'absolute inset-0 [transform-style:preserve-3d] [transform:rotateX(0deg)] transition-transform duration-[480ms] ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none group-data-[lang=en]:[transform:rotateX(-180deg)]';

// 画稿住在半页高的裁切窗里，窗沿朝折缝多让 1px 压住对边：那 1px 里是同一张画稿的同一行，接缝才不会被裁成一道亮线
const WINDOW = 'absolute inset-x-0 top-0 h-[calc(50%+1px)] overflow-hidden [backface-visibility:hidden]';
const PAPER: Record<Lang, string> = { zh: 'bg-[#FEF9C3]', en: 'bg-[#F8F0C6]' };
// 画稿高度按窗口反推回整张纸：窗高 50%+1px，画稿就取 200%-2px。
// 边框会被系统按物理像素取整（本机 2px 实算 1.69px），写死像素会让两半纸色错开露缝
type Edge = 'top' | 'bottom';
const ART = 'h-[calc(200%-2px)]';

const INK_CLASS =
  'absolute inset-0 grid place-items-center font-mono text-[26px] font-bold leading-none tracking-tight text-zinc-900 [text-shadow:0_0_0.6px_rgba(20,20,20,0.5)]';
const HINT_CLASS =
  'absolute bottom-[4px] left-[6px] flex items-center gap-[2px] font-mono text-[8px] leading-none text-zinc-900/55';

// 整张画稿按画心的实际内框来画，上下半页共用同一套坐标，接缝才不会错开；角标与折角都压在纸的下沿
function NotePaper({ lang, edge, height }: { lang: Lang; edge: Edge; height: string }) {
  const grainId = useId();
  const foldId = useId();
  return (
    <span className={`absolute inset-x-0 ${height} ${PAPER[lang]} ${edge === 'top' ? 'top-0' : 'bottom-0'}`}>
      <span className={INK_CLASS}>{GLYPH[lang]}</span>

      {edge === 'bottom' && (
        <span className={HINT_CLASS}>
          <svg viewBox="0 0 12 12" className="h-[7px] w-[7px]" aria-hidden="true">
            <path
              d="M1.5 4.5h7.2M6.4 1.6l2.9 2.9-2.9 2.9M10.5 9.5H3.3M5.6 11.4 2.7 8.5l2.9-2.9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {GLYPH[OTHER[lang]]}
        </span>
      )}

      {edge === 'bottom' && (
        /* 折角：两条直角边与便签的墨线边框重合，折痕走墨线、靠折痕一侧压暗 */
        <span className="absolute bottom-0 right-0 block h-[20px] w-[20px]">
          <svg viewBox="0 0 20 20" className="h-full w-full">
            <defs>
              <linearGradient id={foldId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#F7E7AC" />
                <stop offset="1" stopColor="#E3C675" />
              </linearGradient>
              <linearGradient id={`${foldId}-shade`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="rgba(20,20,20,0.2)" />
                <stop offset="0.5" stopColor="rgba(20,20,20,0)" />
              </linearGradient>
            </defs>
            <path d="M20 3 L3 20 L20 20 Z" fill={`url(#${foldId})`} />
            <path d="M20 3 L3 20 L20 20 Z" fill={`url(#${foldId}-shade)`} />
            <path d="M20 3 L3 20" fill="none" stroke="#18181b" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      )}

      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.13]">
        <filter id={grainId} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.86" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grainId})`} />
      </svg>
    </span>
  );
}

let audioCtx: AudioContext | undefined;

// 纸张沙沙：高通噪波走摩擦、正弦下滑走闷响，全程 Web Audio 实时合成，无静态音频资源
function playPaperSound(): void {
  audioCtx ??= new AudioContext();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
  const now = audioCtx.currentTime;

  const frames = Math.round(audioCtx.sampleRate * 0.07);
  const buffer = audioCtx.createBuffer(1, frames, audioCtx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    samples[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;
  }
  const rustle = audioCtx.createBufferSource();
  rustle.buffer = buffer;
  const hissFilter = audioCtx.createBiquadFilter();
  hissFilter.type = 'highpass';
  hissFilter.frequency.value = 2400;
  const hissGain = audioCtx.createGain();
  hissGain.gain.setValueAtTime(0.05, now);
  hissGain.gain.exponentialRampToValueAtTime(0.0002, now + 0.07);
  rustle.connect(hissFilter).connect(hissGain).connect(audioCtx.destination);
  rustle.start(now);
  rustle.stop(now + 0.07);

  const thud = audioCtx.createOscillator();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(168, now);
  thud.frequency.exponentialRampToValueAtTime(74, now + 0.1);
  const thudGain = audioCtx.createGain();
  thudGain.gain.setValueAtTime(0.075, now);
  thudGain.gain.exponentialRampToValueAtTime(0.0002, now + 0.1);
  thud.connect(thudGain).connect(audioCtx.destination);
  thud.start(now);
  thud.stop(now + 0.1);
}

export default function StickyNoteLangSwitch({ lang, onToggle, className }: Props) {
  const noteRef = useRef<HTMLSpanElement>(null);
  const tapeRef = useRef<HTMLSpanElement>(null);
  const shadowRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const note = noteRef.current;
    const tape = tapeRef.current;
    const shadow = shadowRef.current;
    if (!note || !tape || !shadow) return;
    gsap.set(note, { rotation: NOTE_TILT });
    // 胶带压在纸前 2px：纸翻起来时从胶带底下走过，胶带始终按在墙上那一侧
    gsap.set(tape, { rotation: TAPE_TILT, z: 2 });
    gsap.set(shadow, SHADOW_REST);
  }, []);

  const handleToggle = (): void => {
    playPaperSound();
    onToggle(OTHER[lang]);
  };

  return (
    <button
      type="button"
      data-lang={lang}
      aria-label={ARIA[lang]}
      onClick={handleToggle}
      className={
        // 根节点不带定位与显示类名，外部 className 才能自由落位；纸身自带定位锚点
        `group cursor-pointer touch-manipulation select-none border-0 bg-transparent p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900 ${className ?? ''}`
      }
    >
      <span
        ref={noteRef}
        aria-hidden="true"
        className="relative block h-[70px] w-[84px] rounded-[2px] [transform-style:preserve-3d] [will-change:transform]"
      >
        <span
          ref={shadowRef}
          aria-hidden="true"
          className="absolute inset-0 rounded-[2px] bg-zinc-900 [will-change:transform,filter]"
        />

        {/* 底纸两半各预印一面：上半页摊着英文、下半页摊着中文，正是叶片掀开后该露出来的内容。
            两半都正好一半，压缝的 1px 只由叶片让出来——底纸朝折缝多让就会把另一种语言的纸色挤进这一半 */}
        <span className="absolute inset-0 rounded-[2px] border-2 border-zinc-900 bg-[#EADFB4] [perspective:320px] [transform-style:preserve-3d]">
          <span className="absolute inset-x-0 top-0 h-1/2 overflow-hidden">
            <NotePaper lang="en" edge="top" height="h-[200%]" />
          </span>
          <span className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden">
            <NotePaper lang="zh" edge="bottom" height="h-[200%]" />
          </span>

          <span className={LEAF}>
            {/* 正面裁上半页的中文；背面预先翻 180 度裁下半页的英文，翻过去后每一行都落回画心原位、盖住底纸的裁切边 */}
            <span className={WINDOW}>
              <NotePaper lang="zh" edge="top" height={ART} />
            </span>
            <span className={`${WINDOW} [transform:rotateX(180deg)]`}>
              <NotePaper lang="en" edge="bottom" height={ART} />
            </span>
          </span>
        </span>

        {/* 胶带压在纸沿上，半透填色让底下的墨线边框透出来；上下边留直，只有两端是撕口 */}
        <span
          ref={tapeRef}
          className="absolute -top-[8px] left-1/2 block h-[16px] w-[56px] -ml-[28px]"
        >
          <svg viewBox="0 0 56 16" preserveAspectRatio="none" className="h-full w-full">
            <path
              d="M4.5 1 L14 0.75 L23 1.25 L32 0.85 L41 1.2 L51.5 1 L50.4 2.6 L51.9 4.2 L50.5 5.8 L52 7.5 L50.6 9.1 L51.8 10.7 L50.4 12.3 L51.6 14 L41 14.9 L32 15.3 L23 14.85 L14 15.25 L4.5 15 L5.6 13.4 L4.1 11.8 L5.5 10.2 L4 8.5 L5.4 6.9 L4.2 5.3 L5.6 3.7 L4.4 2 Z"
              fill="#F4EFE0"
              fillOpacity="0.62"
              stroke="rgba(120,113,98,0.26)"
              strokeWidth="0.7"
            />
            <g stroke="rgba(150,142,122,0.14)" strokeWidth="0.7">
              <path d="M6 5.2 L50 4.9" />
              <path d="M6 10.8 L50 11.1" />
            </g>
          </svg>
        </span>
      </span>
    </button>
  );
}
