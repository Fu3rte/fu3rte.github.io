import { t } from '../../shared/i18n';
import { Link } from '../../shared/router';
import SectionHeading from './SectionHeading';
import photo01 from '../photos/assets/photo-01.webp';
import photo03 from '../photos/assets/photo-03.webp';
import photo06 from '../photos/assets/photo-06.webp';

const PHOTOS = [photo01, photo03, photo06];

export default function PhotosPreview() {
  return (
    <section id="photo-preview" className="section photos-preview">
      <SectionHeading index="05" eyebrow="PHOTOGRAPHS" title={t('photos.title')} />
      <div className="photo-preview-grid reveal">
        {PHOTOS.map((src, index) => (
          <img key={src} src={src} alt={`${t('photos.alt')} ${index + 1}`} loading="lazy" decoding="async" />
        ))}
      </div>
      <Link className="text-link" to="/photos">
        {t('photos.open')}
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 3.5H3.5v9h9v-3M9.5 3.5h3v3M12.5 3.5 7 9" /></svg>
      </Link>
    </section>
  );
}
