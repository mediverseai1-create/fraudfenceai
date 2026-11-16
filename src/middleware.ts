import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;
  const isApp = path.startsWith("/app") || path.startsWith("/admin");

  if (!url || !key) {
    // Not configured: the app area cannot work. Send to setup notice on /login.
    if (isApp) return NextResponse.redirect(new URL("/login?setup=1", request.url));
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();

  if (isApp && !data.user) {
    const to = new URL("/login", request.url);
    to.searchParams.set("next", path);
    return NextResponse.redirect(to);
  }
  if (data.user && (path === "/login" || path === "/signup")) {
    return NextResponse.redirect(new URL("/app", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
