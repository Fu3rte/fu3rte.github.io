import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { t } from '../../shared/i18n';

gsap.registerPlugin(ScrollTrigger);

const VERTEX = `
  attribute vec3 aTarget;
  attribute float aSignal;
  uniform float uProgress;
  uniform float uTime;
  uniform float uDpr;
  uniform float uPointerActive;
  uniform vec2 uPointer;
  varying float vSignal;
  varying float vProgress;

  void main() {
    float morph = smoothstep(0.0, 1.0, uProgress);
    vec3 transformed = mix(position, aTarget, morph);
    transformed.z += sin(position.x * 5.0 + uTime * 0.35) * 0.018 * (1.0 - morph);
    vec2 away = transformed.xy - uPointer;
    float force = (1.0 - smoothstep(0.0, 0.32, length(away))) * uPointerActive;
    transformed.xy += normalize(away + vec2(0.0001)) * force * 0.11;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
    gl_PointSize = (1.75 + aSignal * morph * 0.35) * uDpr;
    vSignal = aSignal;
    vProgress = morph;
  }
`;

const FRAGMENT = `
  precision highp float;
  varying float vSignal;
  varying float vProgress;

  void main() {
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    if (distanceToCenter > 0.5) discard;
    float alpha = (1.0 - smoothstep(0.12, 0.5, distanceToCenter)) * 0.9;
    vec3 bone = vec3(0.925, 0.906, 0.855);
    vec3 orange = vec3(1.0, 0.353, 0.122);
    vec3 ice = vec3(0.498, 0.847, 1.0);
    vec3 signal = vSignal < 1.5 ? orange : ice;
    vec3 color = mix(bone, signal, step(0.5, vSignal) * vProgress);
    gl_FragColor = vec4(color, alpha);
  }
`;

function random(index: number): number {
  const value = Math.sin(index * 91.733 + 17.13) * 43758.5453;
  return value - Math.floor(value);
}

function makePointSets(aspect: number) {
  const source = document.createElement('canvas');
  source.width = 1400;
  source.height = 260;
  const context = source.getContext('2d', { willReadFrequently: true })!;
  context.fillStyle = '#fff';
  context.font = '900 218px Atkinson Hyperlegible Next, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('FINNIAN', 700, 138);
  const pixels = context.getImageData(0, 0, source.width, source.height).data;
  const samples: [number, number][] = [];
  for (let y = 0; y < source.height; y += 5) {
    for (let x = 0; x < source.width; x += 5) {
      if (pixels[(y * source.width + x) * 4 + 3] > 120) samples.push([x, y]);
    }
  }

  const count = samples.length;
  const text = new Float32Array(count * 3);
  const graph = new Float32Array(count * 3);
  const signal = new Float32Array(count);
  const width = Math.min(aspect * 1.72, 3.25);
  const nodes = [
    [-0.78, 0.08], [-0.42, 0.4], [-0.06, 0.04], [0.34, 0.36], [0.76, 0.02], [0.06, -0.35],
  ];
  const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 4]];

  samples.forEach(([x, y], index) => {
    text[index * 3] = (x / source.width - 0.5) * width;
    text[index * 3 + 1] = (0.5 - y / source.height) * 0.64 + 0.35;
    text[index * 3 + 2] = 0;

    const spread = Math.min(aspect * 0.86, 1.4);
    if (index % 4 === 0) {
      const nodeIndex = index % nodes.length;
      signal[index] = nodeIndex === 0 ? 1 : nodeIndex === nodes.length - 1 ? 2 : 0;
      graph[index * 3] = nodes[nodeIndex][0] * spread + (random(index) - 0.5) * 0.12;
      graph[index * 3 + 1] = nodes[nodeIndex][1] + 0.25 + (random(index + 2) - 0.5) * 0.12;
    } else {
      const edge = edges[index % edges.length];
      const from = nodes[edge[0]];
      const to = nodes[edge[1]];
      const ratio = random(index + 4);
      signal[index] = edge[0] === 0 ? 1 : edge[1] === nodes.length - 1 ? 2 : 0;
      graph[index * 3] = (from[0] + (to[0] - from[0]) * ratio) * spread + (random(index + 7) - 0.5) * 0.025;
      graph[index * 3 + 1] = from[1] + (to[1] - from[1]) * ratio + 0.25 + (random(index + 9) - 0.5) * 0.025;
    }
    graph[index * 3 + 2] = 0;
  });

  return { text, graph, signal };
}

