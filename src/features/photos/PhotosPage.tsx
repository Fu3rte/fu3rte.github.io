import { useEffect } from 'react';
import { t, useLanguage } from '../../shared/i18n';
import { initMotion } from '../../shared/motion';
import photo01 from './assets/photo-01.webp';
import photo02 from './assets/photo-02.webp';
import photo03 from './assets/photo-03.webp';
import photo04 from './assets/photo-04.webp';
import photo05 from './assets/photo-05.webp';
import photo06 from './assets/photo-06.webp';
import photo07 from './assets/photo-07.webp';
import photo08 from './assets/photo-08.webp';
import photo09 from './assets/photo-09.webp';
import photo10 from './assets/photo-10.webp';

const photos = [photo01, photo02, photo03, photo04, photo05, photo06, photo07, photo08, photo09, photo10];

export default function PhotosPage() {
  useLanguage();
  useEffect(initMotion, []);

  return (
    <main className="photos-page">
      <section id="photos" className="section photos">
        <h1 className="section-title">{t('photos.title')}</h1>
        <div className="photos-grid reveal">
          {photos.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={`${t('photos.alt')} ${String(index + 1).padStart(2, '0')}`}
              loading={index < 3 ? 'eager' : 'lazy'}
              decoding="async"
            />
          ))}
        </div>
      </section>
    </main>
  );
}
