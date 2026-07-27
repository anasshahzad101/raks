"use client"

export type WishlistItem = {
  handle: string
  title: string
  thumbnail?: string | null
  price?: string
}

const KEY = "raks_wishlist"
const EVENT = "raks-wishlist-change"

export function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]")
  } catch {
    return []
  }
}

function save(items: WishlistItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(EVENT))
}

export function isWishlisted(handle: string): boolean {
  return getWishlist().some((i) => i.handle === handle)
}

export function toggleWishlist(item: WishlistItem): boolean {
  const items = getWishlist()
  const idx = items.findIndex((i) => i.handle === item.handle)
  if (idx >= 0) {
    items.splice(idx, 1)
    save(items)
    return false
  }
  items.unshift(item)
  save(items)
  return true
}

export function removeFromWishlist(handle: string) {
  save(getWishlist().filter((i) => i.handle !== handle))
}

export function onWishlistChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(EVENT, cb)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener("storage", cb)
  }
}

export const WISHLIST_EVENT = EVENT
