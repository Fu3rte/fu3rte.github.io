import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { t } from '../../shared/i18n';

type Repo = {
  name: string;
  html_url: string;
  language: string | null;
};

// 贴纸文案按站点口径统一英文，仓库自己那条简介（contextus 是中文）只当素材
const REPOS = [
  {
    name: 'Fit-Agent',
    about: 'Personal strength-training assistant that keeps profile, plan and session logs in shape through natural language, on a single ReAct agent loop.',
  },
  {
    name: 'contextus',
    about: 'Smallest working RAG doc Q&A: chunk → pgvector cosine retrieval → generation, with a React + shadcn debug console.',
  },
  {
    name: 'dsh-sight',
    about: 'Plug-in vision for text-only DeepSeek Harness (dsh) models: built-in free/cheap VLM presets + multi-image batch analysis.',
  },
];
// 手贴的角度与错落，索引和卡片一一对应
const TILTS = [-3.2, 2.2, -1.6];
const DROPS = [0, 26, 12];
// 匿名访问 api.github.com 按 IP 计 60 次/小时，一次浏览就打三发；缓存把访客的重复请求挡在本地
const CACHE_KEY = 'works.repos';
const CACHE_TTL = 60 * 60 * 1000;

function readCache(): Repo[] | null {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  const cached = JSON.parse(raw) as { at: number; repos: Repo[] };
  return Date.now() - cached.at < CACHE_TTL ? cached.repos : null;
}

function writeCache(repos: Repo[]): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos }));
}

// 同一趟浏览里只打一组请求，StrictMode 的双次挂载与路由来回都不再翻倍
let inflight: Promise<Repo[]> | null = null;

function loadRepos(): Promise<Repo[]> {
  if (!inflight) {
    inflight = Promise.all(REPOS.map(async ({ name }) => {
      const response = await fetch(`https://api.github.com/repos/Fu3rte/${name}`);
      if (!response.ok) throw new Error(`github repo ${name} responded ${response.status}`);
      const body = await response.json() as Repo;
      return { name: body.name, html_url: body.html_url, language: body.language };
    })).then(data => {
      writeCache(data);
      return data;
    });
  }
  return inflight;
}

export default function Works() {
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const wall = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setRepos(cached);
      return;
    }
    let alive = true;
    void loadRepos().then(data => {
      if (alive) setRepos(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!repos || !wall.current) return;
    // 卡片带回来的文字比空壳高，整页滚动锚点先重算
    ScrollTrigger.refresh();

    const slots = [...wall.current.querySelectorAll<HTMLElement>('.sticker-slot')];
    // 胶带是贴纸的兄弟：揭示时各走各的拍子，胶带单独按下去
    const cards = slots.map(slot => slot.querySelector<HTMLElement>('.sticker')!);
    const tapes = slots.map(slot => slot.querySelector<HTMLElement>('.sticker-tape')!);
    cards.forEach((card, index) => {
      gsap.set(card, { rotation: TILTS[index], transformOrigin: '50% 0' });
    });

    const media = gsap.matchMedia();

    media.add('(prefers-reduced-motion: no-preference)', () => {
      // 窄屏上贴纸几乎满宽，摆角的包围盒会顶出视口右缘，掉落只留位移与淡入
      const swing = window.matchMedia('(min-width: 801px)').matches;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: wall.current, start: 'top 82%', once: true },
      });
      cards.forEach((card, index) => {
        const at = index * 0.16;
        tl.from(card, {
          opacity: 0,
          y: -52,
          rotation: swing ? TILTS[index] - 9 : TILTS[index],
          scale: swing ? 1.06 : 1,
          duration: 0.5,
          ease: 'power3.out',
        }, at).from(tapes[index], { scale: 0.25, opacity: 0, duration: 0.3, ease: 'power4.out' }, at + 0.34);
      });
      return () => {
        tl.kill();
      };
    });

    return () => {
      media.revert();
    };
  }, [repos]);

  return (
    <section id="works" className="section works">
      <h2 className="section-title">{t('works.title')}</h2>
      <ul className="sticker-wall" ref={wall}>
        {(repos ?? []).map((repo, index) => (
          <li
            className="sticker-slot"
            key={repo.name}
            style={{ '--slot-drop': `${DROPS[index]}px` } as CSSProperties}
          >
            <div className="sticker">
              <span className="sticker-name">{repo.name}</span>
              <span className="sticker-desc">{REPOS[index].about}</span>
              <span className="sticker-foot">
                {repo.language && <span className="sticker-lang">{repo.language}</span>}
                <a
                  className="sticker-open"
                  href={repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={repo.name}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M6.5 3.5H3.5v9h9v-3" />
                    <path d="M9.5 3.5h3v3M12.5 3.5 7 9" />
                  </svg>
                </a>
              </span>
            </div>
            <span className="sticker-tape" aria-hidden="true" />
          </li>
        ))}
      </ul>
    </section>
  );
}
