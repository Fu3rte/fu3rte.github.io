import { useEffect } from 'react';
import { t, useLanguage } from '../../shared/i18n';
import { initMotion } from '../../shared/motion';
import CopyValue from '../../shared/CopyValue';

export default function ContactPage() {
  useLanguage();
  useEffect(initMotion, []);
  return (
    <main className="contact-page">
      <section className="section contact">
        <p className="section-eyebrow"><span>01</span>CONTACT</p>
        <h1 className="section-title contact-title">{t('contact.title')}</h1>
        <p className="prose reveal">{t('contact.p')}</p>
        <ul className="contact-list reveal">
          <li>
            <a className="contact-big" href="mailto:2575716528cqh@gmail.com">
              2575716528cqh@gmail.com
            </a>
          </li>
        </ul>
        <ul className="contact-list row reveal">
          <li><a className="mono" href="https://github.com/Fu3rte" target="_blank" rel="noreferrer">{t('contact.github')}</a></li>
          <li><a className="mono" href="https://www.instagram.com/cq777h/" target="_blank" rel="noreferrer">{t('contact.instagram')}</a></li>
          <li className="mono keepcase"><CopyValue value="F1nnian_">{t('contact.wechat')}</CopyValue></li>
        </ul>
      </section>
    </main>
  );
}
