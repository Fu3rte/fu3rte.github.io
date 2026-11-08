import { useEffect } from 'react';
import { RouterProvider, useRouter } from '../shared/router';
import { bindHead, useLanguage } from '../shared/i18n';
import SiteHeader from './SiteHeader';
import { matchRoute } from './routes';

function Shell() {
  const language = useLanguage();
  const { path } = useRouter();
  const route = matchRoute(path);

  useEffect(() => {
    bindHead(route.titleKey, route.descriptionKey);
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lng: language } }));
  }, [route, language]);

  const Page = route.Component;
  return (
    <>
      <SiteHeader />
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
