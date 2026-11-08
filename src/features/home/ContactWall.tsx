import { t, useLanguage } from '../../shared/i18n';
import CopyValue from '../../shared/CopyValue';
import SectionHeading from './SectionHeading';

const CHANNELS = [
  { key: 'email', value: '2575716528cqh@gmail.com', href: 'mailto:2575716528cqh@gmail.com' },
  { key: 'github', value: 'Fu3rte', href: 'https://github.com/Fu3rte' },
  { key: 'instagram', value: 'cq777h', href: 'https://www.instagram.com/cq777h/' },
  { key: 'wechat', value: 'F1nnian_' },
];

export default function ContactWall() {
  useLanguage();
  return (
    <section id="contact" className="section contact-wall">
      <SectionHeading index="06" eyebrow="CONTACT" title={t('contact.title')} />
      <div className="contact-orbit" aria-hidden="true"><span /><span /><span /></div>
      <h2 className="contact-me reveal">{t('contact.me')}</h2>
      <ul className="contact-rows reveal">
        {CHANNELS.map(channel => (
          <li key={channel.key}>
            <b className="mono">{t(`contact.channel.${channel.key}`)}</b>
            {channel.href
              ? <a href={channel.href} target={channel.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{channel.value}</a>
              : <CopyValue value={channel.value} />}
          </li>
        ))}
      </ul>
      <p className="site-signature mono">FINNIAN · DONGGUAN · UTC+8</p>
    </section>
  );
}
