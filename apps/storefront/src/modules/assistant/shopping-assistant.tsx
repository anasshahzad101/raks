"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { addLocalCartItem } from "@lib/local-cart"
import {
  BRAND,
  POLICY,
  deliveryWindow,
  freeDeliveryThresholdLabel,
  formatPKR,
} from "@lib/raks"
import {
  normalisePkPhone,
  readContact,
  saveContact,
  type AssistantContact,
} from "@lib/assistant-contact"
import { parseIntent } from "./parse-intent"
import {
  trackAssistantAddToCart,
  trackAssistantSelectItem,
  trackChoice,
  trackClose,
  trackContact,
  trackFaq,
  trackHandoff,
  trackMessage,
  trackNoResults,
  trackOpen,
  trackResults,
  trackTeaserDismissed,
  trackTeaserShown,
} from "./track"

/**
 * RAKS shopping assistant.
 *
 * Guided buttons plus free text, deliberately rule-based rather than a language
 * model. It only ever offers real products at real prices from the catalogue
 * index, and answers policy questions from POLICY, so it cannot invent a price,
 * a delivery promise or a product that does not exist. This site spent a month
 * removing fabricated claims; a bot that hallucinates would put them back.
 *
 * When a typed message is not understood it says so and offers the buttons,
 * rather than guessing and showing the wrong thing.
 *
 * Contact details a shopper gives are kept in their own browser and used to
 * prefill checkout. Nothing is transmitted without them pressing send.
 */

type Product = {
  id: string; h: string; t: string; v: string; vt: string; p: number
  img: string | null; c: string[]; sizes: string[]; cups: string[]
  colors: string[]; f: string[]; o: string[]
}

type Filter = {
  cats: string[]; occasion: string; fabric: string; max: number
  size?: string; color?: string
}
type Choice = { label: string; next: string; filter?: Partial<Filter> }

type Msg =
  | { kind: "bot"; text: string }
  | { kind: "user"; text: string }
  | { kind: "products"; items: Product[] }

/* ------------------------------------------------------------------ steps */

const CATEGORY_CHOICES: Choice[] = [
  { label: "Bras", next: "bra-occasion", filter: { cats: ["bras"] } },
  { label: "Nighties & nightwear", next: "night-occasion", filter: { cats: ["nightwear"] } },
  { label: "Pyjama sets", next: "budget", filter: { cats: ["pyjama"] } },
  { label: "Shapewear", next: "budget", filter: { cats: ["shapewear"] } },
  { label: "Panties", next: "budget", filter: { cats: ["panties"] } },
]

const BRA_OCCASION: Choice[] = [
  { label: "Everyday", next: "budget", filter: { cats: ["t-shirt-bra", "padded-bra", "non-padded-bra"], occasion: "everyday" } },
  { label: "Bridal or special occasion", next: "budget", filter: { cats: ["bridal-bra", "bridal-bra-sets", "fancy-bra-in-pakistan"] } },
  { label: "Sports", next: "budget", filter: { cats: ["sports-bra"] } },
  { label: "Nursing or maternity", next: "budget", filter: { cats: ["nursing-and-maternity-bras"] } },
  { label: "A first bra for a teenager", next: "budget", filter: { cats: ["bras"], occasion: "teen" } },
  { label: "Show me everything", next: "budget" },
]

const NIGHT_OCCASION: Choice[] = [
  { label: "Everyday comfort", next: "night-fabric", filter: { occasion: "everyday" } },
  { label: "Bridal or wedding night", next: "night-fabric", filter: { cats: ["bridal-night-dress"], occasion: "bridal" } },
  { label: "Honeymoon", next: "night-fabric", filter: { occasion: "honeymoon" } },
  { label: "Show me everything", next: "night-fabric" },
]

const NIGHT_FABRIC: Choice[] = [
  { label: "Cotton or linen", next: "budget", filter: { fabric: "cotton" } },
  { label: "Silk or satin", next: "budget", filter: { fabric: "satin" } },
  { label: "Lace or net", next: "budget", filter: { fabric: "lace" } },
  { label: "No preference", next: "budget" },
]

