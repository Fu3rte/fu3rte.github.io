import './style.css';
import { initI18n } from './i18n';
import { initScene } from './scene';
import { initMotion } from './motion';

async function init(): Promise<void> {
  // 文案先落地再启动动效：入场动画与 ScrollTrigger 锚点都依赖最终布局
  await initI18n();
  initScene();
  initMotion();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void init());
} else {
  void init();
}
