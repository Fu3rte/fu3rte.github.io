import { t, useLanguage } from '../../shared/i18n';

const CHANNELS = [
  { key: 'email', value: '2575716528cqh@gmail.com', href: 'mailto:2575716528cqh@gmail.com' },
  { key: 'github', value: 'Fu3rte', href: 'https://github.com/Fu3rte' },
  { key: 'instagram', value: 'cq777h', href: 'https://www.instagram.com/cq777h/' },
  { key: 'wechat', value: 'F1nnian_' },
];

export default function ContactWall() {
  useLanguage();
  return (
    <section id="contact" className="section">
      <h2 className="contact-me">{t('contact.me')}</h2>
      <ul className="contact-rows">
        {CHANNELS.map(channel => (
          <li key={channel.key}>
            <b className="mono">{t(`contact.channel.${channel.key}`)}</b>
            {channel.href
              ? <a href={channel.href} target={channel.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{channel.value}</a>
              : <span>{channel.value}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
