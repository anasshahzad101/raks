import { NextRequest, NextResponse } from "next/server"

/**
 * Raks is a single-region (Pakistan) store with no country prefix in the URL,
 * so the middleware no longer redirects to `/{countryCode}`. It only ensures the
 * `_medusa_cache_id` cookie exists (used by the data layer for cache scoping).
 */
export async function middleware(request: NextRequest) {
  const cacheIdCookie = request.cookies.get("_medusa_cache_id")

  if (cacheIdCookie) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  response.cookies.set("_medusa_cache_id", crypto.randomUUID(), {
    maxAge: 60 * 60 * 24,
  })
  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|media|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
