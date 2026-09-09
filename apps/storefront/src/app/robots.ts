import type { MetadataRoute } from "next"
import { SITE_URL } from "@lib/raks"

/**
 * Paths that must never be crawled: transactional flows and anything tied to a
 * signed-in session. Kept in one place so every rule below stays in step.
 */
const PRIVATE_PATHS = ["/checkout", "/account", "/cart", "/order/"]

/**
 * Crawlers that feed answer engines, listed explicitly.
 *
 * The policy was previously implicit in a single allow-all rule, which made it
 * impossible to tell an intentional decision from an accidental one, and left
 * nothing to check a CDN rule against. Stating it here does not by itself grant
 * access: the Hostinger CDN can still refuse a crawler before the request ever
 * reaches this app, which is exactly what happens to GPTBot today (T-13).
 *
 * Worth keeping straight, because the three are often confused:
 *  - Googlebot       — feeds Google Search AND AI Overviews. Google-Extended is
 *                      a separate Gemini training control and has no effect on
 *                      Search or AI Overviews.
 *  - OAI-SearchBot   — the crawler behind ChatGPT Search. NOT GPTBot, which only
 *                      collects OpenAI training data and is a publisher choice.
 *  - PerplexityBot   — Perplexity's index.
 */
const ANSWER_ENGINE_CRAWLERS = [
  "Googlebot",
  "Bingbot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      ...ANSWER_ENGINE_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
