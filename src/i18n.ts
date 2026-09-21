import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import zh from './locales/zh.json';

export const LANG_KEY = 'lang';
export const SUPPORTED = ['zh', 'en'] as const;

export type Lang = (typeof SUPPORTED)[number];

// 页面静态文案的 DOM 绑定约定：
// data-i18n 纯文本 · data-i18n-html 含标签的富文本 · data-i18n-aria 写进 aria-label
// 用 getAttribute 而非 dataset，因为 SVG 节点同样要参与翻译
function bindStaticText(): void {
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = i18next.t(el.getAttribute('data-i18n')!);
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-i18n-html]')) {
    el.innerHTML = i18next.t(el.getAttribute('data-i18n-html')!);
  }
  for (const el of document.querySelectorAll('[data-i18n-aria]')) {
    el.setAttribute('aria-label', i18next.t(el.getAttribute('data-i18n-aria')!));
  }
}

function bindHead(): void {
  document.documentElement.lang = currentLang() === 'zh' ? 'zh-CN' : 'en';
  document.title = i18next.t('meta.title');
  const pairs: [string, string, string][] = [
    ['meta[name="description"]', 'content', 'meta.description'],
    ['meta[property="og:title"]', 'content', 'meta.title'],
    ['meta[property="og:description"]', 'content', 'meta.description'],
  ];
  for (const [selector, attr, key] of pairs) {
    document.querySelector(selector)?.setAttribute(attr, i18next.t(key));
  }
}

export function currentLang(): Lang {
  return (i18next.resolvedLanguage ?? i18next.language ?? 'en').toLowerCase().startsWith('zh')
    ? 'zh'
    : 'en';
}

function syncSwitcher(): void {
  const active = currentLang();
  for (const btn of document.querySelectorAll<HTMLButtonElement>('.lang-btn')) {
    const on = btn.dataset.lang === active;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-pressed', String(on));
  }
}

function render(): void {
  bindStaticText();
  bindHead();
  syncSwitcher();
  // 文案长度会变，布局随之位移 —— 交给动效层重算滚动锚点
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lng: currentLang() } }));
}

export async function setLang(lng: Lang): Promise<void> {
  localStorage.setItem(LANG_KEY, lng);
  await i18next.changeLanguage(lng);
}

function setupSwitcher(): void {
  for (const btn of document.querySelectorAll<HTMLButtonElement>('.lang-btn')) {
    btn.addEventListener('click', () => {
      void setLang(btn.dataset.lang as Lang);
    });
  }
}

export async function initI18n(): Promise<void> {
  await i18next.use(LanguageDetector).init({
    resources: { en: { translation: en }, zh: { translation: zh } },
    supportedLngs: [...SUPPORTED],
    fallbackLng: 'en',
    // zh-CN / zh-TW 都收敛到 zh，避免为区域变体准备空资源
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANG_KEY,
      caches: [],
    },
    returnEmptyString: false,
  });

  i18next.on('languageChanged', render);
  setupSwitcher();
  render();
}

export function t(key: string): string {
  return i18next.t(key);
}
