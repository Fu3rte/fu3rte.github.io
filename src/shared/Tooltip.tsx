import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { FocusEvent as ReactFocusEvent, ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  label: ReactNode;
  placement?: TooltipPlacement;
  /** 说话位：气泡钉在这个元素上，而不是被悬停的那件东西上 */
  anchor?: RefObject<HTMLElement | null>;
  /** 关掉视口裁决：既不翻边也不夹取，气泡死钉锚点、跟着页面一起滚出屏幕 */
  fit?: boolean;
  children: ReactNode;
}

// 气泡与锚点之间的净空、离视口边缘的最小距离、尖角距气泡两端的最小距离
const GAP = 14;
const EDGE = 12;
const CARET_INSET = 14;
const ENTER_DELAY = 120;
const OPPOSITE: Record<TooltipPlacement, TooltipPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

// 同一时刻全站只留一句话：气泡可以各钉各的，共用说话位时两句绝不同框
let silence: (() => void) | null = null;

export default function Tooltip({ label, placement = 'top', anchor, fit = true, children }: TooltipProps) {
  const root = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  // 悬停与键盘焦点各记各的，任一路在场气泡就留着：鼠标移开不该把刚 Tab 过来的焦点收走
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const id = useId();
  const open = hovered || focused;

  const target = () => anchor?.current ?? root.current?.firstElementChild;

  const place = useCallback(() => {
    const el = target();
    const tip = bubble.current;
    if (!el || !tip) return;
    const box = el.getBoundingClientRect();
    // 窄屏上墙上的装饰随媒体查询整层收起，量不到形就别把气泡钉在原地
    if (box.width === 0 && box.height === 0) {
      setHovered(false);
      return;
    }
    // 闭态整层缩着，getBoundingClientRect 量到的是缩过的尺寸，这里只认布局盒
    const width = tip.offsetWidth;
    const height = tip.offsetHeight;
    const room = {
      top: box.top,
      bottom: window.innerHeight - box.bottom,
      left: box.left,
      right: window.innerWidth - box.right,
    };
    const span = (side: TooltipPlacement) => (side === 'top' || side === 'bottom' ? height : width) + GAP;
    const side = fit && room[placement] < span(placement) ? OPPOSITE[placement] : placement;
    const horizontal = side === 'top' || side === 'bottom';
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    let x = cx - width / 2;
    let y = cy - height / 2;
    if (side === 'top') y = box.top - GAP - height;
    else if (side === 'bottom') y = box.bottom + GAP;
    else if (side === 'left') x = box.left - GAP - width;
    else x = box.right + GAP;
    if (fit) {
      x = Math.min(Math.max(x, EDGE), window.innerWidth - EDGE - width);
      y = Math.min(Math.max(y, EDGE), window.innerHeight - EDGE - height);
    }
    const along = horizontal ? cx - x : cy - y;
    tip.dataset.placement = side;
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
    tip.style.setProperty(
      '--tip-caret',
      `${Math.min(Math.max(along, CARET_INSET), (horizontal ? width : height) - CARET_INSET)}px`,
    );
  }, [anchor, fit, placement]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  // 入场动效与总谱同场竞争：滚动、缩放、入场位移都要让气泡钉在锚点上
  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setHovered(false);
        setFocused(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    silence?.();
    const stop = () => {
      setHovered(false);
      setFocused(false);
    };
    silence = stop;
    return () => {
      if (silence === stop) silence = null;
    };
  }, [open]);

  useEffect(() => {
    const el = root.current?.firstElementChild;
    if (!el) return;
    if (open) el.setAttribute('aria-describedby', id);
    else el.removeAttribute('aria-describedby');
  }, [open, id]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const enter = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setHovered(true), ENTER_DELAY);
  };

  const leave = () => {
    window.clearTimeout(timer.current);
    setHovered(false);
  };

  // 只认键盘落点：点一下 label 会把焦点交给里面的控件，那种焦点不该让气泡赖着不走
  const focusIn = (event: ReactFocusEvent<HTMLSpanElement>) => {
    if ((event.target as Element).matches(':focus-visible')) setFocused(true);
  };

  return (
    <span
      ref={root}
      className="tooltip-anchor"
      onPointerEnter={enter}
      onPointerLeave={leave}
      onFocus={focusIn}
      onBlur={() => setFocused(false)}
    >
      {children}
      {createPortal(
        <div ref={bubble} id={id} role="tooltip" className="tooltip" data-open={open}>
          {label}
        </div>,
        document.body,
      )}
    </span>
  );
}
