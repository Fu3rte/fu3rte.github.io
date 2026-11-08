type Props = {
  index: string;
  eyebrow: string;
  title: string;
};

export default function SectionHeading({ index, eyebrow, title }: Props) {
  return (
    <header className="section-heading">
      <p className="section-eyebrow"><span>{index}</span>{eyebrow}</p>
      <h2 className="section-title">{title}</h2>
    </header>
  );
}
