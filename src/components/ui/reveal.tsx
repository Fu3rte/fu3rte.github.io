import * as React from "react"

import { motionIsOff } from "@/hooks/use-live-motion"
import { useInk, useInkContext, useMergedRef } from "@/lib/ink/react"
import { revealNibRecipe } from "@/lib/ink/recipes/reveal-nib-ink"
import type { PaintKey } from "@/lib/ink/paint"
import { cn } from "@/lib/utils"

const CSS = `[data-slot=reveal][data-armed][data-state=hidden]:not([data-stagger],[data-nib]){opacity:0}
[data-slot=reveal][data-armed][data-state=visible]:not([data-stagger],[data-nib]){animation:var(--ll-reveal-anim) var(--ll-reveal-dur) var(--ll-ease-out) var(--ll-reveal-delay,0s) both}
[data-slot=reveal][data-nib][data-armed][data-state=hidden]>[data-slot=reveal-content]{opacity:0}
[data-slot=reveal][data-nib][data-armed][data-state=visible]>[data-slot=reveal-content]{animation:ll-wipe var(--ll-reveal-dur) var(--ll-ease-out) var(--ll-reveal-delay,0s) both}
[data-slot=reveal]{--ll-nib-a:-2%;--ll-nib-b:102%}
[data-slot=reveal][data-from=end],[dir=rtl] [data-slot=reveal]{--ll-nib-a:102%;--ll-nib-b:-2%}
[dir=rtl] [data-slot=reveal][data-from=end]{--ll-nib-a:-2%;--ll-nib-b:102%}
@keyframes ll-reveal-nib{0%{left:var(--ll-nib-a);opacity:1}90%{opacity:1}100%{left:var(--ll-nib-b);opacity:0}}
[data-slot=reveal-nib]{opacity:0;left:var(--ll-nib-a)}
[data-slot=reveal][data-nib][data-armed][data-state=visible]>[data-slot=reveal-nib]{animation:ll-reveal-nib var(--ll-reveal-dur) var(--ll-ease-out) var(--ll-reveal-delay,0s) both}
[data-slot=reveal][data-armed][data-stagger][data-state=hidden]>*{opacity:0}
[data-slot=reveal][data-armed][data-stagger][data-state=visible]>*{animation:var(--ll-reveal-anim) var(--ll-reveal-dur) var(--ll-ease-out) calc(var(--ll-reveal-delay,0s) + var(--ll-reveal-i,0)*var(--ll-reveal-stagger,.12s)) both}
${Array.from({ length: 16 }, (_, i) => `[data-slot=reveal][data-stagger]>:nth-child(${i + 1}){--ll-reveal-i:${i}}`).join("\n")}`

const STEPS = Array.from({ length: 21 }, (_, i) => i / 20)

type Effect = "wipe" | "soak" | "drop" | "pop" | "toss"

const EFFECTS: Record<Effect, { anim: string; dur: string }> = {
  wipe: { anim: "ll-wipe", dur: "var(--ll-dur-draw)" },
  soak: { anim: "ll-soak", dur: "var(--ll-dur-soak)" },
  drop: { anim: "ll-drop", dur: "var(--ll-dur-drop)" },
  pop: { anim: "ll-pop", dur: "var(--ll-dur-pop)" },
  toss: { anim: "ll-toss", dur: "var(--ll-dur-toss)" },
}

type RevealProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  effect?: Effect
  from?: "start" | "end"
  delay?: number
  stagger?: number
  threshold?: number
  once?: boolean
  onReveal?: () => void
  nib?: boolean
  nibColor?: PaintKey
  as?: "div" | "section" | "article" | "aside" | "figure" | "ul" | "ol" | "li" | "span" | "p"
}

function Reveal({ className, children, ref, style, effect = "wipe", from = "start", delay = 0, stagger, threshold = 0.25, once = true, onReveal, nib = false, nibColor = "tomato", as = "div", ...props }: RevealProps) {
  const Comp = as as React.ElementType
  const nibbed = nib && effect === "wipe" && !stagger && as !== "ul" && as !== "ol"
  const Wrap = as === "p" || as === "span" ? "span" : "div"
  const pen = useInk({ recipe: revealNibRecipe, params: { color: nibColor }, kind: "reveal-nib", size: [24, 24], seed: "reveal-nib" })
  const providerReduced = useInkContext().motion === "reduced"
  const root = React.useRef<HTMLElement | null>(null)
  const [armed, setArmed] = React.useState(false)
  const [visible, setVisible] = React.useState(true)
  const seen = React.useRef(onReveal)
  seen.current = onReveal

  React.useLayoutEffect(() => {
    const el = root.current
    if (!el || motionIsOff(el, providerReduced) || typeof IntersectionObserver === "undefined") return
    setArmed(true)
    setVisible(false)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const enough = e.isIntersecting && ((e.intersectionRatio ?? 1) >= threshold || (e.intersectionRect?.height ?? 0) >= window.innerHeight * 0.4)
          if (enough) {
            setVisible(true)
            seen.current?.()
            if (once) io.disconnect()
          } else if (!once && !e.isIntersecting) setVisible(false)
        }
      },
      { threshold: STEPS },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      setArmed(false)
      setVisible(true)
    }
  }, [once, threshold, providerReduced])

  const fx = EFFECTS[effect]
  const vars = {
    "--ll-reveal-anim": fx.anim,
    "--ll-reveal-dur": fx.dur,
    "--ll-reveal-delay": delay ? `${delay}s` : undefined,
    "--ll-reveal-stagger": stagger ? `${stagger}s` : undefined,
    ...(effect === "wipe" && from === "end" ? { "--ll-wipe-r": "-4%", "--ll-wipe-l": "100%" } : {}),
  }

  return (
    <>
      <style href="ll-reveal" precedence="low">
        {CSS}
      </style>
      <Comp
        data-slot="reveal"
        data-effect={effect}
        data-state={visible ? "visible" : "hidden"}
        data-armed={armed ? "" : undefined}
        data-stagger={stagger ? "" : undefined}
        data-nib={nibbed ? "" : undefined}
        data-from={from === "end" ? "end" : undefined}
        ref={useMergedRef<HTMLElement>(root, ref as React.Ref<HTMLElement> | undefined)}
        className={cn("group/reveal", nibbed && "relative", className)}
        style={{ ...vars, ...style } as React.CSSProperties}
        {...props}
      >
        {nibbed ? (
          <>
            <Wrap data-slot="reveal-content" className={Wrap === "span" ? "block" : undefined}>
              {children}
            </Wrap>
            <span
              data-slot="reveal-nib"
              aria-hidden="true"
              ref={pen.hostRef}
              {...pen.hostProps}
              style={{ outline: "none" }}
              className="pointer-events-none absolute bottom-0 z-(--ll-z-raised) isolate size-6 -translate-x-[12%] translate-y-[12%]"
            >
              {pen.node}
            </span>
          </>
        ) : (
          children
        )}
      </Comp>
    </>
  )
}

export { Reveal }
export type { RevealProps, Effect as RevealEffect }
