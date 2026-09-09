/**
 * Contact details a shopper gives the assistant.
 *
 * Stored only in the shopper's own browser and used only to save them retyping
 * at checkout. Nothing is transmitted anywhere from here: the order API is
 * called by the checkout form when they submit it, and the WhatsApp handoff
 * opens a prefilled message that the shopper sends themselves.
 */

export const CONTACT_KEY = "raks_contact_v1"

export type AssistantContact = {
  name: string
  phone: string
  savedAt: string
}

/**
 * Pakistani mobile numbers: 03xx xxxxxxx locally, or +92 3xx xxxxxxx.
 * Returns the number in local 03xxxxxxxxx form, or null when it is not one.
 */
export const normalisePkPhone = (raw: string): string | null => {
  const digits = String(raw ?? "").replace(/[^\d+]/g, "")
  const m =
    digits.match(/^\+?92(3\d{9})$/) ??
    digits.match(/^0(3\d{9})$/) ??
    digits.match(/^(3\d{9})$/)
  return m ? `0${m[1]}` : null
}

export const readContact = (): AssistantContact | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(CONTACT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.name && parsed?.phone ? (parsed as AssistantContact) : null
  } catch {
    return null
  }
}

export const saveContact = (name: string, phone: string): void => {
  if (typeof window === "undefined") return
  try {
    const value: AssistantContact = {
      name: name.trim().slice(0, 80),
      phone,
      savedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(CONTACT_KEY, JSON.stringify(value))
  } catch {
    // Storage can be unavailable in private windows. Losing a convenience
    // prefill is not worth breaking the conversation over.
  }
}