const BUDGET: Choice[] = [
  { label: "Under Rs 1,000", next: "results", filter: { max: 1000 } },
  { label: "Under Rs 2,500", next: "results", filter: { max: 2500 } },
  { label: "Under Rs 5,000", next: "results", filter: { max: 5000 } },
  { label: "Any budget", next: "results", filter: { max: Infinity } },
]

const HELP_TOPICS: Choice[] = [
  { label: "Delivery & charges", next: "a-delivery" },
  { label: "Payment options", next: "a-payment" },
  { label: "Exchanges", next: "a-exchange" },
  { label: "Packaging & privacy", next: "a-packaging" },
  { label: "Finding my size", next: "a-size" },
]

const ANSWERS: Record<string, string> = {
  delivery: `We deliver across Pakistan, usually within ${deliveryWindow()}. Delivery is free on orders over ${freeDeliveryThresholdLabel()}.`,
  payment: `Cash on Delivery — you pay when the order reaches your door. No card needed.`,
  exchange: `If the fit is wrong you can exchange for a different size within ${POLICY.exchangeWindowDays} days, as long as the piece is unworn with tags intact.`,
  packaging: `Every order ships in ${POLICY.packaging}. Nothing on the outside says what is inside.`,
  size: `Each product page lists the sizes in stock for that piece. Tell me your usual size and what you are looking at, and I will point you to the right one.`,
}

const PROMPTS: Record<string, string> = {
  category: "What are you shopping for?",
  "bra-occasion": "What will you mostly wear it for?",
  "night-occasion": "What is the occasion?",
  "night-fabric": "Any fabric preference?",
  budget: "What sort of budget?",
  help: "What would you like to know?",
}

const STEPS: Record<string, Choice[]> = {
  category: CATEGORY_CHOICES,
  "bra-occasion": BRA_OCCASION,
  "night-occasion": NIGHT_OCCASION,
  "night-fabric": NIGHT_FABRIC,
  budget: BUDGET,
  help: HELP_TOPICS,
  "help-done": HELP_TOPICS,
}

/* -------------------------------------------------------------- matching */

const EMPTY: Filter = { cats: [], occasion: "", fabric: "", max: Infinity }

/**
 * Fabric words that count as a match for each request.
 *
 * "jersey" is deliberately in none of them. Jersey is a knit construction, not
 * a fibre: the catalogue contains "premium jersey silk" and "soft jersey and
 * delicate net", neither of which is cotton. Grouping jersey with cotton made
 * the assistant lead a cotton search with a silk cami set.
 */
const FABRIC_GROUP: Record<string, string[]> = {
  cotton: ["cotton", "linen"],
  satin: ["satin", "silk", "chiffon"],
  lace: ["lace", "net", "mesh"],
}

/** How each fabric request is described back to the shopper. */
const FABRIC_LABEL: Record<string, string> = {
  cotton: "cotton or linen",
  satin: "silk or satin",
  lace: "lace or net",
}

/** Does this piece actually match the fabric that was asked for? */
const fabricHit = (p: Product, fabric: string): boolean =>
  (FABRIC_GROUP[fabric] ?? [fabric]).some((g) => p.f.includes(g))

/**
 * What to say when nothing matches the fabric asked for.
 *
 * Showing the nearest pieces under a "Found 30" heading would imply they are
 * cotton when they are not. Only one nightwear piece in the catalogue is tagged
 * cotton, so this is the common case, not an edge case. Saying it plainly also
 * makes the gap visible in analytics.
 */
const nearestLead = (fabric: string): string =>
  `I don't have anything in ${FABRIC_LABEL[fabric] ?? fabric} that matches. ` +
  `Here are the closest pieces — each product page lists what it is made of, so do check before you buy.`

/**
 * Fabrics named outright in a product title, by the group they belong to.
 *
 * Used only to demote. A shopper who asks for cotton should not be led with a
 * piece whose own title says "Silk", so a title that advertises a different
 * fabric costs a product the top of the list.
 */
