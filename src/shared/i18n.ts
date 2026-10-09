import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { useSyncExternalStore } from 'react';
import en from './locales/en.json';
import zh from './locales/zh.json';

const LANG_KEY = 'lang';
const SUPPORTED = ['zh', 'en'] as const;

export type Lang = (typeof SUPPORTED)[number];

export function bindHead(titleKey: string, descriptionKey: string): void {
  document.documentElement.lang = currentLang() === 'zh' ? 'zh-CN' : 'en';
  const title = i18next.t(titleKey);
  const description = i18next.t(descriptionKey);
  document.title = title;
  const meta: [string, string][] = [
    ['meta[name="description"]', description],
    ['meta[property="og:title"]', title],
    ['meta[property="og:description"]', description],
  ];
  for (const [selector, value] of meta) {
    document.querySelector(selector)?.setAttribute('content', value);
  }
}

export function currentLang(): Lang {
  return (i18next.resolvedLanguage ?? 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function subscribeLanguage(onChange: () => void): () => void {
  i18next.on('languageChanged', onChange);
  return () => { i18next.off('languageChanged', onChange); };
}

export function useLanguage(): Lang {
  return useSyncExternalStore(subscribeLanguage, currentLang);
}

export async function initI18n(): Promise<void> {
  await i18next.use(LanguageDetector).init({
    resources: { en: { translation: en }, zh: { translation: zh } },
    supportedLngs: [...SUPPORTED],
    fallbackLng: 'en',
    // zh-CN / zh-TW 都收敛到 zh，避免为区域变体准备空资源
    load: 'languageOnly',
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: LANG_KEY,
      caches: [],
    },
    returnEmptyString: false,
  });
}

export function t(key: string): string {
  return i18next.t(key);
}
