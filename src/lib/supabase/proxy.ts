import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import type { Database } from "./database.types";

/** ロケールプレフィックスを除去してパスを返す */
function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(`/${locale}`.length);
    }
    if (pathname === `/${locale}`) {
      return "/";
    }
  }
  return pathname;
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, options, value } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // JWT署名を検証してトークンリフレッシュを行う
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  // ロケールプレフィックスを除去してパスチェック
  const path = stripLocalePrefix(request.nextUrl.pathname);

  // 未認証ユーザーをログインページにリダイレクト
  if (!user && !path.startsWith("/login") && !path.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    // 現在のロケールプレフィックスを保持
    const localeMatch = request.nextUrl.pathname.match(
      new RegExp(`^/(${routing.locales.join("|")})`),
    );
    const locale = localeMatch?.[1];
    url.pathname = locale && locale !== routing.defaultLocale ? `/${locale}/login` : "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
