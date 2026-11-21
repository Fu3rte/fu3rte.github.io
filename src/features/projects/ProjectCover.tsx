import type { Project } from '../home/projects';

const ACCENTS = {
  sky: {
    fill: '#bde2ff',
    chip: '#fff18f',
    stroke: '#36a384',
  },
  grass: {
    fill: '#c8f0c0',
    chip: '#ffd09b',
    stroke: '#2d8a56',
  },
} as const;

export default function ProjectCover({ project, index }: { project: Project; index: number }) {
  const palette = ACCENTS[project.accent];
  const boxes = project.nodes.map((label, nodeIndex) => ({
    label,
    x: 44 + nodeIndex * 188,
    y: nodeIndex % 2 === 0 ? 105 : 168,
    w: 162,
    h: 72,
  }));

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden border-b-2 border-dashed border-pencil-mark/60 bg-paper">
      <svg viewBox="0 0 640 360" className="h-full w-full" aria-hidden="true">
        <defs>
          {project.accent === 'sky' ? (
            <pattern id={`cover-dots-${project.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1.3" fill="rgb(62 168 137 / 0.25)" />
            </pattern>
          ) : (
            <pattern id={`cover-ruled-${project.id}`} width="640" height="26" patternUnits="userSpaceOnUse">
              <line x1="0" y1="25.5" x2="640" y2="25.5" stroke="rgb(110 198 172 / 0.28)" strokeWidth="1" />
            </pattern>
          )}
        </defs>
        <rect width="640" height="360" fill={project.accent === 'sky' ? '#f7fafc' : '#f6fbf8'} />
        <rect
          width="640"
          height="360"
          fill={project.accent === 'sky' ? `url(#cover-dots-${project.id})` : `url(#cover-ruled-${project.id})`}
        />
        {project.accent === 'grass' ? (
          <line x1="32" y1="0" x2="32" y2="360" stroke="rgb(238 108 59 / 0.28)" strokeWidth="1.2" />
        ) : null}

        {boxes.slice(1).map((target, edgeIndex) => {
          const from = boxes[edgeIndex]!;
          const x1 = from.x + from.w;
          const y1 = from.y + from.h / 2;
          const x2 = target.x;
          const y2 = target.y + target.h / 2;
          const midX = (x1 + x2) / 2;
          return (
            <g key={target.label} data-st="cover-edge">
              <path
                d={`M ${x1 + 3} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2 - 4} ${y2}`}
                fill="none"
                stroke={palette.stroke}
                strokeWidth="2.4"
                strokeDasharray="6 5"
                strokeLinecap="round"
              />
              <path
                d={`M ${x2 - 10} ${y2 - 5} L ${x2 - 2} ${y2} L ${x2 - 10} ${y2 + 5}`}
                fill="none"
                stroke={palette.stroke}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {boxes.map((box, boxIndex) => {
          const boxFill = boxIndex === 0 ? palette.fill : boxIndex === boxes.length - 1 ? palette.chip : '#ffffff';
          return (
            <g key={box.label} transform={`translate(${box.x} ${box.y}) rotate(${boxIndex === 1 ? 1.2 : -1})`}>
              <g data-st="cover-node">
                <rect x="4" y="4" width={box.w} height={box.h} rx="8" fill="#1d242c" opacity="0.92" />
                <rect
                  x="0"
                  y="0"
                  width={box.w}
                  height={box.h}
                  rx="8"
                  fill={boxFill}
                  stroke="#1d242c"
                  strokeWidth="2.3"
                />
                <text
                  x="14"
                  y="24"
                  fill="#52606e"
                  fontFamily="IBM Plex Mono, monospace"
                  fontSize="11"
                  fontWeight="700"
                >
                  0{boxIndex + 1}
                </text>
                <text
                  x="14"
                  y="49"
                  fill="#1d242c"
                  fontFamily='"Kevin Sans Hand", "Custom CJK Hand", "Noto Sans SC", sans-serif'
                  fontSize="16"
                  fontWeight="700"
                >
                  {box.label}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      <span className="pointer-events-none absolute top-3 left-4 font-script text-2xl font-bold text-ink">
        0{index + 1}
      </span>
      <span className="pointer-events-none absolute right-4 bottom-2.5 rounded-sm bg-hi/80 px-2 py-0.5 font-mono text-xs font-bold text-ink">
        {project.name}
      </span>
    </div>
  );
}
