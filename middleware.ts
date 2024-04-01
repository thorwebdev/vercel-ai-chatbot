import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, NextRequest } from 'next/server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'

import { cookies } from 'next/headers'

export async function middleware(request: NextRequest) {
  // const res = NextResponse.next()
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  // Added CSP code 
  // directly from https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const cspHeader = process.env.DEBUG_MODE ? `` : `
  default-src 'self' 'unsafe-inline';
  script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline';
  style-src 'self' 'nonce-${nonce}' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  block-all-mixed-content;
  upgrade-insecure-requests;
`
//   // Replace newline characters and spaces
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim()
 
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
 
  requestHeaders.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  )
 
  response.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  )

  // Create a Supabase client configured to use cookies
  // const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  // const {
  //   data: { session }
  // } = await supabase.auth.getSession()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {domain: '', secure: 'false', maxAge: 604800, path: '', sameSite: 'None'},
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
  // console.log(await supabase.auth.getUser())
  let {data: session} = await supabase.auth.getSession()
  const SUPABASE_ID = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0]
  const sessionCookies = {
    name: `sb-${SUPABASE_ID}-auth-token`,
    value: JSON.stringify(session),
    path: '/',
    expires: new Date(new Date().getTime() + 60 * 60 * 1000 * 24 * 365), // 1 year,
  };

  response.cookies.set(sessionCookies)
  await supabase.auth.getUser()
  const cookieStore = cookies()

  // OPTIONAL: this forces users to be logged in to use the chatbot.
  // If you want to allow anonymous users, simply remove the check below.
  const user_id = request.nextUrl.searchParams.get('user_id')
  if (request.url.includes('/api/healthcheck')){
    return response
  }
  if (
    !session.session &&
    !request.url.includes('/sign-in') &&
    !request.url.includes('/sign-up') &&
    !request.url.includes('/reset-password')
  ) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/sign-in'
    redirectUrl.searchParams.set(`redirectedFrom`, request.nextUrl.pathname)
    user_id ? redirectUrl.searchParams.set(`user_id`, user_id) : undefined
    return NextResponse.redirect(redirectUrl)
  }
  else if (session.session && request.url.includes('/reset-password') && request.url.includes('/sign-up') && request.url.includes('/sign-in')){
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    user_id ? redirectUrl.searchParams.set(`user_id`, user_id) : undefined
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - share (publicly shared chats)
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    // '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ]
}
