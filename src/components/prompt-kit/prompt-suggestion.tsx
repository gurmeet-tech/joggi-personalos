"use client"

import { cn } from "@/lib/utils"

export type PromptSuggestionProps = {
  children: React.ReactNode
  variant?: "outline" | "ghost"
  size?: "sm" | "lg"
  className?: string
  highlight?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

function PromptSuggestion({
  children,
  variant = "outline",
  size = "lg",
  className,
  highlight,
  ...props
}: PromptSuggestionProps) {
  const isHighlightMode = highlight !== undefined && highlight.trim() !== ""
  const content = typeof children === "string" ? children : ""

  const base = cn(
    "inline-flex cursor-pointer items-center justify-center gap-xxs whitespace-nowrap rounded-full border transition-colors",
    size === "lg" ? "px-sm py-xxs text-caption" : "px-xs py-xxs text-caption",
    variant === "ghost"
      ? "border-transparent hover:bg-field"
      : "border-hairline text-muted hover:border-ink hover:text-ink",
    className
  )

  if (!isHighlightMode || !content) {
    return (
      <button type="button" className={base} {...props}>
        {children}
      </button>
    )
  }

  const trimmedHighlight = (highlight || "").trim()
  const contentLower = content.toLowerCase()
  const highlightLower = trimmedHighlight.toLowerCase()
  const shouldHighlight = contentLower.includes(highlightLower)

  if (!shouldHighlight) {
    return (
      <button type="button" className={base} {...props}>
        <span className="whitespace-pre-wrap">{content}</span>
      </button>
    )
  }

  const index = contentLower.indexOf(highlightLower)
  const actualHighlightedText = content.substring(index, index + highlightLower.length)
  const before = content.substring(0, index)
  const after = content.substring(index + actualHighlightedText.length)

  return (
    <button type="button" className={base} {...props}>
      {before && <span className="whitespace-pre-wrap text-muted">{before}</span>}
      <span className="whitespace-pre-wrap font-medium text-ink">{actualHighlightedText}</span>
      {after && <span className="whitespace-pre-wrap text-muted">{after}</span>}
    </button>
  )
}

export { PromptSuggestion }
