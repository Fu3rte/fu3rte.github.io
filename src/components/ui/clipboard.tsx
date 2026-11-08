import * as React from "react"

import { Paper, type PaperProps } from "@/components/ui/paper"
import { useShapedSheet } from "@/hooks/use-paper-object"
import { dropShadow } from "@/lib/ink/paper/shadows"
import { PropSvg } from "@/lib/ink/paper/prop-svg"
import { useDensity, useInkSeed, useInkTier } from "@/lib/ink/react"
import { clipboardBoardRecipe, clipboardClip, type BoardTone } from "@/lib/ink/recipes/clipboard-ink"
import { cn } from "@/lib/utils"

type ClipboardProps = React.ComponentProps<"div"> & {
  tone?: BoardTone
  tilt?: boolean | number
  seed?: string | number
  size?: readonly [number, number]
}

function Clipboard({ className, style, children, ref, tone = "hardboard", tilt, seed: seedProp, size, ...props }: ClipboardProps) {
  const seed = useInkSeed(seedProp)
  const tier = useInkTier()
  const calm = useDensity() === "calm"
  const o = useShapedSheet({ recipe: clipboardBoardRecipe, params: { tone }, ref, seed, tilt, tiltMax: 1.2, size })
  const clip = React.useMemo(() => clipboardClip(`${seed}|clip`, { width: 104, tier, calm }), [seed, tier, calm])
  return (
    <div
      data-slot="clipboard"
      data-tone={tone}
      {...o.root}
      {...props}
      className={cn("relative isolate flex w-full max-w-md flex-col px-6 pt-14 pb-6", !o.ready && "bg-kraft shadow-card", className)}
      style={{ ...o.root.style, ...style }}
    >
      {o.node}
      {children}
      <PropSvg
        res={clip}
        kind="prop"
        data-slot="clipboard-clip"
        className="pointer-events-none absolute top-3 left-1/2 z-(--ll-z-prop) -translate-x-1/2 calm:hidden"
        style={{ filter: dropShadow("prop") }}
      />
    </div>
  )
}

type ClipboardPaperProps = Omit<PaperProps, "stock" | "as"> & { stock?: PaperProps["stock"]; as?: "div" | "section" | "article" | "form" | "fieldset" }

function ClipboardPaper({ className, stock = "paper", rules = "ruled", as = "div", ...props }: ClipboardPaperProps) {
  return <Paper data-slot="clipboard-paper" as={as} stock={stock} rules={rules} className={cn("-mt-6 flex min-h-64 flex-1 flex-col pt-18 pe-5 pb-5 ps-14 text-ink rtl:[&>[data-slot=paper-rules]]:-scale-x-100", className)} {...props} />
}

export { Clipboard, ClipboardPaper }
export type { ClipboardProps, ClipboardPaperProps }
