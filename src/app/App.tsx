import { useEffect } from 'react';
import { RouterProvider, useRouter } from '../shared/router';
import { bindHead, useLanguage } from '../shared/i18n';
import MenuOrb from './MenuOrb';
import { matchRoute } from './routes';

function Shell() {
  const language = useLanguage();
  const { path } = useRouter();
  const route = matchRoute(path);

  useEffect(() => {
    bindHead(route.titleKey, route.descriptionKey);
    // 文案长度变化会推动整页位移，滚动锚点必须重算
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lng: language } }));
  }, [route, language]);

  const Page = route.Component;
  return (
    <>
      <MenuOrb />
      <Page />
    </>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <Shell />
    </RouterProvider>
  );
}
