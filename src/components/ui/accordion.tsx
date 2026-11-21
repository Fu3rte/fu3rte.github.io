"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"

import { useInk, useMergedRef } from "@/lib/ink/react"
import { accordionBoxRecipe, type AccordionBoxParams } from "@/lib/ink/recipes/accordion-ink"
import { cn } from "@/lib/utils"

function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" className={cn("flex flex-col gap-3", className)} {...props} />
}

function AccordionItem({
  className,
  tone = "hi",
  seed,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item> & {
  tone?: AccordionBoxParams["tone"]
  seed?: string | number
}) {
  const { hostRef, hostProps, node } = useInk({
    recipe: accordionBoxRecipe,
    params: { tone },
    kind: "accordion",
    seed,
    still: true,
  })
  const merged = useMergedRef<HTMLDivElement>(hostRef, ref)

  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      ref={merged}
      {...hostProps}
      className={cn("relative isolate rounded-md transition-[translate] duration-(--ll-dur-hover)", className)}
      {...props}
    >
      {node}
      {children}
    </AccordionPrimitive.Item>
  )
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/acc flex flex-1 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-start font-hand text-[16px] font-bold text-ink transition-colors outline-none hover:text-ink-you focus-visible:text-ink-you",
          className,
        )}
        {...props}
      >
        <span className="min-w-0 flex-1">{children}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-4 shrink-0 text-ink transition-transform duration-200 ease-out group-data-[state=open]/acc:rotate-45"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        >
          <path d="M10 3.5C9.8 7.5 10.2 12.5 10 16.5" />
          <path d="M3.5 10.2C7.5 9.8 12.5 10.2 16.5 9.9" />
        </svg>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-[15px] leading-relaxed text-ink-soft data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-150"
      {...props}
    >
      <div className={cn("border-t border-dashed border-pencil-mark/60 px-4 pt-2.5 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