const TITLE_FABRIC: [string, RegExp][] = [
  ["cotton", /\b(cotton|jersey|linen)\b/i],
  ["satin", /\b(satin|silk|silky)\b/i],
  ["lace", /\b(lace|net|mesh)\b/i],
]

const match = (all: Product[], f: Filter): Product[] => {
  const scored = all
    .filter((p) => p.p <= f.max)
    .map((p) => {
      let score = 0
      // Teen pieces surface only when explicitly asked for.
      if (p.o.includes("teen") && f.occasion !== "teen") return null
      if (f.cats.length) {
        if (!f.cats.some((c) => p.c.includes(c))) return null
        score += 3
      }
      if (f.occasion) {
        if (p.o.includes(f.occasion)) score += 2
        else if (f.occasion !== "everyday") return null
        if (f.occasion === "everyday" && (p.o.includes("bridal") || p.o.includes("party"))) score -= 3
      }
      if (f.fabric) {
        if (fabricHit(p, f.fabric)) {
          score += 2
          // A piece whose own title says "100% Polyester" should not lead a
          // search for silk, even though satin and silk share a group. The site
          // tells shoppers to check the composition; the assistant ranks by it.
          if (f.fabric === "satin" && /100%\s*polyester|polyester satin/i.test(p.t)) {
            score -= 4
          }
        } else if (
          // No fabric match, and the title names a different one outright.
          // Kept inside the else so "Cotton Lace Nighty" is never punished for
          // saying cotton when the shopper asked for lace — it is both.
          TITLE_FABRIC.some(([name, re]) => name !== f.fabric && re.test(p.t))
        ) {
          score -= 3
        }
      }
      if (f.size) {
        const want = f.size.toLowerCase()
        const hit =
          p.sizes.some((s) => s.toLowerCase() === want) ||
          p.sizes.some((s) => want.startsWith(s.toLowerCase())) ||
          p.cups.some((c) => want.endsWith(c.toLowerCase()))
        if (hit) score += 2
      }
      if (f.color) {
        const want = f.color
        if (p.colors.some((c) => c.toLowerCase().includes(want))) score += 2
        else if (p.t.toLowerCase().includes(want)) score += 1
      }
      if (p.sizes.length) score += 1
      return { p, score }
    })
    .filter(Boolean) as { p: Product; score: number }[]

  scored.sort((a, b) => b.score - a.score || a.p.p - b.p.p)
  return scored.map((s) => s.p)
}

const TEASER_KEY = "raks_assistant_seen"

/* ------------------------------------------------------------- component */

