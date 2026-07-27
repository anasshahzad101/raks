"use client"

import { useState } from "react"
import { clx } from "@modules/common/components/ui"
import RichText from "@modules/common/components/rich-text"

/**
 * Category intro / SEO copy shown full-width under the category title, enclosed
 * in a bordered card. Collapsed by default behind a fade with a "Read more"
 * toggle so a long block never dominates the page.
 */
const CategoryDescription = ({ content }: { content: string }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-5 rounded-large border border-bronze-100 bg-white/50 px-6 py-5 small:px-8 small:py-6">
      <div className="relative">
        <div
          className={clx(
            "relative overflow-hidden transition-[max-height] duration-500 ease-in-out",
            expanded ? "max-h-[3000px]" : "max-h-24"
          )}
        >
          <RichText content={content} />
          {!expanded && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent" />
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 text-xs uppercase tracking-luxe text-bronze-600 underline-offset-4 transition-colors hover:text-bronze-800 hover:underline"
          aria-expanded={expanded}
        >
          {expanded ? "Read less −" : "Read more +"}
        </button>
      </div>
    </div>
  )
}

export default CategoryDescription
