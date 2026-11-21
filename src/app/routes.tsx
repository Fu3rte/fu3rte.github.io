import { lazy, type ComponentType } from 'react';
import HomePage from '../features/home/HomePage';

const PhotosPage = lazy(() => import('../features/photos/PhotosPage'));
const ContactPage = lazy(() => import('../features/contact/ContactPage'));
const ProjectPage = lazy(() => import('../features/projects/ProjectPage'));

export type RouteKey = 'home' | 'photos' | 'contact' | 'project';

export type Route = {
  key: RouteKey;
  path: string;
  titleKey: string;
  descriptionKey: string;
  Component: ComponentType;
};

// 导航项、head 文案、正文组件都从这张表出
export const routes: readonly Route[] = [
  { key: 'home', path: '/', titleKey: 'meta.title', descriptionKey: 'meta.description', Component: HomePage },
  { key: 'photos', path: '/photos', titleKey: 'meta.photosTitle', descriptionKey: 'meta.photosDescription', Component: PhotosPage },
  { key: 'contact', path: '/contact', titleKey: 'meta.contactTitle', descriptionKey: 'meta.contactDescription', Component: ContactPage },
];

// 案例详情由 /projects/<id> 命中，具体 id 交给页面自身从路径里取
const projectRoute: Route = {
  key: 'project',
  path: '/projects',
  titleKey: 'meta.projectTitle',
  descriptionKey: 'meta.projectDescription',
  Component: ProjectPage,
};

export function matchRoute(path: string): Route {
  if (path.startsWith(`${projectRoute.path}/`)) return projectRoute;
  return routes.find(route => route.path === path) ?? routes[0];
}