export default function LatticeHero() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = section.current;
    const surface = canvas.current;
    if (!host || !surface) return;
    const context = surface.getContext('webgl2', { alpha: true, antialias: false });
    if (!context) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;
    let cleanup = () => {};

    void import('three').then(THREE => {
      if (disposed) return;
      const renderer = new THREE.WebGLRenderer({ canvas: surface, context, alpha: true, antialias: false });
      renderer.setClearColor(0x07080b, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 3;
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uProgress: { value: 0 },
          uTime: { value: 0 },
          uDpr: { value: renderer.getPixelRatio() },
          uPointer: { value: new THREE.Vector2(10, 10) },
          uPointerActive: { value: 0 },
        },
      });
      let geometry = new THREE.BufferGeometry();
      const points = new THREE.Points(geometry, material);
      const scene = new THREE.Scene();
      scene.add(points);

      let ready = false;
      const rebuild = () => {
        const width = host.clientWidth;
        const height = host.querySelector<HTMLElement>('.hero-sticky')!.clientHeight;
        if (!width || !height) return;
        const aspect = width / height;
        renderer.setSize(width, height, false);
        camera.left = -aspect;
        camera.right = aspect;
        camera.updateProjectionMatrix();
        const sets = makePointSets(aspect);
        geometry.dispose();
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(sets.text, 3));
        geometry.setAttribute('aTarget', new THREE.BufferAttribute(sets.graph, 3));
        geometry.setAttribute('aSignal', new THREE.BufferAttribute(sets.signal, 1));
        points.geometry = geometry;
        ready = true;
        renderer.render(scene, camera);
      };

      let visible = true;
      const render = (time: number) => {
        if (!ready || document.hidden) return;
        material.uniforms.uTime.value = time / 1000;
        renderer.render(scene, camera);
      };
      const updateLoop = () => {
        renderer.setAnimationLoop(!reduced && visible ? render : null);
        if (reduced && ready) renderer.render(scene, camera);
      };
      const observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        updateLoop();
      });
      observer.observe(host);
      const resizeObserver = new ResizeObserver(rebuild);
      resizeObserver.observe(host.querySelector('.hero-sticky')!);

      const onPointerMove = (event: PointerEvent) => {
        const box = surface.getBoundingClientRect();
        const aspect = box.width / box.height;
        material.uniforms.uPointer.value.set(
          ((event.clientX - box.left) / box.width * 2 - 1) * aspect,
          -((event.clientY - box.top) / box.height * 2 - 1),
        );
        material.uniforms.uPointerActive.value = 1;
      };
      const onPointerLeave = () => { material.uniforms.uPointerActive.value = 0; };
      host.addEventListener('pointermove', onPointerMove);
      host.addEventListener('pointerleave', onPointerLeave);

      let trigger: ScrollTrigger | null = null;
      let copyTween: gsap.core.Tween | null = null;
      if (!reduced) {
        trigger = ScrollTrigger.create({
          trigger: host,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: self => { material.uniforms.uProgress.value = self.progress; },
        });
        copyTween = gsap.to(host.querySelector('.hero-copy'), {
          opacity: 0,
          y: -24,
          ease: 'none',
          scrollTrigger: { trigger: host, start: 'top top', end: '35% top', scrub: true },
        });
      }

      rebuild();
      updateLoop();
      document.fonts.ready.then(() => { if (!disposed) rebuild(); });
      cleanup = () => {
        trigger?.kill();
        copyTween?.scrollTrigger?.kill();
        copyTween?.kill();
        observer.disconnect();
        resizeObserver.disconnect();
        host.removeEventListener('pointermove', onPointerMove);
        host.removeEventListener('pointerleave', onPointerLeave);
        renderer.setAnimationLoop(null);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <section id="home" className="lattice-hero" ref={section}>
      <div className="hero-sticky">
        <canvas className="lattice-canvas" ref={canvas} aria-hidden="true" />
        <div className="hero-copy">
          <p className="hero-kicker mono">{t('hero.kicker')}</p>
          <h1>{t('hero.title')}</h1>
          <p className="hero-intro">{t('hero.intro')}</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#works">{t('hero.primary')}</a>
            <a className="button button-secondary" href="#contact">{t('hero.secondary')}</a>
          </div>
        </div>
        <p className="hero-coordinate mono">DONGGUAN · UTC+8</p>
      </div>
    </section>
  );
}
