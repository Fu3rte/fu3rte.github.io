import { t, useLanguage } from '../../shared/i18n';
import CopyValue from '../../shared/CopyValue';
import { Link } from '../../shared/router';

export default function ContactPage() {
  useLanguage();
  return (
    <main className="contact-page">
      <Link className="mono wordmark" to="/">{t('brand')}</Link>
      <section className="section contact">
        <h1 className="section-title contact-title">{t('contact.title')}</h1>
        <p className="prose">{t('contact.p')}</p>
        <ul className="contact-list">
          <li>
            <a className="contact-big" href="mailto:2575716528cqh@gmail.com">
              2575716528cqh@gmail.com
            </a>
          </li>
        </ul>
        <ul className="contact-list row">
          <li>
            <a className="mono" href="https://github.com/Fu3rte" target="_blank" rel="noreferrer">
              {t('contact.github')}
            </a>
          </li>
          <li>
            <a className="mono" href="https://www.instagram.com/cq777h/" target="_blank" rel="noreferrer">
              {t('contact.instagram')}
            </a>
          </li>
          <li className="mono keepcase">
            <CopyValue value="F1nnian_">{t('contact.wechat')}</CopyValue>
          </li>
        </ul>
      </section>
    </main>
  );
}
