"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { NavCategory } from "./nav-categories"

export default function MobileMenu({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <>
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="p-2 -ml-2 text-ink lg:hidden"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[82%] max-w-sm bg-cream-50 shadow-2xl flex flex-col animate-fade-in-right">
            <div className="flex items-center justify-between px-5 h-16 border-b border-bronze-200/60">
              <span className="font-display text-2xl tracking-luxe text-ink">RAKS</span>
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="p-2 -mr-2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-4">
              <MenuLink href="/shop/" onClick={() => setOpen(false)}>Shop All</MenuLink>
              {categories.map((c) => (
                <div key={c.href} className="border-b border-bronze-100/70">
                  <div className="flex items-center">
                    <LocalizedClientLink
                      href={c.href}
                      onClick={() => setOpen(false)}
                      className="flex-1 px-4 py-3 text-[15px] text-ink"
                    >
                      {c.name}
                    </LocalizedClientLink>
                    {c.children.length > 0 && (
                      <button
                        aria-label="Expand"
                        onClick={() => setExpanded(expanded === c.href ? null : c.href)}
                        className="px-4 py-3 text-bronze-600"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          className={`transition-transform ${expanded === c.href ? "rotate-180" : ""}`}>
                          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {expanded === c.href && c.children.length > 0 && (
                    <div className="pb-2">
                      {c.children.map((ch) => (
                        <LocalizedClientLink
                          key={ch.href}
                          href={ch.href}
                          onClick={() => setOpen(false)}
                          className="block pl-8 pr-4 py-2 text-sm text-ink/70 hover:text-bronze-600"
                        >
                          {ch.name}
                        </LocalizedClientLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <MenuLink href="/blogs/" onClick={() => setOpen(false)}>Journal</MenuLink>
              <MenuLink href="/about-us/" onClick={() => setOpen(false)}>About</MenuLink>
              <MenuLink href="/contact-us/" onClick={() => setOpen(false)}>Contact</MenuLink>
              <MenuLink href="/account" onClick={() => setOpen(false)}>My Account</MenuLink>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

function MenuLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <LocalizedClientLink
      href={href}
      onClick={onClick}
      className="block px-4 py-3 text-[15px] text-ink border-b border-bronze-100/70"
    >
      {children}
    </LocalizedClientLink>
  )
}