export default function ShoppingAssistant() {
  const [open, setOpen] = useState(false)
  const [teaser, setTeaser] = useState(false)
  const [index, setIndex] = useState<Product[] | null>(null)
  const [step, setStep] = useState("category")
  const [filter, setFilter] = useState<Filter>(EMPTY)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [shown, setShown] = useState(3)
  const [added, setAdded] = useState<Record<string, boolean>>({})
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState("")
  const [contact, setContact] = useState<AssistantContact | null>(null)
  const [capture, setCapture] = useState<"none" | "name" | "phone">("none")
  const [pendingName, setPendingName] = useState("")
  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setContact(readContact()), [])

  /* The greeting appears on its own, once per visit, without hijacking the page. */
  useEffect(() => {
    if (typeof window === "undefined") return
    let seen = false
    try { seen = window.sessionStorage.getItem(TEASER_KEY) === "1" } catch {}
    if (seen) return
    const t = window.setTimeout(() => {
      setTeaser(true)
      trackTeaserShown()
    }, 3200)
    return () => window.clearTimeout(t)
  }, [])

  /** Hide the greeting without recording a dismissal — used when it is opened. */
  const markTeaserSeen = useCallback(() => {
    setTeaser(false)
    try { window.sessionStorage.setItem(TEASER_KEY, "1") } catch {}
  }, [])

  /** The shopper actively closed the greeting, which is worth knowing. */
  const dismissTeaser = useCallback(() => {
    markTeaserSeen()
    trackTeaserDismissed()
  }, [markTeaserSeen])

  /* Catalogue index loads on first open only. */
  useEffect(() => {
    if (!open || index) return
    fetch("/assistant-index.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setIndex)
      .catch(() => setIndex([]))
  }, [open, index])

  useEffect(() => {
    if (!open || msgs.length) return
    setMsgs([
      {
        kind: "bot",
        text: contact?.name
          ? `Welcome back, ${contact.name.split(" ")[0]}. What are you looking for today? Tap an option or just type.`
          : "Hi, I'm here to help you find something. Tap an option below, or type what you're after — for example \"cotton nighty under 2000\".",
      },
    ])
  }, [open, msgs.length, contact])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" })
  }, [msgs, typing, shown, capture])

  const say = useCallback((text: string, delay = 420) => {
    setTyping(true)
    window.setTimeout(() => {
      setTyping(false)
      setMsgs((p) => [...p, { kind: "bot", text }])
    }, delay)
  }, [])

  const showProducts = useCallback(
    (items: Product[], lead: string) => {
      setShown(3)
      say(lead)
      window.setTimeout(() => setMsgs((p) => [...p, { kind: "products", items }]), 700)
      setStep("results")
    },
    [say]
  )

  const openChat = (source: "teaser" | "button") => {
    markTeaserSeen()
    setOpen(true)
    trackOpen(source)
  }

  const closeChat = () => {
    setOpen(false)
    trackClose(msgs.length)
  }

  /* ------------------------------------------------------------ contact */

  const askForContact = useCallback((reason: string) => {
    say(reason)
    trackContact("asked")
    window.setTimeout(() => {
      setMsgs((p) => [...p, { kind: "bot", text: "What name should I use?" }])
      setCapture("name")
      inputRef.current?.focus()
    }, 800)
  }, [say])

  const handleCapture = (value: string) => {
    if (capture === "name") {
      setPendingName(value)
      setCapture("phone")
      say(`Thanks ${value.split(" ")[0]}. And your mobile number? We use it only for the order.`)
      return
    }
    const phone = normalisePkPhone(value)
    if (!phone) {
      say("That doesn't look like a Pakistani mobile number. It should start 03 and have 11 digits — for example 0300 1234567.")
      trackContact("invalid_phone")
      return
    }
    saveContact(pendingName, phone)
    trackContact("saved")
    setContact({ name: pendingName, phone, savedAt: new Date().toISOString() })
    setCapture("none")
    say(`Saved, ${pendingName.split(" ")[0]} — ${phone}. It stays on this device and fills in your details at checkout, so you don't retype them. Payment is Cash on Delivery.`)
    setStep("contact-done")
  }

  /* -------------------------------------------------------------- input */

  const submit = (raw: string) => {
    const text = raw.trim()
    if (!text) return
    setMsgs((p) => [...p, { kind: "user", text }])
    setDraft("")

    // Returns before any tracking: a message typed during contact capture is
    // the shopper's name or number and must never reach Analytics.
    if (capture !== "none") { handleCapture(text); return }

    const intent = parseIntent(text)
    trackMessage(intent.kind, text)

    if (intent.kind === "faq") {
      say(ANSWERS[intent.topic]); trackFaq(intent.topic); setStep("help-done"); return
    }

    if (intent.kind === "human") {
      trackHandoff("requested")
      if (contact) {
        say(`I'll pass this on. We have you as ${contact.name} on ${contact.phone} — tap WhatsApp below and we'll pick it up there.`)
        setStep("contact-done")
      } else {
        askForContact("Happy to get a person onto this.")
      }
      return
    }

    if (intent.kind === "order") {
      if (contact) {
        say("Your bag is ready when you are — tap View bag, and checkout will already have your details. Payment is Cash on Delivery.")
        setStep("contact-done")
      } else {
        askForContact("I can take your details so checkout is quicker.")
      }
      return
    }

    if (intent.kind === "search") {
      const f: Filter = {
        cats: intent.cats, occasion: intent.occasion, fabric: intent.fabric,
        max: intent.max, size: intent.size, color: intent.color,
      }
      setFilter(f)
      const found = match(index ?? [], f)
      if (!found.length) {
        say("I couldn't find anything matching that. Try a higher budget or a different fabric, or tap an option below.")
        trackNoResults(f)
        setStep("no-results")
        return
      }
      const exact = !f.fabric || found.some((p) => fabricHit(p, f.fabric))
      trackResults(found.length, f, exact)
      if (!exact) { showProducts(found, nearestLead(f.fabric)); return }
      const bits = [
        intent.color,
        intent.fabric,
        intent.size ? `size ${intent.size}` : "",
        intent.max !== Infinity ? `under ${formatPKR(intent.max)}` : "",
      ].filter(Boolean).join(", ")
      showProducts(found, `Found ${found.length} ${found.length === 1 ? "piece" : "pieces"}${bits ? ` — ${bits}` : ""}.`)
      return
    }

    say("Sorry, I didn't catch that. I understand things like \"silk nighty under 3000\", \"34B t-shirt bra\" or \"how long is delivery\". You can also tap an option below, or ask for a person.")
  }

  /* ------------------------------------------------------------ choices */

  const choose = (c: Choice) => {
    setMsgs((p) => [...p, { kind: "user", text: c.label }])
    trackChoice(step, c.label)
    const next: Filter = { ...filter, ...(c.filter ?? {}), cats: c.filter?.cats ?? filter.cats }
    setFilter(next)

    if (c.next.startsWith("a-")) {
      const topic = c.next.slice(2)
      say(ANSWERS[topic]); trackFaq(topic); setStep("help-done"); return
    }
    if (c.next === "results") {
      const found = match(index ?? [], next)
      if (!found.length) {
        say("Nothing matches that exactly. Try a higher budget, or start again.")
        trackNoResults(next)
        setStep("no-results")
        return
      }
      const exact = !next.fabric || found.some((p) => fabricHit(p, next.fabric))
      trackResults(found.length, next, exact)
      showProducts(
        found,
        exact
          ? `Here ${found.length === 1 ? "is" : "are"} ${found.length} that fit. Delivery is free over ${freeDeliveryThresholdLabel()}.`
          : nearestLead(next.fabric)
      )
      return
    }
    say(PROMPTS[c.next] ?? "")
    setStep(c.next)
  }

  const restart = () => {
    setFilter(EMPTY); setStep("category"); setShown(3); setCapture("none")
    setMsgs([{ kind: "bot", text: "Let's start again — what are you shopping for?" }])
  }

  const add = (p: Product) => {
    trackAssistantAddToCart({
      item_id: p.h, item_name: p.t, price: p.p, item_variant: p.vt,
    })
    addLocalCartItem(
      { variant_id: p.v, product_id: p.id, product_handle: p.h, product_title: p.t,
        variant_title: p.vt, thumbnail: p.img, unit_price: p.p },
      1
    )
    setAdded((a) => ({ ...a, [p.v]: true }))
    if (!contact) {
      window.setTimeout(
        () => askForContact("Added to your bag. Shall I take your details so checkout is quicker?"),
        900
      )
    }
  }

  /** Click-through to a product page, attributed to the assistant's list. */
  const selectItem = (p: Product, i: number) =>
    trackAssistantSelectItem({ item_id: p.h, item_name: p.t, price: p.p, index: i })

  const choices = step === "no-results" ? BUDGET : STEPS[step] ?? []
  const waMessage = encodeURIComponent(
    contact
      ? `Hi RAKS, this is ${contact.name} (${contact.phone}). I'd like some help choosing.`
      : "Hi RAKS, I'd like some help choosing."
  )

  return (
    <>
      {/* Greeting bubble — appears on its own, once per visit */}
      {teaser && !open && (
        <div className="fixed bottom-24 right-5 z-[60] w-[min(300px,calc(100vw-2.5rem))] rounded-2xl rounded-br-sm border border-cream-300 bg-[#fffdf9] p-3.5 shadow-[0_14px_38px_rgba(42,17,23,0.2)]">
          <button type="button" onClick={dismissTeaser} aria-label="Dismiss" className="absolute right-2 top-1.5 text-[16px] leading-none text-ink/35 hover:text-ink">
            ×
          </button>
          <button type="button" onClick={() => openChat("teaser")} className="block w-full pr-4 text-left">
            <span className="mb-1 block font-display text-[15px] text-ink">Need help choosing?</span>
            <span className="block text-[12px] leading-relaxed text-ink/65">
              Tell me your size, fabric or budget and I&apos;ll show you what we have. Cash on Delivery across Pakistan.
            </span>
            <span className="mt-2 inline-block rounded-full bg-accent px-3 py-1 text-[11px] text-cream-50">
              Start chatting
            </span>
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => (open ? closeChat() : openChat("button"))}
        aria-expanded={open}
        aria-label={open ? "Close the shopping assistant" : "Open the shopping assistant"}
        className="fixed bottom-5 right-5 z-[60] flex h-14 items-center gap-2.5 rounded-full bg-accent px-5 text-cream-50 shadow-[0_8px_28px_rgba(42,17,23,0.28)] transition-transform hover:scale-[1.03] active:scale-95"
      >
        <span aria-hidden className="text-[17px] leading-none">{open ? "×" : "✦"}</span>
        <span className="text-[13px] font-medium tracking-[0.06em]">{open ? "Close" : "Help me choose"}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="RAKS shopping assistant"
          className="fixed bottom-24 right-5 z-[60] flex max-h-[min(640px,calc(100vh-8rem))] w-[min(384px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-cream-300 bg-[#fffdf9] shadow-[0_18px_50px_rgba(42,17,23,0.22)]"
        >
          <div className="flex items-center gap-3 border-b border-cream-300 bg-cream-100 px-4 py-3.5">
            <span className="font-arabic text-[26px] leading-none text-accent">رقـص</span>
            <div className="flex-1">
              <div className="font-display text-[17px] leading-tight text-ink">Shopping help</div>
              <div className="text-[11px] text-ink/55">Real pieces, real prices</div>
            </div>
            <button type="button" onClick={restart} className="text-[11px] uppercase tracking-[0.12em] text-gold-deep underline underline-offset-4 hover:text-accent">
              Restart
            </button>
          </div>

          <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) =>
              m.kind === "products" ? (
                <div key={i} className="space-y-2.5">
                  {m.items.slice(0, shown).map((p, i) => (
                    <article key={p.v} className="flex gap-3 rounded-xl border border-cream-300 bg-white p-2.5">
                      <a href={`/product/${p.h}/`} onClick={() => selectItem(p, i)} className="shrink-0">
                        {p.img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.img} alt={p.t} className="h-[74px] w-[58px] rounded-lg object-cover" loading="lazy" />
                        ) : (
                          <div className="h-[74px] w-[58px] rounded-lg bg-cream-200" />
                        )}
                      </a>
                      <div className="min-w-0 flex-1">
                        <a href={`/product/${p.h}/`} onClick={() => selectItem(p, i)} className="line-clamp-2 text-[12.5px] leading-snug text-ink hover:text-accent">{p.t}</a>
                        <div className="mt-1 text-[13px] font-medium text-accent">{formatPKR(p.p)}</div>
                        {!!p.sizes.length && (
                          <div className="mt-0.5 text-[10.5px] text-ink/50">Sizes {p.sizes.slice(0, 5).join(", ")}</div>
                        )}
                        <button
                          type="button"
                          onClick={() => add(p)}
                          disabled={added[p.v]}
                          className={`mt-1.5 rounded-full px-3 py-1 text-[11px] tracking-[0.06em] transition-colors ${
                            added[p.v] ? "bg-cream-200 text-ink/55" : "bg-ink text-cream-50 hover:bg-accent"
                          }`}
                        >
                          {added[p.v] ? "In your bag ✓" : "Add to bag"}
                        </button>
                      </div>
                    </article>
                  ))}
                  {m.items.length > shown && (
                    <button type="button" onClick={() => setShown((s) => s + 3)} className="w-full rounded-lg border border-cream-300 py-2 text-[11.5px] tracking-[0.1em] text-ink/70 hover:border-accent hover:text-accent">
                      Show {Math.min(3, m.items.length - shown)} more
                    </button>
                  )}
                </div>
              ) : (
                <div key={i} className={m.kind === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3.5 py-2 text-[12.5px] leading-relaxed text-cream-50"
                  : "max-w-[88%] rounded-2xl rounded-bl-sm bg-cream-100 px-3.5 py-2 text-[12.5px] leading-relaxed text-ink"}>
                  {m.text}
                </div>
              )
            )}
            {typing && (
              <div className="max-w-[60%] rounded-2xl rounded-bl-sm bg-cream-100 px-3.5 py-2.5">
                <span className="flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/30" style={{ animationDelay: `${d * 120}ms` }} />
                  ))}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-cream-300 bg-cream-50 px-3 py-3">
            {capture === "none" && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {choices.map((c) => (
                  <button key={c.label} type="button" onClick={() => choose(c)} className="rounded-full border border-cream-300 bg-white px-3 py-1.5 text-[11.5px] text-ink transition-colors hover:border-accent hover:text-accent">
                    {c.label}
                  </button>
                ))}
                {(step === "results" || step === "help-done" || step === "no-results" || step === "contact-done") && (
                  <>
                    <button type="button" onClick={restart} className="rounded-full border border-cream-300 bg-white px-3 py-1.5 text-[11.5px] text-ink hover:border-accent hover:text-accent">
                      Find something else
                    </button>
                    <a href="/cart/" className="rounded-full bg-ink px-3 py-1.5 text-[11.5px] text-cream-50 hover:bg-accent">View bag</a>
                  </>
                )}
                {step === "category" && (
                  <button
                    type="button"
                    onClick={() => { setMsgs((p) => [...p, { kind: "user", text: "I have a question" }]); say(PROMPTS.help); setStep("help") }}
                    className="rounded-full border border-dashed border-cream-300 bg-white px-3 py-1.5 text-[11.5px] text-ink/70 hover:border-accent hover:text-accent"
                  >
                    I have a question
                  </button>
                )}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); submit(draft) }} className="flex gap-2">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                type={capture === "phone" ? "tel" : "text"}
                inputMode={capture === "phone" ? "tel" : "text"}
                autoComplete={capture === "name" ? "name" : capture === "phone" ? "tel" : "off"}
                aria-label={capture === "name" ? "Your name" : capture === "phone" ? "Your mobile number" : "Type your message"}
                placeholder={
                  capture === "name" ? "Your name"
                    : capture === "phone" ? "03xx xxxxxxx"
                    : "Type what you're looking for…"
                }
                className="min-w-0 flex-1 rounded-full border border-cream-300 bg-white px-3.5 py-2 text-[12.5px] text-ink outline-none placeholder:text-ink/40 focus:border-accent"
              />
              <button type="submit" disabled={!draft.trim()} aria-label="Send" className="shrink-0 rounded-full bg-accent px-4 text-[13px] text-cream-50 disabled:opacity-40">
                Send
              </button>
            </form>

            <p className="mt-2.5 text-center text-[10.5px] leading-relaxed text-ink/45">
              {contact ? <>Saved for checkout: {contact.name} · {contact.phone}<br /></> : null}
              <a href={`https://wa.me/923395400416?text=${waMessage}`} onClick={() => trackHandoff("whatsapp")} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-accent">
                WhatsApp us
              </a>{" "}
              or email{" "}
              <a href={`mailto:${BRAND.email}`} className="underline underline-offset-2 hover:text-accent">{BRAND.email}</a>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
