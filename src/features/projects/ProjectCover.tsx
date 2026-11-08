import type { Project } from '../home/projects';

export default function ProjectCover({ project, index }: { project: Project; index: number }) {
  const nodes = project.nodes.map((_, nodeIndex) => ({
    x: 92 + nodeIndex * (456 / (project.nodes.length - 1)),
    y: 218 + (nodeIndex % 2 === 0 ? -42 : 42),
  }));
  return (
    <div className={`project-cover project-cover-${index + 1}`}>
      <svg viewBox="0 0 640 480" aria-hidden="true">
        <defs>
          <pattern id={`dot-grid-${project.id}`} width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="currentColor" opacity="0.2" />
          </pattern>
        </defs>
        <rect width="640" height="480" fill={`url(#dot-grid-${project.id})`} />
        {nodes.slice(1).map((node, nodeIndex) => {
          const from = nodes[nodeIndex];
          return <line key={node.x} x1={from.x} y1={from.y} x2={node.x} y2={node.y} className="project-edge" />;
        })}
        {nodes.map((node, nodeIndex) => (
          <g key={node.x} transform={`translate(${node.x} ${node.y})`} className={nodeIndex === 0 ? 'cover-input' : nodeIndex === nodes.length - 1 ? 'cover-output' : ''}>
            <circle r="38" className="project-node-ring" />
            <circle r="24" className="project-node-core" />
            {Array.from({ length: 12 }, (_, dot) => (
              <circle
                key={dot}
                cx={(dot % 4 - 1.5) * 10}
                cy={(Math.floor(dot / 4) - 1) * 10}
                r="2.8"
                className="project-node-dot"
              />
            ))}
          </g>
        ))}
      </svg>
      <span className="project-cover-index">0{index + 1}</span>
      <span className="project-cover-name mono">{project.name}</span>
    </div>
  );
}
