import type { ComponentType } from 'react';
import HomePage from '../features/home/HomePage';
import PhotosPage from '../features/photos/PhotosPage';
import ContactPage from '../features/contact/ContactPage';

export type RouteKey = 'home' | 'photos' | 'contact';

export type Route = {
  key: RouteKey;
  path: string;
  titleKey: string;
  descriptionKey: string;
  Component: ComponentType;
};

// 悬浮球菜单、head 文案、正文组件都从这张表出
export const routes: readonly Route[] = [
  { key: 'home', path: '/', titleKey: 'meta.title', descriptionKey: 'meta.description', Component: HomePage },
  { key: 'photos', path: '/photos', titleKey: 'meta.photosTitle', descriptionKey: 'meta.photosDescription', Component: PhotosPage },
  { key: 'contact', path: '/contact', titleKey: 'meta.contactTitle', descriptionKey: 'meta.contactDescription', Component: ContactPage },
];

export function matchRoute(path: string): Route {
  return routes.find(route => route.path === path) ?? routes[0];
}
