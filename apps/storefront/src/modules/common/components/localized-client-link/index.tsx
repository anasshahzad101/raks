"use client"

import Link from "next/link"
import React from "react"

/**
 * Raks is a single-region (Pakistan) store, so URLs carry no country prefix.
 * This component is kept (many imports rely on it) but now renders a plain
 * Next.js <Link> with the href unchanged — preserving the exact SEO URLs.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: unknown
}) => {
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
